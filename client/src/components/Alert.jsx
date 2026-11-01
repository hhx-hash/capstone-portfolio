/** Inline banner for form-level success and error messages. */
export default function Alert({ tone = "error", children }) {
  const styles =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <div role={tone === "success" ? "status" : "alert"} className={`rounded-xl border p-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}
