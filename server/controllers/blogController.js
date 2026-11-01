const BlogPost = require("../models/BlogPost");
const Comment = require("../models/Comment");
const { pageOptions } = require("../utils/pageOptions");
const httpError = require("../utils/httpError");

function pickPostFields(body) {
  const allowed = ["title", "content", "tags"];
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => allowed.includes(key))
  );
}

/** Loads a post and throws the right error when it is missing or not the caller's. */
async function findOwnedPost(id, userId) {
  const post = await BlogPost.findById(id);

  if (!post) {
    throw httpError(404, "Blog post not found.");
  }

  if (post.author.toString() !== userId.toString()) {
    throw httpError(403, "You can only modify your own posts.");
  }

  return post;
}

/**
 * GET /api/blog
 * Public. Posts newest first, each one populated with its author's username.
 */
exports.list = async (req, res) => {
  const { page, limit, skip, sort } = pageOptions(req.query);

  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { title: { $regex: String(req.query.search).trim(), $options: "i" } },
      { content: { $regex: String(req.query.search).trim(), $options: "i" } },
    ];
  }

  const [total, posts] = await Promise.all([
    BlogPost.countDocuments(filter),
    BlogPost.find(filter)
      .populate("author", "username")
      .sort(sort)
      .skip(skip)
      .limit(limit),
  ]);

  res.set("X-Total-Count", String(total));
  res.set("X-Total-Pages", String(Math.max(1, Math.ceil(total / limit))));
  res.set("X-Page", String(page));
  res.set("X-Page-Limit", String(limit));

  res.json(posts);
};

/**
 * GET /api/blog/:id
 * Public. One post, populated with the author's username, plus its comments
 * (each comment populated with its own author's username).
 */
exports.get = async (req, res) => {
  const post = await BlogPost.findById(req.params.id).populate("author", "username");

  if (!post) {
    throw httpError(404, "Blog post not found.");
  }

  const comments = await Comment.find({ post: post._id })
    .populate("author", "username")
    .sort({ createdAt: -1 });

  res.json({ ...post.toJSON(), comments });
};

/** POST /api/blog - protected; the post is written by the caller. */
exports.create = async (req, res) => {
  const post = await BlogPost.create({
    ...pickPostFields(req.body),
    author: req.user._id,
  });

  await post.populate("author", "username");

  res.status(201).json(post);
};

/** PUT /api/blog/:id - protected AND authorized (author only). */
exports.update = async (req, res) => {
  const post = await findOwnedPost(req.params.id, req.user._id);

  Object.assign(post, pickPostFields(req.body));
  await post.save();
  await post.populate("author", "username");

  res.json(post);
};

/**
 * DELETE /api/blog/:id - protected AND authorized (author only).
 * The comments are removed too: nothing else references them, and leaving them
 * behind would leave orphans in the database.
 */
exports.remove = async (req, res) => {
  const post = await findOwnedPost(req.params.id, req.user._id);

  const { deletedCount } = await Comment.deleteMany({ post: post._id });
  await post.deleteOne();

  res.json({
    message: "Blog post deleted.",
    id: post._id,
    deletedComments: deletedCount,
  });
};
