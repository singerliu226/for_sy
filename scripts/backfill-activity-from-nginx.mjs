import { createHmac, randomUUID } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const storePath = process.env.ACTIVITY_LOG_FILE;
const hashSecret = process.env.ACTIVITY_HASH_SECRET;
const logDirectory = process.env.NGINX_LOG_DIR ?? "/var/log/nginx";
const activityLimit = 2000;
const reportMode = process.argv.includes("--report");
const geoReportMode = process.argv.includes("--geo-report");
const months = new Map([["Jan", 0], ["Feb", 1], ["Mar", 2], ["Apr", 3], ["May", 4], ["Jun", 5], ["Jul", 6], ["Aug", 7], ["Sep", 8], ["Oct", 9], ["Nov", 10], ["Dec", 11]]);

if (!hashSecret || (!storePath && !reportMode)) throw new Error("ACTIVITY_HASH_SECRET is required; ACTIVITY_LOG_FILE is required unless --report is used.");

function digest(value) {
  return createHmac("sha256", hashSecret).update(value).digest("hex");
}

function parseNginxTime(value) {
  const match = /^(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-])(\d{2})(\d{2})$/.exec(value);
  if (!match || months.get(match[2]) === undefined) return null;
  const [, day, month, year, hour, minute, second, sign, offsetHour, offsetMinute] = match;
  const offset = (Number(offsetHour) * 60 + Number(offsetMinute)) * (sign === "+" ? 1 : -1);
  return new Date(Date.UTC(Number(year), months.get(month), Number(day), Number(hour), Number(minute) - offset, Number(second))).toISOString();
}

function parseLine(line) {
  const match = /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"GET\s+(\/[^\s?\"]*)(?:\?[^\s\"]*)?\s+HTTP\/[^\"]+"\s+(\d{3})\s+\S+\s+"[^\"]*"\s+"([^\"]*)"/.exec(line);
  if (!match) return null;
  const [, address, timestamp, rawPath, status, userAgent] = match;
  if (Number(status) < 200 || Number(status) >= 400) return null;
  if (!/^\/(guide|assistant|anniversaries(?:\/|$)|messages(?:\/|$)|dashboard)(?:\/|$)/.test(rawPath)) return null;
  const createdAt = parseNginxTime(timestamp);
  if (!createdAt) return null;
  const visitor = `history-${digest(address).slice(0, 24)}`;
  return {
    address,
    event: {
      id: `history-${digest(`${timestamp}|${address}|${rawPath}|${status}`).slice(0, 24)}`,
      visitor,
      type: "pageview",
      path: rawPath,
      createdAt,
      source: "history",
    },
    userAgent,
  };
}

function agentFamily(userAgent) {
  if (/MicroMessenger/i.test(userAgent)) return "微信内置浏览器";
  if (/iPhone|iPad/i.test(userAgent)) return /CriOS/i.test(userAgent) ? "iPhone Chrome" : "iPhone Safari";
  if (/Android/i.test(userAgent)) return /Chrome/i.test(userAgent) ? "Android Chrome" : "Android 浏览器";
  if (/Macintosh/i.test(userAgent)) return /Chrome/i.test(userAgent) ? "Mac Chrome" : "Mac 浏览器";
  if (/Windows/i.test(userAgent)) return /Edg/i.test(userAgent) ? "Windows Edge" : "Windows 浏览器";
  return "其他设备";
}

async function lookupLocation(address) {
  const providers = [
    `https://ipapi.co/${encodeURIComponent(address)}/json/`,
    `https://ipwho.is/${encodeURIComponent(address)}`,
  ];
  for (const provider of providers) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4_000);
    try {
      const response = await fetch(provider, { signal: controller.signal });
      if (!response.ok) continue;
      const data = await response.json();
      if (!data || typeof data !== "object") continue;
      const location = data;
      const values = [location.city, location.region, location.country_name ?? location.country].filter((value) => typeof value === "string" && value.trim());
      const connection = location.connection && typeof location.connection === "object" ? location.connection : {};
      const networkValues = [connection.asn, connection.isp, connection.org, location.org].filter((value) => typeof value === "string" && value.trim());
      if (values.length || networkValues.length) return { location: values.length ? values.join(" · ") : null, network: networkValues.length ? [...new Set(networkValues)].join(" · ") : null };
    } catch {
      // Try the second provider before declaring a location unavailable.
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

async function readExisting() {
  try {
    const content = await readFile(storePath, "utf8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function logContent(fileName) {
  const content = await readFile(join(logDirectory, fileName));
  return fileName.endsWith(".gz") ? gunzipSync(content).toString("utf8") : content.toString("utf8");
}

const logFiles = (await readdir(logDirectory))
  .filter((fileName) => /^access\.log(?:\.\d+)?(?:\.gz)?$/.test(fileName));
const imported = [];
const visitorProfiles = new Map();
for (const fileName of logFiles) {
  const content = await logContent(fileName);
  for (const line of content.split("\n")) {
    const parsed = parseLine(line);
    if (!parsed) continue;
    imported.push(parsed.event);
    if (reportMode) {
      const profile = visitorProfiles.get(parsed.event.visitor) ?? { visitor: parsed.event.visitor, address: parsed.address, visits: 0, first: parsed.event.createdAt, last: parsed.event.createdAt, days: new Set(), paths: new Set(), devices: new Set(), deviceSignatures: new Set() };
      profile.visits += 1;
      if (parsed.event.createdAt < profile.first) profile.first = parsed.event.createdAt;
      if (parsed.event.createdAt > profile.last) profile.last = parsed.event.createdAt;
      profile.days.add(parsed.event.createdAt.slice(0, 10));
      profile.paths.add(parsed.event.path);
      profile.devices.add(agentFamily(parsed.userAgent));
      profile.deviceSignatures.add(digest(parsed.userAgent).slice(0, 16));
      visitorProfiles.set(parsed.event.visitor, profile);
    }
  }
}

if (reportMode) {
  const profiled = await Promise.all([...visitorProfiles.values()]
    .map(async (profile) => {
      const geo = geoReportMode ? await lookupLocation(profile.address) : null;
      return { ...profile, ...(geoReportMode ? { location: geo?.location ?? null, network: geo?.network ?? null } : {}), days: [...profile.days].sort(), paths: [...profile.paths].sort(), devices: [...profile.devices].sort(), deviceSignatures: [...profile.deviceSignatures].sort() };
    }));
  const profiles = profiled
    .map(({ address, ...profile }) => profile)
    .sort((first, second) => first.first.localeCompare(second.first));
  console.log(JSON.stringify({ scannedFiles: logFiles.length, profiles }));
  process.exit(0);
}

const existing = await readExisting();
const knownIds = new Set(existing.map((event) => event?.id).filter((id) => typeof id === "string"));
const additions = imported.filter((event) => !knownIds.has(event.id));
const combined = [...existing, ...additions]
  .sort((first, second) => String(first.createdAt).localeCompare(String(second.createdAt)))
  .slice(-activityLimit);

await mkdir(dirname(storePath), { recursive: true });
const temporaryPath = `${storePath}.${randomUUID()}.tmp`;
await writeFile(temporaryPath, JSON.stringify(combined, null, 2), "utf8");
await rename(temporaryPath, storePath);

console.log(JSON.stringify({ scannedFiles: logFiles.length, imported: additions.length, total: combined.length }));
