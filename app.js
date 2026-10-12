import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDatabase } from "./src/config/db.js";
import leadRoutes from "./src/routes/lead.js";
import {
  errorHandler,
  notFoundHandler,
} from "./src/middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());

  const allowedOrigins = (
    process.env.FRONTEND_ORIGIN ||
    "http://localhost:5173,https://med-license-inky.vercel.app"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        console.error("Blocked by CORS:", origin);
        return callback(new Error("Origin not allowed by CORS"));
      },
      methods: ["GET", "POST", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  // Handle browser preflight requests.
  app.options(
    /.*/,
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Origin not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use(express.json({ limit: "30kb" }));

  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      service: "medlicense-api",
      status: "ok",
    });
  });

  const leadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
  });

  // Inside createApp(), before registering API routes:
  app.use("/api", async (req, res, next) => {
    try {
      await connectDatabase();
      next();
    } catch (error) {
      console.error("Database connection failed:", error.message);
      res.status(503).json({
        success: false,
        message: "Database temporarily unavailable",
      });
    }
  });

  // Register the lead routes only once.
  app.use("/api/leads", leadLimiter, leadRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
