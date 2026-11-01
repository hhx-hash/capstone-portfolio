const Project = require("../models/Project");
const { pageOptions } = require("../utils/pageOptions");
const httpError = require("../utils/httpError");

/** Copies only the fields a client is allowed to set (never `user`, never `_id`). */
function pickProjectFields(body) {
  const allowed = ["title", "description", "imageUrl", "repoUrl", "liveUrl", "technologies"];
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => allowed.includes(key))
  );
}

/**
 * GET /api/projects
 * Public. Newest first, optionally paginated (`?page=&limit=`) and searched
 * (`?search=`). Pagination metadata travels in response headers so the body
 * stays a plain array.
 */
exports.list = async (req, res) => {
  const { page, limit, skip, sort } = pageOptions(req.query);

  const filter = {};
  if (req.query.search) {
    filter.title = { $regex: String(req.query.search).trim(), $options: "i" };
  }

  const [total, projects] = await Promise.all([
    Project.countDocuments(filter),
    Project.find(filter)
      .populate("user", "username")
      .sort(sort)
      .skip(skip)
      .limit(limit),
  ]);

  res.set("X-Total-Count", String(total));
  res.set("X-Total-Pages", String(Math.max(1, Math.ceil(total / limit))));
  res.set("X-Page", String(page));
  res.set("X-Page-Limit", String(limit));

  res.json(projects);
};

/** GET /api/projects/:id - public single project. */
exports.get = async (req, res) => {
  const project = await Project.findById(req.params.id).populate("user", "username");

  if (!project) {
    throw httpError(404, "Project not found.");
  }

  res.json(project);
};

/** POST /api/projects - protected; the project is owned by the caller. */
exports.create = async (req, res) => {
  const project = await Project.create({
    ...pickProjectFields(req.body),
    user: req.user._id,
  });

  res.status(201).json(project);
};

/** PUT /api/projects/:id - protected full update. */
exports.update = async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw httpError(404, "Project not found.");
  }

  Object.assign(project, pickProjectFields(req.body));
  await project.save();

  res.json(project);
};

/** DELETE /api/projects/:id - protected. */
exports.remove = async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);

  if (!project) {
    throw httpError(404, "Project not found.");
  }

  res.json({ message: "Project deleted.", id: project._id });
};
