import { Fragment, useEffect, useState } from "react";
import { Loader2, Search, Download, X, Settings, Pencil, ChevronUp, Camera } from "lucide-react";

const PAGE_SIZE = 8;

const weekdayName = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`).toLocaleDateString("en-IN", { timeZone: "UTC", weekday: "long" }) : "";

const hm = (totalMinutes) => `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;

const BREAK_OPTIONS = [
  ["tea_coffee", "Tea / coffee"],
  ["lunch", "Lunch"],
  ["dinner", "Dinner"],
  ["snack", "Snack"],
  ["emergency", "Emergency"],
  ["rest", "Rest"],
  ["personal", "Personal"],
  ["other", "Other"],
  ["meal", "Meal (legacy)"],
];

const WORK_DAYS = [
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
  [0, "Sun"],
];

const TAB_LABELS = [
  ["register", "Register"],
  ["calendar", "Team calendar"],
  ["corrections", "Corrections"],
  ["photos", "Photos"],
  ["locations", "Locations"],
  ["history", "Updates history"],
];

const DEFAULT_EVENT_LABELS = {
  clock_in: "Manual clock-in",
  clock_out: "Manual clock-out",
  break_start: "Break start",
  break_end: "Break end",
  custom: "",
};

const inputClass = "mt-1 block w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy";
const thClass = "px-4 py-3 whitespace-nowrap";
const tdClass = "px-4 py-2.5";

function Modal({ id, title, subtitle, onClose, maxWidth = "max-w-2xl", children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4"
      onClick={onClose}
    >
      <div
        id={id}
        className={`max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-2xl bg-white p-5`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-navy">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-navy hover:bg-offwhite"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white px-4 py-3">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-0.5 text-xl font-extrabold text-navy">{value}</p>
    </div>
  );
}

export default function AdminAttendanceDashboard({ context }) {
  const {
    isManager, register, rowTimeEdits, setRowTimeEdits, savingTimeRecord,
    attendanceEmployees, manualEvent, setManualEvent, manualPunchTimes, setManualPunchTimes,
    from, setFrom, to, setTo, search, setSearch, busy, loading, setError, settings,
    calendar, corrections, holidayDate, setHolidayDate, holidayTitle, setHolidayTitle,
    scheduleForm, setScheduleForm, loadRegister, syncManualDate, load, reviewCorrection,
    saveSchedule, submitHoliday, submitManagerEvent, submitManualPunchTime,
    updateRegisterTime, saveAttendanceBreak, printAttendanceReport, downloadRegister, statusLabel,
    attendancePhotoHref, removeAttendanceHoliday, attendanceDateLabel, attendanceTimeLabel,
    attendanceDateTimeLabel, indiaTodayInput, indiaDateTimeInput, breakTypeLabel,
  } = context;

  const [tab, setTab] = useState("register");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [breakEdits, setBreakEdits] = useState({});
  const [savingBreakId, setSavingBreakId] = useState(null);

  // Old links like #manual-attendance-update still open the manual update popup.
  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === "#manual-attendance-update") setShowManual(true);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  if (!isManager) return null;

  const registerRows = register.items || [];
  const searchText = search.trim().toLowerCase();
  const calendarRows = calendar.items.filter(
    (item) =>
      !searchText ||
      `${item.employee_name} ${item.employee_user_id} ${item.employee_department} ${item.branch_name}`
        .toLowerCase()
        .includes(searchText)
  );
  const punchedKeys = new Set(registerRows.map((item) => `${item.employee_id}|${String(item.attendance_date).slice(0, 10)}`));
  const absentRows = calendarRows
    .filter((item) => item.status === "absent" && !punchedKeys.has(`${item.employee_id}|${String(item.date).slice(0, 10)}`))
    .map((item) => ({ id: `absent-${item.employee_id}-${item.date}`, isAbsent: true, employee_id: item.employee_id, employee_name: item.employee_name, employee_user_id: item.employee_user_id, employee_department: item.employee_department, branch_name: item.branch_name, attendance_date: String(item.date).slice(0, 10), clock_in_at: null, clock_out_at: null, worked_minutes: null, break_minutes: 0, breaks: [] }));
  const registerTableRows = [...registerRows, ...absentRows].sort((a, b) => String(b.attendance_date).localeCompare(String(a.attendance_date)));
  const pendingCount = corrections.filter((item) => item.status === "pending").length;
  const correctionRows = pendingCount ? corrections : [];
  const locationRows = registerRows.filter(
    (item) => item.clock_in_latitude != null || item.clock_out_latitude != null
  );
  const historyRows = register.events || [];
  const photoRows = registerRows.filter((item) => item.clock_in_photo_key || item.clock_out_photo_key);

  const lists = {
    register: registerTableRows,
    calendar: calendarRows,
    corrections: correctionRows,
    photos: photoRows,
    locations: locationRows,
    history: historyRows,
  };
  const activeList = lists[tab];
  const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = activeList.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const presentToday = new Set(
    registerRows
      .filter((item) => item.attendance_date === indiaTodayInput() && !item.clock_out_at)
      .map((item) => item.employee_id)
  ).size;

  const registerStatus = (item) => {
    if (item.isAbsent) return { text: "No punch", cls: "bg-red-50 text-red-700" };
    if (item.clock_out_at) return { text: "Logged out", cls: "bg-slate-100 text-slate-700" };
    if (item.attendance_date !== indiaTodayInput())
      return { text: "Incomplete (past)", cls: "bg-amber-50 text-amber-700" };
    if (item.on_break) return { text: "Present - On break", cls: "bg-blue-50 text-blue-700" };
    return { text: "Present - Logged in", cls: "bg-emerald-50 text-emerald-700" };
  };

  const changeTab = (key) => {
    setTab(key);
    setPage(0);
    setExpandedId(null);
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(0);
    loadRegister().catch((err) => setError(err.message || "Could not load attendance register."));
  };

  const editRowTime = (item, key) => (event) =>
    setRowTimeEdits((current) => ({
      ...current,
      [item.id]: { ...current[item.id], [key]: event.target.value },
    }));

  const updateManual = (key) => (event) =>
    setManualEvent((current) => ({ ...current, [key]: event.target.value }));

  const updatePunchTime = (key) => (event) => {
    const value = event.target.value;
    if (value) syncManualDate(value.slice(0, 10));
    setManualPunchTimes((current) => ({ ...current, [key]: value }));
  };

  const toggleWorkDay = (day) => (event) =>
    setScheduleForm({
      ...scheduleForm,
      work_days: event.target.checked
        ? [...scheduleForm.work_days, day]
        : scheduleForm.work_days.filter((item) => item !== day),
    });

  return (
    <>
      {/* Header + actions */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-navy">Attendance register</h2>
          <p className="mt-1 text-sm text-muted">Owner and HR team view of employee punch records.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="rounded-full bg-amber px-4 py-2 text-xs font-bold text-navy"
          >
            Manual update
          </button>
          <button
            type="button"
            onClick={() => setShowSchedule(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-white px-4 py-2 text-xs font-bold text-navy"
          >
            <Settings size={14} />
            Schedule &amp; holidays
          </button>
          <button
            type="button"
            onClick={printAttendanceReport}
            className="rounded-full border border-navy/15 bg-white px-4 py-2 text-xs font-bold text-navy"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <Stat label="Attendance records" value={register.summary.records ?? "—"} />
        <Stat label="Employees present" value={presentToday} />
        <Stat label="Incomplete shifts" value={register.summary.open_records ?? "—"} />
        <Stat
          label="Total recorded work"
          value={
            register.summary.total_worked_minutes == null
              ? "—"
              : `${(Number(register.summary.total_worked_minutes) / 60).toFixed(1)} h`
          }
        />
        <Stat
          label="Total break time"
          value={
            register.summary.total_break_minutes == null
              ? "0 h"
              : `${(Number(register.summary.total_break_minutes) / 60).toFixed(1)} h`
          }
        />
      </div>

      {/* Main tabbed card */}
      <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        <form
          onSubmit={applyFilters}
          className="flex flex-wrap items-end gap-3 border-b border-navy/10 p-4"
        >
          <label className="text-xs font-semibold text-muted">
            From
            <input
              type="date"
              required
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="mt-1 block rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy"
            />
          </label>
          <label className="text-xs font-semibold text-muted">
            To
            <input
              type="date"
              required
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="mt-1 block rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy"
            />
          </label>
          <label className="min-w-[180px] flex-1 text-xs font-semibold text-muted">
            Search employees
            <span className="relative mt-1 block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, employee ID, branch"
                className="block w-full rounded-lg border border-navy/15 py-2 pl-8 pr-3 text-sm text-navy"
              />
            </span>
          </label>
          <button type="submit" className="rounded-full bg-navy px-4 py-2.5 text-xs font-bold text-white">
            Apply filters
          </button>
          <button
            type="button"
            onClick={downloadRegister}
            disabled={!register.items.length}
            className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 px-4 py-2.5 text-xs font-bold text-navy disabled:opacity-50"
          >
            <Download size={14} />
            Export CSV
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-1 border-b border-navy/10 px-3 py-2">
          {TAB_LABELS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => changeTab(key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold ${
                tab === key ? "bg-amber text-navy" : "text-muted hover:bg-offwhite"
              }`}
            >
              {label}
              {key === "corrections" && pendingCount > 0 && (
                <span className="rounded-full bg-navy px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Register */}
        {tab === "register" &&
          (loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-amber" />
            </div>
          ) : !registerTableRows.length ? (
            <p className="p-5 text-sm text-muted">No attendance records match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-offwhite text-xs text-muted">
                  <tr>
                    <th className={thClass}>Employee</th>
                    <th className={thClass}>Date</th>
                    <th className={thClass}>Day</th>
                    <th className={thClass}>Present / Absent</th>
                    <th className={thClass}>Login (IST)</th>
                    <th className={thClass}>Logout (IST)</th>
                    <th className={thClass}>Net hours</th>
                    <th className={thClass}>Breaks</th>
                    <th className={thClass}>Photos</th>
                    <th className={thClass}>Status</th>
                    <th className={thClass}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {pageItems.map((item) => {
                    const status = registerStatus(item);
                    const isOpen = expandedId === item.id;
                    return (
                      <Fragment key={item.id}>
                        <tr>
                          <td className={tdClass}>
                            <p className="font-semibold text-navy">{item.employee_name}</p>
                            <p className="text-xs text-muted">
                              {item.employee_user_id} · {item.employee_department || "—"} ·{" "}
                              {item.branch_name || "—"}
                            </p>
                          </td>
                          <td className={`${tdClass} whitespace-nowrap`}>
                            {attendanceDateLabel(item.attendance_date)}
                          </td>
                          <td className={`${tdClass} whitespace-nowrap font-semibold ${weekdayName(item.attendance_date) === "Sunday" ? "text-red-600" : "text-navy"}`}>{weekdayName(item.attendance_date)}</td>
                          <td className={tdClass}>
                            <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${item.isAbsent ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{item.isAbsent ? "Absent" : "Present"}</span>
                          </td>
                          <td className={tdClass}>{attendanceTimeLabel(item.clock_in_at)}</td>
                          <td className={tdClass}>
                            {item.clock_out_at ? attendanceTimeLabel(item.clock_out_at) : "—"}
                          </td>
                          <td className={tdClass}>
                            {item.worked_minutes == null
                              ? "—"
                              : `${(Number(item.worked_minutes) / 60).toFixed(2)} h`}
                          </td>
                          <td className={`${tdClass} whitespace-nowrap`}>
                            {hm(Number(item.break_minutes || 0))}
                            <span className="block text-xs text-muted">
                              {item.breaks?.length ? `${item.breaks.length} break(s)` : "No breaks"}
                            </span>
                          </td>
                          <td className={tdClass}>
                            <div className="flex gap-1.5">
                              {item.clock_in_photo_key && (
                                <a
                                  href={attendancePhotoHref(item.id, "clock-in")}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Clock-in photo"
                                  className="inline-flex items-center gap-1 rounded-full bg-offwhite px-2.5 py-1 text-xs font-bold text-navy"
                                >
                                  <Camera size={13} />In
                                </a>
                              )}
                              {item.clock_out_photo_key && (
                                <a
                                  href={attendancePhotoHref(item.id, "clock-out")}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Clock-out photo"
                                  className="inline-flex items-center gap-1 rounded-full bg-offwhite px-2.5 py-1 text-xs font-bold text-navy"
                                >
                                  <Camera size={13} />Out
                                </a>
                              )}
                              {!item.clock_in_photo_key && !item.clock_out_photo_key && (
                                <span className="text-muted">—</span>
                              )}
                            </div>
                          </td>
                          <td className={tdClass}>
                            <span
                              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${status.cls}`}
                            >
                              {status.text}
                            </span>
                          </td>
                          <td className={tdClass}>
                            <button
                              type="button"
                              onClick={() => item.isAbsent ? (setManualEvent((current) => ({ ...current, employee_id: String(item.employee_id) })), syncManualDate(item.attendance_date), setShowManual(true)) : setExpandedId(isOpen ? null : item.id)}
                              
                              className="inline-flex items-center gap-1 rounded-full border border-navy/15 px-3 py-1 text-xs font-bold text-navy hover:bg-offwhite"
                            >
                              {isOpen ? <ChevronUp size={13} /> : <Pencil size={13} />}
                              {isOpen ? "Close" : item.isAbsent ? "Add punch" : "Edit"}
                            </button>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr className="bg-offwhite/60">
                            <td colSpan={11} className="px-4 py-4">
                              <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr]">
                                <label className="block text-[11px] font-semibold text-muted">
                                  Clock-in (IST)
                                  <input
                                    type="datetime-local"
                                    step="60"
                                    value={
                                      rowTimeEdits[item.id]?.clock_in ??
                                      indiaDateTimeInput(item.clock_in_at)
                                    }
                                    onChange={editRowTime(item, "clock_in")}
                                    className="mt-1 block w-full rounded-lg border border-navy/15 bg-white px-2 py-1.5 text-xs text-navy"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateRegisterTime(item, "clock_in")}
                                    disabled={savingTimeRecord === `${item.id}:clock_in`}
                                    className="mt-1 rounded-md border border-navy/15 bg-white px-2 py-1 text-[11px] font-semibold text-navy hover:bg-offwhite disabled:opacity-50"
                                  >
                                    {savingTimeRecord === `${item.id}:clock_in` ? "Saving..." : "Save time"}
                                  </button>
                                </label>

                                <label className="block text-[11px] font-semibold text-muted">
                                  Clock-out (IST)
                                  <input
                                    type="datetime-local"
                                    step="60"
                                    value={
                                      rowTimeEdits[item.id]?.clock_out ??
                                      (item.clock_out_at ? indiaDateTimeInput(item.clock_out_at) : "")
                                    }
                                    onChange={editRowTime(item, "clock_out")}
                                    className="mt-1 block w-full rounded-lg border border-navy/15 bg-white px-2 py-1.5 text-xs text-navy"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateRegisterTime(item, "clock_out")}
                                    disabled={savingTimeRecord === `${item.id}:clock_out`}
                                    className="mt-1 rounded-md border border-navy/15 bg-white px-2 py-1 text-[11px] font-semibold text-navy hover:bg-offwhite disabled:opacity-50"
                                  >
                                    {savingTimeRecord === `${item.id}:clock_out`
                                      ? "Saving..."
                                      : item.clock_out_at
                                      ? "Save time"
                                      : "Add clock-out"}
                                  </button>
                                </label>

                                <div>
                                  <p className="text-[11px] font-semibold text-muted">
                                    Break timeline (IST) ·{" "}
                                    <span className="text-navy">
                                      {hm(Number(item.break_minutes || 0))} total
                                    </span>
                                  </p>
                                  {item.breaks?.length ? (
                                    <ul className="mt-1 space-y-1 text-xs text-muted">
                                      {item.breaks.map((entry, index) => (
                                        <li key={entry.id || index}>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span><span className="font-semibold text-navy">{breakTypeLabel(entry.break_type)}</span>: {attendanceTimeLabel(entry.break_start_at)} - {entry.break_end_at ? attendanceTimeLabel(entry.break_end_at) : "In progress"}</span>
                                            {entry.break_end_at && <button type="button" className="inline-flex items-center gap-1 rounded-md border border-navy/15 px-2 py-1 text-[11px] font-semibold text-navy hover:bg-white" onClick={() => setBreakEdits((current) => ({ ...current, [entry.id]: current[entry.id] ? null : { break_start_at: indiaDateTimeInput(entry.break_start_at), break_end_at: indiaDateTimeInput(entry.break_end_at) } }))}><Pencil size={11}/>{breakEdits[entry.id] ? "Cancel edit" : "Edit break"}</button>}
                                          </div>
                                          {breakEdits[entry.id] && <div className="mt-2 flex flex-wrap items-end gap-2 rounded-lg bg-white p-2"><label className="text-[11px] text-muted">Start<input type="datetime-local" className={inputClass} value={breakEdits[entry.id].break_start_at} onChange={(event) => setBreakEdits((current) => ({ ...current, [entry.id]: { ...current[entry.id], break_start_at: event.target.value } }))}/></label><label className="text-[11px] text-muted">End<input type="datetime-local" className={inputClass} value={breakEdits[entry.id].break_end_at} onChange={(event) => setBreakEdits((current) => ({ ...current, [entry.id]: { ...current[entry.id], break_end_at: event.target.value } }))}/></label><button type="button" disabled={savingBreakId === entry.id} className="rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" onClick={async () => { setSavingBreakId(entry.id); await saveAttendanceBreak(entry.id, breakEdits[entry.id], item.employee_name); setBreakEdits((current) => ({ ...current, [entry.id]: null })); setSavingBreakId(null); }}>{savingBreakId === entry.id ? "Saving..." : "Save"}</button></div>}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="mt-1 text-xs text-muted">No breaks</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}

        {/* Team calendar */}
        {tab === "calendar" && (
          <>
            <div className="border-b border-navy/10 px-5 py-3">
              <p className="text-xs text-muted">
                {from} to {to} · {calendar.items.length} employee-day records · absent, leave and
                off-day states are shown separately.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(calendar.counts || {}).map(([status, count]) => (
                  <span
                    key={status}
                    className="rounded-full bg-offwhite px-3 py-1 text-xs font-semibold text-navy"
                  >
                    {statusLabel(status)}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
            </div>
            {!calendarRows.length ? (
              <p className="p-5 text-sm text-muted">No calendar records match.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[740px] text-left text-sm">
                  <thead className="bg-offwhite text-xs text-muted">
                    <tr>
                      <th className={thClass}>Date</th>
                      <th className={thClass}>Employee</th>
                      <th className={thClass}>Department / branch</th>
                      <th className={thClass}>Shift</th>
                      <th className={thClass}>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy/5">
                    {pageItems.map((item, index) => (
                      <tr key={`${item.employee_id}-${item.date}-${index}`}>
                        <td className={`${tdClass} whitespace-nowrap`}>{attendanceDateLabel(item.date)}</td>
                        <td className={tdClass}>
                          {item.employee_name}
                          <span className="block text-xs text-muted">{item.employee_user_id}</span>
                        </td>
                        <td className={tdClass}>
                          {item.employee_department || "—"}
                          <span className="block text-xs text-muted">{item.branch_name || "—"}</span>
                        </td>
                        <td className={`${tdClass} whitespace-nowrap`}>
                          {attendanceTimeLabel(item.clock_in_at)} – {attendanceTimeLabel(item.clock_out_at)}
                        </td>
                        <td className={tdClass}>
                          <span
                            title={item.holiday_title || item.leave_type || ""}
                            className="whitespace-nowrap rounded-full bg-offwhite px-2.5 py-1 text-xs font-bold text-navy"
                          >
                            {statusLabel(item.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Corrections */}
        {tab === "corrections" &&
          (!correctionRows.length ? (
            <p className="p-5 text-sm text-muted">No correction requests are awaiting review.</p>
          ) : (
            <div className="divide-y divide-navy/5">
              {pageItems.map((item) => (
                <article key={item.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-navy">
                        {item.employee_name} · {attendanceDateLabel(item.attendance_date)}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        In: {attendanceDateTimeLabel(item.requested_clock_in)} · Out:{" "}
                        {attendanceDateTimeLabel(item.requested_clock_out)}
                      </p>
                      <p className="mt-1 text-sm text-navy">{item.reason}</p>
                      {item.status !== "pending" && (
                        <p className="mt-2 text-xs text-muted">
                          Previous: {attendanceDateTimeLabel(item.original_clock_in)} ·{" "}
                          {attendanceDateTimeLabel(item.original_clock_out)}
                        </p>
                      )}
                      {item.reviewer_name && (
                        <p className="mt-1 text-xs text-muted">
                          Reviewed by {item.reviewer_name} · {attendanceDateTimeLabel(item.reviewed_at)}
                          {item.reviewer_note ? ` · ${item.reviewer_note}` : ""}
                        </p>
                      )}
                    </div>
                    {item.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          disabled={busy}
                          onClick={() => reviewCorrection(item.id, "approved")}
                          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
                        >
                          Approve
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => reviewCorrection(item.id, "rejected")}
                          className="rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="rounded-full bg-offwhite px-3 py-1 text-xs font-bold capitalize text-muted">
                        {item.status}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ))}

        {/* Location punches */}
        {tab === "locations" &&
          (!locationRows.length ? (
            <p className="p-5 text-sm text-muted">No location-enabled punches in this range.</p>
          ) : (
            <>
              <p className="border-b border-navy/10 px-5 py-3 text-xs text-muted">
                Only punches where the employee enabled optional location are listed.
              </p>
              <ul className="divide-y divide-navy/5">
                {pageItems.map((item) => {
                  const latitude = item.clock_in_latitude ?? item.clock_out_latitude;
                  const longitude = item.clock_in_longitude ?? item.clock_out_longitude;
                  return (
                    <li
                      key={`location-${item.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
                    >
                      <span>
                        {item.employee_name} · {attendanceDateLabel(item.attendance_date)}
                        <span className="block text-xs text-muted">
                          Accuracy: {item.clock_in_accuracy_m ?? item.clock_out_accuracy_m ?? "—"} m
                        </span>
                      </span>
                      <a
                        className="font-semibold text-blue-700 underline"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://maps.google.com/?q=${latitude},${longitude}`}
                      >
                        Open map
                      </a>
                    </li>
                  );
                })}
              </ul>
            </>
          ))}

        {/* Manual update history */}
        {tab === "history" && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy/10 px-5 py-3">
            <p className="text-xs text-muted">
              Owner and HR attendance edits for the selected date range.
            </p>
            <span className="rounded-full bg-offwhite px-3 py-1 text-xs font-bold text-muted">
              {historyRows.length} updates
            </span>
          </div>
        )}
        {tab === "history" &&
          (!historyRows.length ? (
            <p className="p-5 text-sm text-muted">No manual updates in this date range.</p>
          ) : (
            <div className="divide-y divide-navy/5">
              {pageItems.map((event) => (
                <article key={event.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-navy">{event.employee_name}</strong>
                    <span className="text-xs text-muted">{event.employee_user_id}</span>
                    <span className="rounded-full bg-amber-soft px-2.5 py-1 text-xs font-semibold capitalize text-navy">
                      {event.event_label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-navy">
                    {attendanceDateTimeLabel(event.event_at)} - {event.note}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Entered by {event.entered_by_name || "Owner / HR"}
                  </p>
                </article>
              ))}
            </div>
          ))}

        {/* Team attendance photos */}
        {tab === "photos" &&
          (!photoRows.length ? (
            <p className="p-5 text-sm text-muted">No attendance photos in this date range.</p>
          ) : (
            <div className="space-y-2 p-4">
              {pageItems.map((item) => (
                <div
                  key={`team-attendance-photo-${item.id}`}
                  className="flex flex-wrap items-center gap-3 rounded-lg bg-offwhite p-3 text-sm"
                >
                  <span className="mr-auto font-semibold text-navy">
                    {item.employee_name} · {attendanceDateLabel(item.attendance_date)}
                  </span>
                  {item.clock_in_photo_key && (
                    <a
                      href={attendancePhotoHref(item.id, "clock-in")}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-blue-700 underline"
                    >
                      Clock-in photo
                    </a>
                  )}
                  {item.clock_out_photo_key && (
                    <a
                      href={attendancePhotoHref(item.id, "clock-out")}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-blue-700 underline"
                    >
                      Clock-out photo
                    </a>
                  )}
                </div>
              ))}
            </div>
          ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-navy/10 px-5 py-3 text-sm">
            <span className="text-muted">
              Page {safePage + 1} of {totalPages} · {activeList.length} records
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage(safePage - 1)}
                disabled={safePage === 0}
                className="rounded-full border border-navy/15 px-4 py-1.5 text-xs font-bold text-navy disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage(safePage + 1)}
                disabled={safePage >= totalPages - 1}
                className="rounded-full bg-amber px-4 py-1.5 text-xs font-bold text-navy disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Manual attendance update popup */}
      {showManual && (
        <Modal
          id="manual-attendance-update"
          title="Manual attendance update"
          subtitle="Record or correct an employee's clock-in, clock-out, break, or add a custom attendance event."
          onClose={() => setShowManual(false)}
          maxWidth="max-w-3xl"
        >
          <form
            onSubmit={(event) => {
              submitManagerEvent(event);
              setShowManual(false);
            }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label className="text-xs font-semibold text-muted">
              Employee
              <select
                required
                value={manualEvent.employee_id}
                onChange={updateManual("employee_id")}
                className="mt-1 block w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy"
              >
                <option value="">Select employee</option>
                {attendanceEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.user_id}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-muted">
              Attendance date
              <input
                required
                type="date"
                value={manualEvent.attendance_date}
                onChange={(event) => syncManualDate(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy"
              />
            </label>

            <label className="text-xs font-semibold text-muted">
              Event time (IST)
              <input
                required
                type="datetime-local"
                step="60"
                value={manualEvent.event_at}
                onChange={(event) => {
                  const value = event.target.value;
                  syncManualDate(value.slice(0, 10));
                  setManualEvent((current) => ({ ...current, event_at: value }));
                }}
                className="mt-1 block w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy"
              />
            </label>

            <label className="text-xs font-semibold text-muted">
              Update type
              <select
                value={manualEvent.event_type}
                onChange={(event) => {
                  const eventType = event.target.value;
                  setManualEvent((current) => ({
                    ...current,
                    event_type: eventType,
                    event_label: DEFAULT_EVENT_LABELS[eventType],
                  }));
                }}
                className="mt-1 block w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy"
              >
                <option value="clock_in">Clock-in / login</option>
                <option value="clock_out">Clock-out / logout</option>
                <option value="break_start">Break start</option>
                <option value="break_end">Break end</option>
                <option value="custom">Custom event</option>
              </select>
            </label>

            {manualEvent.event_type === "break_start" && (
              <label className="text-xs font-semibold text-muted">
                Break type
                <select
                  value={manualEvent.break_type}
                  onChange={updateManual("break_type")}
                  className="mt-1 block w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy"
                >
                  {BREAK_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            )}

            {manualEvent.event_type === "custom" && (
              <label className="text-xs font-semibold text-muted">
                Custom event type
                <input
                  required
                  maxLength={160}
                  value={manualEvent.event_label}
                  onChange={updateManual("event_label")}
                  placeholder="e.g. Client site visit"
                  className="mt-1 block w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy"
                />
              </label>
            )}

            <label className="text-xs font-semibold text-muted">
              Clock-in time (IST)
              <input
                type="datetime-local"
                step="60"
                value={manualPunchTimes.clock_in}
                onChange={updatePunchTime("clock_in")}
                className="mt-1 block w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy"
              />
              <button
                type="button"
                onClick={() => submitManualPunchTime("clock_in")}
                disabled={busy || loading}
                className="mt-2 rounded-lg border border-navy/15 px-3 py-2 text-xs font-semibold text-navy hover:bg-offwhite disabled:opacity-50"
              >
                Save clock-in time
              </button>
            </label>

            <label className="text-xs font-semibold text-muted">
              Clock-out time (IST)
              <input
                type="datetime-local"
                step="60"
                value={manualPunchTimes.clock_out}
                onChange={updatePunchTime("clock_out")}
                className="mt-1 block w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy"
              />
              <button
                type="button"
                onClick={() => submitManualPunchTime("clock_out")}
                disabled={busy || loading}
                className="mt-2 rounded-lg border border-navy/15 px-3 py-2 text-xs font-semibold text-navy hover:bg-offwhite disabled:opacity-50"
              >
                Save clock-out time
              </button>
            </label>

            <label className="text-xs font-semibold text-muted sm:col-span-2">
              Reason / details
              <textarea
                required
                maxLength={500}
                value={manualEvent.note}
                onChange={updateManual("note")}
                placeholder="Add a short reason or details"
                className="mt-1 block min-h-20 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy"
              />
            </label>

            <button
              disabled={busy || loading || !attendanceEmployees.length}
              className="w-full rounded-full bg-amber px-5 py-3 text-sm font-bold text-navy disabled:opacity-50 sm:w-fit"
            >
              {busy ? "Saving..." : "Save attendance update"}
            </button>
          </form>
        </Modal>
      )}

      {/* Schedule & holidays popup */}
      {showSchedule && (
        <Modal
          title="Attendance schedule & holidays"
          subtitle="Configure company workdays, shift times, late grace period and holidays. These settings define the calendar statuses."
          onClose={() => setShowSchedule(false)}
          maxWidth="max-w-3xl"
        >
          <form
            onSubmit={(event) => {
              saveSchedule(event);
              setShowSchedule(false);
            }}
            className="grid gap-3 sm:grid-cols-3"
          >
            <fieldset className="sm:col-span-3">
              <legend className="mb-2 text-xs font-semibold text-muted">Working days</legend>
              <div className="flex flex-wrap gap-3">
                {WORK_DAYS.map(([day, label]) => (
                  <label key={day} className="inline-flex items-center gap-1.5 text-sm text-navy">
                    <input
                      type="checkbox"
                      checked={scheduleForm.work_days.includes(day)}
                      onChange={toggleWorkDay(day)}
                      className="accent-amber"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="text-xs font-semibold text-muted">
              Shift starts
              <input
                type="time"
                required
                value={scheduleForm.shift_start}
                onChange={(event) =>
                  setScheduleForm({ ...scheduleForm, shift_start: event.target.value })
                }
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-muted">
              Shift ends
              <input
                type="time"
                required
                value={scheduleForm.shift_end}
                onChange={(event) =>
                  setScheduleForm({ ...scheduleForm, shift_end: event.target.value })
                }
                className={inputClass}
              />
            </label>
            <label className="text-xs font-semibold text-muted">
              Late grace period (minutes)
              <input
                type="number"
                min="0"
                max="180"
                required
                value={scheduleForm.grace_minutes}
                onChange={(event) =>
                  setScheduleForm({ ...scheduleForm, grace_minutes: Number(event.target.value) })
                }
                className={inputClass}
              />
            </label>

            <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
              <button
                disabled={busy}
                className="rounded-full bg-navy px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                Save schedule
              </button>
              <p className="text-xs text-muted">
                {settings?.settings
                  ? "Schedule configured"
                  : "No schedule is configured yet; absence and late statuses are not inferred until you save one."}
              </p>
            </div>
          </form>

          <form
            onSubmit={submitHoliday}
            className="mt-4 flex flex-wrap items-end gap-3 border-t border-navy/10 pt-4"
          >
            <label className="text-xs font-semibold text-muted">
              Holiday date
              <input
                type="date"
                required
                value={holidayDate}
                onChange={(event) => setHolidayDate(event.target.value)}
                className="mt-1 block rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy"
              />
            </label>
            <label className="min-w-[200px] flex-1 text-xs font-semibold text-muted">
              Holiday name
              <input
                required
                maxLength={160}
                value={holidayTitle}
                onChange={(event) => setHolidayTitle(event.target.value)}
                placeholder="Holiday or office closure"
                className={inputClass}
              />
            </label>
            <button
              disabled={busy}
              className="rounded-full border border-navy/15 px-4 py-2.5 text-xs font-bold text-navy"
            >
              Add holiday
            </button>
          </form>

          {(settings?.holidays || []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {settings.holidays.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-2 rounded-full bg-offwhite px-3 py-1.5 text-xs text-navy"
                >
                  {attendanceDateLabel(item.holiday_date)} · {item.title}
                  <button
                    type="button"
                    onClick={async () => {
                      await removeAttendanceHoliday(item.id);
                      await load();
                    }}
                    className="font-bold text-red-600"
                    aria-label={`Remove ${item.title}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
