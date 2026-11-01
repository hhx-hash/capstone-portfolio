import { Link } from "react-router";

/** 404 page - rendered for any route the table in App.jsx does not match. */
export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-6xl font-black tracking-tight text-indigo-600">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        The address you opened does not exist. It may have been a post that was deleted, or a typo
        in the URL.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn btn-primary">
          Back home
        </Link>
        <Link to="/blog" className="btn btn-secondary">
          Browse the blog
        </Link>
      </div>
    </div>
  );
}
