import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { router } from "./router.js";
import { getDb } from "./config/db.js";
import { sql } from "drizzle-orm";

const startTime = Date.now();
const APP_VERSION = "0.1.0";

export function createApp() {
  const app = express();

  // ─── Proxy Trust (required for Render, Railway, etc.) ────────
  // Render terminates TLS and forwards requests via a reverse proxy.
  // Without this, express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
  app.set("trust proxy", 1);

  // ─── Request Logging ──────────────────────────────────────────
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => {
          const url = (req as any).url ?? "";
          return url === "/health" || url === "/health/db";
        },
      },
      customLogLevel: (_req, res, err) => {
        if (res.statusCode >= 500 || err) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
      serializers: {
        req: (req) => ({
          method: req.method,
          url: req.url,
          remoteAddress: req.remoteAddress,
        }),
        res: (res) => ({
          statusCode: res.statusCode,
        }),
      },
    })
  );

  // ─── Security ────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
    })
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 86400,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));

  // ─── Rate Limiting ────────────────────────────────────────────
  app.use(
    "/api/v1/auth/login",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many login attempts, try again in 15 minutes",
        },
      },
    })
  );

  app.use(
    "/api",
    rateLimit({
      windowMs: 60 * 1000,
      max: env.NODE_ENV === "production" ? 100 : 500,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // ─── Routes ───────────────────────────────────────────────────
  app.use("/api/v1", router);

  // ─── Health Check ─────────────────────────────────────────────
  app.get("/health", (_req, res) => {
    const uptimeMs = Date.now() - startTime;
    const uptimeSec = Math.floor(uptimeMs / 1000);
    const hours = Math.floor(uptimeSec / 3600);
    const mins = Math.floor((uptimeSec % 3600) / 60);
    const secs = uptimeSec % 60;

    res.json({
      status: "ok",
      version: APP_VERSION,
      uptime: `${hours}h ${mins}m ${secs}s`,
      uptimeSeconds: uptimeSec,
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  app.get("/health/db", async (_req, res) => {
    const start = Date.now();
    try {
      const db = getDb();
      const result = await db.execute(sql`SELECT 1 as ok, NOW() as server_time`);
      const latencyMs = Date.now() - start;
      const row = (result as any).rows?.[0] ?? (result as any)[0] ?? result;

      res.json({
        status: "ok",
        database: "connected",
        latencyMs,
        serverTime: row?.server_time ?? new Date().toISOString(),
        version: APP_VERSION,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      const latencyMs = Date.now() - start;
      res.status(503).json({
        status: "error",
        database: "disconnected",
        latencyMs,
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ─── Error Handler (must be last) ────────────────────────────
  app.use(errorHandler);

  return app;
}
