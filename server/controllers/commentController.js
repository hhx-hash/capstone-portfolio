const BlogPost = require("../models/BlogPost");
const Comment = require("../models/Comment");
const httpError = require("../utils/httpError");
const { pageOptions } = require("../utils/pageOptions");
const { asString } = require("../utils/text");

/**
 * Comments are mounted on the post path (`/api/blog/:postId/comments`) with
 * `mergeParams`, so the controller receives both ids and has to check that the
 * post really exists before touching the collection.
 */
async function assertPostExists(postId) {
  const exists = await BlogPost.exists({ _id: postId });
  if (!exists) {
    throw httpError(404, "Blog post not found.");
  }
}

/**
 * GET /api/blog/:postId/comments
 * Public. Newest first, each comment populated with its author's username.
 */
exports.list = async (req, res) => {
  await assertPostExists(req.params.postId);

  const { page, limit, skip } = pageOptions(req.query);

  const [total, comments] = await Promise.all([
    Comment.countDocuments({ post: req.params.postId }),
    Comment.find({ post: req.params.postId })
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  res.set("X-Total-Count", String(total));
  res.set("X-Total-Pages", String(Math.max(1, Math.ceil(total / limit))));
  res.set("X-Page", String(page));
  res.set("X-Page-Limit", String(limit));

  res.json(comments);
};

/**
 * POST /api/blog/:postId/comments
 * Protected. The comment is linked to both the post and the logged-in user.
 */
exports.create = async (req, res) => {
  const postId = req.params.postId;
  const body = asString(req.body.body);

  if (!body) {
    throw httpError(400, "Comment text is required.");
  }

  await assertPostExists(postId);

  const comment = await Comment.create({
    body,
    post: postId,
    author: req.user._id,
  });

  await comment.populate("author", "username");

  res.status(201).json(comment);
};
