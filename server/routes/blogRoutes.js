const express = require("express");
const commentRoutes = require("./commentRoutes");
const blogController = require("../controllers/blogController");
const { protect } = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

// Comments live under a post. Mounted before the single-post route so the
// nested path is matched first.
router.use("/:postId/comments", commentRoutes);

// Public reads.
router.get("/", blogController.list);
router.get("/:id", validateObjectId("id"), blogController.get);

// Writes require a bearer token; the controller also checks authorship.
router.post("/", protect, blogController.create);
router.put("/:id", protect, validateObjectId("id"), blogController.update);
router.delete("/:id", protect, validateObjectId("id"), blogController.remove);

module.exports = router;
