const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SALT_ROUNDS = 10;

/**
 * Users are the blog authors / portfolio owners.
 *
 * `password` is never stored in clear text: the pre-save hook hashes it only
 * when it changed, and `toJSON` strips it from every response so a controller
 * cannot leak it by accident.
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [40, "Username must be at most 40 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [EMAIL_PATTERN, "Email must be a valid address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
  },
  { timestamps: true }
);

// Hash on create and whenever the password field is replaced by a new value.
userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

/** Compares a plain text password from the login form with the stored hash. */
userSchema.methods.matchPassword = function matchPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

// Belt and braces: password is already `select: false`, this also removes it
// when a document was loaded with an explicit `+password`.
userSchema.methods.toJSON = function toJSON() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

module.exports = mongoose.model("User", userSchema);
