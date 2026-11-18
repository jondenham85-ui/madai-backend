require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { createOpenAIProxyHandler } = require("./routes/madsiOpenAI");

const app = express();
const PORT = Number(process.env.PORT || 10000);

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.status(200).json({ service: "MADSI OpenAI secondary", status: "ok" });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "madsi-openai-secondary" });
});

app.post(
  "/api/madsi/openai",
  rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false }),
  createOpenAIProxyHandler(),
);

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

app.listen(PORT, "0.0.0.0", () => {
  console.log("MADSI OpenAI secondary listening on port " + PORT);
  console.info("MADSI_OPENAI_PROXY_CONFIG", {
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    reservationAuthConfigured: Boolean(process.env.MADSI_SUPABASE_URL && process.env.MADSI_SUPABASE_PUBLISHABLE_KEY),
  });
});
