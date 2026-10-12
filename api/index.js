import dotenv from "dotenv";
import { createApp } from "../app.js";
import { connectDatabase } from "../src/config/db.js";

dotenv.config();

const app = createApp();

let databasePromise;

async function ensureDatabaseConnected() {
  if (!databasePromise) {
    databasePromise = connectDatabase().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}

app.use(async (req, res, next) => {
  try {
    await ensureDatabaseConnected();
    next();
  } catch (error) {
    console.error("Database connection failed:", error.message);

    res.status(503).json({
      success: false,
      message: "Database temporarily unavailable",
    });
  }
});

export default app;
