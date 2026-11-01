/**
 * Creates an Error carrying an HTTP status code.
 *
 * Controllers only `throw`; the central error handler in
 * `middleware/errorHandler.js` is the single place that writes the response.
 * Using a helper keeps the status code attached to the error instead of being
 * set on `res` (which the handler would then have to read back).
 */
function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

module.exports = httpError;
