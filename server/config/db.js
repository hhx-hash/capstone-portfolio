/**
 * MongoDB Atlas connection.
 *
 * The free Atlas tier (and the office/home networks these demos run on) can be
 * slow to answer the first time, so the connection is attempted a few times
 * before the process gives up.
 */
const mongoose = require("mongoose");
const env = require("./env");

mongoose.set("strictQuery", true);

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connectDB(attempt = 1) {
  try {
    const connection = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(
      `[db] connected to ${connection.connection.name} on ${connection.connection.host}`
    );
    return connection;
  } catch (error) {
    console.error(`[db] attempt ${attempt} failed: ${error.message}`);
    if (attempt >= MAX_ATTEMPTS) {
      throw error;
    }
    await sleep(RETRY_DELAY_MS);
    return connectDB(attempt + 1);
  }
}

async function disconnectDB() {
  await mongoose.connection.close();
  console.log("[db] connection closed");
}

module.exports = { connectDB, disconnectDB };
