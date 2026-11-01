/**
 * Label + control + error message in one component.
 *
 * Every form in the app uses it, so `htmlFor`, `id`, `aria-invalid` and the
 * error id can never fall out of sync. `as="textarea"` swaps the control.
 */
export default function Field({ id, label, as = "input", error, hint, rows, ...props }) {
  const Control = as === "textarea" ? "textarea" : "input";
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <Control
        id={id}
        name={id}
        rows={as === "textarea" ? rows || 5 : undefined}
        className="input"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {error ? (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      ) : (
        hint && (
          <p className="mt-1.5 text-xs text-slate-500" id={`${id}-hint`}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}
