import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`GymFlow API running on port ${env.PORT} [${env.NODE_ENV}]`);
});

// ─── Graceful Shutdown ──────────────────────────────────────────
function shutdown(signal: string) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });
  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception — shutting down");
  process.exit(1);
});
