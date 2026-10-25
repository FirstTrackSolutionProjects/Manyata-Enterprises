import { useCallback, useEffect, useState } from "react";
import { Check, Clock3, LogOut, Loader2, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  cancelEmployeeExitRequest,
  createEmployeeExitRequest,
  decideEmployeeExitRequest,
  getEmployeeExitRequestInbox,
  getMyEmployeeExitRequests,
} from "../services/api";
import { isHrEmployee } from "../utils/employeeRoles";

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const EMPTY_FORM = { resignationDate: today(), proposedLastWorkingDay: "", reason: "" };
const dateLabel = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const dateTimeLabel = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

function Status({ value }) {
  const style = {
    pending: "bg-amber-50 text-amber-800",
    approved: "bg-green-50 text-green-800",
    rejected: "bg-red-50 text-red-800",
    cancelled: "bg-slate-100 text-slate-600",
  }[value] || "bg-slate-100 text-slate-600";
  const label = { pending: "Pending review", approved: "Approved", rejected: "Declined", cancelled: "Cancelled" }[value] || value;
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{label}</span>;
}

export default function EmployeeExitRequests() {
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";
  const canReview = user?.role === "owner" || isHrEmployee(user);
  const [mine, setMine] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const jobs = [];
    if (isEmployee) jobs.push(getMyEmployeeExitRequests().then((response) => setMine(response.data?.items || [])));
    if (canReview) jobs.push(getEmployeeExitRequestInbox({ status, search: search.trim() }).then((response) => setInbox(response.data?.items || [])));
    const results = await Promise.allSettled(jobs);
    const failed = results.find((result) => result.status === "rejected");
    if (failed) setError(failed.reason?.message || "Could not load resignation requests.");
    setLoading(false);
  }, [canReview, isEmployee, search, status]);

  useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      const result = await createEmployeeExitRequest(form);
      setForm({ ...EMPTY_FORM, resignationDate: today() });
      setNotice(result.message || "Resignation request submitted.");
      await load();
    } catch (requestError) { setError(requestError.message || "Could not submit the request."); }
    finally { setSaving(false); }
  };

  const cancel = async (request) => {
    if (!window.confirm("Cancel this pending resignation request?")) return;
    setActingId(request.id); setError(""); setNotice("");
    try {
      const result = await cancelEmployeeExitRequest(request.id);
      setNotice(result.message || "Request cancelled.");
      await load();
    } catch (requestError) { setError(requestError.message || "Could not cancel the request."); }
    finally { setActingId(null); }
  };

  const decide = async (request, nextStatus) => {
    const note = window.prompt(nextStatus === "rejected" ? "Reason for declining this request (required):" : "Optional approval note:");
    if (note === null || (nextStatus === "rejected" && !note.trim())) return;
    if (nextStatus === "approved" && !window.confirm(`Approve ${request.employee_name}'s proposed last working day of ${dateLabel(request.proposed_last_working_day)}?`)) return;
    setActingId(request.id); setError(""); setNotice("");
    try {
      const result = await decideEmployeeExitRequest(request.id, { status: nextStatus, note: note.trim() });
      setNotice(result.message || `Request ${nextStatus}.`);
      await load();
    } catch (requestError) { setError(requestError.message || "Could not review the request."); }
    finally { setActingId(null); }
  };

  const RequestCard = ({ request, reviewer = false }) => <article key={request.id} className="rounded-xl border border-navy/10 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-[240px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-sm text-navy">{reviewer ? request.employee_name : `Request #${request.id}`}</strong>
          {reviewer && <span className="text-xs text-muted">{request.employee_user_id} · {request.employee_department || "Employee"} · {request.employee_designation || ""}</span>}
          <Status value={request.status}/>
        </div>
        <div className="mt-2 grid gap-1 text-sm text-muted sm:grid-cols-2">
          <p>Resignation date: <strong className="text-navy">{dateLabel(request.resignation_date)}</strong></p>
          <p>Proposed last working day: <strong className="text-navy">{dateLabel(request.proposed_last_working_day)}</strong></p>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-navy/80">{request.reason}</p>
        {request.decision_note && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-muted">HR/Admin note: {request.decision_note}</p>}
        <details className="mt-3 text-xs text-muted">
          <summary className="cursor-pointer font-semibold text-navy">Request history ({request.history?.length || 0})</summary>
          <ol className="mt-2 space-y-2 border-l border-amber/50 pl-3">
            {(request.history || []).map((entry) => <li key={entry.id}>
              <strong className="text-navy">{entry.action === "submitted" ? "Submitted" : entry.action === "approved" ? "Approved" : entry.action === "rejected" ? "Declined" : "Cancelled"}</strong>
              {entry.changed_by_name ? ` by ${entry.changed_by_name}` : ""} · {dateTimeLabel(entry.created_at)}
              {entry.note && <p className="mt-0.5 whitespace-pre-wrap">{entry.note}</p>}
            </li>)}
          </ol>
        </details>
      </div>
      {request.status === "pending" && (reviewer
        ? Number(request.employee_id) !== Number(user.id) && <div className="flex gap-2">
          <button disabled={actingId === request.id} onClick={() => decide(request, "approved")} className="inline-flex items-center gap-1 rounded-full bg-green-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Check size={14}/>Approve</button>
          <button disabled={actingId === request.id} onClick={() => decide(request, "rejected")} className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"><X size={14}/>Decline</button>
        </div>
        : <button disabled={actingId === request.id} onClick={() => cancel(request)} className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Cancel request</button>)}
    </div>
  </article>;

  return <div className="space-y-6">
    {isEmployee && <>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-navy/10 bg-white p-5">
        <div><h2 className="flex items-center gap-2 font-bold text-navy"><LogOut size={18} className="text-amber"/>Submit resignation / last working day request</h2><p className="mt-1 text-xs text-muted">This request goes to HR and the Owner for review. Your account remains active while the request is pending; submission does not automatically end employment.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-muted">Resignation date<input required type="date" value={form.resignationDate} onChange={(event) => setForm({ ...form, resignationDate: event.target.value })} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy"/></label>
          <label className="text-xs font-semibold text-muted">Proposed last working day<input required type="date" min={form.resignationDate || undefined} value={form.proposedLastWorkingDay} onChange={(event) => setForm({ ...form, proposedLastWorkingDay: event.target.value })} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy"/></label>
        </div>
        <label className="block text-xs font-semibold text-muted">Reason<textarea required minLength={5} maxLength={3000} rows={3} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Share your reason and any handover information" className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy"/></label>
        <div className="flex justify-end"><button disabled={saving} className="rounded-full bg-amber px-5 py-2.5 text-xs font-extrabold text-navy disabled:opacity-50">{saving ? "Submitting…" : "Submit request"}</button></div>
      </form>
      <section className="space-y-3 rounded-2xl border border-navy/10 bg-white p-5">
        <h2 className="font-bold text-navy">My resignation request history</h2>
        {loading ? <div className="flex justify-center p-6"><Loader2 className="animate-spin text-amber"/></div> : mine.length ? mine.map((request) => <RequestCard key={request.id} request={request}/>) : <p className="text-sm text-muted">You have not submitted a resignation request.</p>}
      </section>
    </>}

    {canReview && <section className="space-y-3 rounded-2xl border border-navy/10 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-bold text-navy">Resignation Requests Inbox</h2><p className="mt-1 text-xs text-muted">Review employee requests, add a decision note, and the employee will be emailed.</p></div>
        <div className="flex flex-wrap gap-2">
          <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && load()} placeholder="Search employee" className="rounded-lg border border-navy/15 px-3 py-2 text-sm"/>
          <button onClick={load} className="rounded-full border border-navy/15 px-4 py-2 text-xs font-bold text-navy">Search</button>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-navy/15 px-3 py-2 text-sm"><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Declined</option><option value="cancelled">Cancelled</option><option value="">All statuses</option></select>
        </div>
      </div>
      {loading ? <div className="flex justify-center p-6"><Loader2 className="animate-spin text-amber"/></div> : inbox.length ? inbox.map((request) => <RequestCard key={request.id} request={request} reviewer/>) : <p className="text-sm text-muted">No resignation requests match this filter.</p>}
    </section>}
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    <p className="flex items-center gap-2 text-xs text-muted"><Clock3 size={14}/>An approved request records HR/Admin’s decision; employee offboarding remains a separate action.</p>
  </div>;
}
