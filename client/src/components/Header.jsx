import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.js";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/projects", label: "Projects" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

/**
 * Persistent navigation. It is auth-aware: the right hand side shows the two
 * sign-in links for a guest and the dashboard link plus a logout button once a
 * session exists. The mobile menu closes itself on navigation so a tap cannot
 * leave a panel covering the page.
 */
export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    setOpen(false);
    navigate("/");
  }

  const linkClass = ({ isActive }) => `nav-link${isActive ? " nav-link-active" : ""}`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-900/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
            HH
          </span>
          <span className="text-base font-semibold tracking-tight text-white">
            HuHaozhe
            <span className="ml-2 hidden text-xs font-normal text-slate-400 sm:inline">
              Portfolio &amp; Blog
            </span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <NavLink to="/admin" className={linkClass}>
                Dashboard
              </NavLink>
              <span className="px-2 text-xs text-slate-400">@{user?.username}</span>
              <button type="button" className="btn btn-sm btn-secondary" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>
              <Link to="/register" className="btn btn-sm btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          className="grid h-10 w-10 place-items-center rounded-lg text-white md:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true" className="text-xl">
            {open ? "✕" : "☰"}
          </span>
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-slate-900 md:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}

            <div className="my-2 h-px bg-white/10" />

            {isAuthenticated ? (
              <>
                <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>
                  Dashboard
                </NavLink>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary mt-1 self-start"
                  onClick={handleLogout}
                >
                  Log out (@{user?.username})
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="btn btn-sm btn-primary"
                  onClick={() => setOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keep the current route in the header for screen readers. */}
      <span className="sr-only">Current page: {location.pathname}</span>
    </header>
  );
}
