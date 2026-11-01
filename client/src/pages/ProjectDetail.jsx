import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../lib/api.js";
import { formatDate, initials } from "../lib/format.js";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";

/** One project, fetched from GET /api/projects/:id. */
export default function ProjectDetail() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true, error: null, project: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, error: null, project: null });

    api
      .getProject(id)
      .then((project) => {
        if (!cancelled) setState({ loading: false, error: null, project });
      })
      .catch((error) => {
        if (!cancelled) setState({ loading: false, error: error.message, project: null });
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  if (state.loading) return <Loading label="Loading project..." />;

  if (state.error) {
    return (
      <div className="container-page py-12">
        <ErrorState message={state.error} onRetry={() => setReloadKey((key) => key + 1)} />
        <div className="mt-6 text-center">
          <Link to="/projects" className="text-sm font-semibold text-indigo-600">
            ← Back to all projects
          </Link>
        </div>
      </div>
    );
  }

  const { project } = state;

  return (
    <article className="container-page py-12">
      <Link to="/projects" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
        ← All projects
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_0.6fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Project
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {project.title}
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Added {formatDate(project.createdAt)}
            {project.user?.username && <> · by {project.user.username}</>}
          </p>

          <div className="post-body mt-8">
            {project.description.split(/\n{2,}/).map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>

          {(project.liveUrl || project.repoUrl) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                  Visit live site
                </a>
              )}
              {project.repoUrl && (
                <a href={project.repoUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
                  View source
                </a>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          {project.imageUrl ? (
            <img
              src={project.imageUrl}
              alt={`Preview of ${project.title}`}
              className="w-full rounded-2xl border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700">
              <span className="text-5xl font-bold tracking-widest text-white/90">
                {initials(project.title)}
              </span>
            </div>
          )}

          {project.technologies?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-900">Technologies</h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {project.technologies.map((tech) => (
                  <li key={tech} className="chip-accent">
                    {tech}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
