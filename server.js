import dotenv from "dotenv";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { connectDatabase } from "./src/config/db.js";

dotenv.config();

const port = Number(process.env.PORT || 6500);

try {
  console.log("MongoDB URI configured:", Boolean(process.env.MONGODB_URI));

  await connectDatabase();

  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`MedLicense API listening on port ${port}`);
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
  console.error("Failed to start MedLicense API:", error);
  process.exit(1);
}
