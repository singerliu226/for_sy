import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";

async function freePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const port = address.port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function request(base, path, options = {}) {
  const response = await fetch(base + path, options);
  return { status: response.status, body: await response.json(), cookie: response.headers.get("set-cookie")?.split(";", 1)[0] ?? "" };
}

test("小魔丸：两人聊天隔离、传话确认、删除与断线提示", { timeout: 30000 }, async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "mozu-assistant-test-"));
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const setupToken = randomBytes(24).toString("hex");
  const env = {
    ...process.env,
    HOST: "127.0.0.1",
    PORT: String(port),
    MOZU_ACCOUNT_FILE: join(directory, "accounts.json"),
    MOZU_SESSION_SECRET: randomBytes(32).toString("hex"),
    MOZU_SETUP_TOKEN: setupToken,
    ASSISTANT_AUDIT_LOG_FILE: join(directory, "audit.json"),
    MESSAGE_BOARD_FILE: join(directory, "messages.json"),
  };
  delete env.DEEPSEEK_API_KEY;
  const child = spawn(process.execPath, ["dist/standalone/server.js"], { cwd: process.cwd(), env, stdio: "ignore" });
  t.after(async () => {
    if (child.exitCode === null) {
      child.kill("SIGTERM");
      await new Promise((resolve) => child.once("exit", resolve));
    }
    await rm(directory, { recursive: true, force: true });
  });

  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) break;
    try {
      const health = await request(base, "/api/auth");
      if (health.status === 200) { ready = true; break; }
    } catch { /* The test server is still starting. */ }
    await delay(100);
  }
  assert.ok(ready, "test server should start");
  assert.equal((await request(base, "/api/shanghai-guide/chat")).status, 401);

  const setup = await request(base, "/api/auth", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "setup", setupToken, bigPassword: "big-test-only", smallPassword: "small-test-only" }),
  });
  assert.equal(setup.status, 201);
  const bigCookie = setup.cookie;
  const smallLogin = await request(base, "/api/auth", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", member: "小魔王", password: "small-test-only" }),
  });
  assert.equal(smallLogin.status, 200);
  const smallCookie = smallLogin.cookie;
  assert.ok(bigCookie && smallCookie);

  const smallChat = await request(base, "/api/shanghai-guide/chat", {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: smallCookie },
    body: JSON.stringify({ message: "帮我告诉大魔王：明天记得带伞", history: [{ role: "user", text: "另一个账号的假历史" }] }),
  });
  assert.equal(smallChat.status, 200);
  assert.equal(smallChat.body.relayDraft, "明天记得带伞");
  assert.equal(smallChat.body.saved, true);

  const bigHistoryBefore = await request(base, "/api/shanghai-guide/chat", { headers: { Cookie: bigCookie } });
  assert.deepEqual(bigHistoryBefore.body.messages, []);
  const bigMailBefore = await request(base, "/api/messages?recipient=%E5%A4%A7%E9%AD%94%E7%8E%8B", { headers: { Cookie: bigCookie } });
  assert.deepEqual(bigMailBefore.body.messages, [], "creating a draft must not send a message");

  const sent = await request(base, "/api/messages", {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: smallCookie },
    body: JSON.stringify({ message: smallChat.body.relayDraft }),
  });
  assert.equal(sent.status, 201);
  assert.equal(sent.body.message.author, "小魔王");
  assert.equal(sent.body.message.recipient, "大魔王");
  const bigMailAfter = await request(base, "/api/messages?recipient=%E5%A4%A7%E9%AD%94%E7%8E%8B", { headers: { Cookie: bigCookie } });
  assert.equal(bigMailAfter.body.messages[0].body, "明天记得带伞");

  const bigChat = await request(base, "/api/shanghai-guide/chat", {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: bigCookie },
    body: JSON.stringify({ message: "帮我告诉小魔王：晚饭想吃啥？" }),
  });
  assert.equal(bigChat.body.relayDraft, "晚饭想吃啥？");

  const deleted = await request(base, "/api/shanghai-guide/chat", { method: "DELETE", headers: { Cookie: smallCookie } });
  assert.equal(deleted.status, 200);
  const smallHistoryAfter = await request(base, "/api/shanghai-guide/chat", { headers: { Cookie: smallCookie } });
  const bigHistoryAfter = await request(base, "/api/shanghai-guide/chat", { headers: { Cookie: bigCookie } });
  assert.deepEqual(smallHistoryAfter.body.messages, []);
  assert.equal(bigHistoryAfter.body.messages[0].text, "帮我告诉小魔王：晚饭想吃啥？");
  assert.equal((await request(base, "/api/messages?recipient=%E5%A4%A7%E9%AD%94%E7%8E%8B", { headers: { Cookie: bigCookie } })).body.messages.length, 1);

  const offline = await request(base, "/api/shanghai-guide/chat", {
    method: "POST", headers: { "Content-Type": "application/json", Cookie: smallCookie },
    body: JSON.stringify({ message: "今天真的很难过" }),
  });
  assert.equal(offline.status, 503);
  assert.ok(offline.body.error);
  assert.equal(offline.body.answer, undefined, "an outage must not masquerade as an assistant reply");
  assert.deepEqual((await request(base, "/api/shanghai-guide/chat", { headers: { Cookie: smallCookie } })).body.messages, []);
});
