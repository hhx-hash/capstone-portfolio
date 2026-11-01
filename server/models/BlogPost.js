const mongoose = require("mongoose");

/**
 * A blog post. `author` is the relationship used by the authorization rule:
 * only the author may update or delete the post.
 */
const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [160, "Title must be at most 160 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      minlength: [10, "Content must be at least 10 characters"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Optional extension used by the blog list cards.
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

blogPostSchema.index({ createdAt: -1 });

// Short teaser for list pages, so the client does not need the whole body.
blogPostSchema.virtual("excerpt").get(function excerpt() {
  const text = this.content.replace(/\s+/g, " ").trim();
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
});

// Rough reading time, one virtual instead of a helper in every component.
blogPostSchema.virtual("readingTime").get(function readingTime() {
  const words = this.content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
});

module.exports = mongoose.model("BlogPost", blogPostSchema);
