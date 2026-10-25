import { useCallback, useEffect, useState } from "react";
import { Search, ShieldAlert, Loader2, UserRoundX } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getEmployeeTerminations, listUsers, terminateEmployee } from "../services/api";

const today = () => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const date = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${date.year}-${date.month}-${date.day}`;
};
const dateLabel = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const dateTimeLabel = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function EmployeeTerminations() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(today());
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [activeResponse, historyResponse] = await Promise.all([
        listUsers({ role: "employee", status: "active" }),
        getEmployeeTerminations(search.trim() ? { search: search.trim() } : {}),
      ]);
      setEmployees(activeResponse.data?.items || []);
      setItems(historyResponse.data?.items || []);
    } catch (loadError) {
      setError(loadError.message || "Could not load employee termination records.");
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    const employee = employees.find((item) => String(item.id) === String(selectedId));
    if (!employee) { setError("Choose an active employee."); return; }
    if (!window.confirm(`Terminate ${employee.name} (${employee.user_id}) effective ${dateLabel(effectiveDate)}? Their dashboard access will stop immediately.`)) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await terminateEmployee({ employeeId: Number(selectedId), terminationDate: effectiveDate, reason: reason.trim() });
      setNotice(response.message || "Employee termination recorded.");
      setSelectedId(""); setEffectiveDate(today()); setReason("");
      await load();
    } catch (saveError) { setError(saveError.message || "Could not terminate this employee."); }
    finally { setSaving(false); }
  };

  return <div className="space-y-6">
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-navy/10 bg-white p-5">
      <div>
        <h2 className="flex items-center gap-2 font-bold text-navy"><UserRoundX size={18} className="text-amber"/>Record employee termination</h2>
        <p className="mt-1 text-xs text-muted">Only HR/Admin can submit this action. Saving immediately disables the employee login and records the date and reason.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-muted">Active employee
          <select required value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy">
            <option value="">Choose employee</option>
            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {employee.user_id}{employee.branch_name ? ` · ${employee.branch_name}` : ""}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-muted">Effective date
          <input required type="date" max={today()} value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy"/>
        </label>
      </div>
      <label className="block text-xs font-semibold text-muted">Reason
        <textarea required minLength={5} maxLength={3000} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Enter the reason for termination" className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy"/>
      </label>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-amber-800"><ShieldAlert size={15}/>Account access ends immediately when saved.</p>
        <button disabled={saving || loading || !employees.length} className="rounded-full bg-amber px-5 py-2.5 text-xs font-extrabold text-navy disabled:opacity-50">{saving ? "Saving…" : "Terminate employee"}</button>
      </div>
      {!loading && employees.length === 0 && <p className="text-xs text-muted">No active employees are available to terminate.</p>}
    </form>

    <section className="space-y-3 rounded-2xl border border-navy/10 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-bold text-navy">Termination history</h2><p className="mt-1 text-xs text-muted">HR/Admin actions and employee notifications are recorded here.</p></div>
        <div className="flex gap-2"><label className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && load()} placeholder="Search employee" className="rounded-lg border border-navy/15 py-2 pl-9 pr-3 text-sm"/></label><button type="button" onClick={load} className="rounded-full border border-navy/15 px-4 py-2 text-xs font-bold text-navy">Refresh</button></div>
      </div>
      {loading ? <div className="flex justify-center p-6"><Loader2 className="animate-spin text-amber"/></div> : items.length ? <div className="space-y-3">{items.map((item) => <article key={item.id} className="rounded-xl border border-navy/10 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><strong className="text-sm text-navy">{item.employee_name}</strong><p className="text-xs text-muted">{item.employee_user_id} · {item.employee_department || "Employee"} · {item.employee_designation || ""}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.account_status === "terminated" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>{item.account_status === "terminated" ? "Terminated" : `Account: ${item.account_status}`}</span></div>
        <div className="mt-2 grid gap-1 text-sm text-muted sm:grid-cols-2"><p>Effective date: <strong className="text-navy">{dateLabel(item.termination_date)}</strong></p><p>Recorded by: <strong className="text-navy">{item.terminated_by_name || "Former user"}</strong></p></div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-navy/80">{item.reason}</p>
        <details className="mt-3 text-xs text-muted"><summary className="cursor-pointer font-semibold text-navy">History ({item.history?.length || 0})</summary><ol className="mt-2 space-y-2 border-l border-amber/50 pl-3">{(item.history || []).map((entry) => <li key={entry.id}><strong className="text-navy">Termination recorded</strong>{entry.changed_by_name ? ` by ${entry.changed_by_name}` : ""} · {dateTimeLabel(entry.created_at)}{entry.note && <p className="mt-0.5 whitespace-pre-wrap">{entry.note}</p>}</li>)}</ol></details>
      </article>)}</div> : <p className="text-sm text-muted">No termination records found.</p>}
    </section>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    <p className="text-xs text-muted">Signed in as {user?.name || "HR/Admin"}.</p>
  </div>;
}
