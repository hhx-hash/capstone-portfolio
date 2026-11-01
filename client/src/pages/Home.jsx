import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../lib/api.js";
import Loading from "../components/Loading.jsx";
import ErrorState from "../components/ErrorState.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import BlogPostCard from "../components/BlogPostCard.jsx";

const SKILLS = [
  { title: "Front end", items: ["React 19", "Vite", "Tailwind CSS", "React Router"] },
  { title: "Back end", items: ["Node.js", "Express 5", "REST design", "JWT auth"] },
  { title: "Data", items: ["MongoDB Atlas", "Mongoose schemas", "populate()", "Indexes"] },
  { title: "Practices", items: ["MVC layout", "Error handling", "Accessibility", "Deployment"] },
];

/**
 * Home / about page.
 *
 * Fetches the two collections it previews in one round trip each and renders
 * three different states: loading, error (with a retry) and content.
 */
export default function Home() {
  const [data, setData] = useState({ loading: true, error: null, projects: [], posts: [] });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setData((current) => ({ ...current, loading: true, error: null }));

    Promise.all([api.listProjects({ limit: 3 }), api.listPosts({ limit: 3 })])
      .then(([projectPage, postPage]) => {
        if (cancelled) return;
        setData({
          loading: false,
          error: null,
          projects: projectPage.projects,
          posts: postPage.posts,
          projectTotal: projectPage.total,
          postTotal: postPage.total,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setData({ loading: false, error: error.message, projects: [], posts: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <>
      {/* ------------------------------- hero ------------------------------- */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_70%_-10%,rgba(79,70,229,0.12),transparent)]"
        />
        <div className="container-page relative grid gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Capstone Project · Web Data Management and Application
            </p>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Hi, I am <span className="text-indigo-600">HuHaozhe</span>.
              <br />
              I build web applications end to end.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              I design and ship full stack products: a React single page application on the front,
              an Express and MongoDB API on the back. This site is both my portfolio and the proof -
              every project, post and comment you see here is served by the API I wrote.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/projects" className="btn btn-primary">
                View my projects
              </Link>
              <Link to="/blog" className="btn btn-secondary">
                Read the blog
              </Link>
              <Link to="/contact" className="btn btn-ghost">
                Get in touch →
              </Link>
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-slate-200 pt-6">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Projects
                </dt>
                <dd className="mt-1 text-2xl font-bold text-slate-900">
                  {data.loading ? "—" : (data.projectTotal ?? data.projects.length)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Posts</dt>
                <dd className="mt-1 text-2xl font-bold text-slate-900">
                  {data.loading ? "—" : (data.postTotal ?? data.posts.length)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Stack</dt>
                <dd className="mt-1 text-2xl font-bold text-slate-900">MERN</dd>
              </div>
            </dl>
          </div>

          {/* A small "card" that shows the shape of a project, without data. */}
          <div className="relative">
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs text-slate-500">client → api → atlas</span>
              </div>
              <div className="space-y-3 p-5 font-mono text-xs leading-6 text-slate-600">
                <p>
                  <span className="text-indigo-600">GET</span> /api/projects{" "}
                  <span className="text-emerald-600">200</span>
                </p>
                <p>
                  <span className="text-indigo-600">GET</span> /api/blog{" "}
                  <span className="text-emerald-600">200</span>
                </p>
                <p>
                  <span className="text-indigo-600">GET</span> /api/blog/:id{" "}
                  <span className="text-emerald-600">200</span>
                </p>
                <p>
                  <span className="text-violet-600">POST</span> /api/blog{" "}
                  <span className="text-amber-600">401</span>{" "}
                  <span className="text-slate-400">// needs a token</span>
                </p>
                <p>
                  <span className="text-violet-600">POST</span> /api/contact{" "}
                  <span className="text-emerald-600">201</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------- featured work -------------------------- */}
      <section className="container-page py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              Selected work
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Projects I have built
            </h2>
          </div>
          <Link to="/projects" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            All projects →
          </Link>
        </div>

        <div className="mt-8">
          {data.loading && <Loading label="Loading projects..." />}
          {data.error && (
            <ErrorState message={data.error} onRetry={() => setReloadKey((key) => key + 1)} />
          )}
          {!data.loading && !data.error && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------ latest posts ------------------------ */}
      <section className="border-y border-slate-200 bg-white">
        <div className="container-page py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
                Writing
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                Latest from the blog
              </h2>
            </div>
            <Link to="/blog" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              All posts →
            </Link>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {data.loading && <Loading label="Loading posts..." />}
            {!data.loading &&
              data.posts.map((post) => <BlogPostCard key={post._id} post={post} />)}
          </div>
        </div>
      </section>

      {/* -------------------------------- skills ---------------------------- */}
      <section className="container-page py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
          What I work with
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          A stack that covers the whole request
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SKILLS.map((group) => (
            <div key={group.title} className="card p-5">
              <h3 className="text-sm font-semibold text-slate-900">{group.title}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                {group.items.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-indigo-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------- cta ------------------------------ */}
      <section className="container-page pb-20">
        <div className="overflow-hidden rounded-3xl bg-slate-900 px-8 py-12 text-center sm:px-12">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Have a project in mind?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Send a message through the contact form - it is stored in the same database and shows up
            in the admin inbox.
          </p>
          <Link to="/contact" className="btn btn-primary mt-6">
            Start a conversation
          </Link>
        </div>
      </section>
    </>
  );
}
