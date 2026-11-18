require("dotenv").config();

const http = require("http");
const app = require("./app");

const PORT = Number(process.env.PORT || 10000);

const server = http.createServer(app);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`MADSI backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.info("MADSI_OPENAI_PROXY_CONFIG", {
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    reservationAuthConfigured: Boolean(process.env.MADSI_SUPABASE_URL && process.env.MADSI_SUPABASE_PUBLISHABLE_KEY),
  });
});

server.on("error", (error) => {
  console.error("Failed to start MADSI backend:", error);
  process.exit(1);
});

process.on("SIGINT", () => {
  server.close(() => {
    console.log("MADSI backend shutdown complete");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("MADSI backend shutdown complete");
    process.exit(0);
  });
});
