const express = require("express");
const projectController = require("../controllers/projectController");
const { protect } = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

// Public reads.
router.get("/", projectController.list);
router.get("/:id", validateObjectId("id"), projectController.get);

// Writes require a bearer token.
router.post("/", protect, projectController.create);
router.put("/:id", protect, validateObjectId("id"), projectController.update);
router.delete("/:id", protect, validateObjectId("id"), projectController.remove);

module.exports = router;
