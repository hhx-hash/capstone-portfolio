const mongoose = require("mongoose");
const httpError = require("../utils/httpError");

/**
 * Rejects malformed ids before Mongoose can throw a CastError.
 *
 * A request like `/api/blog/not-an-id` therefore answers 400 ("that is not a
 * valid id") instead of 404 or 500.
 */
function validateObjectId(paramName = "id") {
  return function checkId(req, res, next) {
    const value = req.params[paramName];
    if (!mongoose.isValidObjectId(value)) {
      throw httpError(400, `Invalid ${paramName} format.`);
    }
    next();
  };
}

module.exports = validateObjectId;
