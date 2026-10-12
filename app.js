import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import leadRoutes from "./src/routes/lead.js";
import {
  errorHandler,
  notFoundHandler,
} from "./src/middleware/errorHandler.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "20kb" }));

  const allowedOrigins = (
    process.env.FRONTEND_ORIGIN || "http://localhost:5173"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin))
          return callback(null, true);
        return callback(new Error("Origin not allowed by CORS"));
      },
      methods: ["GET", "POST", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "30kb" }));

  app.get("/api/v1/health", (req, res) =>
    res.json({ success: true, service: "medlicense-api", status: "ok" }),
  );

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

  app.use("/api/leads", leadLimiter, leadRoutes);
  app.use("/api/leads", leadRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
