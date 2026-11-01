const mongoose = require("mongoose");

/**
 * A portfolio project card.
 *
 * `user` is the author relationship the specification asks for: every project
 * belongs to the account that created it, which is what makes ownership checks
 * meaningful later.
 */
const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title must be at most 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description must be at most 2000 characters"],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    repoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    liveUrl: {
      type: String,
      trim: true,
      default: "",
    },
    // Optional extension: the badges rendered under each project card.
    technologies: {
      type: [String],
      default: [],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Project", projectSchema);
