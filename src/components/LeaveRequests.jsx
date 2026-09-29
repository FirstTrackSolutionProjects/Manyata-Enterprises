import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Clock3, Loader2, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  cancelMyLeaveRequest,
  createMyLeaveRequest,
  decideLeaveRequest,
  getLeaveInbox,
  getMyLeaveRequests,
  updateMyLeaveRequest,
} from "../services/api";

const EMPTY_FORM = { leaveType: "casual", startDate: "", endDate: "", dayPart: "full_day", reason: "" };
const TYPES = {
  casual: "Casual leave", sick: "Sick leave", medical: "Medical leave", earned: "Earned / privilege leave",
  unpaid: "Leave without pay", maternity: "Maternity leave", paternity: "Paternity leave",
  parental: "Parental leave", adoption: "Adoption leave", bereavement: "Bereavement / compassionate leave",
  marriage: "Marriage leave", compensatory: "Compensatory off", study: "Study / examination leave",
  sabbatical: "Sabbatical leave", notice_period: "Notice-period / exit leave", other: "Other leave",
};
const STATUSES = { pending: "Pending review", approved: "Approved", rejected: "Rejected", cancelled: "Cancelled" };
const isHR = (user) => String(user?.name || "").trim().toLowerCase() === "tejash parekh";
const inputDate = (value) => value ? String(value).slice(0, 10) : "";
const dateLabel = (value) => value ? new Date(`${inputDate(value)}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function LeaveRequests() {
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";
  const canReview = user?.role === "owner" || isHR(user);
  const [mine, setMine] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const jobs = [];
    if (isEmployee) jobs.push(getMyLeaveRequests().then((res) => setMine(res.data?.items || [])));
    if (canReview) jobs.push(getLeaveInbox({ status: statusFilter, search: search.trim() }).then((res) => setInbox(res.data?.items || [])));
    const results = await Promise.allSettled(jobs);
    const failed = results.find((result) => result.status === "rejected");
    if (failed) setError(failed.reason?.message || "Could not load leave requests.");
    setLoading(false);
  }, [canReview, isEmployee, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const estimatedDays = useMemo(() => {
    if (!form.startDate || !form.endDate || form.endDate < form.startDate) return 0;
    if (form.dayPart !== "full_day") return form.startDate === form.endDate ? 0.5 : 0;
    return Math.round((Date.parse(`${form.endDate}T00:00:00Z`) - Date.parse(`${form.startDate}T00:00:00Z`)) / 86400000) + 1;
  }, [form.dayPart, form.endDate, form.startDate]);

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const result = editingId
        ? await updateMyLeaveRequest(editingId, form)
        : await createMyLeaveRequest(form);
      setForm(EMPTY_FORM); setEditingId(null);
      setNotice(result.message || "Leave request saved.");
      await load();
    } catch (err) { setError(err.message || "Could not save your leave request."); }
    finally { setSaving(false); }
  };

  const edit = (item) => {
    setEditingId(item.id);
    setForm({ leaveType: item.leave_type, startDate: inputDate(item.start_date), endDate: inputDate(item.end_date), dayPart: item.day_part, reason: item.reason || "" });
    setNotice(""); setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancel = async (item) => {
    if (!window.confirm(`Cancel your leave request for ${dateLabel(item.start_date)}?`)) return;
    setActingId(item.id); setError("");
    try { await cancelMyLeaveRequest(item.id); setNotice("Leave request cancelled."); await load(); }
    catch (err) { setError(err.message || "Could not cancel the request."); }
    finally { setActingId(null); }
  };

  const decide = async (item, status) => {
    const note = status === "rejected" ? window.prompt("Please enter a reason for declining this leave:") : window.prompt("Optional approval note:") || "";
    if (status === "rejected" && !note?.trim()) return;
    if (status === "approved" && !window.confirm(`Approve ${item.employee_name}'s ${item.leave_days}-day leave request?`)) return;
    setActingId(item.id); setError(""); setNotice("");
    try {
      const result = await decideLeaveRequest(item.id, { status, note: note?.trim() || "" });
      setNotice(result.message || `Leave request ${status}.`); await load();
    } catch (err) { setError(err.message || "Could not review the request."); }
    finally { setActingId(null); }
  };

  const cards = [
    ["Approved days", mine.filter((item) => item.status === "approved").reduce((sum, item) => sum + Number(item.leave_days), 0)],
    ["Pending days", mine.filter((item) => item.status === "pending").reduce((sum, item) => sum + Number(item.leave_days), 0)],
    ["Requests", mine.length],
  ];

  return <div className="space-y-6">
    {isEmployee && <>
      <div className="grid gap-3 sm:grid-cols-3">{cards.map(([label, value]) => <div key={label} className="rounded-2xl border border-navy/10 bg-white p-4"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-1 text-2xl font-extrabold text-navy">{value}</p></div>)}</div>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-navy/10 bg-white p-5">
        <div><h2 className="flex items-center gap-2 font-bold text-navy"><CalendarDays size={18} className="text-amber"/>{editingId ? "Edit leave request" : "Request leave"}</h2><p className="mt-1 text-xs text-muted">Requests go to the owner and HR, Tejash Parekh. Select the closest applicable category; approval remains subject to company policy. Duration uses calendar days; half-day leave is available for one date.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold text-muted">Leave type<select value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy">{Object.entries(TYPES).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label className="text-xs font-semibold text-muted">Start date<input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, ...(form.endDate && e.target.value > form.endDate ? { endDate: e.target.value } : {}) })} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy"/></label>
          <label className="text-xs font-semibold text-muted">End date<input required type="date" min={form.startDate || undefined} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy"/></label>
          <label className="text-xs font-semibold text-muted">Duration<select value={form.dayPart} onChange={(e) => setForm({ ...form, dayPart: e.target.value })} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy"><option value="full_day">Full day(s)</option><option value="first_half">First half</option><option value="second_half">Second half</option></select></label>
        </div>
        <label className="block text-xs font-semibold text-muted">Reason<textarea required minLength={5} maxLength={3000} rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Briefly explain the reason for your leave" className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy"/></label>
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">Estimated duration: <strong className="text-navy">{estimatedDays || 0} calendar day(s)</strong></p><div className="flex gap-2">{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }} className="rounded-full border border-navy/15 px-4 py-2 text-xs font-bold text-navy">Stop editing</button>}<button disabled={saving} className="rounded-full bg-amber px-5 py-2.5 text-xs font-extrabold text-navy disabled:opacity-50">{saving ? "Saving…" : editingId ? "Save changes" : "Submit request"}</button></div></div>
      </form>
      <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white"><div className="border-b border-navy/10 px-5 py-4"><h2 className="font-bold text-navy">My leave history</h2></div>{loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-amber"/></div> : !mine.length ? <p className="p-5 text-sm text-muted">You have not submitted a leave request.</p> : <div className="divide-y divide-navy/5">{mine.map((item) => <div key={item.id} className="flex flex-wrap items-start justify-between gap-3 p-4"><div className="min-w-[240px] flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-navy">{TYPES[item.leave_type] || item.leave_type} · {item.leave_days} day(s)</strong><StatusBadge status={item.status}/></div><p className="mt-1 text-sm text-muted">{dateLabel(item.start_date)} – {dateLabel(item.end_date)}{item.day_part !== "full_day" ? ` · ${item.day_part.replaceAll("_", " ")}` : ""}</p><p className="mt-2 whitespace-pre-wrap text-sm text-navy/80">{item.reason}</p>{item.decision_note && <p className="mt-2 text-xs text-muted">Review note: {item.decision_note}</p>}</div>{item.status === "pending" && <div className="flex gap-2"><button onClick={() => edit(item)} className="rounded-full border border-navy/15 px-3 py-2 text-xs font-semibold text-navy">Edit</button><button disabled={actingId === item.id} onClick={() => cancel(item)} className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Cancel</button></div>}</div>)}</div>}</section>
    </>}

    {canReview && <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/10 px-5 py-4"><div><h2 className="font-bold text-navy">{user.role === "owner" ? "Leave Requests Inbox" : "HR Leave Requests Inbox"}</h2><p className="mt-1 text-xs text-muted">Review requests, record decisions, and notify employees by email.</p></div><div className="flex flex-wrap gap-2"><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Search employee or reason" className="rounded-lg border border-navy/15 px-3 py-2 text-sm"/><button onClick={load} className="rounded-full border border-navy/15 px-4 py-2 text-xs font-bold text-navy">Search</button><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-navy/15 px-3 py-2 text-sm"><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="cancelled">Cancelled</option><option value="">All statuses</option></select></div></div>{loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-amber"/></div> : !inbox.length ? <p className="p-5 text-sm text-muted">No leave requests match this filter.</p> : <div className="divide-y divide-navy/5">{inbox.map((item) => <div key={item.id} className="flex flex-wrap items-start justify-between gap-4 p-4"><div className="min-w-[250px] flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-navy">{item.employee_name}</strong><span className="text-xs text-muted">{item.employee_user_id} · {item.employee_department || "Employee"}</span><StatusBadge status={item.status}/></div><p className="mt-1 text-sm text-navy">{TYPES[item.leave_type] || item.leave_type} · {dateLabel(item.start_date)} – {dateLabel(item.end_date)} · {item.leave_days} day(s){item.day_part !== "full_day" ? ` · ${item.day_part.replaceAll("_", " ")}` : ""}</p><p className="mt-2 whitespace-pre-wrap text-sm text-muted">{item.reason}</p>{item.decision_note && <p className="mt-2 text-xs text-muted">Decision note: {item.decision_note}</p>}</div>{item.status === "pending" && Number(item.employee_id) !== Number(user.id) && <div className="flex gap-2"><button disabled={actingId === item.id} onClick={() => decide(item, "approved")} className="inline-flex items-center gap-1 rounded-full bg-green-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Check size={14}/>Approve</button><button disabled={actingId === item.id} onClick={() => decide(item, "rejected")} className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"><X size={14}/>Decline</button></div>}</div>)}</div>}</section>}

    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    <p className="flex items-center gap-2 text-xs text-muted"><Clock3 size={14}/>Calendar days are counted inclusively; the system does not yet apply weekends, public holidays, or a configured annual leave quota.</p>
  </div>;
}

function StatusBadge({ status }) {
  const colors = { pending: "bg-amber-50 text-amber-800", approved: "bg-green-50 text-green-800", rejected: "bg-red-50 text-red-800", cancelled: "bg-slate-100 text-slate-600" };
  const labels = { pending: "Pending review", approved: "Approved", rejected: "Declined", cancelled: "Cancelled" };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status] || colors.pending}`}>{labels[status] || status}</span>;
}
