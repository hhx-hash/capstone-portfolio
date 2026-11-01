const jwt = require("jsonwebtoken");
const env = require("../config/env");

/**
 * Signs a JWT whose payload identifies the user.
 *
 * The client sends it back in `Authorization: Bearer <token>` and the `protect`
 * middleware turns it into `req.user`.
 */
function signToken(user) {
  return jwt.sign({ id: user._id.toString() }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

module.exports = { signToken };
