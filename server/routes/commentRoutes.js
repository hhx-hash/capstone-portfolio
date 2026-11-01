const express = require("express");
const commentController = require("../controllers/commentController");
const { protect } = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");

// mergeParams keeps `:postId` from the parent `/api/blog/:postId/comments` path.
const router = express.Router({ mergeParams: true });

router.get("/", validateObjectId("postId"), commentController.list);
router.post("/", protect, validateObjectId("postId"), commentController.create);

module.exports = router;
