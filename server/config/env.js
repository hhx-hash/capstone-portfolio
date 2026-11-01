/**
 * Environment loading and validation.
 *
 * Everything secret lives in `.env` (local) or in the hosting provider's
 * environment variables (Render). This module is the single place that reads
 * `process.env`, checks the values are usable, and fails loudly at boot instead
 * of at 3 a.m. behind a 500 response.
 */
const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const required = ["MONGO_URI", "JWT_SECRET"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `[env] Missing required environment variable(s): ${missing.join(", ")}\n` +
      "      Copy server/.env.example to server/.env and fill it in."
  );
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error("[env] JWT_SECRET is too short. Use at least 32 characters.");
  process.exit(1);
}

/**
 * Normalised, typed view of the environment. The rest of the code imports this
 * object instead of reading `process.env` directly, so a typo shows up here.
 */
const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  // Comma separated list -> array. "*" means "reflect any origin".
  clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  // Behind Render/Heroku the client IP arrives in X-Forwarded-For.
  trustProxy: process.env.TRUST_PROXY !== "0",
  // Vercel gives every deployment its own preview domain, which would otherwise
  // need a fresh CORS entry on every push. Set ALLOW_VERCEL_PREVIEWS=0 to turn
  // this off and rely on CLIENT_ORIGIN alone.
  allowVercelPreviews: process.env.ALLOW_VERCEL_PREVIEWS !== "0",
};

env.isProduction = env.nodeEnv === "production";

module.exports = env;
