const express = require("express");
const userController = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const { authLimit } = require("../middleware/limits");

const router = express.Router();

// Account responses must never be cached by the browser or a CDN: they carry a
// token and depend on who is asking.
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Register and login share one rate-limit budget, so an attacker cannot double
// their attempts by alternating between the two forms.
router.post("/register", authLimit, userController.register);
router.post("/login", authLimit, userController.login);
router.get("/me", protect, userController.me);

module.exports = router;
