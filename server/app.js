const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");

const env = require("./config/env");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const blogRoutes = require("./routes/blogRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const { apiLimit } = require("./middleware/limits");

const app = express();

// Behind Render (or any PaaS) req.ip only reflects the real client when the
// proxy header is trusted - that matters for rate limiting.
if (env.trustProxy) {
  app.set("trust proxy", 1);
}
app.disable("x-powered-by");

/* ----------------------------- global middleware ------------------------- */

// 1. Secure response headers (CSP, nosniff, frame options, ...).
app.use(helmet());

// 2. CORS. `CLIENT_ORIGIN` may list several origins (comma separated) so the
//    local dev server and the deployed front end both work without edits.
//    An unknown origin is not reflected back, which makes the browser block it.
//    Vercel and Netlify give every deployment its own subdomain, so those two
//    platforms are recognised by pattern unless ALLOW_PLATFORM_PREVIEWS=0.
const allowAnyOrigin = env.clientOrigins.includes("*");
const PLATFORM_HOST = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.(vercel|netlify)\.app$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowAnyOrigin || env.clientOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (env.allowPlatformPreviews && PLATFORM_HOST.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    // Pagination counters are read by the client, so they must be exposed.
    exposedHeaders: [
      "X-Total-Count",
      "X-Total-Pages",
      "X-Page",
      "X-Page-Limit",
      "X-Unread-Count",
      "RateLimit",
      "RateLimit-Policy",
    ],
    maxAge: 86400,
  })
);

// 3. JSON body parser with a small ceiling: no legitimate request needs more.
//    Serverless runtimes differ: Vercel hands over a raw stream, while the
//    Lambda-style Netlify event arrives with `req.body` already set to the raw
//    JSON string. Parsing has to cope with all three shapes (undefined, string,
//    already-parsed object) instead of assuming a stream.
const jsonParser = express.json({ limit: "32kb" });

function jsonBody(req, res, next) {
  // Already parsed into an object by the runtime.
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    next();
    return;
  }

  // Present as the raw JSON text: parse it here, the stream is gone.
  if (typeof req.body === "string") {
    if (req.body.length === 0) {
      req.body = {};
      next();
      return;
    }
    try {
      req.body = JSON.parse(req.body);
      next();
    } catch {
      const error = new Error("Request body is not valid JSON.");
      error.status = 400;
      next(error);
    }
    return;
  }

  jsonParser(req, res, next);
}

app.use(jsonBody);

// 3b. A request without a JSON content type leaves req.body undefined. Give
//     every handler an object to read, so validation reports 400 instead of a
//     TypeError turning into a 500.
app.use((req, res, next) => {
  if (!req.body) req.body = {};
  next();
});

// 4. Broad throttle as a backstop behind the per-route limits.
app.use("/api", apiLimit);

/* --------------------------------- routes -------------------------------- */

app.get("/", (req, res) => {
  res.json({
    name: "Capstone Portfolio & Blog API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      users: "/api/users",
      projects: "/api/projects",
      blog: "/api/blog",
      comments: "/api/blog/:postId/comments",
      contact: "/api/contact",
      health: "/api/health",
    },
  });
});

app.get("/api/health", (req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status: "ok",
    uptime: Math.round(process.uptime()),
    database: states[mongoose.connection.readyState] || "unknown",
  });
});

app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/contact", messageRoutes);

/* ------------------------------ error handling --------------------------- */

app.use(notFound);
app.use(errorHandler);

module.exports = app;
