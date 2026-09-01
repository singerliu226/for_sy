import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export const dynamic = "force-dynamic";

type ActivityKind = "pageview" | "click";
type ActivitySource = "live" | "history";
type VisitorAttribution = { label: string; confidence: "高" | "中" | "低"; basis: string };

type ActivityEvent = {
  id: string;
  visitor: string;
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

function validPath(value: unknown) {
  return typeof value === "string" && /^\/[a-z0-9/_-]{0,159}$/i.test(value) ? value : "";
}

function normaliseEvent(value: unknown): ActivityEvent | null {
  if (!value || typeof value !== "object") return null;
  const event = value as Partial<ActivityEvent>;
  if (typeof event.id !== "string" || !validVisitor(event.visitor) || !isActivityKind(event.type) || !validPath(event.path) || typeof event.createdAt !== "string") return null;
  const label = cleanText(event.label, 90);
  const destination = cleanText(event.destination, 160);
  return { id: event.id, visitor: event.visitor, type: event.type, path: event.path, createdAt: event.createdAt, ...(label ? { label } : {}), ...(destination ? { destination } : {}), ...(isActivitySource(event.source) ? { source: event.source } : {}) };
}

function normaliseAttribution(value: unknown): VisitorAttribution | null {
  if (!value || typeof value !== "object") return null;
  const attribution = value as Partial<VisitorAttribution>;
  const label = cleanText(attribution.label, 32);
  const basis = cleanText(attribution.basis, 160);
  if (!label || !basis || (attribution.confidence !== "高" && attribution.confidence !== "中" && attribution.confidence !== "低")) return null;
  return { label, confidence: attribution.confidence, basis };
}

async function readAttributions() {
  if (!attributionPath) return new Map<string, VisitorAttribution>();
  try {
    const content = await readFile(attributionPath, "utf8");
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return new Map<string, VisitorAttribution>();
    return new Map(Object.entries(parsed)
      .flatMap(([visitor, value]) => {
        const attribution = normaliseAttribution(value);
        return validVisitor(visitor) && attribution ? [[visitor, attribution] as const] : [];
      }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Map<string, VisitorAttribution>();
    throw error;
  }
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
    const attributions = privateView ? await readAttributions() : new Map<string, VisitorAttribution>();
    const visibleEvents = privateView ? events.map((event) => ({ ...event, ...(attributions.has(event.visitor) ? { attribution: attributions.get(event.visitor) } : {}) })) : events;
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
  const event: ActivityEvent = {
    id: randomUUID(),
    visitor: body.visitor,
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
