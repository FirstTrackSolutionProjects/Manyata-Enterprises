import { useEffect, useState } from "react";
import { Clock3, Loader2, RefreshCw } from "lucide-react";
import { getApplicationForwardingHistory } from "../services/api";
import { applicationStatusLabel } from "../constants/applicationStatuses";

const formatForwardedAt = (value) => value ? new Date(value).toLocaleString("en-IN") : "—";

export default function ApplicationForwardHistory() {
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState({ items: [], pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (nextPage = page) => {
    setLoading(true);
    setError("");
    try {
      const response = await getApplicationForwardingHistory({ page: String(nextPage), limit: "10" });
      setHistory(response.data || { items: [], pages: 1, total: 0 });
    } catch (loadError) {
      setError(loadError.message || "Could not load forwarding history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    getApplicationForwardingHistory({ page: String(page), limit: "10" })
      .then((response) => {
        if (active) setHistory(response.data || { items: [], pages: 1, total: 0 });
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Could not load forwarding history.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [page]);

  return (
    <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/10 px-4 py-4 sm:px-5">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-navy"><Clock3 size={17} className="text-amber" /> Application forwarding history</h2>
          <p className="mt-1 text-xs text-muted">Application, status at forwarding, sender, recipient, and exact date/time.</p>
        </div>
        <button type="button" onClick={() => load(page)} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-navy/15 px-3 py-2 text-xs font-semibold text-navy disabled:opacity-50">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && <p role="alert" className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber" /></div>
        : history.items?.length ? <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead><tr className="border-b border-navy/10 bg-offwhite text-xs font-semibold text-muted">
                <th className="p-3">Application</th><th className="p-3">Customer</th><th className="p-3">Status when forwarded</th><th className="p-3">Forwarded by</th><th className="p-3">Forwarded to</th><th className="p-3">Date &amp; time</th>
              </tr></thead>
              <tbody>{history.items.map((item) => <tr key={item.id} className="border-b border-navy/5 last:border-0">
                <td className="p-3 font-mono text-xs font-semibold text-navy">{item.application_no}</td>
                <td className="p-3 font-semibold text-navy">{item.customer_name || "—"}</td>
                <td className="p-3 text-xs">{applicationStatusLabel(item.application_status)}</td>
                <td className="p-3">{item.forwarded_by_employee_name}</td>
                <td className="p-3">{item.forwarded_to_employee_name}</td>
                <td className="p-3 whitespace-nowrap text-xs text-muted">{formatForwardedAt(item.forwarded_at)}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-navy/10 px-4 py-3">
            <span className="text-xs text-muted">{history.total} forwarding {history.total === 1 ? "record" : "records"}</span>
            {history.pages > 1 && <>
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} className="rounded-full border border-navy/15 px-3 py-1.5 text-xs font-semibold disabled:opacity-40">Previous</button>
              <span className="text-xs text-muted">Page {page} of {history.pages}</span>
              <button type="button" onClick={() => setPage((current) => Math.min(history.pages, current + 1))} disabled={page >= history.pages} className="rounded-full bg-amber px-3 py-1.5 text-xs font-semibold text-navy disabled:opacity-40">Next</button>
            </>}
          </div>
        </> : <p className="p-6 text-center text-sm text-muted">No forwarding records yet.</p>}
    </section>
  );
}
