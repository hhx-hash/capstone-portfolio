const rateLimit = require("express-rate-limit");

/**
 * Request throttling.
 *
 * Two budgets: logging in / registering is the expensive, guessable operation,
 * so it is capped tightly; the public contact form is capped so the inbox
 * cannot be flooded. Counting is per client IP, which is why the app trusts the
 * proxy header in production (see `config/env.js`).
 */
const FIFTEEN_MINUTES = 15 * 60 * 1000;

// The automated checks fire more than ten auth requests in a row, so the
// verifier starts the API with DISABLE_RATE_LIMIT=1. Nothing else sets it.
const skipAll = () => process.env.DISABLE_RATE_LIMIT === "1";

/**
 * Inside a serverless function the runtime has no real socket, so `req.ip` can
 * be undefined while the platform still sends `x-forwarded-for`. Falling back to
 * that header keeps the counters per client instead of lumping everyone into one
 * bucket.
 */
function clientKey(req) {
  if (req.ip) return req.ip;
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

// draft-7 headers are used instead of draft-8: the draft-8 `RateLimit` header
// hashes the client address, which does not exist in a serverless request.
const HEADERS = "draft-7";

function jsonLimiterMessage(message) {
  return { error: { status: 429, message } };
}

const authLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  standardHeaders: HEADERS,
  legacyHeaders: false,
  keyGenerator: clientKey,
  validate: { keyGeneratorIpFallback: false },
  message: jsonLimiterMessage("Too many attempts. Try again in 15 minutes."),
  skip: skipAll,
});

const contactLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 5,
  standardHeaders: HEADERS,
  legacyHeaders: false,
  keyGenerator: clientKey,
  validate: { keyGeneratorIpFallback: false },
  message: jsonLimiterMessage("Too many messages. Try again in 15 minutes."),
  skip: skipAll,
});

// Backstop for the whole API: generous, but stops a script hammering reads.
const apiLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 600,
  standardHeaders: HEADERS,
  legacyHeaders: false,
  keyGenerator: clientKey,
  validate: { keyGeneratorIpFallback: false },
  message: jsonLimiterMessage("Too many requests. Please slow down."),
  skip: skipAll,
});

module.exports = { authLimit, contactLimit, apiLimit };
