import { formatDate, initials } from "../lib/format.js";

/** The comment thread under an article. */
export default function CommentList({ comments }) {
  if (comments.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        No comments yet. Be the first to say something.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <li key={comment._id} className="flex gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
            {initials(comment.author?.username || "?")}
          </span>
          <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-sm font-semibold text-slate-900">
                {comment.author?.username || "Unknown"}
              </span>
              <time className="text-xs text-slate-500" dateTime={comment.createdAt}>
                {formatDate(comment.createdAt)}
              </time>
            </div>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-slate-700">
              {comment.body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
