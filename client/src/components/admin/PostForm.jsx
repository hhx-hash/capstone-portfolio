import { useEffect, useState } from "react";
import Field from "../Field.jsx";
import Alert from "../Alert.jsx";

const EMPTY = { title: "", content: "", tags: "" };

/** Create / edit form for a blog post. */
export default function PostForm({ post, onSubmit, onCancel, busy, error }) {
  const [values, setValues] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (post) {
      setValues({
        title: post.title || "",
        content: post.content || "",
        tags: (post.tags || []).join(", "),
      });
    } else {
      setValues(EMPTY);
    }
    setFieldErrors({});
  }, [post]);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const errors = {};
    if (values.title.trim().length === 0) errors.title = "Title is required.";
    if (values.content.trim().length < 10) {
      errors.content = "Write at least a paragraph (10 characters).";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    onSubmit({
      title: values.title.trim(),
      content: values.content.trim(),
      tags: values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-5" noValidate>
      <h2 className="text-base font-semibold text-slate-900">
        {post ? "Edit post" : "New post"}
      </h2>

      <Field
        id="post-title"
        label="Title"
        name="title"
        value={values.title}
        onChange={handleChange}
        error={fieldErrors.title}
        placeholder="What I learned building this API"
        required
      />

      <Field
        id="post-content"
        label="Content"
        as="textarea"
        rows={12}
        name="content"
        value={values.content}
        onChange={handleChange}
        error={fieldErrors.content}
        placeholder="Write the post. Separate paragraphs with a blank line."
        hint="Blank lines become paragraphs on the article page."
        required
      />

      <Field
        id="post-tags"
        label="Tags"
        name="tags"
        value={values.tags}
        onChange={handleChange}
        placeholder="React, Express, MongoDB"
        hint="Comma separated, shown on the blog cards."
      />

      {error && <Alert>{error}</Alert>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Saving..." : post ? "Save changes" : "Publish post"}
        </button>
      </div>
    </form>
  );
}
