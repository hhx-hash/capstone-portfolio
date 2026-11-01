const mongoose = require("mongoose");

/**
 * A comment on a blog post.
 *
 * Both relationships are required: a comment always belongs to exactly one
 * post and to the user who wrote it.
 */
const commentSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: [true, "Comment body is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [1000, "Comment must be at most 1000 characters"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogPost",
      required: true,
    },
  },
  { timestamps: true }
);

// Fetching the comments of one post is the hot path.
commentSchema.index({ post: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", commentSchema);
