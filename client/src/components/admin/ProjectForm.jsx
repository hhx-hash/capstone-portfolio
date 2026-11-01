import { useEffect, useState } from "react";
import Field from "../Field.jsx";
import Alert from "../Alert.jsx";

const EMPTY = {
  title: "",
  description: "",
  imageUrl: "",
  repoUrl: "",
  liveUrl: "",
  technologies: "",
};

/**
 * Create / edit form for a project. The same component serves both because the
 * only difference is the starting values and the label on the button.
 */
export default function ProjectForm({ project, onSubmit, onCancel, busy, error }) {
  const [values, setValues] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (project) {
      setValues({
        title: project.title || "",
        description: project.description || "",
        imageUrl: project.imageUrl || "",
        repoUrl: project.repoUrl || "",
        liveUrl: project.liveUrl || "",
        technologies: (project.technologies || []).join(", "),
      });
    } else {
      setValues(EMPTY);
    }
    setFieldErrors({});
  }, [project]);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const errors = {};
    if (values.title.trim().length === 0) errors.title = "Title is required.";
    if (values.description.trim().length === 0) errors.description = "Description is required.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      imageUrl: values.imageUrl.trim(),
      repoUrl: values.repoUrl.trim(),
      liveUrl: values.liveUrl.trim(),
      technologies: values.technologies
        .split(",")
        .map((tech) => tech.trim())
        .filter(Boolean),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-5" noValidate>
      <h2 className="text-base font-semibold text-slate-900">
        {project ? "Edit project" : "New project"}
      </h2>

      <Field
        id="project-title"
        label="Title"
        name="title"
        value={values.title}
        onChange={handleChange}
        error={fieldErrors.title}
        placeholder="Portfolio & Blog API"
        required
      />

      <Field
        id="project-description"
        label="Description"
        as="textarea"
        rows={5}
        name="description"
        value={values.description}
        onChange={handleChange}
        error={fieldErrors.description}
        placeholder="What the project does, what you built, what you learned."
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="project-imageUrl"
          label="Image URL"
          name="imageUrl"
          value={values.imageUrl}
          onChange={handleChange}
          placeholder="https://..."
          hint="Optional. Leave empty for a gradient tile."
        />
        <Field
          id="project-technologies"
          label="Technologies"
          name="technologies"
          value={values.technologies}
          onChange={handleChange}
          placeholder="React, Express, MongoDB"
          hint="Comma separated."
        />
        <Field
          id="project-repoUrl"
          label="Repository URL"
          name="repoUrl"
          value={values.repoUrl}
          onChange={handleChange}
          placeholder="https://github.com/..."
        />
        <Field
          id="project-liveUrl"
          label="Live URL"
          name="liveUrl"
          value={values.liveUrl}
          onChange={handleChange}
          placeholder="https://..."
        />
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Saving..." : project ? "Save changes" : "Create project"}
        </button>
      </div>
    </form>
  );
}
