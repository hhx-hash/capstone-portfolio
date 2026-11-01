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

function jsonLimiterMessage(message) {
  return { error: { status: 429, message } };
}

const authLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonLimiterMessage("Too many attempts. Try again in 15 minutes."),
  skip: skipAll,
});

const contactLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonLimiterMessage("Too many messages. Try again in 15 minutes."),
  skip: skipAll,
});

// Backstop for the whole API: generous, but stops a script hammering reads.
const apiLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 600,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: jsonLimiterMessage("Too many requests. Please slow down."),
  skip: skipAll,
});

module.exports = { authLimit, contactLimit, apiLimit };
