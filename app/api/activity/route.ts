import { createHmac, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const dynamic = "force-dynamic";

type ActivityKind = "pageview" | "click";
type ActivitySource = "live" | "history";
type VisitorAttribution = { label: string; confidence: "高" | "中" | "低"; basis: string };
type VisitorAttributionRule = VisitorAttribution & { before?: string };

type ActivityEvent = {
  id: string;
  visitor: string;
  device?: string;
  type: ActivityKind;
  path: string;
  label?: string;
  destination?: string;
  createdAt: string;
  source?: ActivitySource;
  attribution?: VisitorAttribution;
};

// The retained Nginx history is small enough to keep the available range intact.
const activityLimit = 2000;
const returnLimit = 2000;
const rateWindowMs = 10 * 60 * 1000;
const rateLimit = 120;
const storePath = process.env.ACTIVITY_LOG_FILE ?? join(process.cwd(), ".activity-log", "events.json");
const attributionPath = process.env.VISITOR_ATTRIBUTION_FILE ?? "";
const activityHashSecret = process.env.ACTIVITY_HASH_SECRET ?? "";
const recentRequests = new Map<string, number[]>();
let writes = Promise.resolve();

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function isActivityKind(value: unknown): value is ActivityKind {
  return value === "pageview" || value === "click";
}

function isActivitySource(value: unknown): value is ActivitySource {
  return value === "live" || value === "history";
}

function cleanText(value: unknown, limit: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}

function validVisitor(value: unknown) {
  return typeof value === "string" && /^[a-z0-9-]{16,64}$/i.test(value);
}

function validDevice(value: unknown) {
  return typeof value === "string" && /^device-[a-f0-9]{24}$/i.test(value);
}

function validPath(value: unknown) {
  return typeof value === "string" && /^\/[a-z0-9/_-]{0,159}$/i.test(value) ? value : "";
}

function normaliseEvent(value: unknown): ActivityEvent | null {
  if (!value || typeof value !== "object") return null;
  const event = value as Partial<ActivityEvent>;
  if (typeof event.id !== "string" || !validVisitor(event.visitor) || !isActivityKind(event.type) || !validPath(event.path) || typeof event.createdAt !== "string") return null;
  const label = cleanText(event.label, 90);
  const destination = cleanText(event.destination, 160);
  const device = validDevice(event.device) ? event.device : "";
  return { id: event.id, visitor: event.visitor, ...(device ? { device } : {}), type: event.type, path: event.path, createdAt: event.createdAt, ...(label ? { label } : {}), ...(destination ? { destination } : {}), ...(isActivitySource(event.source) ? { source: event.source } : {}) };
}

function normaliseAttribution(value: unknown): VisitorAttributionRule | null {
  if (!value || typeof value !== "object") return null;
  const attribution = value as Partial<VisitorAttribution>;
  const label = cleanText(attribution.label, 32);
  const basis = cleanText(attribution.basis, 160);
  if (!label || !basis || (attribution.confidence !== "高" && attribution.confidence !== "中" && attribution.confidence !== "低")) return null;
  const before = typeof (value as { before?: unknown }).before === "string" && !Number.isNaN(new Date((value as { before: string }).before).getTime()) ? (value as { before: string }).before : "";
  return { label, confidence: attribution.confidence, basis, ...(before ? { before } : {}) };
}

type AttributionIndex = {
  visitors: Map<string, VisitorAttributionRule[]>;
  devices: Map<string, VisitorAttributionRule[]>;
};

function readAttributionRules(value: unknown, validKey: (key: unknown) => boolean) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return new Map<string, VisitorAttributionRule[]>();
  return new Map(Object.entries(value)
    .flatMap(([key, ruleValue]) => {
      const rules = (Array.isArray(ruleValue) ? ruleValue : [ruleValue]).map(normaliseAttribution).filter((item): item is VisitorAttributionRule => item !== null);
      return validKey(key) && rules.length ? [[key, rules] as const] : [];
    }));
}

async function readAttributions(): Promise<AttributionIndex> {
  const empty = { visitors: new Map<string, VisitorAttributionRule[]>(), devices: new Map<string, VisitorAttributionRule[]>() };
  if (!attributionPath) return empty;
  try {
    const content = await readFile(attributionPath, "utf8");
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return empty;
    const config = parsed as Record<string, unknown>;
    const structured = Object.prototype.hasOwnProperty.call(config, "visitors") || Object.prototype.hasOwnProperty.call(config, "devices");
    return {
      visitors: readAttributionRules(structured ? config.visitors : config, validVisitor),
      devices: readAttributionRules(config.devices, validDevice),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return empty;
    throw error;
  }
}

function attributionFromRules(rules: VisitorAttributionRule[], createdAt: string) {
  const rule = rules.find((item) => !item.before || createdAt < item.before);
  if (!rule) return undefined;
  const { before: _before, ...attribution } = rule;
  return attribution;
}

function attributionFor(event: ActivityEvent, attributions: AttributionIndex) {
  const direct = attributionFromRules(attributions.visitors.get(event.visitor) ?? [], event.createdAt);
  if (direct) return direct;
  return attributionFromRules(event.device ? attributions.devices.get(event.device) ?? [] : [], event.createdAt);
}

function deviceHint(userAgent: string) {
  const wechatAndroid = /Android\s+[^;]+;\s*([^;]+?)\s+Build\//i.exec(userAgent);
  if (/MicroMessenger/i.test(userAgent) && wechatAndroid) return `wechat-android:${wechatAndroid[1].trim()}`;

  const mac = /Macintosh; Intel Mac OS X ([^\)]+).*?(?:Chrome|Edg)\/(\d+)/i.exec(userAgent);
  if (mac) return `${/Edg\//i.test(userAgent) ? "mac-edge" : "mac-chrome"}:${mac[1].replace(/_/g, "_")}:${mac[2]}`;
  return "";
}

function deviceSignature(request: Request) {
  const hint = deviceHint(request.headers.get("user-agent") ?? "");
  if (!hint || !activityHashSecret) return "";
  return `device-${createHmac("sha256", activityHashSecret).update(hint).digest("hex").slice(0, 24)}`;
}

function visibleEvent(event: ActivityEvent) {
  const { device: _device, ...visible } = event;
  return visible;
}

function isPrivateOwnerRequest(request: Request) {
  const host = request.headers.get("host") ?? "";
  return !request.headers.get("x-forwarded-for") && /^(localhost|127\.0\.0\.1)(?::\d+)?$/i.test(host);
}

async function readEvents() {
  try {
    const content = await readFile(storePath, "utf8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed.map(normaliseEvent).filter((event): event is ActivityEvent => event !== null).slice(-activityLimit) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function saveEvents(events: ActivityEvent[]) {
  await mkdir(dirname(storePath), { recursive: true });
  const temporaryPath = `${storePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(events, null, 2), "utf8");
  await rename(temporaryPath, storePath);
}

function withWriteLock<T>(task: () => Promise<T>) {
  const result = writes.then(task, task);
  writes = result.then(() => undefined, () => undefined);
  return result;
}

function isRateLimited(visitor: string) {
  const now = Date.now();
  const recent = (recentRequests.get(visitor) ?? []).filter((time) => now - time < rateWindowMs);
  if (recent.length >= rateLimit) {
    recentRequests.set(visitor, recent);
    return true;
  }
  recentRequests.set(visitor, [...recent, now]);
  return false;
}

export async function GET(request: Request) {
  try {
    const events = await readEvents();
    const now = Date.now();
    const today = events.filter((event) => now - new Date(event.createdAt).getTime() < 24 * 60 * 60 * 1000);
    const week = events.filter((event) => now - new Date(event.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000);
    const privateView = isPrivateOwnerRequest(request);
    const attributions = privateView ? await readAttributions() : { visitors: new Map<string, VisitorAttributionRule[]>(), devices: new Map<string, VisitorAttributionRule[]>() };
    const visibleEvents = privateView ? events.map((event) => {
      const attribution = attributionFor(event, attributions);
      return { ...visibleEvent(event), ...(attribution ? { attribution } : {}) };
    }) : events.map(visibleEvent);
    return json({
      privateView,
      summary: {
        visitsToday: today.filter((event) => event.type === "pageview").length,
        visitorsThisWeek: new Set(week.map((event) => event.visitor)).size,
        clicksToday: today.filter((event) => event.type === "click").length,
      },
      events: visibleEvents.slice(-returnLimit).reverse(),
    });
  } catch {
    return json({ error: "访问记录暂时打不开。" }, 500);
  }
}

export async function POST(request: Request) {
  let body: { visitor?: unknown; type?: unknown; path?: unknown; label?: unknown; destination?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "记录格式不对。" }, 400);
  }

  if (!validVisitor(body.visitor) || !isActivityKind(body.type) || !validPath(body.path)) return json({ error: "记录格式不对。" }, 400);
  if (isRateLimited(body.visitor)) return json({ ok: true });

  const label = cleanText(body.label, 90);
  const destination = cleanText(body.destination, 160);
  const device = deviceSignature(request);
  const event: ActivityEvent = {
    id: randomUUID(),
    visitor: body.visitor,
    ...(device ? { device } : {}),
    type: body.type,
    path: body.path,
    createdAt: new Date().toISOString(),
    ...(body.type === "click" && label ? { label } : {}),
    ...(body.type === "click" && destination ? { destination } : {}),
    source: "live",
  };

  try {
    await withWriteLock(async () => {
      const events = await readEvents();
      events.push(event);
      await saveEvents(events.slice(-activityLimit));
    });
    return json({ ok: true }, 201);
  } catch {
    return json({ error: "记录没有保存下来。" }, 500);
  }
}
