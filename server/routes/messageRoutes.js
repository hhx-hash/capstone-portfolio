const express = require("express");
const messageController = require("../controllers/messageController");
const { protect } = require("../middleware/auth");
const { contactLimit } = require("../middleware/limits");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

// Public form submission, throttled so the inbox cannot be flooded.
router.post("/", contactLimit, messageController.create);

// The inbox is for the owner only.
router.get("/", protect, messageController.list);
router.put("/:id/read", protect, validateObjectId("id"), messageController.markRead);

module.exports = router;
