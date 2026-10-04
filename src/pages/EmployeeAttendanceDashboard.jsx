import { useState } from "react";
import { Loader2, Clock3, LogIn, LogOut, ClipboardList, Camera, X } from "lucide-react";

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

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TABS = [
  ["history", "History"],
  ["breaks", "Breaks"],
  ["corrections", "Corrections"],
];

const inputClass = "mt-1 block w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy";
const cardClass = "rounded-2xl border border-navy/10 bg-white p-5";
const thClass = "px-5 py-3";
const tdClass = "px-5 py-2.5";

export default function EmployeeAttendanceDashboard({ context }) {
  const {
    isEmployee, mine, from, to, month, setMonth, timerNow, busy, loading, setError,
    calendar, corrections, breakType, setBreakType, useLocation, setUseLocation,
    cameraStream, punchPhoto, videoRef, correctionForm, setCorrectionForm,
    startPunchCamera, capturePunchPhoto, submitPunch, submitBreak, submitCorrection,
    printAttendanceReport, activePunch, onBreak, clockedInToday, todayClosed,
    activeElapsedMinutes, monthRows, monthSummary, statCard, statusLabel,
    attendancePhotoHref, attendanceDateLabel, attendanceTimeLabel,
    attendanceDateTimeLabel, indiaTodayInput,
  } = context;

  const [tab, setTab] = useState("history");
  const [showCorrection, setShowCorrection] = useState(false);
const [page, setPage] = useState(0);

 if (!isEmployee) return null;

const PAGE_SIZE = 7;
const activeList =
  tab === "history" ? monthRows : tab === "breaks" ? mine.monthBreaks || [] : mine.corrections || [];
const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE));
const safePage = Math.min(page, totalPages - 1);
const pageSlice = (list) => list.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const money = (value) =>
    `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const statusBadge = onBreak
    ? { text: "On break", cls: "bg-blue-50 text-blue-700" }
    : activePunch
    ? { text: "Clocked in", cls: "bg-emerald-50 text-emerald-700" }
    : todayClosed
    ? { text: "Complete", cls: "bg-blue-50 text-blue-700" }
    : { text: "Not clocked in", cls: "bg-slate-100 text-slate-600" };

  const heading = onBreak
    ? "Your break is in progress"
    : activePunch
    ? "Your shift is in progress"
    : todayClosed
    ? "Today's attendance is complete"
    : "Ready to start your day?";

  const liveBreakSeconds = activePunch
    ? Number(activePunch.break_seconds || 0) +
      (onBreak && mine.snapshotAt
        ? Math.max(0, (timerNow - new Date(mine.snapshotAt).getTime()) / 1000)
        : 0)
    : 0;

  const shiftTime = activePunch
    ? hm(Math.floor((timerNow - new Date(activePunch.clock_in_at).getTime()) / 60000))
    : todayClosed
    ? hm(Number(mine.todayRecord.worked_minutes || 0) + Number(mine.todayRecord.break_minutes || 0))
    : "—";

  const breakTime = activePunch
    ? hm(Math.floor(liveBreakSeconds / 60))
    : todayClosed
    ? hm(Number(mine.todayRecord.break_minutes || 0))
    : "—";

  const netWorkTime = activePunch
    ? hm(activeElapsedMinutes)
    : todayClosed
    ? hm(Number(mine.todayRecord.worked_minutes || 0))
    : "—";

  const calendarItems = mine.calendar || [];
  const calendarPad = calendarItems.length
    ? (new Date(`${String(calendarItems[0].date).slice(0, 10)}T00:00:00Z`).getUTCDay() + 6) % 7
    : 0;

  const hasPhotoCapture = Boolean(punchPhoto);

  const handleClockOut = () => {
    if (punchPhoto) return submitPunch("out");
    if (cameraStream) return setError("Capture the selfie in the Camera card before clocking out.");
    return startPunchCamera();
  };

  const handleCorrectionSubmit = (event) => {
    submitCorrection(event);
    setShowCorrection(false);
  };

  const updateCorrection = (key) => (event) =>
    setCorrectionForm({ ...correctionForm, [key]: event.target.value });

  return (
    <>
      {/* Location toggle */}
      <label
        className="flex w-fit items-center gap-2 rounded-full border border-navy/10 bg-white px-3 py-1.5 text-xs font-semibold text-navy"
        title="Your browser will ask for permission when you punch. Coordinates are visible to the Owner and HR team. You can clock in without sharing location."
      >
        <input
          type="checkbox"
          checked={useLocation}
          onChange={(event) => setUseLocation(event.target.checked)}
          className="accent-amber"
        />
        Attach location to clock-in/out (optional)
      </label>

      {/* Hero row: shift / live summary / camera */}
      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr_1fr]">
        {/* Shift card */}
        <div className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Today · {attendanceDateLabel(mine.today || indiaTodayInput())}
              </p>
              <h2 className="mt-1 text-xl font-bold text-navy">{heading}</h2>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadge.cls}`}>
              {statusBadge.text}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-offwhite p-4">
              <p className="text-xs text-muted">Clock-in time</p>
              <p className="mt-1 font-bold text-navy">
                {activePunch
                  ? attendanceDateTimeLabel(activePunch.clock_in_at)
                  : attendanceTimeLabel(mine.todayRecord?.clock_in_at)}
              </p>
            </div>
            <div className="rounded-xl bg-offwhite p-4">
              <p className="text-xs text-muted">Clock-out time</p>
              <p className="mt-1 font-bold text-navy">
                {attendanceTimeLabel(mine.todayRecord?.clock_out_at)}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            {activePunch ? (
              <>
                <label className="text-xs font-semibold text-muted">
                  Break type
                  <select
                    value={breakType}
                    onChange={(event) => setBreakType(event.target.value)}
                    disabled={onBreak}
                    className="mt-1 block w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy sm:w-auto"
                  >
                    {BREAK_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <button
                  onClick={() => submitBreak(onBreak ? "end" : "start")}
                  disabled={busy || loading}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-navy/15 px-5 py-3 text-sm font-bold text-navy disabled:opacity-50 sm:w-auto"
                >
                  {onBreak ? "End break" : "Start break"}
                </button>
                <button
                  onClick={handleClockOut}
                  disabled={busy || loading || onBreak}
                  title={
                    onBreak
                      ? "End your break before clocking out."
                      : !punchPhoto
                      ? "Tap to open the camera, capture a selfie, then clock out."
                      : ""
                  }
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-amber px-5 py-3 text-sm font-bold text-navy disabled:opacity-50 sm:w-auto"
                >
                  <LogOut size={17} />
                  {busy ? "Recording…" : "Clock out"}
                </button>
              </>
            ) : (
              <button
                onClick={() => submitPunch("in")}
                disabled={busy || loading || clockedInToday || !punchPhoto}
                title={!punchPhoto ? "Capture a camera photo before clocking in." : ""}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-amber px-5 py-3 text-sm font-bold text-navy disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <LogIn size={17} />
                {busy ? "Recording…" : clockedInToday ? "Clock-in already recorded" : "Clock in"}
              </button>
            )}
            <p className="text-xs text-muted sm:basis-full">
              Times are recorded in India Standard Time (IST).
            </p>
          </div>
        </div>

        {/* Live shift summary */}
        <div className={cardClass}>
          <div className="flex items-center gap-2">
            <Clock3 size={18} className="text-amber" />
            <h2 className="font-bold text-navy">Live shift summary</h2>
          </div>
          <div className="mt-4 grid gap-2 text-sm [&>p]:rounded-xl [&>p]:bg-offwhite [&>p]:px-3 [&>p]:py-2">
            <p className="text-muted">
              Shift time: <strong className="text-navy">{shiftTime}</strong>
            </p>
            <p className="text-muted">
              Break time: <strong className="text-navy">{breakTime}</strong>
              {onBreak && <span className="ml-2 text-amber">· Break in progress</span>}
            </p>
            <p className="text-muted">
              Net work time: <strong className="text-navy">{netWorkTime}</strong>
            </p>
          </div>
          <p className="mt-3 text-xs text-muted">Break time is excluded from net work time.</p>
        </div>

        {/* Camera card */}
        <div className="rounded-2xl border border-navy/10 bg-white p-4">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-amber" />
            <h2 className="font-bold text-navy">Camera photo</h2>
          </div>
          <p className="mt-1 text-xs text-muted">Live selfie is stored privately with your punch.</p>

          {cameraStream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="mt-3 aspect-[3/4] max-h-[50svh] w-full rounded-xl bg-navy object-cover sm:aspect-video sm:max-h-40"
            />
          ) : hasPhotoCapture ? (
            <img
              src={punchPhoto}
              alt="Captured attendance selfie preview"
              className="mt-3 h-24 w-24 rounded-xl border border-navy/10 object-cover"
            />
          ) : (
            <div className="mt-3 flex h-24 items-center justify-center rounded-xl border border-dashed border-navy/15 bg-offwhite text-muted">
              <Camera size={22} />
            </div>
          )}

          {hasPhotoCapture && !cameraStream && (
            <p className="mt-2 text-xs font-semibold text-emerald-700">
              Photo captured. It will be attached to your next punch.
            </p>
          )}

          <div className="mt-3">
            {!cameraStream ? (
              <button
                type="button"
                onClick={startPunchCamera}
                disabled={busy || loading || todayClosed}
                className="w-full rounded-full border border-navy/15 px-4 py-2 text-sm font-bold text-navy disabled:opacity-50"
              >
                {punchPhoto ? "Retake photo" : "Start camera"}
              </button>
            ) : (
              <button
                type="button"
                onClick={capturePunchPhoto}
                className="w-full rounded-full bg-amber px-4 py-2 text-sm font-bold text-navy"
              >
                Capture selfie
              </button>
            )}
          </div>

          {todayClosed && (
            <p className="mt-2 text-xs text-muted">
              Today’s attendance is complete. Camera is available on your next working day.
            </p>
          )}
        </div>
      </section>

      {/* Punch correction modal */}
      {showCorrection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4"
          onClick={() => setShowCorrection(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-navy">Request a punch correction</h2>
                <p className="mt-1 text-sm text-muted">
                  Missed or incorrect punches are sent to the Owner and HR team. Approved changes are recorded in the review history.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCorrection(false)}
                className="rounded-full p-1 text-navy hover:bg-offwhite"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-xs font-semibold text-muted">
                Attendance date
                <input
                  type="date"
                  required
                  value={correctionForm.attendance_date}
                  onChange={updateCorrection("attendance_date")}
                  className={inputClass}
                />
              </label>
              <label className="text-xs font-semibold text-muted">
                Requested clock-in
                <input
                  type="datetime-local"
                  required
                  value={correctionForm.clock_in_at}
                  onChange={updateCorrection("clock_in_at")}
                  className={inputClass}
                />
              </label>
              <label className="text-xs font-semibold text-muted">
                Requested clock-out (optional)
                <input
                  type="datetime-local"
                  value={correctionForm.clock_out_at}
                  onChange={updateCorrection("clock_out_at")}
                  className={inputClass}
                />
              </label>
              <label className="text-xs font-semibold text-muted">
                Reason
                <textarea
                  required
                  maxLength={500}
                  value={correctionForm.reason}
                  onChange={updateCorrection("reason")}
                  className={inputClass}
                />
              </label>
              <button
                disabled={busy}
                className="w-fit rounded-full bg-navy px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                Submit correction request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Calendar */}
      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-navy">Attendance calendar · {month}</h2>
            <p className="mt-1 text-sm text-muted">
              Schedule-aware view of punches, approved leave, holidays and weekly offs.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowCorrection(true)}
              className="rounded-full bg-navy px-4 py-2 text-xs font-bold text-white"
            >
              Request correction
            </button>
            <button
              onClick={printAttendanceReport}
              className="rounded-full border border-navy/15 px-4 py-2 text-xs font-bold text-navy"
            >
              Print / Save PDF
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="px-1 text-center text-[11px] font-bold uppercase text-muted">
                {d}
              </div>
            ))}
            {Array.from({ length: calendarPad }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {calendarItems.map((item) => (
              <div
                key={item.date}
                title={item.holiday_title || item.leave_type || ""}
                className="flex min-h-[56px] flex-col justify-between rounded-lg border border-navy/10 bg-offwhite p-1 sm:min-h-[64px] sm:p-1.5"
              >
                <span className="text-xs font-bold text-navy">
                  {Number(String(item.date).slice(8, 10))}
                </span>
                <span className="truncate rounded-full bg-white px-1 py-0.5 text-center text-[9px] font-bold text-muted sm:px-1.5 sm:text-[10px]">
                  {statusLabel(item.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monthly summary */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-navy">Monthly work and pay summary</h2>
            <p className="mt-1 text-sm text-muted">
              Attendance totals and an estimated salary based on your generated salary slip.
            </p>
          </div>
          <label className="text-xs font-semibold text-muted">
            Pay month
            <input
              type="month"
              value={month}
              onChange={(event) => {
  setMonth(event.target.value);
  setPage(0);
}}
              className="mt-1 block rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {statCard("Days attended", monthSummary.attendance_days ?? "—", "Days with a recorded clock-in")}
          {statCard("Completed days", monthSummary.completed_days ?? "—", `${monthSummary.open_days || 0} open shift(s)`)}
          {statCard("Net work time", hm(Number(monthSummary.worked_minutes || 0)), "Break time excluded")}
          {statCard("Break time", hm(Number(monthSummary.break_minutes || 0)), "Across this month")}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className={cardClass}>
            <p className="text-xs font-semibold text-muted">Net monthly salary on slip</p>
            <p className="mt-1 text-xl font-extrabold text-navy">
              {mine.payroll ? money(mine.payroll.net_salary) : "Not generated"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {mine.payroll
                ? `Salary slip for ${new Date(Number(mine.payroll.pay_year), Number(mine.payroll.pay_month) - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}.`
                : "A salary estimate will appear after HR or the owner generates this month's salary slip."}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-xs font-semibold text-muted">Today's salary estimate</p>
            <p className="mt-1 text-xl font-extrabold text-navy">
              {mine.todaySalaryEstimate == null ? "—" : money(mine.todaySalaryEstimate)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {!mine.payroll
                ? "Requires a generated salary slip for this month."
                : mine.todaySalaryEstimate != null
                ? "Estimate uses the configured work schedule and generated net salary."
                : "Clock in to record today's attendance."}
            </p>
          </div>

          <div className={cardClass}>
            <p className="text-xs font-semibold text-muted">Month-to-date salary estimate</p>
            <p className="mt-1 text-xl font-extrabold text-navy">
              {mine.salaryEstimate == null ? "—" : money(mine.salaryEstimate)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {mine.dailySalaryEstimate == null
                ? "Requires a generated salary slip for the selected month."
                : `Monthly net salary spread across ${mine.expectedWorkdays || 0} scheduled workday(s) at ${mine.scheduledShiftHours || 0} scheduled hours per day, multiplied by ${(Number(monthSummary.worked_minutes || 0) / 60).toFixed(2)} net work hours. Estimate only; the approved salary slip is authoritative.`}
            </p>
          </div>
        </div>
      </section>

      {/* Tabbed card: history / breaks / corrections */}
      <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        <div className="flex flex-wrap items-center gap-1 border-b border-navy/10 px-3 py-2">
          <ClipboardList size={18} className="mx-2 text-amber" />
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
  setTab(key);
  setPage(0);
}}
              className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                tab === key ? "bg-amber text-navy" : "text-muted hover:bg-offwhite"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "history" &&
          (loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-amber" />
            </div>
          ) : !monthRows.length ? (
            <p className="p-5 text-sm text-muted">No attendance records for this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-offwhite text-xs text-muted">
                  <tr>
                    <th className={thClass}>Date</th>
                    <th className={thClass}>Clock in</th>
                    <th className={thClass}>Clock out</th>
                    <th className={thClass}>Break time</th>
                    <th className={thClass}>Net work</th>
                    <th className={thClass}>Photos</th>
                    <th className={thClass}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {pageSlice(monthRows).map((item) => (
                    <tr key={item.id}>
                      <td className={`${tdClass} font-semibold text-navy`}>
                        {attendanceDateLabel(item.attendance_date)}
                      </td>
                      <td className={tdClass}>{attendanceTimeLabel(item.clock_in_at)} IST</td>
                      <td className={tdClass}>
                        {item.clock_out_at ? `${attendanceTimeLabel(item.clock_out_at)} IST` : "—"}
                      </td>
                      <td className={tdClass}>{hm(Number(item.break_minutes || 0))}</td>
                      <td className={tdClass}>
                        {item.worked_minutes == null ? "—" : hm(item.worked_minutes)}
                      </td>
                      <td className={tdClass}>
                        <div className="flex gap-2">
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
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            item.clock_out_at
                              ? "bg-emerald-50 text-emerald-700"
                              : item.on_break
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {item.clock_out_at ? "Complete" : item.on_break ? "On break" : "Shift open"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === "breaks" &&
          (!(mine.monthBreaks || []).length ? (
            <p className="p-5 text-sm text-muted">No breaks recorded for this month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-offwhite text-xs text-muted">
                  <tr>
                    <th className={thClass}>Date</th>
                    <th className={thClass}>Type</th>
                    <th className={thClass}>Started (IST)</th>
                    <th className={thClass}>Ended (IST)</th>
                    <th className={thClass}>Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {pageSlice(mine.monthBreaks).map((item) => (
                    <tr key={item.id}>
                      <td className={tdClass}>{attendanceDateLabel(item.attendance_date)}</td>
                      <td className={`${tdClass} capitalize`}>{item.break_type}</td>
                      <td className={tdClass}>{attendanceDateTimeLabel(item.break_start_at)}</td>
                      <td className={tdClass}>{attendanceDateTimeLabel(item.break_end_at)}</td>
                      <td className={tdClass}>
                        {item.break_end_at
                          ? `${Math.floor((new Date(item.break_end_at) - new Date(item.break_start_at)) / 60000)} min`
                          : "In progress"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === "corrections" &&
          (!(mine.corrections || []).length ? (
            <p className="p-5 text-sm text-muted">No correction requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-offwhite text-xs text-muted">
                  <tr>
                    <th className={thClass}>Date</th>
                    <th className={thClass}>Requested times</th>
                    <th className={thClass}>Reason</th>
                    <th className={thClass}>Status</th>
                    <th className={thClass}>Review trail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                 {pageSlice(mine.corrections).map((item) => (
                    <tr key={item.id}>
                      <td className={tdClass}>{attendanceDateLabel(item.attendance_date)}</td>
                      <td className={tdClass}>
                        {attendanceDateTimeLabel(item.requested_clock_in)} ·{" "}
                        {attendanceDateTimeLabel(item.requested_clock_out)}
                      </td>
                      <td className={tdClass}>{item.reason}</td>
                      <td className={`${tdClass} capitalize`}>{item.status}</td>
                      <td className={tdClass}>
                        {item.reviewer_name
                          ? `By ${item.reviewer_name} · ${attendanceDateTimeLabel(item.reviewed_at)}`
                          : "Awaiting review"}
                        {item.reviewer_note ? (
                          <span className="block text-xs text-muted">{item.reviewer_note}</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
                   ))}

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
    </>
  );
}