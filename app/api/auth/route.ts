import { accountStatus, clearedSessionCookie, login, memberFromRequest, setupAccounts } from "@/lib/auth";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export async function GET(request: Request) {
  try {
    const status = await accountStatus();
    return json({ member: memberFromRequest(request), ...status });
  } catch {
    return json({ error: "登录状态暂时打不开。" }, 500);
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json({ error: "这次没有收到内容，再试一次。" }, 400);
  }

  try {
    if (body.action === "logout") return json({ ok: true }, 200, { "Set-Cookie": clearedSessionCookie() });
    if (body.action === "setup") {
      const member = await setupAccounts({ setupToken: body.setupToken, bigPassword: body.bigPassword, smallPassword: body.smallPassword });
      const result = await login(member, body.bigPassword);
      return json({ member: result.member }, 201, { "Set-Cookie": result.cookie });
    }
    if (body.action === "login") {
      const result = await login(body.member, body.password);
      return json({ member: result.member }, 200, { "Set-Cookie": result.cookie });
    }
    return json({ error: "这个操作还没准备好。" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message.trim() : "这次没能完成。" }, 400);
  }
}
