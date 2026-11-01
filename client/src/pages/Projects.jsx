import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import PageHeader from "../components/PageHeader.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Pagination from "../components/Pagination.jsx";

const PAGE_SIZE = 6;

/**
 * Projects gallery: fetches GET /api/projects, offers a server-side search and
 * a page switcher. Search resets the page so a query never lands on page 3 of a
 * smaller result set.
 */
export default function Projects() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ loading: true, error: null, projects: [], pages: 1, total: 0 });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));

    api
      .listProjects({ page, limit: PAGE_SIZE, search: query })
      .then((result) => {
        if (cancelled) return;
        setState({
          loading: false,
          error: null,
          projects: result.projects,
          pages: result.pages,
          total: result.total,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ loading: false, error: error.message, projects: [], pages: 1, total: 0 });
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
        eyebrow="Portfolio"
        title="Projects"
        description="Every project below is stored in MongoDB Atlas and served by the same API that powers the rest of this site."
      >
        <form onSubmit={handleSearch} className="flex gap-2" role="search">
          <label className="sr-only" htmlFor="project-search">
            Search projects
          </label>
          <input
            id="project-search"
            className="input w-56"
            placeholder="Search projects..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </PageHeader>

      <div className="mt-8">
        {state.loading && <Loading label="Loading projects..." />}

        {state.error && (
          <ErrorState message={state.error} onRetry={() => setReloadKey((key) => key + 1)} />
        )}

        {!state.loading && !state.error && state.projects.length === 0 && (
          <EmptyState
            title={query ? `No projects match "${query}"` : "No projects yet"}
            description={
              query
                ? "Try a shorter search term, or clear the search to see everything."
                : "Projects added from the admin dashboard will appear here."
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

        {!state.loading && !state.error && state.projects.length > 0 && (
          <>
            <p className="mb-4 text-sm text-slate-500">
              Showing {state.projects.length} of {state.total} project
              {state.total === 1 ? "" : "s"}
              {query && (
                <>
                  {" "}
                  for <span className="font-medium text-slate-700">“{query}”</span>
                </>
              )}
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {state.projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>

            <Pagination page={page} pages={state.pages} onChange={setPage} label="Projects pagination" />
          </>
        )}
      </div>
    </div>
  );
}
