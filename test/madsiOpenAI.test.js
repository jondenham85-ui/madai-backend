const test = require("node:test");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { createOpenAIProxyHandler } = require("../src/routes/madsiOpenAI");

const request = {
  kind: "chat",
  prompt: "Say hello",
  conversationId: null,
  build: false,
};
const requestKey = "123e4567-e89b-42d3-a456-426614174000";
const requestHash = createHash("sha256").update(JSON.stringify(request)).digest("hex");
const env = {
  OPENAI_API_KEY: "test-openai-key",
  MADSI_SUPABASE_URL: "https://project.supabase.co",
  MADSI_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
};

function responseHarness() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

function requestHarness(overrides = {}) {
  return {
    headers: { authorization: "Bearer user.jwt.token" },
    body: { requestKey, request, history: [], context: "" },
    ...overrides,
  };
}

test("OpenAI proxy verifies a live MADSI reservation before using the Render key", async () => {
  const calls = [];
  const req = requestHarness();
  const res = responseHarness();
  const handler = createOpenAIProxyHandler({
    env,
    logger: { warn() {} },
    fetchImpl: async (url, options) => {
      calls.push(String(url));
      if (String(url).includes("/api/ai/reservation")) {
        assert.equal(options.headers.apikey, env.MADSI_SUPABASE_PUBLISHABLE_KEY);
        assert.equal(options.headers.Authorization, req.headers.authorization);
        return Response.json({
          reservation: { kind: "chat", requestHash, buildRequested: false },
        });
      }
      assert.equal(String(url), "https://api.openai.com/v1/chat/completions");
      assert.equal(options.headers.Authorization, "Bearer test-openai-key");
      return Response.json({
        choices: [{ message: { content: "MADSI secondary answer" } }],
      });
    },
  });

  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload, { answer: "MADSI secondary answer" });
  assert.equal(calls.length, 2);
  assert.match(calls[0], /\/api\/ai\/reservation/);
  assert.equal(calls[1], "https://api.openai.com/v1/chat/completions");
});

test("OpenAI proxy rejects an invalid reservation without calling OpenAI", async () => {
  let providerCalled = false;
  const req = requestHarness();
  const res = responseHarness();
  const handler = createOpenAIProxyHandler({
    env,
    logger: { warn() {} },
    fetchImpl: async (url) => {
      if (String(url).includes("api.openai.com")) providerCalled = true;
      return Response.json({
        reservation: { kind: "chat", requestHash: "wrong-hash", buildRequested: false },
      });
    },
  });

  await handler(req, res);
  assert.equal(res.statusCode, 403);
  assert.equal(providerCalled, false);
});

test("OpenAI proxy rejects browser-origin requests", async () => {
  const res = responseHarness();
  const handler = createOpenAIProxyHandler({
    env,
    fetchImpl: async () => { throw new Error("Must not fetch"); },
  });
  await handler(requestHarness({ headers: { origin: "https://www.madmadisonai.com" } }), res);
  assert.equal(res.statusCode, 403);
});

test("OpenAI proxy does not make provider calls when its server key is absent", async () => {
  let called = false;
  const res = responseHarness();
  const handler = createOpenAIProxyHandler({
    env: { ...env, OPENAI_API_KEY: "" },
    fetchImpl: async () => { called = true; throw new Error("Must not fetch"); },
  });
  await handler(requestHarness(), res);
  assert.equal(res.statusCode, 503);
  assert.equal(called, false);
});
