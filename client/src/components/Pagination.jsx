/**
 * Page switcher for the paginated lists. Returns nothing when everything fits
 * on one page, so short collections do not get a dead control.
 */
export default function Pagination({ page, pages, onChange, label = "Pagination" }) {
  if (!pages || pages <= 1) return null;

  const numbers = Array.from({ length: pages }, (_, index) => index + 1);

  return (
    <nav aria-label={label} className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>

      {numbers.map((number) => (
        <button
          key={number}
          type="button"
          aria-current={number === page ? "page" : undefined}
          className={`btn btn-sm ${number === page ? "btn-primary" : "btn-secondary"}`}
          onClick={() => onChange(number)}
        >
          {number}
        </button>
      ))}

      <button
        type="button"
        className="btn btn-secondary btn-sm"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
