import { Link } from "react-router";
import { initials } from "../lib/format.js";

/**
 * One portfolio project in the gallery. When a project has no image, a
 * gradient tile with its monogram is shown instead, so the grid never has a
 * hole where a picture was supposed to be.
 */
export default function ProjectCard({ project }) {
  const { _id, title, description, imageUrl, repoUrl, liveUrl, technologies = [] } = project;

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Preview of ${title}`}
          className="h-40 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700">
          <span className="text-3xl font-bold tracking-widest text-white/90">{initials(title)}</span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">
          <Link to={`/projects/${_id}`} className="hover:text-indigo-600">
            {title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">{description}</p>

        {technologies.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Technologies used">
            {technologies.map((tech) => (
              <li key={tech} className="chip">
                {tech}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-4 pt-4 text-sm">
          <Link to={`/projects/${_id}`} className="font-semibold text-indigo-600 hover:text-indigo-700">
            Details →
          </Link>
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-600 hover:text-slate-900"
            >
              Live site
            </a>
          )}
          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-600 hover:text-slate-900"
            >
              Source
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
