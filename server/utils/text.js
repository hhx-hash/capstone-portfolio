/**
 * `String` helpers that survive hostile input.
 *
 * A request body is untrusted: `{ "email": { "$ne": null } }` is a perfectly
 * valid JSON document, and calling `.trim()` on it throws a TypeError that would
 * surface as a 500. Every controller funnels body values through these instead.
 */
function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function asLowerString(value) {
  return asString(value).toLowerCase();
}

/** Accepts a real array of strings, ignores anything else. */
function asStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : undefined;
}

module.exports = { asString, asLowerString, asStringArray };
