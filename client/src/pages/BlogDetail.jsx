import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../lib/api.js";
import { formatDate, initials, paragraphs, readingTime } from "../lib/format.js";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";
import CommentList from "../components/CommentList.jsx";
import CommentForm from "../components/CommentForm.jsx";

/**
 * Article page: GET /api/blog/:id returns the post with its author and its
 * comments. New comments are appended to local state so the page does not need
 * a refetch after posting.
 */
export default function BlogDetail() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, error: null, post: null, comments: [] });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, error: null, post: null, comments: [] });

    api
      .getPost(id)
      .then((post) => {
        if (cancelled) return;
        setState({
          loading: false,
          error: null,
          post,
          comments: Array.isArray(post.comments) ? post.comments : [],
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ loading: false, error: error.message, post: null, comments: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  if (state.loading) return <Loading label="Loading article..." />;

  if (state.error) {
    return (
      <div className="container-page py-12">
        <ErrorState message={state.error} onRetry={() => setReloadKey((key) => key + 1)} />
        <div className="mt-6 text-center">
          <Link to="/blog" className="text-sm font-semibold text-indigo-600">
            ← Back to the blog
          </Link>
        </div>
      </div>
    );
  }

  const { post, comments } = state;

  return (
    <div className="container-page py-12">
      <Link to="/blog" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
        ← All posts
      </Link>

      <article className="mx-auto mt-6 max-w-3xl">
        <div className="flex flex-wrap gap-1.5">
          {(post.tags || []).map((tag) => (
            <span key={tag} className="chip-accent">
              {tag}
            </span>
          ))}
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {post.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-y border-slate-200 py-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
            {initials(post.author?.username || "?")}
          </span>
          <div className="text-sm">
            <p className="font-semibold text-slate-900">{post.author?.username || "Unknown author"}</p>
            <p className="text-slate-500">
              <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
              {" · "}
              {readingTime(post.content)} min read
            </p>
          </div>
        </div>

        <div className="post-body mt-8">
          {paragraphs(post.content).map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}
        </div>
      </article>

      <section className="mx-auto mt-14 max-w-3xl" aria-labelledby="comments-heading">
        <h2 id="comments-heading" className="text-xl font-semibold tracking-tight text-slate-900">
          Comments ({comments.length})
        </h2>

        <div className="mt-5">
          <CommentForm
            postId={post._id}
            onCreated={(comment) =>
              setState((current) => ({ ...current, comments: [comment, ...current.comments] }))
            }
          />
        </div>

        <div className="mt-6">
          <CommentList comments={comments} />
        </div>
      </section>
    </div>
  );
}
