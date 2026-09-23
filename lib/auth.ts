import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { isMember, members, type Member } from "@/lib/members";

type Account = {
  passwordHash: string;
  createdAt: string;
};

type AccountStore = {
  version: 1;
  accounts: Partial<Record<Member, Account>>;
};

const cookieName = "mozu_session_v1";
const accountPath = process.env.MOZU_ACCOUNT_FILE ?? join(process.cwd(), ".mozu-auth", "accounts.json");
const sessionLifetimeSeconds = 60 * 60 * 24 * 30;
let writes = Promise.resolve();

function responseError(message: string, status = 401) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function sessionSecret() {
  const secret = process.env.MOZU_SESSION_SECRET ?? "";
  if (secret.length >= 32) return secret;
  // This fallback is only for local development. Production needs the server secret.
  if (process.env.NODE_ENV !== "production") return "local-development-only-mozu-session-secret-please-change";
  return "";
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string) {
  const secret = sessionSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function secureEqual(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);
  return firstBuffer.length === secondBuffer.length && timingSafeEqual(firstBuffer, secondBuffer);
}

function cookieValue(request: Request, name: string) {
  const cookie = request.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return "";
}

function makeSession(member: Member) {
  const payload = base64url(JSON.stringify({ member, exp: Math.floor(Date.now() / 1000) + sessionLifetimeSeconds }));
  const signature = sign(payload);
  return signature ? `${payload}.${signature}` : "";
}

function parseSession(value: string) {
  const [payload, signature, ...extra] = value.split(".");
  if (!payload || !signature || extra.length || !secureEqual(signature, sign(payload))) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { member?: unknown; exp?: unknown };
    if (!isMember(decoded.member) || typeof decoded.exp !== "number" || decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded.member;
  } catch {
    return null;
  }
}

function sessionCookie(member: Member) {
  const token = makeSession(member);
  if (!token) throw new Error("登录配置还没准备好。");
  return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionLifetimeSeconds}`;
}

export function clearedSessionCookie() {
  return `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function memberFromRequest(request: Request) {
  return parseSession(cookieValue(request, cookieName));
}

export function requireMember(request: Request) {
  const member = memberFromRequest(request);
  return member ? { member } : { response: responseError("先登录，再打开这里。") };
}

function passwordHash(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

function passwordMatches(password: string, stored: string) {
  const [scheme, salt, encodedHash, ...extra] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !encodedHash || extra.length) return false;
  const actual = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("base64url");
  return secureEqual(actual, encodedHash);
}

function cleanPassword(value: unknown) {
  return typeof value === "string" ? value : "";
}

function validPassword(value: string) {
  return value.length >= 8 && value.length <= 200;
}

function emptyStore(): AccountStore {
  return { version: 1, accounts: {} };
}

function normaliseStore(value: unknown): AccountStore {
  if (!value || typeof value !== "object") return emptyStore();
  const raw = value as Partial<AccountStore>;
  const accounts: AccountStore["accounts"] = {};
  for (const member of members) {
    const account = raw.accounts?.[member];
    if (account && typeof account.passwordHash === "string" && typeof account.createdAt === "string") accounts[member] = account;
  }
  return { version: 1, accounts };
}

async function readAccounts() {
  try {
    return normaliseStore(JSON.parse(await readFile(accountPath, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyStore();
    throw error;
  }
}

async function saveAccounts(store: AccountStore) {
  await mkdir(dirname(accountPath), { recursive: true });
  const temporaryPath = `${accountPath}.${randomBytes(8).toString("hex")}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(store, null, 2), "utf8");
  await rename(temporaryPath, accountPath);
}

function withWriteLock<T>(task: () => Promise<T>) {
  const result = writes.then(task, task);
  writes = result.then(() => undefined, () => undefined);
  return result;
}

export async function accountStatus() {
  const accounts = await readAccounts();
  return { setupNeeded: members.some((member) => !accounts.accounts[member]) };
}

export async function setupAccounts(input: { setupToken: unknown; bigPassword: unknown; smallPassword: unknown }) {
  const expectedToken = process.env.MOZU_SETUP_TOKEN ?? "";
  const bigPassword = cleanPassword(input.bigPassword);
  const smallPassword = cleanPassword(input.smallPassword);
  if (!expectedToken || !secureEqual(typeof input.setupToken === "string" ? input.setupToken : "", expectedToken)) throw new Error("设置码不对。再核对一下。");
  if (!validPassword(bigPassword) || !validPassword(smallPassword)) throw new Error("两个密码都至少要 8 个字符。\n");

  return withWriteLock(async () => {
    const store = await readAccounts();
    if (store.accounts["大魔王"] || store.accounts["小魔王"]) throw new Error("账号已经设置好了。直接去登录吧。");
    const createdAt = new Date().toISOString();
    store.accounts["大魔王"] = { passwordHash: passwordHash(bigPassword), createdAt };
    store.accounts["小魔王"] = { passwordHash: passwordHash(smallPassword), createdAt };
    await saveAccounts(store);
    return "大魔王" as const;
  });
}

export async function login(member: unknown, password: unknown) {
  if (!isMember(member)) throw new Error("选一个账号再登录。\n");
  const store = await readAccounts();
  const account = store.accounts[member];
  if (!account || !passwordMatches(cleanPassword(password), account.passwordHash)) throw new Error("账号或密码不对，再试一次。\n");
  return { member, cookie: sessionCookie(member) };
}

