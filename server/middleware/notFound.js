const httpError = require("../utils/httpError");

/**
 * Any request that reached this point matched no route.
 * It is converted into the same JSON error shape as every other failure.
 */
function notFound(req, res, next) {
  next(httpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
