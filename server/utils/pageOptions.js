const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/**
 * Turns `?page=2&limit=5` into numbers that are safe to hand to Mongoose.
 *
 * Everything is clamped: a hand-written `?limit=999999` cannot be used to pull
 * the whole collection in one request.
 */
function pageOptions(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const requested = Number.parseInt(query.limit, 10) || DEFAULT_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, requested));

  return { page, limit, skip: (page - 1) * limit, sort: { createdAt: -1, _id: -1 } };
}

module.exports = { pageOptions, DEFAULT_LIMIT, MAX_LIMIT };
