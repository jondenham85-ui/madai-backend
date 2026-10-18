
require("dotenv").config();

const http = require("http");
const app = require("./app");

const PORT = process.env.PORT || 10000;

const server = http.createServer(app);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`MADAI backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

server.on("error", (error) => {
  console.error("Server startup error:", error);
  process.exit(1);
});

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server closed gracefully");
  });
});

process.on("SIGINT", () => {
  server.close(() => {
    console.log("Server closed gracefully");
  });
});
