/**
 * Serverless glue shared by the Vercel entry point (`api/index.js`) and the
 * Netlify function (`netlify/functions/api.js`).
 *
 * Both platforms call one function per request inside a container that may be
 * frozen between requests, so the database connection has to be cached across
 * invocations *and* checked for liveness on every call. Checking the state -
 * not just "is there a promise" - is what makes a frozen instance recover after
 * Atlas has dropped its idle sockets.
 */
const mongoose = require("mongoose");
const env = require("../config/env");

const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 8000,
  maxPoolSize: 5,
  // Serverless egress is IPv4. Without this, Node may try the AAAA record first
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
if (!global.__capstoneDisconnectHooked) {
  global.__capstoneDisconnectHooked = true;
  mongoose.connection.on("disconnected", () => {
    cache().promise = null;
  });
}

async function ensureDatabase() {
  const store = cache();
  const state = mongoose.connection.readyState; // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting

  if (state === 1) return mongoose.connection;

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

/** Describes the connection target without revealing the password. */
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

/** The 503 body used when the database cannot be reached. */
function failurePayload(error) {
  const safeMessage = String(error.message || "").replace(
    /mongodb(\+srv)?:\/\/[^@\s]+@/g,
    "mongodb://***@"
  );

  return {
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
        region: process.env.VERCEL_REGION || process.env.AWS_REGION || "unknown",
      },
    },
  };
}

module.exports = { ensureDatabase, failurePayload, describeTarget, hintFor, CONNECT_OPTIONS };
