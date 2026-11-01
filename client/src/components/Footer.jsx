import { Link } from "react-router";

/**
 * Persistent footer: a short about line, the route list and the technology
 * stack, so every page ends on the same note.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
              HH
            </span>
            <span className="font-semibold text-slate-900">HuHaozhe</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-6 text-slate-600">
            Full stack web development student. This site is the capstone project for Web Data
            Management and Application: a React client on top of an Express and MongoDB API.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900">Pages</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link className="hover:text-indigo-600" to="/projects">
                Projects
              </Link>
            </li>
            <li>
              <Link className="hover:text-indigo-600" to="/blog">
                Blog
              </Link>
            </li>
            <li>
              <Link className="hover:text-indigo-600" to="/contact">
                Contact
              </Link>
            </li>
            <li>
              <Link className="hover:text-indigo-600" to="/admin">
                Admin dashboard
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900">Built with</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>React 19 + Vite + Tailwind CSS</li>
            <li>Node.js + Express 5</li>
            <li>MongoDB Atlas + Mongoose</li>
            <li>JWT authentication with bcrypt hashing</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-xs text-slate-500 sm:flex-row">
          <p>© {year} HuHaozhe. All rights reserved.</p>
          <p>Student ID 24998111 · Capstone Project</p>
        </div>
      </div>
    </footer>
  );
}
