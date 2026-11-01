import { useState } from "react";
import { Link, useLocation } from "react-router";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.js";

/**
 * Comment box for the article page.
 *
 * A guest sees an invitation to log in instead of a form, because the endpoint
 * requires a bearer token - showing a form that can only fail would be worse UI
 * than explaining the rule once.
 */
export default function CommentForm({ postId, onCreated }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        <Link
          to="/login"
          state={{ from: location.pathname }}
          className="font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Log in
        </Link>{" "}
        to join the discussion.
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (body.trim().length === 0) {
      setError("Write something before posting.");
      return;
    }

    setSaving(true);
    try {
      const comment = await api.createComment(postId, body.trim());
      setBody("");
      onCreated(comment);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5">
      <label className="label" htmlFor="comment-body">
        Comment as @{user?.username}
      </label>
      <textarea
        id="comment-body"
        name="comment-body"
        rows={4}
        className="input"
        placeholder="Share what you think..."
        value={body}
        onChange={(event) => setBody(event.target.value)}
        aria-describedby={error ? "comment-error" : undefined}
      />

      {error && (
        <p className="field-error" id="comment-error" role="alert">
          {error}
        </p>
      )}

      <div className="mt-3 flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Posting..." : "Post comment"}
        </button>
      </div>
    </form>
  );
}
