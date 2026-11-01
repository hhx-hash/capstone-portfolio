const Message = require("../models/Message");
const { pageOptions } = require("../utils/pageOptions");
const httpError = require("../utils/httpError");
const { asString, asLowerString } = require("../utils/text");

/**
 * POST /api/contact
 * Public. Saves the contact form as a Message document. Nothing is emailed -
 * the inbox lives in the admin dashboard.
 */
exports.create = async (req, res) => {
  const message = await Message.create({
    name: asString(req.body.name),
    email: asLowerString(req.body.email),
    message: asString(req.body.message),
  });

  res.status(201).json({
    message: "Thanks! Your message has been saved.",
    data: message,
  });
};

/**
 * GET /api/contact
 * Protected. The inbox: newest first, paginated.
 */
exports.list = async (req, res) => {
  const { page, limit, skip, sort } = pageOptions(req.query);

  const [total, unread, messages] = await Promise.all([
    Message.countDocuments(),
    Message.countDocuments({ read: false }),
    Message.find().sort(sort).skip(skip).limit(limit),
  ]);

  res.set("X-Total-Count", String(total));
  res.set("X-Unread-Count", String(unread));
  res.set("X-Total-Pages", String(Math.max(1, Math.ceil(total / limit))));

  res.json(messages);
};

/** PUT /api/contact/:id/read - protected; flips the "handled" flag. */
exports.markRead = async (req, res) => {
  const message = await Message.findByIdAndUpdate(
    req.params.id,
    { read: Boolean(req.body.read ?? true) },
    { new: true, runValidators: true }
  );

  if (!message) {
    throw httpError(404, "Message not found.");
  }

  res.json(message);
};
