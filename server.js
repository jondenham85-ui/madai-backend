const { app, prisma } = require("./app");

const PORT = process.env.PORT || 10000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`MADAI backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health\`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);

  server.close(async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error("Error disconnecting Prisma:", error);
    }

    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
