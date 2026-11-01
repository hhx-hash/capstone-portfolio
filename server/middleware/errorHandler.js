const env = require("../config/env");

/**
 * Central error handler - the only place that writes an error response.
 *
 * Controllers throw (usually via `httpError(status, message)`); this middleware
 * translates Mongoose and `express.json()` failures into the same JSON envelope:
 *
 *     { "error": { "message": "...", "fields": { "title": "..." } } }
 */
// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
function errorHandler(error, req, res, next) {
  let status = error.status || error.statusCode || 500;
  let message = error.message || "Server error";
  let fields;

  // Mongoose: field validation failed.
  if (error.name === "ValidationError") {
    status = 400;
    message = "Validation failed.";
    fields = Object.fromEntries(
      Object.entries(error.errors).map(([path, detail]) => [path, detail.message])
    );
  }

  // Mongoose: `/api/blog/<not-an-id>` style cast failure.
  if (error.name === "CastError") {
    status = 400;
    message = `Invalid value for ${error.path}.`;
  }

  // Mongoose: unique index (username or email already taken).
  if (error.code === 11000) {
    status = 409;
    const field = Object.keys(error.keyValue || error.keyPattern || {})[0] || "field";
    message = `That ${field} is already registered.`;
    fields = { [field]: `${field} must be unique` };
  }

  // express.json(): malformed JSON, or a body above the 32 KB limit.
  if (error.type === "entity.parse.failed") {
    status = 400;
    message = "Request body is not valid JSON.";
  }
  if (error.type === "entity.too.large") {
    status = 413;
    message = "Request body is too large.";
  }

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, error);
    if (env.isProduction) {
      message = "Something went wrong on the server.";
    }
  }

  res.status(status).json({
    error: {
      status,
      message,
      ...(fields ? { fields } : {}),
      ...(env.isProduction ? {} : { stack: error.stack }),
    },
  });
}

module.exports = errorHandler;
