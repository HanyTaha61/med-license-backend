import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import cors from "cors";
import express from "express";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://med-license-inky.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header, such as server-to-server calls.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

const currentFile = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFile);

// Always load the .env file located beside server.js
dotenv.config({ path: resolve(currentDir, ".env") });

const { createApp } = await import("./app.js");
const { connectDatabase } = await import("./src/config/db.js");

const port = Number(process.env.PORT || 6500);

try {
  console.log("Environment loaded:", Boolean(process.env.MONGODB_URI));

  await connectDatabase();

  const app = createApp();

  const server = app.listen(port, () => {
    console.log(`✅ MedLicense API listening on port ${port}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received; closing server`);

    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
} catch (error) {
  console.error("Failed to start MedLicense API:", error.message);
  process.exit(1);
}
