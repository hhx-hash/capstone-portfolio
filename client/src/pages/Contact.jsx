import { useState } from "react";
import { api } from "../lib/api.js";
import PageHeader from "../components/PageHeader.jsx";
import Field from "../components/Field.jsx";
import Alert from "../components/Alert.jsx";

const EMPTY = { name: "", email: "", message: "" };

function validate(values) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (values.message.trim().length < 10) {
    errors.message = "Tell me a little more - at least 10 characters.";
  }
  return errors;
}

/**
 * Contact page: a controlled form that POSTs to /api/contact. The message is
 * stored in MongoDB and read from the admin dashboard's inbox.
 */
export default function Contact() {
  const [values, setValues] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState({ tone: null, message: "" });
  const [sending, setSending] = useState(false);

  function handleChange(event) {
    const { id, name, value } = event.target;
    // `name` is what the state is keyed by; the id is only the label target.
    const key = name || id.replace("contact-", "");
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ tone: null, message: "" });

    const errors = validate(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSending(true);
    try {
      await api.sendMessage({
        name: values.name.trim(),
        email: values.email.trim(),
        message: values.message.trim(),
      });
      setValues(EMPTY);
      setStatus({ tone: "success", message: "Thanks! Your message has been saved." });
    } catch (error) {
      setStatus({ tone: "error", message: error.message });
      if (error.fields) setFieldErrors(error.fields);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container-page py-12">
      <PageHeader
        eyebrow="Contact"
        title="Let's talk"
        description="Questions about this project, a course, or a role you are hiring for - this form goes straight into the API."
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSubmit} className="card space-y-5 p-6" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="contact-name"
              label="Name"
              name="name"
              value={values.name}
              onChange={handleChange}
              placeholder="Your name"
              error={fieldErrors.name}
              autoComplete="name"
              required
            />
            <Field
              id="contact-email"
              label="Email"
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              placeholder="you@example.com"
              error={fieldErrors.email}
              autoComplete="email"
              required
            />
          </div>

          <Field
            id="contact-message"
            label="Message"
            as="textarea"
            name="message"
            rows={7}
            value={values.message}
            onChange={handleChange}
            placeholder="What would you like to talk about?"
            error={fieldErrors.message}
            hint="At least 10 characters. Sent to the API and stored in MongoDB."
            required
          />

          {status.message && <Alert tone={status.tone}>{status.message}</Alert>}

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-slate-500">No account needed to send a message.</p>
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? "Sending..." : "Send message"}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-slate-900">How this form works</h2>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>1. The browser validates the fields as you type.</li>
              <li>
                2. It sends <code className="rounded bg-slate-100 px-1">POST /api/contact</code> with
                a JSON body.
              </li>
              <li>3. Express validates it with a Mongoose schema and saves a Message document.</li>
              <li>4. The message appears in the admin dashboard inbox.</li>
            </ol>
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-slate-900">Directly</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                Email:{" "}
                <a className="font-medium text-indigo-600" href="mailto:huhaozhe@example.com">
                  huhaozhe@example.com
                </a>
              </li>
              <li>
                GitHub:{" "}
                <a
                  className="font-medium text-indigo-600"
                  href="https://github.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  github.com/huhaozhe
                </a>
              </li>
              <li>Location: China · UTC+8</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
