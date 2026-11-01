/**
 * Shared "waiting on the API" state. Rendered by every page while its first
 * fetch is in flight, so the loading state looks the same everywhere.
 */
export default function Loading({ label = "Loading..." }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 py-16">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
}
