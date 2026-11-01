/**
 * Vercel entry point.
 *
 * Vercel has no long-running process: this file exports the Express app as a
 * request handler. Two things have to be handled here and nowhere else:
 *
 * 1. The Atlas connection is cached on `global`, so a warm function reuses it
 *    instead of opening a new TLS connection for every request.
 * 2. The database must be reachable before Express starts querying, so the
 *    handler awaits the connection once per cold start.
 *
 * Locally the app is started by `server.js` instead; the code that serves
 * requests is exactly the same `app.js`.
 */
const mongoose = require("mongoose");
const app = require("../app");
const env = require("../config/env");

// Survives between invocations of the same warm function instance.
let connectPromise = global.__capstoneConnect || null;

function ensureDatabase() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();

  if (!connectPromise) {
    connectPromise = mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 5,
    });
    global.__capstoneConnect = connectPromise;
  }

  // A failed attempt must not be cached, or the function stays broken until it
  // is recycled.
  return connectPromise.catch((error) => {
    connectPromise = null;
    global.__capstoneConnect = null;
    throw error;
  });
}

module.exports = async (req, res) => {
  try {
    await ensureDatabase();
  } catch (error) {
    console.error("[vercel] database unavailable:", error.message);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: {
          status: 503,
          message:
            "The API cannot reach the database right now. Check the MongoDB Atlas network access list.",
        },
      })
    );
    return undefined;
  }

  return app(req, res);
};
