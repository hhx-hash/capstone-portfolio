/**
 * Netlify Function entry point.
 *
 * Netlify calls an AWS Lambda style handler with an `event` object instead of
 * Node's `req`/`res`, so `serverless-http` translates both ways. The Express
 * app is mounted under `/.netlify/functions/api`, and `basePath` strips that
 * prefix again before the request reaches Express - which is why the redirect
 * in `netlify.toml` maps `/api/x` to `/.netlify/functions/api/api/x`.
 */
const serverless = require("serverless-http");
const app = require("../../app");
const { ensureDatabase, failurePayload } = require("../../lib/serverless");

const FUNCTION_PREFIX = "/.netlify/functions/api";
const handler = serverless(app, { basePath: FUNCTION_PREFIX });

exports.handler = async (event, context) => {
  // Mongoose keeps sockets open; without this Lambda waits for the event loop
  // to drain and the request times out instead of returning.
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  try {
    await ensureDatabase();
  } catch (error) {
    console.error("[netlify] database unavailable:", error);
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify(failurePayload(error)),
    };
  }

  return handler(event, context);
};
