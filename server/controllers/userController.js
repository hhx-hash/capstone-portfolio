const User = require("../models/User");
const httpError = require("../utils/httpError");
const { signToken } = require("../utils/token");
const { asString, asLowerString } = require("../utils/text");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * POST /api/users/register
 * Creates an account with a hashed password and signs the first token, so the
 * client can drop the user straight into the logged-in state.
 */
exports.register = async (req, res) => {
  const username = asString(req.body.username);
  const email = asLowerString(req.body.email);
  const password = typeof req.body.password === "string" ? req.body.password : "";

  const fields = {};
  if (username.length < 3) fields.username = "Username must be at least 3 characters.";
  if (!EMAIL_PATTERN.test(email)) fields.email = "Enter a valid email address.";
  if (password.length < 6) fields.password = "Password must be at least 6 characters.";

  if (Object.keys(fields).length > 0) {
    const error = httpError(400, "Validation failed.");
    error.fields = fields;
    throw error;
  }

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    const field = existing.email === email ? "email" : "username";
    const conflict = httpError(409, `That ${field} is already registered.`);
    conflict.fields = { [field]: `${field} must be unique` };
    throw conflict;
  }

  const user = await User.create({ username, email, password });

  res.status(201).json({ token: signToken(user), user });
};

/**
 * POST /api/users/login
 * Verifies the password with bcrypt and returns a fresh JWT.
 * `email` is the documented field; `username` is accepted as well so the demo
 * can log in with either identifier.
 */
exports.login = async (req, res) => {
  const identifier = asString(req.body.email) || asString(req.body.username);
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!identifier || !password) {
    throw httpError(400, "Email and password are required.");
  }

  const query = identifier.includes("@")
    ? { email: identifier.toLowerCase() }
    : { username: identifier };

  const user = await User.findOne(query).select("+password");

  // Same message for "no such account" and "wrong password" on purpose: it
  // does not tell an attacker which emails are registered.
  if (!user || !(await user.matchPassword(password))) {
    throw httpError(401, "Invalid email or password.");
  }

  // toJSON() removes the password hash from the payload.
  res.json({ token: signToken(user), user });
};

/** GET /api/users/me - the account behind the bearer token. */
exports.me = async (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ user: req.user });
};
