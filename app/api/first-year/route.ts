import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { requireMember } from "@/lib/auth";
import { isMember, type Member } from "@/lib/members";

export const dynamic = "force-dynamic";

export type FirstYearPage = {
  id: string;
  title: string;
  prompt?: string;
  eventDate?: string;
  createdBy: Member;
  createdAt: string;
  hiddenBy?: Member;
  hiddenAt?: string;
};

export type LittlePromise = {
  id: string;
  title: string;
  date: string;
  createdBy: Member;
  createdAt: string;
  checkedBy: Member[];
  approvedAt?: string;
};

type FirstYearStore = {
  pages: FirstYearPage[];
  promises: LittlePromise[];
};

const storePath = process.env.FIRST_YEAR_FILE ?? join(process.cwd(), ".first-year", "pages.json");
const pageLimit = 300;
let writes = Promise.resolve();

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function cleanText(value: unknown, limit: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\p{Cc}]+/gu, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value + "T12:00:00").getTime());
}

function normalisePage(value: unknown): FirstYearPage | null {
  if (!value || typeof value !== "object") return null;
  const page = value as Partial<FirstYearPage>;
  if (typeof page.id !== "string" || !isMember(page.createdBy) || typeof page.title !== "string" || typeof page.createdAt !== "string") return null;
  const title = cleanText(page.title, 80);
  if (!title) return null;
  const prompt = cleanText(page.prompt, 160);
  return {
    id: page.id.slice(0, 96),
    title,
    ...(prompt ? { prompt } : {}),
    ...(validDate(page.eventDate) ? { eventDate: page.eventDate } : {}),
    createdBy: page.createdBy,
    createdAt: page.createdAt,
    ...(isMember(page.hiddenBy) ? { hiddenBy: page.hiddenBy } : {}),
    ...(typeof page.hiddenAt === "string" ? { hiddenAt: page.hiddenAt } : {}),
  };
}

function normalisePromise(value: unknown): LittlePromise | null {
  if (!value || typeof value !== "object") return null;
  const promise = value as Partial<LittlePromise> & { completedAt?: unknown };
  if (typeof promise.id !== "string" || !isMember(promise.createdBy) || typeof promise.title !== "string" || !validDate(promise.date) || typeof promise.createdAt !== "string") return null;
  const title = cleanText(promise.title, 100);
  if (!title) return null;
  const checkedBy = Array.isArray(promise.checkedBy) ? [...new Set(promise.checkedBy.filter(isMember))] : [];
  return {
    id: promise.id.slice(0, 96),
    title,
    date: promise.date,
    createdBy: promise.createdBy,
    createdAt: promise.createdAt,
    checkedBy,
    // Old entries used completedAt for the moment both people agreed. Keep them
    // on the calendar, but do not turn approval into a false "completed" state.
    ...(typeof promise.approvedAt === "string" ? { approvedAt: promise.approvedAt } : typeof promise.completedAt === "string" && checkedBy.length === 2 ? { approvedAt: promise.completedAt } : {}),
  };
}

function normaliseStore(value: unknown): FirstYearStore {
  if (!value || typeof value !== "object") return { pages: [], promises: [] };
  const store = value as Partial<FirstYearStore>;
  return {
    pages: Array.isArray(store.pages) ? store.pages.map(normalisePage).filter((item): item is FirstYearPage => item !== null).slice(-pageLimit) : [],
    promises: Array.isArray(store.promises) ? store.promises.map(normalisePromise).filter((item): item is LittlePromise => item !== null).slice(-pageLimit) : [],
  };
}

async function readStore() {
  try {
    return normaliseStore(JSON.parse(await readFile(storePath, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { pages: [], promises: [] };
    throw error;
  }
}

async function saveStore(store: FirstYearStore) {
  await mkdir(dirname(storePath), { recursive: true });
  const temporaryPath = storePath + "." + randomUUID() + ".tmp";
  await writeFile(temporaryPath, JSON.stringify(store, null, 2), "utf8");
  await rename(temporaryPath, storePath);
}

function withWriteLock<T>(task: () => Promise<T>) {
  const result = writes.then(task, task);
  writes = result.then(() => undefined, () => undefined);
  return result;
}

export async function GET(request: Request) {
  const access = requireMember(request);
  if ("response" in access) return access.response;
  try {
    const store = await readStore();
    return json({
      pages: store.pages.filter((page) => !page.hiddenBy).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      promises: store.promises.sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch {
    return json({ error: "手账暂时打不开，刷新一下再试试。" }, 500);
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json({ error: "这次没有收到内容，再试一下。" }, 400);
  }

  const access = requireMember(request);
  if ("response" in access) return access.response;
  const action = body.action;
  const author = access.member;

  try {
    const result = await withWriteLock(async () => {
      const store = await readStore();

      if (action === "create-page") {
        const title = cleanText(body.title, 80);
        if (!title) throw new Error("给这一页起个名字吧。");
        const prompt = cleanText(body.prompt, 160);
        const eventDate = validDate(body.eventDate) ? body.eventDate : undefined;
        const page: FirstYearPage = {
          id: randomUUID(),
          title,
          ...(prompt ? { prompt } : {}),
          ...(eventDate ? { eventDate } : {}),
          createdBy: author,
          createdAt: new Date().toISOString(),
        };
        store.pages.push(page);
        await saveStore(store);
        return { page };
      }

      if (action === "hide-page") {
        const id = cleanText(body.id, 96);
        const page = store.pages.find((item) => item.id === id);
        if (!page) throw new Error("这一页找不到了，刷新后再试试。");
        page.hiddenBy = author;
        page.hiddenAt = new Date().toISOString();
        await saveStore(store);
        return { page };
      }

      if (action === "create-promise") {
        const title = cleanText(body.title, 100);
        const date = body.date;
        if (!title) throw new Error("写下要一起做的那件小事吧。");
        if (!validDate(date)) throw new Error("先选一个日子。");
        const promise: LittlePromise = {
          id: randomUUID(),
          title,
          date,
          createdBy: author,
          createdAt: new Date().toISOString(),
          checkedBy: [author],
        };
        store.promises.push(promise);
        await saveStore(store);
        return { promise };
      }

      if (action === "check-promise") {
        const id = cleanText(body.id, 96);
        const promise = store.promises.find((item) => item.id === id);
        if (!promise) throw new Error("这件小事找不到了，刷新后再试试。");
        if (!promise.checkedBy.includes(author)) promise.checkedBy.push(author);
        if (promise.checkedBy.length === 2 && !promise.approvedAt) promise.approvedAt = new Date().toISOString();
        await saveStore(store);
        return { promise };
      }

      throw new Error("这个操作还没准备好。");
    });
    return json(result, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "这次没能保存，稍后再试。" }, 400);
  }
}
