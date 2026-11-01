/**
 * Vercel entry point.
 *
 * Vercel exports this file as a request handler (no listening socket), so the
 * only extra work is making sure Atlas is reachable before Express starts
 * querying. The connection caching itself lives in `lib/serverless.js`, shared
 * with the Netlify function.
 */
const app = require("../app");
const { ensureDatabase, failurePayload } = require("../lib/serverless");

module.exports = async (req, res) => {
  try {
    await ensureDatabase();
  } catch (error) {
    console.error("[vercel] database unavailable:", error);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(failurePayload(error)));
    return undefined;
  }

  return app(req, res);
};
