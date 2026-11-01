/**
 * Shared failure state. `onRetry` is optional; when a page can re-run its fetch
 * it passes one and the button appears.
 */
export default function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="card border-rose-200 bg-rose-50 p-6 text-center">
      <p className="text-sm font-semibold text-rose-800">Something went wrong</p>
      <p className="mt-1 text-sm text-rose-700">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm mt-4" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
