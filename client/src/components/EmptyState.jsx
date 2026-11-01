/** Shown when a collection is legitimately empty (not an error). */
export default function EmptyState({ title, description, action }) {
  return (
    <div className="card p-10 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
