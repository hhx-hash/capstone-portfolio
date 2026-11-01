import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import PageHeader from "../components/PageHeader.jsx";
import BlogPostCard from "../components/BlogPostCard.jsx";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Pagination from "../components/Pagination.jsx";

const PAGE_SIZE = 4;

/**
 * Blog list: GET /api/blog with pagination and a search box.
 * Each card shows the author's username, which the API populates.
 */
export default function Blog() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ loading: true, error: null, posts: [], pages: 1, total: 0 });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));

    api
      .listPosts({ page, limit: PAGE_SIZE, search: query })
      .then((result) => {
        if (cancelled) return;
        setState({
          loading: false,
          error: null,
          posts: result.posts,
          pages: result.pages,
          total: result.total,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ loading: false, error: error.message, posts: [], pages: 1, total: 0 });
      });

    return () => {
      cancelled = true;
    };
  }, [page, query, reloadKey]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  }

  return (
    <div className="container-page py-12">
      <PageHeader
        eyebrow="Writing"
        title="Blog"
        description="Notes on building this project: API design, React state, and the small decisions that made the code easier to live with."
      >
        <form onSubmit={handleSearch} className="flex gap-2" role="search">
          <label className="sr-only" htmlFor="post-search">
            Search posts
          </label>
          <input
            id="post-search"
            className="input w-56"
            placeholder="Search posts..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </PageHeader>

      <div className="mt-8">
        {state.loading && <Loading label="Loading posts..." />}

        {state.error && (
          <ErrorState message={state.error} onRetry={() => setReloadKey((key) => key + 1)} />
        )}

        {!state.loading && !state.error && state.posts.length === 0 && (
          <EmptyState
            title={query ? `No posts match “${query}”` : "No posts yet"}
            description={
              query
                ? "Try a different word, or clear the search to read everything."
                : "Posts published from the admin dashboard will show up here."
            }
            action={
              query ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearch("");
                    setQuery("");
                    setPage(1);
                  }}
                >
                  Clear search
                </button>
              ) : null
            }
          />
        )}

        {!state.loading && !state.error && state.posts.length > 0 && (
          <>
            <div className="space-y-6">
              {state.posts.map((post) => (
                <BlogPostCard key={post._id} post={post} />
              ))}
            </div>

            <Pagination page={page} pages={state.pages} onChange={setPage} label="Blog pagination" />
          </>
        )}
      </div>
    </div>
  );
}
