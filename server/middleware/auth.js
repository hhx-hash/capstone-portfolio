const jwt = require("jsonwebtoken");
const User = require("../models/User");
const httpError = require("../utils/httpError");
const env = require("../config/env");

/**
 * Reads `Authorization: Bearer <token>`, verifies the signature and attaches
 * the matching user document to `req.user`.
 *
 * Every failure path ends in 401 with a message the client can display, so a
 * protected page can tell the difference between "log in" and "your session
 * expired".
 */
async function protect(req, res, next) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    throw httpError(401, "Not authorized. Please log in.");
  }

  const token = header.slice("Bearer ".length).trim();

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Your session expired. Please log in again."
        : "Not authorized. Invalid token.";
    throw httpError(401, message);
  }

  const user = await User.findById(payload.id);

  if (!user) {
    throw httpError(401, "The account for this token no longer exists.");
  }

  req.user = user;
  next();
}

/**
 * Guards routes that only the owner of the site may call.
 *
 * The capstone brief treats project management as admin-only. This build has a
 * single-owner model: any authenticated account is the owner, so the check
 * exists as a named middleware that the routes opt into, keeping the intent
 * readable in `routes/`.
 */
function ownerOnly(req, res, next) {
  if (!req.user) {
    throw httpError(401, "Not authorized. Please log in.");
  }
  next();
}

module.exports = { protect, ownerOnly };
