import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.js";
import Field from "../components/Field.jsx";
import Alert from "../components/Alert.jsx";

const EMPTY = { username: "", email: "", password: "", confirm: "" };

/** Register page: POST /api/users/register, then straight into the dashboard. */
export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
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
    if (values.username.trim().length < 3) errors.username = "At least 3 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    if (values.password.length < 6) errors.password = "At least 6 characters.";
    if (values.confirm !== values.password) errors.confirm = "The two passwords do not match.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setBusy(true);
    try {
      await register({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      navigate("/admin", { replace: true });
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create an account</h1>
          <p className="mt-1 text-sm text-slate-600">
            One account owns the portfolio, the blog and the inbox.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <Field
              id="register-username"
              label="Username"
              name="username"
              value={values.username}
              onChange={handleChange}
              placeholder="huhaozhe"
              autoComplete="username"
              error={fieldErrors.username}
              required
            />
            <Field
              id="register-email"
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
              id="register-password"
              label="Password"
              type="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              error={fieldErrors.password}
              required
            />
            <Field
              id="register-confirm"
              label="Confirm password"
              type="password"
              name="confirm"
              value={values.confirm}
              onChange={handleChange}
              placeholder="Repeat the password"
              autoComplete="new-password"
              error={fieldErrors.confirm}
              required
            />

            {error && <Alert>{error}</Alert>}

            <button type="submit" className="btn btn-primary w-full" disabled={busy}>
              {busy ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
