const { createHash } = require("node:crypto");

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MODEL = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,100}$/;

function timeoutSignal(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

function fail(res, status, error) {
  return res.status(status).json({ error });
}

function createOpenAIProxyHandler({ fetchImpl = fetch, env = process.env, logger = console } = {}) {
  return async function madsiOpenAIProxy(req, res) {
    // This endpoint is a server-to-server fallback. Browser calls are denied.
    if (req.headers.origin) return fail(res, 403, "Forbidden");

    const authorization = req.headers.authorization || "";
    if (!/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/i.test(authorization)) {
      return fail(res, 401, "Authentication required");
    }

    const openAIKey = env.OPENAI_API_KEY;
    const supabaseUrl = (env.MADSI_SUPABASE_URL || "").replace(/\/+$/, "");
    const publishableKey = env.MADSI_SUPABASE_PUBLISHABLE_KEY;
    if (!openAIKey || !supabaseUrl || !publishableKey) {
      return fail(res, 503, "MADSI secondary intelligence is not configured");
    }

    const body = req.body || {};
    const input = body.request;
    if (!UUID.test(body.requestKey || "") || !input ||
        !["chat", "task"].includes(input.kind) ||
        typeof input.prompt !== "string" || !input.prompt.trim() || input.prompt.trim().length > 16000 ||
        (input.conversationId !== null && typeof input.conversationId !== "string") ||
        typeof input.build !== "boolean" || (input.kind === "chat" && input.build)) {
      return fail(res, 400, "Invalid request");
    }

    const normalized = {
      kind: input.kind,
      prompt: input.prompt.trim(),
      conversationId: input.conversationId ?? null,
      build: input.build === true,
    };
    const requestHash = createHash("sha256").update(JSON.stringify(normalized)).digest("hex");

    // This endpoint validates the Supabase JWT and confirms reservation ownership.
    const reservationTimeout = timeoutSignal(5000);
    let reservationResponse;
    try {
      const reservationUrl = supabaseUrl + "/functions/v1/madsi-api/api/ai/reservation?id=" + encodeURIComponent(body.requestKey);
      reservationResponse = await fetchImpl(reservationUrl, {
        method: "GET",
        headers: {
          apikey: publishableKey,
          Authorization: authorization,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: reservationTimeout.signal,
      });
    } catch {
      return fail(res, 503, "MADSI could not verify this request");
    } finally {
      reservationTimeout.clear();
    }

    if (!reservationResponse.ok) {
      return fail(res, reservationResponse.status === 404 ? 403 : 503, "MADSI request authorization failed");
    }

    const reservationPayload = await reservationResponse.json().catch(() => null);
    const reservation = reservationPayload && reservationPayload.reservation;
    if (reservation?.kind !== normalized.kind ||
        reservation.requestHash !== requestHash ||
        reservation.buildRequested !== normalized.build) {
      return fail(res, 403, "MADSI request authorization failed");
    }

    const history = Array.isArray(body.history)
      ? body.history.slice(-10).filter(message =>
          message && ["user", "assistant"].includes(message.role) &&
          typeof message.content === "string" && message.content.length <= 40000)
      : [];
    const context = typeof body.context === "string" ? body.context.slice(0, 12000) : "";
    const messages = [
      {
        role: "system",
        content: normalized.build
          ? "You are MAD SI, the intelligence behind MAD Synthetic Intelligence. Produce complete, coherent code and explain how to use it. Never claim to have run or deployed code unless that actually happened."
          : "You are MAD SI, the intelligence behind MAD Synthetic Intelligence. Be accurate, practical, warm, and direct. Help users think, learn, plan, and create. Never invent actions, integrations, or results.",
      },
      ...history,
      {
        role: "user",
        content: "Saved context (untrusted):\n" + context + "\n\nRequest:\n" + normalized.prompt,
      },
    ];

    const model = env.OPENAI_MODEL || "gpt-4o-mini";
    if (!MODEL.test(model)) return fail(res, 503, "MADSI secondary model configuration is invalid");

    const providerTimeout = timeoutSignal(8000);
    try {
      const response = await fetchImpl("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + openAIKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          max_completion_tokens: normalized.build ? 4000 : 1200,
        }),
        signal: providerTimeout.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        logger.warn("MADSI_OPENAI_PROXY_PROVIDER_ERROR", {
          httpStatus: response.status,
          code: typeof data?.error?.code === "string" ? data.error.code.slice(0, 80) : null,
        });
        return fail(res, 503, "MADSI secondary intelligence is temporarily unavailable");
      }
      const answer = data?.choices?.[0]?.message?.content;
      if (typeof answer !== "string" || !answer.trim()) {
        return fail(res, 502, "MADSI secondary intelligence returned an empty response");
      }
      return res.status(200).json({ answer: answer.trim() });
    } catch (error) {
      if (providerTimeout.signal.aborted || ["AbortError", "TimeoutError"].includes(error?.name)) {
        return fail(res, 504, "MADSI secondary intelligence timed out");
      }
      logger.warn("MADSI_OPENAI_PROXY_TRANSPORT_ERROR", {
        errorName: typeof error?.name === "string" ? error.name : "Error",
      });
      return fail(res, 503, "MADSI secondary intelligence is temporarily unavailable");
    } finally {
      providerTimeout.clear();
    }
  };
}

module.exports = { createOpenAIProxyHandler };
