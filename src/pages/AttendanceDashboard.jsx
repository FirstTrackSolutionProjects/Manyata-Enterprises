import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Search,
  Download,
  Clock3,
  LogIn,
  LogOut,
  ClipboardList,
  Camera
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import AdminAttendanceDashboard from "./AdminAttendanceDashboard";
import EmployeeAttendanceDashboard from "./EmployeeAttendanceDashboard";
import {
  getSalaryEmployees,
  getMyAttendance,
  attendancePhotoHref,
  clockInToAttendance,
  clockOutOfAttendance,
  getAttendanceRegister,
  addManagerAttendanceEvent,
  updateAttendanceRegisterTime,
  startAttendanceBreak,
  endAttendanceBreak,
  getAttendanceSettings,
  saveAttendanceSettings,
  addAttendanceHoliday,
  removeAttendanceHoliday,
  getAttendanceCalendar,
  requestAttendanceCorrection,
  getAttendanceCorrections,
  decideAttendanceCorrection
} from "../services/api";

const attendanceDateLabel = (value) => value
  ? new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`).toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" })
  : "—";
const attendanceTimeLabel = (value) => value
  ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(new Date(value))
  : "—";
const attendanceDateTimeLabel = (value) => value
  ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "medium", hourCycle: "h23" }).format(new Date(value))
  : "—";
const indiaTodayInput = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const indiaDateTimeInput = (value = new Date()) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value)).map(({ type, value: part }) => [type, part]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};
const indiaNowDateTimeInput = () => indiaDateTimeInput();
const breakTypeLabel = (type) => ({ tea_coffee: "Tea / coffee", lunch: "Lunch", dinner: "Dinner", snack: "Snack", emergency: "Emergency", rest: "Rest", personal: "Personal", meal: "Meal (legacy)", other: "Other" }[type] || type);
const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const attendanceSearchWords = (value) => String(value ?? "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
const attendanceSearchWordsMatch = (left, right) => {
  if (left.includes(right) || right.includes(left)) return true;
  if (Math.abs(left.length - right.length) > 1 || Math.min(left.length, right.length) < 4) return false;
  let leftIndex = 0;
  let rightIndex = 0;
  let differences = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] === right[rightIndex]) {
      leftIndex += 1;
      rightIndex += 1;
      continue;
    }
    differences += 1;
    if (differences > 1) return false;
    if (left.length > right.length) leftIndex += 1;
    else if (right.length > left.length) rightIndex += 1;
    else {
      leftIndex += 1;
      rightIndex += 1;
    }
  }
  return differences + Number(leftIndex < left.length || rightIndex < right.length) <= 1;
};
const attendanceRecordMatchesSearch = (record, fields, search) => {
  const queryWords = attendanceSearchWords(search);
  const recordWords = fields.flatMap((field) => attendanceSearchWords(record[field]));
  return queryWords.every((queryWord) => recordWords.some((recordWord) => attendanceSearchWordsMatch(recordWord, queryWord)));
};

export default function AttendanceDashboard({ isManager }) {
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";
  const [mine, setMine] = useState({ today: "", todayRecord: null, openRecord: null, items: [] });
  const [register, setRegister] = useState({ items: [], summary: {}, events: [] });
  const [rowTimeEdits, setRowTimeEdits] = useState({});
  const [savingTimeRecord, setSavingTimeRecord] = useState("");
  const [attendanceEmployees, setAttendanceEmployees] = useState([]);
  const [manualEvent, setManualEvent] = useState(() => ({ employee_id: "", attendance_date: indiaTodayInput(), event_at: indiaNowDateTimeInput(), event_type: "clock_in", event_label: "Manual clock-in", break_type: "rest", note: "" }));
  const [manualPunchTimes, setManualPunchTimes] = useState(() => ({ clock_in: indiaNowDateTimeInput(), clock_out: "" }));
  const [from, setFrom] = useState(() => `${indiaTodayInput().slice(0, 8)}01`);
  const [to, setTo] = useState(indiaTodayInput);
  const [month, setMonth] = useState(() => indiaTodayInput().slice(0, 7));
  const [timerNow, setTimerNow] = useState(() => Date.now());
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [settings, setSettings] = useState(null);
  const [calendar, setCalendar] = useState({ items: [], counts: {} });
  const [corrections, setCorrections] = useState([]);
  const [breakType, setBreakType] = useState("rest");
  const [useLocation, setUseLocation] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [punchPhoto, setPunchPhoto] = useState("");
  const videoRef = useRef(null);
  const [holidayDate, setHolidayDate] = useState(indiaTodayInput);
  const [holidayTitle, setHolidayTitle] = useState("");
  const [correctionForm, setCorrectionForm] = useState({ attendance_date: indiaTodayInput(), clock_in_at: "", clock_out_at: "", reason: "" });
  const [scheduleForm, setScheduleForm] = useState({ work_days: [], shift_start: "", shift_end: "", grace_minutes: 0 });

  useEffect(() => {
    if (!isManager) return;
    getSalaryEmployees().then((response) => {
      const employees = response.data?.items || [];
      setAttendanceEmployees(employees);
      if (employees.length) setManualEvent((current) => ({ ...current, employee_id: current.employee_id || String(employees[0].id) }));
    }).catch((err) => setError(err.message || "Could not load employees for attendance updates."));
  }, [isManager]);

  const loadMyAttendance = async () => {
    if (!isEmployee) return;
    const response = await getMyAttendance(month);
    setMine(response.data || { today: "", todayRecord: null, openRecord: null, items: [] });
  };
  const loadRegister = async ({ fromDate = from, toDate = to } = {}) => {
    if (!isManager) return;
    const [response, calendarResponse, settingsResponse, correctionsResponse] = await Promise.all([
      getAttendanceRegister({ from: fromDate, to: toDate, search: search.trim() }), getAttendanceCalendar({ from: fromDate, to: toDate }), getAttendanceSettings(), getAttendanceCorrections(false, "all"),
    ]);
    let registerData = response.data || { items: [], summary: {}, events: [] };
    const searchText = search.trim().toLocaleLowerCase();
    if (searchText) {
      if (!registerData.items?.length) {
        const fallback = await getAttendanceRegister({ from: fromDate, to: toDate });
        registerData = fallback.data || registerData;
      }
      const items = (registerData.items || []).filter((item) => attendanceRecordMatchesSearch(item, ["employee_name", "employee_user_id", "employee_department", "employee_designation", "branch_name"], searchText));
      const events = (registerData.events || []).filter((item) => attendanceRecordMatchesSearch(item, ["employee_name", "employee_user_id"], searchText));
      const employeeIds = new Set(items.map((item) => item.employee_id));
      const completedItems = items.filter((item) => item.clock_out_at);
      registerData = {
        ...registerData,
        items,
        events,
        summary: {
          records: items.length,
          employees: employeeIds.size,
          open_records: items.filter((item) => !item.clock_out_at).length,
          total_worked_minutes: completedItems.length ? completedItems.reduce((sum, item) => sum + Number(item.worked_minutes || 0), 0) : null,
          total_break_minutes: items.reduce((sum, item) => sum + Number(item.break_minutes || 0), 0),
        },
      };
    }
    setRegister(registerData);
    setCalendar(calendarResponse.data || { items: [], counts: {} });
    setSettings(settingsResponse.data || null);
    setCorrections(correctionsResponse.data?.items || []);
    if (settingsResponse.data?.settings) setScheduleForm({ ...settingsResponse.data.settings, work_days: (settingsResponse.data.settings.work_days || []).map(Number), shift_start: String(settingsResponse.data.settings.shift_start).slice(0, 5), shift_end: String(settingsResponse.data.settings.shift_end).slice(0, 5) });
  };
  const showAttendanceDate = async (date) => {
    if (!date) return loadRegister();
    setFrom(date);
    setTo(date);
    await loadRegister({ fromDate: date, toDate: date });
  };
  const syncManualDate = (date) => {
    if (!date) return;
    setManualEvent((current) => ({ ...current, attendance_date: date, event_at: `${date}T${current.event_at.slice(11, 16)}` }));
    setManualPunchTimes((current) => ({
      clock_in: current.clock_in ? `${date}T${current.clock_in.slice(11, 16)}` : "",
      clock_out: current.clock_out ? `${date}T${current.clock_out.slice(11, 16)}` : "",
    }));
  };
  const load = async () => {
    setLoading(true); setError("");
    try { await Promise.all([loadMyAttendance(), loadRegister()]); }
    catch (err) { setError(err.message || "Could not load attendance records."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [month]);
  useEffect(() => {
    const timer = window.setInterval(() => setTimerNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream;
    return () => cameraStream?.getTracks().forEach((track) => track.stop());
  }, [cameraStream]);

  const startPunchCamera = async () => {
    setError("");
    setNotice("");
    setPunchPhoto("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access is not supported by this browser. Use a current browser over HTTPS.");
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      } catch (cameraError) {
        // Some mobile browsers do not support the facingMode constraint. Retry
        // with their default camera while still requiring an explicit user tap.
        if (!["OverconstrainedError", "ConstraintNotSatisfiedError", "NotFoundError"].includes(cameraError.name)) throw cameraError;
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      setCameraStream(stream);
    } catch (err) {
      setError(err.name === "NotAllowedError" ? "Camera permission was denied. Allow camera access for this site in your browser settings and try again." : err.name === "NotReadableError" ? "The camera is busy in another app. Close other camera apps and try again." : err.message || "Could not start the camera.");
    }
  };
  const capturePunchPhoto = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) { setError("Wait for the camera preview, then capture your photo."); return; }
    const scale = Math.min(1, 1280 / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    setPunchPhoto(canvas.toDataURL("image/jpeg", 0.78));
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
  };

  const submitPunch = async (action) => {
    setBusy(true); setError(""); setNotice("");
    try {
      let location = {};
      if (useLocation) {
        if (!navigator.geolocation) throw new Error("This browser does not support location access.");
        const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error("Location permission was not granted. Turn off location check-in or allow browser location access.")), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }));
        location = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: Math.round(position.coords.accuracy) };
      }
      if (!punchPhoto) throw new Error("Capture a camera photo before clocking in or out.");
      if (action === "in") await clockInToAttendance({ ...location, photoDataUrl: punchPhoto });
      else await clockOutOfAttendance({ ...location, photoDataUrl: punchPhoto });
      setPunchPhoto("");
      setNotice(action === "in" ? "Clock-in recorded successfully." : "Clock-out recorded successfully.");
      await load();
    } catch (err) { setError(err.message || "Could not record attendance."); }
    finally { setBusy(false); }
  };

  const submitBreak = async (action) => {
    setBusy(true); setError(""); setNotice("");
    try {
      if (action === "start") await startAttendanceBreak(breakType);
      else await endAttendanceBreak();
      setNotice(action === "start" ? "Break started." : "Break ended.");
      await load();
    } catch (err) { setError(err.message || "Could not update your break."); }
    finally { setBusy(false); }
  };

  const submitCorrection = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try { await requestAttendanceCorrection(correctionForm); setNotice("Punch correction sent to the Owner and HR team for review."); setCorrectionForm((current) => ({ ...current, reason: "" })); await load(); }
    catch (err) { setError(err.message || "Could not submit the correction request."); }
    finally { setBusy(false); }
  };
  const reviewCorrection = async (id, status) => {
    const reviewer_note = window.prompt(status === "approved" ? "Optional approval note" : "Please enter a reason for rejection.", "");
    if (reviewer_note === null || (status === "rejected" && !reviewer_note.trim())) return;
    setBusy(true); setError("");
    try { await decideAttendanceCorrection(id, { status, reviewer_note }); setNotice(`Punch correction ${status}.`); await load(); }
    catch (err) { setError(err.message || "Could not review this correction."); }
    finally { setBusy(false); }
  };
  const saveSchedule = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try { await saveAttendanceSettings(scheduleForm); setNotice("Attendance schedule saved."); await load(); }
    catch (err) { setError(err.message || "Could not save the attendance schedule."); }
    finally { setBusy(false); }
  };
  const submitHoliday = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try { await addAttendanceHoliday({ date: holidayDate, title: holidayTitle }); setHolidayTitle(""); setNotice("Holiday added to the attendance calendar."); await load(); }
    catch (err) { setError(err.message || "Could not add the holiday."); }
    finally { setBusy(false); }
  };
  const submitManagerEvent = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      await addManagerAttendanceEvent(manualEvent);
      setNotice("Attendance update saved.");
      const savedDate = manualEvent.attendance_date;
      setManualEvent((current) => ({ ...current, attendance_date: indiaTodayInput(), event_at: indiaNowDateTimeInput(), event_type: "custom", event_label: "", note: "" }));
      setManualPunchTimes({ clock_in: indiaNowDateTimeInput(), clock_out: "" });
      await showAttendanceDate(savedDate);
    } catch (err) { setError(err.message || "Could not save the attendance update."); }
    finally { setBusy(false); }
  };
  const submitManualPunchTime = async (eventType) => {
    const eventAt = manualPunchTimes[eventType];
    if (!manualEvent.employee_id || !eventAt || !manualEvent.note.trim()) {
      setError("Select an employee, enter the time and add a reason before saving.");
      return;
    }
    setBusy(true); setError(""); setNotice("");
    try {
      await addManagerAttendanceEvent({
        employee_id: manualEvent.employee_id,
        attendance_date: manualEvent.attendance_date,
        event_at: eventAt,
        event_type: eventType,
        event_label: eventType === "clock_in" ? "Owner corrected clock-in" : "Owner corrected clock-out",
        break_type: "rest",
        note: manualEvent.note,
      });
      setNotice(`${eventType === "clock_in" ? "Clock-in" : "Clock-out"} time saved.`);
      await showAttendanceDate(manualEvent.attendance_date);
    } catch (err) { setError(err.message || "Could not save the attendance time."); }
    finally { setBusy(false); }
  };
  const updateRegisterTime = async (item, eventType) => {
    const key = `${item.id}:${eventType}`;
    const value = rowTimeEdits[item.id]?.[eventType];
    if (!value) { setError("Choose a clock-in or clock-out date and time first."); return; }
    setSavingTimeRecord(key); setError(""); setNotice("");
    try {
      await updateAttendanceRegisterTime(item.id, {
        event_at: value,
        event_type: eventType,
      });
      setNotice(`${eventType === "clock_in" ? "Clock-in" : "Clock-out"} time updated for ${item.employee_name}.`);
      setRowTimeEdits((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      await loadRegister();
    } catch (err) { setError(err.message || "Could not update the attendance time."); }
    finally { setSavingTimeRecord(""); }
  };
  const printAttendanceReport = () => {
    const rows = isManager ? calendar.items.filter((item) => !search.trim() || `${item.employee_name} ${item.employee_user_id} ${item.employee_department} ${item.branch_name}`.toLowerCase().includes(search.trim().toLowerCase())) : (mine.calendar || []).map((item) => ({ ...item, employee_name: user?.name || "Employee", employee_user_id: user?.user_id || "", employee_department: user?.department || "", branch_name: "" }));
    const reportFrom = isManager ? from : `${month}-01`;
    const reportTo = isManager ? to : `${month}-${String(new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate()).padStart(2, "0")}`;
    const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
    const popup = window.open("", "_blank", "width=1000,height=750");
    if (!popup) { setError("Allow pop-ups to print or save the attendance report."); return; }
    const body = rows.map((item) => `<tr><td>${escape(item.date || item.attendance_date)}</td><td>${escape(item.employee_name)}</td><td>${escape(item.employee_user_id)}</td><td>${escape(item.employee_department || "—")}</td><td>${escape(item.branch_name || "—")}</td><td>${escape(item.clock_in_at ? attendanceDateTimeLabel(item.clock_in_at) : "—")}</td><td>${escape(item.clock_out_at ? attendanceDateTimeLabel(item.clock_out_at) : "—")}</td><td>${escape(statusLabel(item.status || (item.clock_out_at ? "present" : "incomplete")))}</td></tr>`).join("");
    popup.document.write(`<!doctype html><html><head><title>Attendance report</title><meta charset="utf-8"><style>body{font:14px Arial,sans-serif;color:#10253f;padding:28px}h1{margin:0 0 6px}p{color:#52647b;margin:0 0 20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #d9e0e9;text-align:left;padding:9px}th{background:#f3f5f8}@media print{button{display:none}}</style></head><body><h1>Attendance report</h1><p>${escape(reportFrom)} to ${escape(reportTo)} · Generated ${escape(new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }))}</p><button onclick="window.print()">Print / Save PDF</button><table><thead><tr><th>Date</th><th>Employee</th><th>Employee ID</th><th>Department</th><th>Branch</th><th>Clock in (IST)</th><th>Clock out (IST)</th><th>Status</th></tr></thead><tbody>${body}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`);
    popup.document.close();
  };

  const downloadRegister = () => {
    const rows = [["Employee", "Employee ID", "Department", "Branch", "Attendance date", "Login (IST)", "Break events (IST)", "Logout (IST)", "Net work hours", "Status"]];
    for (const item of register.items.filter((record) => !search.trim() || `${record.employee_name} ${record.employee_user_id} ${record.employee_department} ${record.branch_name}`.toLowerCase().includes(search.trim().toLowerCase()))) rows.push([
      item.employee_name, item.employee_user_id, item.employee_department, item.branch_name,
      item.attendance_date, item.clock_in_at ? attendanceDateTimeLabel(item.clock_in_at) : "",
      (item.breaks || []).map((entry) => `${entry.break_type}: ${attendanceDateTimeLabel(entry.break_start_at)} – ${entry.break_end_at ? attendanceDateTimeLabel(entry.break_end_at) : "In progress"}`).join("; "),
      item.clock_out_at ? attendanceDateTimeLabel(item.clock_out_at) : "",
      item.worked_minutes == null ? "" : (Number(item.worked_minutes) / 60).toFixed(2),
      item.clock_out_at ? "Logged out" : item.on_break ? "Present · On break" : "Present · Logged in",
    ]);
    const blob = new Blob([`\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `attendance-${from}-to-${to}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  const activePunch = mine.openRecord;
  const onBreak = Boolean(activePunch?.on_break);
  const clockedInToday = Boolean(mine.todayRecord);
  const todayClosed = Boolean(mine.todayRecord?.clock_out_at);
  const activeElapsedMinutes = activePunch
    ? Math.max(0, Math.floor((timerNow - new Date(activePunch.clock_in_at).getTime() - Number(activePunch.break_seconds || 0) * 1000 - (onBreak && mine.snapshotAt ? Math.max(0, timerNow - new Date(mine.snapshotAt).getTime()) : 0)) / 60000))
    : 0;
  const monthRows = mine.monthItems || [];
  const monthSummary = mine.summary || {};
  const statCard = (label, value, hint = "") => <div key={label} className="rounded-2xl border border-navy/10 bg-white p-4"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-1 text-2xl font-extrabold text-navy">{value}</p>{hint && <p className="mt-1 text-xs text-muted">{hint}</p>}</div>;
  const statusLabel = (status) => ({ present: "Present", late: "Late arrival", early_departure: "Early departure", late_and_early: "Late and early", incomplete: "Incomplete", absent: "Absent", holiday: "Holiday", weekly_off: "Weekly off", approved_leave: "Approved leave", upcoming: "Upcoming", schedule_unconfigured: "Set work schedule" }[status] || status);

    const attendanceViewContext = { isManager, isEmployee, mine, register, rowTimeEdits, setRowTimeEdits, savingTimeRecord, attendanceEmployees, manualEvent, setManualEvent, manualPunchTimes, setManualPunchTimes, from, setFrom, to, setTo, month, setMonth, timerNow, search, setSearch, busy, loading, setError, settings, calendar, corrections, breakType, setBreakType, useLocation, setUseLocation, cameraStream, punchPhoto, videoRef, holidayDate, setHolidayDate, holidayTitle, setHolidayTitle, correctionForm, setCorrectionForm, scheduleForm, setScheduleForm, loadRegister, syncManualDate, load, startPunchCamera, capturePunchPhoto, submitPunch, submitBreak, submitCorrection, reviewCorrection, saveSchedule, submitHoliday, submitManagerEvent, submitManualPunchTime, updateRegisterTime, printAttendanceReport, downloadRegister, activePunch, onBreak, clockedInToday, todayClosed, activeElapsedMinutes, monthRows, monthSummary, statCard, statusLabel, Loader2, Search, Download, Clock3, LogIn, LogOut, ClipboardList, Camera, attendancePhotoHref, removeAttendanceHoliday, attendanceDateLabel, attendanceTimeLabel, attendanceDateTimeLabel, indiaTodayInput, indiaDateTimeInput, breakTypeLabel };
return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-extrabold text-navy">Attendance</h1><p className="mt-1 text-sm text-muted">Clock in and out securely, and review timestamped attendance records.</p></div><button onClick={load} disabled={loading} className="rounded-full border border-navy/15 px-4 py-2 text-xs font-bold text-navy disabled:opacity-50">Refresh</button></div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

    {isManager ? <AdminAttendanceDashboard context={attendanceViewContext} /> : isEmployee ? <EmployeeAttendanceDashboard context={attendanceViewContext} /> : null}
  </div>;
}

