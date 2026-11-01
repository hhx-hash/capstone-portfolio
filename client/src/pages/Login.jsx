import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.js";
import Field from "../components/Field.jsx";
import Alert from "../components/Alert.jsx";

/**
 * Login page. On success the router returns the visitor to the page that sent
 * them here (`/admin` by default), which is what makes the protected route feel
 * like part of the app instead of a dead end.
 */
export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/admin";

  const [values, setValues] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const errors = {};
    if (!values.email.trim()) errors.email = "Email is required.";
    if (!values.password) errors.password = "Password is required.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setBusy(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.fields) setFieldErrors(requestError.fields);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-600">
            Log in to manage projects, posts and the inbox.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <Field
              id="login-email"
              label="Email"
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              error={fieldErrors.email}
              required
            />
            <Field
              id="login-password"
              label="Password"
              type="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              placeholder="Your password"
              autoComplete="current-password"
              error={fieldErrors.password}
              required
            />

            {error && <Alert>{error}</Alert>}

            <button type="submit" className="btn btn-primary w-full" disabled={busy}>
              {busy ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            No account yet?{" "}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Create one
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Demo account: huhaozhe@example.com · CoursePass123!
        </p>
      </div>
    </div>
  );
}
