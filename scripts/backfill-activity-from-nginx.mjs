import { createHmac, randomUUID } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const storePath = process.env.ACTIVITY_LOG_FILE;
const hashSecret = process.env.ACTIVITY_HASH_SECRET;
const logDirectory = process.env.NGINX_LOG_DIR ?? "/var/log/nginx";
const activityLimit = 2000;
const months = new Map([["Jan", 0], ["Feb", 1], ["Mar", 2], ["Apr", 3], ["May", 4], ["Jun", 5], ["Jul", 6], ["Aug", 7], ["Sep", 8], ["Oct", 9], ["Nov", 10], ["Dec", 11]]);

if (!storePath || !hashSecret) throw new Error("ACTIVITY_LOG_FILE and ACTIVITY_HASH_SECRET are required.");

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
  const match = /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"GET\s+(\/[^\s?\"]*)(?:\?[^\s\"]*)?\s+HTTP\/[^\"]+"\s+(\d{3})\s/.exec(line);
  if (!match) return null;
  const [, address, timestamp, rawPath, status] = match;
  if (Number(status) < 200 || Number(status) >= 400) return null;
  if (!/^\/(guide|assistant|anniversaries(?:\/|$)|messages(?:\/|$)|dashboard)(?:\/|$)/.test(rawPath)) return null;
  const createdAt = parseNginxTime(timestamp);
  if (!createdAt) return null;
  const visitor = `history-${digest(address).slice(0, 24)}`;
  return {
    id: `history-${digest(`${timestamp}|${address}|${rawPath}|${status}`).slice(0, 24)}`,
    visitor,
    type: "pageview",
    path: rawPath,
    createdAt,
    source: "history",
  };
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
for (const fileName of logFiles) {
  const content = await logContent(fileName);
  for (const line of content.split("\n")) {
    const event = parseLine(line);
    if (event) imported.push(event);
  }
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
