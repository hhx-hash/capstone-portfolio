import { Link } from "react-router";
import { excerpt, formatDate, readingTime } from "../lib/format.js";

/** One entry in the blog list. */
export default function BlogPostCard({ post }) {
  const { _id, title, content, author, createdAt, tags = [] } = post;

  return (
    <article className="card p-6 transition hover:shadow-md">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <time dateTime={createdAt}>{formatDate(createdAt)}</time>
        <span aria-hidden="true">·</span>
        <span>{readingTime(content)} min read</span>
        {author?.username && (
          <>
            <span aria-hidden="true">·</span>
            <span>by {author.username}</span>
          </>
        )}
      </div>

      <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
        <Link to={`/blog/${_id}`} className="hover:text-indigo-600">
          {title}
        </Link>
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">{excerpt(content)}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
          {tags.map((tag) => (
            <li key={tag} className="chip-accent">
              {tag}
            </li>
          ))}
        </ul>
        <Link to={`/blog/${_id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          Read article →
        </Link>
      </div>
    </article>
  );
}
