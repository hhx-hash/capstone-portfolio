/**
 * Vercel entry point.
 *
 * Vercel has no long-running process: this file exports the Express app as a
 * request handler. Three things have to be handled here and nowhere else:
 *
 * 1. The Atlas connection is cached on `global`, so a warm function reuses it
 *    instead of opening a new TLS connection for every request.
 * 2. A cached connection can be dead. Vercel freezes idle instances, and Atlas
 *    drops idle sockets, so the readyState is checked on every request and a
 *    fresh connection is opened when needed. Checking the state - not just
 *    "do we have a promise" - is what makes a frozen instance recover.
 * 3. The database must be reachable before Express starts querying, so the
 *    handler awaits the connection once per cold start.
 *
 * Locally the app is started by `server.js` instead; the code that serves
 * requests is exactly the same `app.js`.
 */
const mongoose = require("mongoose");
const app = require("../app");
const env = require("../config/env");

const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 8000,
  maxPoolSize: 5,
  // Vercel's egress is IPv4. Without this, Node may try the AAAA record first
  // and sit on a timeout before falling back.
  family: 4,
};

function cache() {
  if (!global.__capstoneCache) {
    global.__capstoneCache = { promise: null };
  }
  return global.__capstoneCache;
}

// A dropped socket must not leave a resolved promise behind.
mongoose.connection.on("disconnected", () => {
  cache().promise = null;
});

async function ensureDatabase() {
  const store = cache();
  const state = mongoose.connection.readyState; // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting

  if (state === 1) return mongoose.connection;

  // Anything other than "connecting" means the cached promise points at a
  // connection that is gone (or was never established).
  if (state !== 2) store.promise = null;

  if (!store.promise) {
    store.promise = mongoose
      .connect(env.mongoUri, CONNECT_OPTIONS)
      .then(() => mongoose.connection);
  }

  try {
    return await store.promise;
  } catch (error) {
    store.promise = null;
    throw error;
  }
}

/**
 * Describes the connection target without revealing the password, so a
 * deployment problem can be diagnosed from the response alone.
 */
function describeTarget(uri) {
  try {
    const parsed = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, "http://"));
    const hosts = decodeURIComponent(parsed.host).split(",").map((host) => host.trim());
    return {
      form: uri.startsWith("mongodb+srv") ? "srv" : "direct",
      hosts,
      database: parsed.pathname.replace(/^\//, "").split("?")[0] || "(none)",
      user: parsed.username || "(none)",
    };
  } catch {
    return { form: "unparseable" };
  }
}

/** Turns a driver error into one line of actionable advice. */
function hintFor(error) {
  const text = `${error.name} ${error.message}`;

  if (/ENOTFOUND|querySrv|EAI_AGAIN|getaddrinfo/i.test(text)) {
    return "DNS lookup failed. The srv form needs SRV/TXT records; switch MONGO_URI to the direct host list.";
  }
  if (/Authentication failed|bad auth|SCRAM/i.test(text)) {
    return "Atlas rejected the credentials. Check the username, password and authSource=admin.";
  }
  if (/not allowed|whitelist|ip/i.test(text)) {
    return "The client IP is not in the Atlas access list. Add 0.0.0.0/0 in Network Access.";
  }
  if (/timed out|timeout|ServerSelection/i.test(text)) {
    return "The cluster was unreachable in time. Check the Atlas access list and that the cluster is not paused.";
  }
  return "Unexpected driver error; the message above is the raw cause.";
}

module.exports = async (req, res) => {
  try {
    await ensureDatabase();
  } catch (error) {
    console.error("[vercel] database unavailable:", error);

    // Strip any credentials that might appear inside the driver message.
    const safeMessage = String(error.message || "").replace(
      /mongodb(\+srv)?:\/\/[^@\s]+@/g,
      "mongodb://***@"
    );

    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(
      JSON.stringify({
        error: {
          status: 503,
          message:
            "The API cannot reach the database right now. Check the MongoDB Atlas network access list.",
          diagnostics: {
            target: describeTarget(env.mongoUri),
            reason: error.name,
            detail: safeMessage.slice(0, 300),
            hint: hintFor(error),
            node: process.version,
            region: process.env.VERCEL_REGION || "unknown",
          },
        },
      })
    );
    return undefined;
  }

  return app(req, res);
};
