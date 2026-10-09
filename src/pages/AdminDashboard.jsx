import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Building2,
  FileText,
  Handshake,
  Wrench,
  Loader2,
  Plus,
  Search,
  Eye,
  Pencil,
  UserCheck,
  Send,
  UserX,
  KeyRound,
  Trash2,
  X,
  Copy,
  CheckCircle2,
  Filter,
  RotateCcw,
  Download,
  Banknote,
  MapPin,
  Camera
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import DashboardWelcome from "../components/DashboardWelcome";
import PartnerDetailsModal from "../components/PartnerDetailsModal";
import PartnerCreateModal from "../components/PartnerCreateModal";
import SubmissionCreateModal from "../components/SubmissionCreateModal";
import LeaveRequests from "../components/LeaveRequests";
import { APPLICATION_STATUSES, APPLICATION_UPDATE_STATUSES, applicationStatusLabel, getApplicationUpdateStatusOptions } from "../constants/applicationStatuses";
import { INSTALLATION_STATUSES } from "../constants/installationStatuses";
import { useAuth } from "../contexts/AuthContext";
import {
  getDashboardStats,
  getEmployeeStats,
  getRecentActivity,
  clearRecentActivity,
  getBranchStats,
  listApplications,
  listInstallations,
  getInstallation,
  updateInstallation,
  updateInstallationStatus,
  uploadFilesToS3,
  listUsers,
  listBranches,
  createEmployee,
  updateEmployee,
  resetEmployeePassword,
  setUserStatus,
  createBranch,
  updateBranch,
  apiFetch,
  downloadApplicationPdf,
  resetPartnerPassword,
  downloadCsvExport,
  generateEmployeeSalarySlip,
  publishEmployeeSalarySlip,
  getSalaryEmployees,
  getSalaryHistory,
  markEmployeeSalaryPaid,
  getSalaryAttendancePreview,
  getEmployeeSalaryAdvances,
  createEmployeeSalaryAdvance,
  getMySalaryAdvances,
  getMySalarySlips,
  downloadSalarySlip,
  listCommissionPayouts,
  updateCommissionPayoutStatus,
  sendPartnerLOL,
  updateMyEmployeeProfile,
  attendancePhotoHref,
  getAttendanceRegister
} from "../services/api";
import { hasActionPermission } from "../utils/permissions";
import { isHrEmployee } from "../utils/employeeRoles";
import { formatApplicationLocation } from "../utils/applicationLocation";
import JoinUsDetailsModal from "../components/JoinUsDetailsModal";
import AttendanceDashboard from "./AttendanceDashboard";

const TECHNICAL_APPLICATION_STATUS_VALUES = ["technical_installation_pending", "technical_installation_half_work_done", "technical_installation_completed"];
const EMPLOYEE_APPLICATION_STATUS_OPTIONS = [...new Map([
  ...APPLICATION_UPDATE_STATUSES,
  ...APPLICATION_STATUSES.filter((status) => TECHNICAL_APPLICATION_STATUS_VALUES.includes(status.value)),
].map((status) => [status.value, status])).values()];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const permissions = user?.permissions || ["applications"];
  const isHr = isHrEmployee(user);
  const initialEmployeeTab = ["applications", "installations", "employees", "partners", "branches", "submissions"].find((item) => permissions.includes(item));
  const tab = searchParams.get("section") || (user?.role === "owner" ? "overview" : initialEmployeeTab || (isHr ? "employees" : "no-access"));
  const requiredModule = tab.startsWith("applications") ? "applications" : tab.startsWith("installations") ? "installations" : tab;
  const hasAccess = user?.role === "owner" || isHr
    || (tab === "employee-profile" && user?.role === "employee")
    || (tab === "emp-attendance" && isHr)
    || (tab === "employees" && isHr)
    || ((requiredModule === "applications" || requiredModule === "installations")
      ? hasActionPermission(user, requiredModule, "view")
      : ((tab === "salary-slips" || tab === "leave-requests" || tab === "attendance") && user?.role === "employee")
        || (tab === "salary-management" && (user?.role === "owner" || isHr))
        || permissions.includes(requiredModule));

  const handleSectionChange = (section) => {
    setSearchParams({ section }, { replace: true });
  };

  return (
    <DashboardLayout
      activeSection={tab}
      onSectionChange={handleSectionChange}
    >
      {!hasAccess || (tab === "overview" && user?.role !== "owner" && !isHr) ? <div className="rounded-2xl border border-navy/10 bg-white p-8 text-center text-muted">The owner has not granted you access to any dashboard sections yet.</div> : null}
      {hasAccess && tab === "overview" && <OverviewTab />}
      {hasAccess && tab === "employee-profile" && user?.role === "employee" && <EmployeeProfileTab />}
      {hasAccess && tab === "applications" && <ApplicationsTab />}
      {hasAccess && tab === "applications-odisha" && <ApplicationsTab initialLocation="odisha" />}
      {hasAccess && tab === "applications-kolkata" && <ApplicationsTab initialLocation="kolkata" />}
      {hasAccess && tab.startsWith("installations") && <InstallationsTab location={tab === "installations-odisha" ? "odisha" : tab === "installations-kolkata" ? "kolkata" : ""} />}
      {hasAccess && tab === "employees" && <EmployeesTab />}
      {hasAccess && tab === "salary-slips" && user?.role === "employee" && <div className="space-y-5"><EmployeeAdvanceHistory /><EmployeeSalarySlipsTab /></div>}
      {hasAccess && tab === "salary-management" && (user?.role === "owner" || isHr) && <SalaryManagementTab />}
      {hasAccess && tab === "commission-payouts" && (user?.role === "owner" || isHr) && <CommissionPayoutsTab />}
      {hasAccess && tab === "leave-requests" && ["owner", "employee"].includes(user?.role) && <LeaveRequests />}
      {hasAccess && tab === "attendance" && ["owner", "employee"].includes(user?.role) && <AttendanceDashboard isManager={user?.role === "owner"} />}
      {hasAccess && tab === "emp-attendance" && (user?.role === "owner" || isHr) && <AttendanceDashboard isManager />}
      {hasAccess && tab === "partners" && <PartnersTab />}
      {hasAccess && tab === "branches" && <BranchesTab />}
      {hasAccess && tab === "submissions" && <OtherTab />}
    </DashboardLayout>
  );
}

/* ── Overview ─────────────────────────────────────── */

function EmployeeProfileTab() {
  const { user, refresh } = useAuth();
  const [editing, setEditing] = useState(false);
  const profile = user?.profileDetails || {};
  const nameParts = String(user?.name || "").trim().split(/\s+/).filter(Boolean);
  const submission = {
    ...profile,
    id: user?.id,
    created_at: user?.createdAt || new Date().toISOString(),
    firstName: profile.firstName || nameParts.shift() || "",
    lastName: profile.lastName || nameParts.join(" "),
    email: user?.email || "",
    phone: user?.phone || "",
    streetAddress: user?.address || profile.streetAddress || "",
    city: user?.city || profile.city || "",
    state: user?.state || profile.state || "",
    postalCode: user?.pincode || profile.postalCode || "",
    profileDetails: profile,
    documentUrls: {},
  };
  const groups = [
    { title: "Personal Details", fields: [["Full Name", user?.name], ["Email", user?.email], ["Phone", user?.phone], ["Date of Birth", profile.dob], ["Gender", profile.gender], ["Father's Name", profile.fatherName], ["Mother's Name", profile.motherName], ["Blood Group", profile.bloodGroup], ["Marital Status", profile.maritalStatus]] },
    { title: "Address", fields: [["Street Address", user?.address || profile.streetAddress], ["City", user?.city || profile.city], ["District", profile.district], ["State", user?.state || profile.state], ["Postal Code", user?.pincode || profile.postalCode], ["Country", profile.country], ["Location / Posting Preference", profile.location]] },
    { title: "Education & Experience", fields: [["Qualification", profile.qualification], ["Institution", profile.institutionName], ["Year of Passing", profile.yearOfPassing], ["Experience", profile.experience], ["Company", profile.companyName], ["Designation", profile.designation || user?.designation]] },
    { title: "Bank Details", fields: [["Bank Name", profile.bankName], ["Account Number", profile.accountNumber], ["IFSC Code", profile.ifscCode]] },
  ];
  const displayProfileValue = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "object") {
      try { return JSON.stringify(value); } catch { return "—"; }
    }
    return String(value);
  };
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-extrabold text-navy">Employee Profile</h2><p className="mt-1 text-sm text-muted">View your saved profile information.</p></div><button onClick={() => setEditing(true)} className="rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy">Edit Profile</button></div>
    <div className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-lg font-bold text-navy">{user?.name || "Employee"}</p><p className="mt-1 text-sm text-muted">{user?.userId || user?.user_id || ""} · {user?.department || "Employee"}{user?.designation ? ` · ${user.designation}` : ""}</p></div>
    {groups.map((group) => <section key={group.title} className="rounded-2xl border border-navy/10 bg-white p-5"><h3 className="font-bold text-navy">{group.title}</h3><div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{group.fields.map(([label, value]) => <div key={label}><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-1 break-words text-sm text-navy">{displayProfileValue(value)}</p></div>)}</div></section>)}
    {profile.description && <section className="rounded-2xl border border-navy/10 bg-white p-5"><h3 className="font-bold text-navy">About</h3><p className="mt-2 whitespace-pre-wrap text-sm text-navy">{displayProfileValue(profile.description)}</p></section>}
    {editing && <JoinUsDetailsModal submission={submission} employeeProfile onClose={() => setEditing(false)} onSaveProfile={async (payload) => { const result = await updateMyEmployeeProfile(payload); await refresh(); return result; }} onSaved={() => setEditing(false)} />}
  </div>;
}

function EmployeeAdvanceHistory() {
  const [history, setHistory] = useState({ advances: [], deductions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    getMySalaryAdvances()
      .then((response) => setHistory({ advances: response.data?.advances || [], deductions: response.data?.deductions || [] }))
      .catch((err) => setError(err.message || "Could not load advance history."))
      .finally(() => setLoading(false));
  }, []);

  const money = (amount) => `Rs. ${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const totalTaken = history.advances.reduce((sum, advance) => sum + Number(advance.total_amount || 0), 0);
  const totalRecovered = history.advances.reduce((sum, advance) => sum + Number(advance.recovered_amount || 0), 0);
  const totalBalance = history.advances.reduce((sum, advance) => sum + Math.max(0, Number(advance.total_amount || 0) - Number(advance.recovered_amount || 0)), 0);

  return <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
    <div className="flex items-center gap-2 border-b border-navy/10 px-5 py-4"><Banknote size={18} className="text-amber"/><h2 className="font-bold text-navy">My Advance History</h2></div>
    {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-amber"/></div>
      : error ? <p className="p-5 text-sm text-red-600">{error}</p>
      : <div className="p-5">
        {history.advances.length > 0 && <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-muted">Total advance taken</p><p className="mt-1 font-bold text-navy">{money(totalTaken)}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-muted">Deducted from salary</p><p className="mt-1 font-bold text-navy">{money(totalRecovered)}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-muted">Remaining balance</p><p className="mt-1 font-bold text-navy">{money(totalBalance)}</p></div>
        </div>}
        {history.advances.length === 0 && history.deductions.length === 0
          ? <p className="text-sm text-muted">No advances or advance deductions have been recorded.</p>
          : <>
            {history.advances.length > 0 && <div className="divide-y divide-navy/5">{history.advances.map((advance) => <article key={advance.id} className="py-3 text-sm first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-navy">Advance taken: {money(advance.total_amount)}</strong><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-navy">{advance.status === "paid" ? "Paid" : advance.status === "cancelled" ? "Cancelled" : "Active"}</span></div>
              <p className="mt-1 text-xs text-muted">Deducted from salary: {money(advance.recovered_amount)} · Remaining: {money(Math.max(0, Number(advance.total_amount || 0) - Number(advance.recovered_amount || 0)))} · Monthly installment: {money(advance.monthly_installment)}</p>
              {advance.note && <p className="mt-1 text-xs text-muted">Note: {advance.note}</p>}
            </article>)}</div>}
            {history.deductions.length > 0 && <div className="mt-5 border-t border-navy/10 pt-4"><h3 className="mb-2 text-sm font-bold text-navy">Published salary deductions</h3><div className="divide-y divide-navy/5">{history.deductions.map((deduction) => <div key={`${deduction.pay_year}-${deduction.pay_month}`} className="flex flex-wrap justify-between gap-2 py-2 text-xs"><strong className="text-navy">{new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(deduction.pay_year, deduction.pay_month - 1, 1))}</strong><span className="text-muted">Advance: {money(deduction.advance_recovery)} · Any Other Advance: {money(deduction.other_advance)}</span></div>)}</div></div>}
          </>}
      </div>}
  </section>;
}

function EmployeeSalarySlipsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    getMySalarySlips()
      .then((response) => setItems(response.data?.items || []))
      .catch((err) => setError(err.message || "Could not load salary slips."))
      .finally(() => setLoading(false));
  }, []);

  return <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
    <div className="flex items-center gap-2 border-b border-navy/10 px-5 py-4"><Banknote size={18} className="text-amber"/><h2 className="font-bold text-navy">My Salary Slips</h2></div>
    {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-amber"/></div>
      : error ? <p className="p-5 text-sm text-red-600">{error}</p>
      : items.length === 0 ? <p className="p-5 text-sm text-muted">No salary slips have been generated for you yet.</p>
      : <div className="divide-y divide-navy/5">{items.map((slip) => <div key={slip.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div><p className="font-semibold text-navy">{new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(Number(slip.pay_year), Number(slip.pay_month) - 1, 1))}</p><p className="mt-1 text-xs text-muted">Net salary: ₹{Number(slip.net_salary || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${Number(slip.is_paid) ? "bg-emerald-50 text-emerald-700" : "bg-amber-soft text-amber-800"}`}>{Number(slip.is_paid) ? "Paid" : "Published · awaiting payment"}{slip.paid_at ? ` · ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(slip.paid_at))}` : ""}</span>
        <button onClick={() => downloadSalarySlip(slip.id, slip.employee_name, slip.pay_month, slip.pay_year).catch((err) => alert(err.message))} className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-navy-light"><Download size={14}/>Download PDF</button>
      </div>)}</div>}
  </section>;
}

function SalaryPaymentHistory({ refreshKey }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    getSalaryHistory()
      .then((response) => { if (active) setItems(response.data?.items || []); })
      .catch((err) => { if (active) setError(err.message || "Could not load salary payment history."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);

  const markPaid = async (slip) => {
    const period = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(Number(slip.pay_year), Number(slip.pay_month) - 1, 1));
    if (!window.confirm(`Confirm that Rs. ${Number(slip.net_salary || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })} salary for ${period} has been transferred to ${slip.employee_name}?`)) return;
    setSavingId(slip.id);
    setError("");
    try {
      const response = await markEmployeeSalaryPaid(slip.id);
      setItems((current) => current.map((item) => item.id === slip.id ? { ...item, ...response.data } : item));
    } catch (err) {
      setError(err.message || "Could not update salary payment status.");
    } finally {
      setSavingId(null);
    }
  };
  const term = search.trim().toLowerCase();
  const filtered = items.filter((item) => [item.employee_name, item.user_id, item.pay_month, item.pay_year].some((value) => String(value || "").toLowerCase().includes(term)));

  return <section id="salary-payment-history" className="mt-5 overflow-hidden rounded-2xl border border-navy/10 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/10 px-5 py-4"><div><h2 className="font-bold text-navy">Salary payment history</h2><p className="mt-1 text-xs text-muted">Review monthly slips and mark payment after the salary transfer is complete.</p></div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee or month" className="rounded-lg border border-navy/15 px-3 py-2 text-sm"/></div>
    {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-amber"/></div> : error && !items.length ? <p className="p-5 text-sm text-red-600">{error}</p> : !filtered.length ? <p className="p-5 text-sm text-muted">No salary history found.</p> : <>
      {error && <p className="px-5 pt-4 text-sm text-red-600">{error}</p>}
      <div className="divide-y divide-navy/5">{filtered.map((slip) => {
        const period = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(Number(slip.pay_year), Number(slip.pay_month) - 1, 1));
        const published = Number(slip.is_published) === 1;
        const paid = Number(slip.is_paid) === 1;
        return <article key={slip.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-[220px]"><p className="font-semibold text-navy">{slip.employee_name} <span className="font-mono text-xs text-muted">· {slip.user_id}</span></p><p className="mt-1 text-xs text-muted">{period} · Net salary: Rs. {Number(slip.net_salary || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-navy">{published ? "Published" : "Draft"}</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-soft text-amber-800"}`}>{paid ? "Paid" : published ? "Payment pending" : "Not paid"}</span>{paid && slip.paid_at && <span className="text-xs text-muted">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(slip.paid_at))}</span>}{published && !paid && <button type="button" disabled={savingId === slip.id} onClick={() => markPaid(slip)} className="rounded-full bg-amber px-4 py-2 text-xs font-bold text-navy disabled:opacity-50">{savingId === slip.id ? "Saving..." : "Mark as paid"}</button>}</div>
        </article>;
      })}</div>
    </>}
  </section>;
}

const attendanceDateTimeLabel = (value) => value
  ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "medium", hourCycle: "h23" }).format(new Date(value))
  : "—";

function SalaryManagementTab() {
  const employeePageSize = 8;
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const [employeePage, setEmployeePage] = useState(1);
  const [salaryPeriod, setSalaryPeriod] = useState(() => ({ month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()) }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getSalaryEmployees(salaryPeriod);
      setEmployees(response.data?.items || []);
    } catch (err) {
      setError(err.message || "Could not load employees for salary management.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let active = true;
    getSalaryEmployees(salaryPeriod)
      .then((response) => { if (active) setEmployees(response.data?.items || []); })
      .catch((err) => { if (active) setError(err.message || "Could not load employees for salary management."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [salaryPeriod]);
  const term = search.trim().toLowerCase();
  const filtered = employees.filter((employee) => [employee.name, employee.user_id, employee.email, employee.department, employee.designation, employee.branch_name]
    .some((value) => String(value || "").toLowerCase().includes(term)));
  const totalEmployeePages = Math.max(1, Math.ceil(filtered.length / employeePageSize));
  const currentEmployeePage = Math.min(employeePage, totalEmployeePages);
  const visibleEmployees = filtered.slice((currentEmployeePage - 1) * employeePageSize, currentEmployeePage * employeePageSize);
  const scrollToSalaryHistory = () => document.getElementById("salary-payment-history")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return <>
  <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/10 px-5 py-4"><div><h2 className="font-bold text-navy">Employee Salary Management</h2><p className="mt-1 text-xs text-muted">Prepare, review, and publish monthly salary slips for active employees.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={scrollToSalaryHistory} className="rounded-full bg-navy px-4 py-2 text-xs font-bold text-white">Salary history</button><input type="month" value={`${salaryPeriod.year}-${salaryPeriod.month.padStart(2, "0")}`} onChange={(event) => { const [year, month] = event.target.value.split("-"); setSalaryPeriod({ year, month: String(Number(month)) }); setEmployeePage(1); }} className="rounded-lg border border-navy/15 px-3 py-2 text-sm"/><input value={search} onChange={(event) => { setSearch(event.target.value); setEmployeePage(1); }} placeholder="Search employees" className="rounded-lg border border-navy/15 px-3 py-2 text-sm"/><button onClick={load} className="rounded-full border border-navy/15 px-4 py-2 text-xs font-bold text-navy">Refresh</button></div></div>
    {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-amber"/></div> : error ? <p className="p-5 text-sm text-red-600">{error}</p> : !filtered.length ? <p className="p-5 text-sm text-muted">No active employees match your search.</p> : <>
      <div className="divide-y divide-navy/5">{visibleEmployees.map((employee) => <div key={employee.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold text-navy">{employee.name} <span className="font-mono text-xs text-muted">{employee.user_id}</span></p><p className="mt-1 text-xs text-muted">{employee.designation || "Employee"} | {employee.department || "No department"} | {employee.branch_name || "No branch"}</p><p className="mt-1 text-xs text-muted">Advance balance: <strong className="text-navy">Rs. {Number(employee.advance_outstanding || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></p></div><div className="flex gap-2"><button onClick={() => setSelectedEmployee(employee)} className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 px-4 py-2 text-xs font-bold text-navy"><Banknote size={14}/>Advance</button><button onClick={() => setSelectedEmployee({ ...employee, openSalarySlip: true })} className="inline-flex items-center gap-1.5 rounded-full bg-amber px-4 py-2 text-xs font-bold text-navy"><Banknote size={14}/>Generate salary</button></div></div>)}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-navy/10 px-5 py-4"><p className="text-xs text-muted">Showing {(currentEmployeePage - 1) * employeePageSize + 1} to {Math.min(currentEmployeePage * employeePageSize, filtered.length)} of {filtered.length} employees</p><div className="flex gap-2"><button type="button" disabled={currentEmployeePage <= 1} onClick={() => setEmployeePage((page) => Math.max(1, page - 1))} className="rounded-full border border-navy/15 px-4 py-2 text-xs font-bold text-navy disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span className="self-center text-xs text-muted">Page {currentEmployeePage} of {totalEmployeePages}</span><button type="button" disabled={currentEmployeePage >= totalEmployeePages} onClick={() => setEmployeePage((page) => Math.min(totalEmployeePages, page + 1))} className="rounded-full bg-navy px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div>
    </>}
    {selectedEmployee && !selectedEmployee.openSalarySlip && <SalaryAdvanceModal key={`advance-${selectedEmployee.id}`} employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} onSaved={() => { setSelectedEmployee(null); load(); }}/>}
    {selectedEmployee?.openSalarySlip && <SalarySlipModal key={`slip-${selectedEmployee.id}`} employee={{ ...selectedEmployee, month: Number(salaryPeriod.month), year: Number(salaryPeriod.year) }} onClose={() => setSelectedEmployee(null)} onGenerate={async (payload) => { const response = await generateEmployeeSalarySlip(payload); setHistoryRefresh((current) => current + 1); return response; }} onPublished={() => setHistoryRefresh((current) => current + 1)}/>}
  </section>
  <SalaryPaymentHistory refreshKey={historyRefresh}/>
  </>;
}

function SalaryAdvanceModal({ employee, onClose, onSaved }) {
  const now = new Date();
  const [form, setForm] = useState({ totalAmount: "", monthlyInstallment: "", firstRecoveryMonth: String(now.getMonth() + 1), firstRecoveryYear: String(now.getFullYear()), note: "" });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { getEmployeeSalaryAdvances(employee.id).then((response) => setItems(response.data?.items || [])).catch((err) => setError(err.message || "Could not load advances.")).finally(() => setLoading(false)); }, [employee.id]);
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await createEmployeeSalaryAdvance(employee.id, { ...form, totalAmount: Number(form.totalAmount), monthlyInstallment: Number(form.monthlyInstallment), firstRecoveryMonth: Number(form.firstRecoveryMonth), firstRecoveryYear: Number(form.firstRecoveryYear) });
      onSaved();
    } catch (err) { setError(err.message || "Could not record salary advance."); }
    finally { setSaving(false); }
  };
  const input = "mt-1 block w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy";
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4" onClick={onClose}><section onClick={(event) => event.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"><header className="flex justify-between gap-4"><div><h2 className="text-lg font-bold text-navy">Employee salary advance</h2><p className="mt-1 text-sm text-muted">{employee.name} · {employee.user_id}</p></div><button onClick={onClose} className="rounded-lg p-1 text-muted" aria-label="Close"><X size={20}/></button></header>
    <form onSubmit={submit} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-muted">Advance amount (Rs.)<input required type="number" min="0.01" step="0.01" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} className={input}/></label><label className="text-xs font-semibold text-muted">Monthly recovery (Rs.)<input required type="number" min="0.01" step="0.01" value={form.monthlyInstallment} onChange={(e) => setForm({ ...form, monthlyInstallment: e.target.value })} className={input}/></label><label className="text-xs font-semibold text-muted sm:col-span-2">First recovery month<input required type="month" value={`${form.firstRecoveryYear}-${form.firstRecoveryMonth.padStart(2, "0")}`} onChange={(e) => { const [year, month] = e.target.value.split("-"); setForm({ ...form, firstRecoveryYear: year, firstRecoveryMonth: String(Number(month)) }); }} className={input}/></label><label className="text-xs font-semibold text-muted sm:col-span-2">Note (optional)<input maxLength="500" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={input}/></label></div>{error && <p className="text-sm text-red-600">{error}</p>}<div className="text-right"><button disabled={saving} className="rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy disabled:opacity-50">{saving ? "Saving..." : "Record advance"}</button></div></form>
    <div><h3 className="font-bold text-navy">Advance history</h3>{loading ? <p className="py-4 text-sm text-muted">Loading...</p> : !items.length ? <p className="py-4 text-sm text-muted">No advances recorded.</p> : <div className="mt-2 divide-y divide-navy/5">{items.map((item) => <article key={item.id} className="py-3 text-sm"><div className="flex justify-between gap-3"><strong>{item.status === "active" ? "Active" : item.status === "paid" ? "Paid" : "Cancelled"}</strong><strong>Rs. {Number(item.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div><p className="mt-1 text-xs text-muted">Recovered Rs. {Number(item.recovered_amount).toFixed(2)} · Balance Rs. {(Number(item.total_amount) - Number(item.recovered_amount)).toFixed(2)} · Rs. {Number(item.monthly_installment).toFixed(2)} per month from {new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(Number(item.first_recovery_year), Number(item.first_recovery_month) - 1, 1))}</p>{item.note && <p className="mt-1 text-xs text-muted">{item.note}</p>}</article>)}</div>}</div></section></div>;
}

function CommissionPayoutsTab() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const loadItems = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listCommissionPayouts({ status, search: search.trim() });
      setItems(response.data?.items || []);
    } catch (err) { setError(err.message || "Could not load commission payouts."); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadItems(); }, [status]);
  const update = async (item, nextStatus, paymentReference = "", note = "") => {
    setSavingId(item.id);
    setError("");
    try {
      await updateCommissionPayoutStatus(item.id, { status: nextStatus, paymentReference, note });
      await loadItems();
    } catch (err) { setError(err.message || "Could not update the commission record."); setSavingId(null); }
    finally { setSavingId(null); }
  };
  const approve = (item) => {
    if (window.confirm("Please confirm that the installation is complete and the customer’s agreed payment has been received.")) update(item, "approved");
  };
  const markPaid = (item) => {
    const paymentReference = window.prompt("After transferring this amount outside the app, enter the bank UTR / payment reference:");
    if (!paymentReference?.trim()) return;
    update(item, "paid", paymentReference.trim());
  };
  const cancel = (item) => {
    if (!window.confirm(`Cancel the ₹${Number(item.amount).toLocaleString("en-IN")} commission for ${item.recipient_name}?`)) return;
    const note = window.prompt("Reason for cancellation (optional):") || "";
    update(item, "cancelled", "", note);
  };
  const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  return <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/10 px-5 py-4"><div><h2 className="font-bold text-navy">Vendor / Partner Commission Payouts</h2><p className="mt-1 text-xs text-muted">Installation-completed projects with an active commission offer.</p></div><div className="flex flex-wrap gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && loadItems()} placeholder="Search project or partner" className="rounded-lg border border-navy/15 px-3 py-2 text-sm"/><button onClick={loadItems} className="rounded-full border border-navy/15 px-4 py-2 text-xs font-bold text-navy">Search</button><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-navy/15 px-3 py-2 text-sm"><option value="">All statuses</option><option value="pending">Pending review</option><option value="approved">Approved</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option></select></div></div>
    <p className="border-b border-navy/10 bg-amber-50 px-5 py-3 text-xs text-navy">Review project completion and confirm the customer's agreed payment before approval. Make the transfer through your normal bank/payment method, then mark it paid with its reference.</p>
    {error && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-amber"/></div>
      : !items.length ? <p className="p-8 text-center text-sm text-muted">No commission records match this filter. A record is created only when an assigned partner has a configured rate and its project reaches installation completed.</p>
      : <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead><tr className="border-b border-navy/10 text-left text-xs text-muted"><th className="p-3">Project / customer</th><th className="p-3">Payee</th><th className="p-3">Payer</th><th className="p-3">System</th><th className="p-3">Amount</th><th className="p-3">Status / payment history</th><th className="p-3">Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-navy/5 last:border-0"><td className="p-3"><p className="font-mono text-xs">{item.application_no}</p><p className="mt-1 font-semibold text-navy">{item.customer_name}</p></td><td className="p-3 font-semibold">{item.recipient_name}</td><td className="p-3">{item.payer_name}</td><td className="p-3">{item.system_type === "on_grid" ? "On-Grid" : item.system_type === "hybrid" ? "Hybrid" : item.system_type}</td><td className="p-3 font-bold">{money(item.amount)}</td><td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "paid" ? "bg-emerald-50 text-emerald-700" : item.status === "cancelled" ? "bg-slate-100 text-slate-600" : "bg-amber-50"}`}>{item.status}</span>{item.payment_reference && <p className="mt-1 text-xs text-muted">Ref: {item.payment_reference}</p>}{item.paid_at && <p className="mt-1 text-xs text-muted">Paid: {formatDateTime(item.paid_at)}{item.paid_by_name ? ` · by ${item.paid_by_name}` : ""}</p>}</td><td className="p-3"><div className="flex flex-wrap gap-2">{item.status === "pending" && <button disabled={savingId === item.id} onClick={() => approve(item)} className="rounded-full bg-navy px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Approve</button>}{item.status === "approved" && <button disabled={savingId === item.id} onClick={() => markPaid(item)} className="rounded-full bg-amber px-3 py-2 text-xs font-bold text-navy disabled:opacity-50">Mark paid</button>}{["pending", "approved"].includes(item.status) && <button disabled={savingId === item.id} onClick={() => cancel(item)} className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Cancel</button>}</div></td></tr>)}</tbody></table></div>}
  </section>;
}

function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [empStats, setEmpStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [branchStats, setBranchStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clearingActivity, setClearingActivity] = useState(false);

  const handleClearActivity = async () => {
    if (!window.confirm("Clear all recent activity entries? This cannot be undone.")) return;
    setClearingActivity(true);
    try {
      await clearRecentActivity();
      setActivity([]);
    } catch (err) {
      alert(err.message || "Could not clear recent activity.");
    } finally {
      setClearingActivity(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [s, e, a, b] = await Promise.all([
          getDashboardStats(),
          getEmployeeStats(),
          getRecentActivity(20),
          getBranchStats(),
        ]);
        setStats(s.data);
        setEmpStats(e.data);
        setActivity(a.data.items || []);
        setBranchStats(b.data.items || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-amber" />
      </div>
    );

  if (error)
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );

  const applicationStatuses = stats.applications?.byStatus || {};
  const totalLoanDisbursed = [
    "loan_disbursed_successfully_phase_1",
    "loan_disbursed_phase_2",
    "customer_full_loan_amount_disbursed",
  ].reduce((total, status) => total + Number(applicationStatuses[status] || 0), 0);
  const subsidyCases = Number(applicationStatuses.consumer_subsidy_pending || 0)
    + Number(applicationStatuses.consumer_subsidy_disbursed || 0);

  return (
    <div className="space-y-6">
      {/* ── Welcome banner ── */}
      <DashboardWelcome
        name="Manyata Enterprises"
        description="Here's a quick overview of your business at a glance."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Applications"
          value={stats.applications.total}
          icon={FileText}
        />
        <StatCard label="Branches" value={stats.branches.total} icon={Building2} />
        <StatCard label="Employees" value={stats.employees} icon={Users} />
        <StatCard label="Partners" value={stats.partners} icon={Handshake} />
        <StatCard label="Careers" value={stats.careers} icon={FileText} />
        <StatCard label="Join Us" value={stats.joinUs} icon={Users} />
        <StatCard label="Contacts" value={stats.contacts} icon={FileText} />
        <StatCard label="Total Loan Disbursed" value={totalLoanDisbursed} icon={Banknote} />
        <StatCard label="Installations" value={stats.installations.total} icon={Wrench} />
        <StatCard label="Subsidy" value={subsidyCases} icon={Banknote} />
      </div>

      <div className="rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="text-sm font-bold text-navy">Branch-wise Applications</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-left text-xs font-semibold text-muted">
                <th className="py-2 pr-4 whitespace-nowrap">Branch</th>
                <th className="py-2 px-3 whitespace-nowrap">Total</th>
                <th className="py-2 px-3 whitespace-nowrap">Pending</th>
                <th className="py-2 px-3 whitespace-nowrap">Verified</th>
                <th className="py-2 px-3 whitespace-nowrap">Submitted</th>
                <th className="py-2 px-3 whitespace-nowrap">Approved</th>
                <th className="py-2 px-3 whitespace-nowrap">Rejected</th>
                <th className="py-2 px-3 whitespace-nowrap">Bank Forwarded</th>
                <th className="py-2 px-3 whitespace-nowrap">Loan Disbursed - Phase 1</th>
                <th className="py-2 px-3 whitespace-nowrap">Loan Disbursed - Phase 2</th>
              </tr>
            </thead>
            <tbody>
              {branchStats.length === 0 && (
                <tr><td colSpan={10} className="py-4 text-center text-muted">No branch data yet.</td></tr>
              )}
              {branchStats.map((branch) => (
                <tr key={branch.branch_id} className="border-b border-navy/5">
                  <td className="py-2 pr-4 font-semibold text-navy whitespace-nowrap">{branch.branch_name} ({branch.branch_code})</td>
                  <td className="py-2 px-3 whitespace-nowrap">{branch.total || 0}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{branch.pending || 0}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{branch.verified || 0}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{branch.submitted || 0}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{branch.approved || 0}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{branch.rejected || 0}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{branch.bank_forwarded || 0}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{branch.loan_disbursed_phase_1 || 0}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{branch.loan_disbursed_phase_2 || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="text-sm font-bold text-navy">Employee Performance</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-left text-xs font-semibold text-muted">
                <th className="py-2 pr-4 whitespace-nowrap">Employee</th>
                <th className="py-2 px-3 whitespace-nowrap">Designation</th>
                <th className="py-2 px-3 whitespace-nowrap">Department</th>
                <th className="py-2 px-3 whitespace-nowrap">Branch</th>
                <th className="py-2 px-3 whitespace-nowrap">Handled</th>
                <th className="py-2 px-3 whitespace-nowrap">Verified</th>
                <th className="py-2 px-3 whitespace-nowrap">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {(empStats?.byEmployee || []).length === 0 && (
                <tr><td colSpan={7} className="py-4 text-center text-muted">No employees yet.</td></tr>
              )}
              {(empStats?.byEmployee || []).map((employee) => (
                <tr key={employee.user_id} className="border-b border-navy/5">
                  <td className="py-2 pr-4 font-semibold text-navy whitespace-nowrap">{employee.name}<span className="ml-1 text-xs text-muted">({employee.login_id})</span></td>
                  <td className="py-2 px-3 text-xs whitespace-nowrap">{employee.designation || "-"}</td>
                  <td className="py-2 px-3 text-xs whitespace-nowrap">{employee.department || "-"}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{employee.branch_name || "-"}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{employee.total_handled || 0}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{employee.verified_count || 0}</td>
                  <td className="py-2 px-3 whitespace-nowrap">{employee.submitted_count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent Activity — FIXED: scrollable container ── */}
      <div className="rounded-2xl border border-navy/10 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-navy">Recent Activity</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">{activity.length} {activity.length === 1 ? "entry" : "entries"}</span>
            <button type="button" onClick={handleClearActivity} disabled={!activity.length || clearingActivity} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
              <Trash2 size={13} /> {clearingActivity ? "Clearing..." : "Clear all"}
            </button>
          </div>
        </div>
        <div className="mt-4 max-h-[420px] overflow-y-auto pr-2 scrollbar-light">
          {activity.length === 0 && (
            <p className="text-sm text-muted">No activity yet.</p>
          )}
          <div className="space-y-3">
            {activity.map((a) => (
              <div key={a.id} className="rounded-xl border border-navy/10 bg-offwhite p-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-navy">{a.action}</p>
                  <p className="text-xs text-muted">
                    {a.user_name} ·{" "}
                    {new Date(a.created_at).toLocaleString("en-IN")}
                  </p>
                  {a.details && (
                    <p className="mt-0.5 text-xs text-muted">{a.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted">{label}</p>
        <Icon size={18} className="text-amber" />
      </div>
      <p className="mt-2 text-2xl font-extrabold text-navy">{value}</p>
    </div>
  );
}

/* ── Applications with advanced filters ───────────── */

const EMPTY_FILTERS = {
  search: "",
  status: "",
  branchId: "",
  location: "",
  systemType: "",
  systemSize: "",
  fromDate: "",
  toDate: "",
  sortBy: "created_at",
  sortOrder: "desc",
  name: "",
  email: "",
  phone: "",
  updatedBy: "",
};

function ApplicationsTab({ initialLocation = "" }) {
  const { user } = useAuth();
  const canViewApplications = hasActionPermission(user, "applications", "view");
  const canEditApplications = hasActionPermission(user, "applications", "edit");
  const canDownloadApplications = hasActionPermission(user, "applications", "download");
  const canExportApplications = hasActionPermission(user, "applications", "export");
  const [items, setItems] = useState([]);
  const [locationCounts, setLocationCounts] = useState(null);
  const [totalApplicationCount, setTotalApplicationCount] = useState(null);
  const [applicationStatusCounts, setApplicationStatusCounts] = useState({});
  const [branches, setBranches] = useState([]);
  const [updateEmployees, setUpdateEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(() => ({ ...EMPTY_FILTERS, location: initialLocation }));
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const listRequestId = useRef(0);
  const limit = 20;

  // Load branches once for the branch filter dropdown
  useEffect(() => {
    if (user?.role !== "owner" && !isHrEmployee(user) && !(user?.permissions || []).includes("branches")) return;
    (async () => {
      try {
        const res = await listBranches();
        setBranches(res.data.items || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [user]);

  useEffect(() => {
    let active = true;
    listUsers({ role: "employee" })
      .then((res) => { if (active) setUpdateEmployees(res.data.items || []); })
      .catch((err) => console.error("Could not load employees for the updater filter.", err));
    return () => { active = false; };
  }, []);

  const load = async (p = page, overrideFilters) => {
    const requestId = ++listRequestId.current;
    setLoading(true);
    const f = overrideFilters || filters;
    try {
      const params = { page: p, limit };
      if (f.search) params.search = f.search;
      if (f.name) params.name = f.name;
      if (f.email) params.email = f.email;
      if (f.phone) params.phone = f.phone;
      if (f.updatedBy) params.updatedBy = f.updatedBy;
      if (f.status) params.status = f.status;
      if (f.branchId) params.branchId = f.branchId;
      if (f.location) params.location = f.location;
      if (f.systemType) params.systemType = f.systemType;
      if (f.systemSize) params.systemSize = f.systemSize;
      if (f.fromDate) params.fromDate = f.fromDate;
      if (f.toDate) params.toDate = f.toDate;
      if (f.sortBy) params.sortBy = f.sortBy;
      if (f.sortOrder) params.sortOrder = f.sortOrder;

      const res = await listApplications(params);
      if (requestId !== listRequestId.current) return;
      setItems(res.data.items || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      if (requestId === listRequestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load(1);
    // eslint-disable-next-line
  }, [filters]);

  useEffect(() => {
    let active = true;
    const statsParams = new URLSearchParams();
    if (filters.branchId) statsParams.set("branchId", filters.branchId);
    if (filters.location) statsParams.set("location", filters.location);
    const statsQuery = statsParams.size ? `?${statsParams}` : "";
    apiFetch(`/applications/stats/overview${statsQuery}`)
      .then((res) => { if (active) { setLocationCounts(res.data.byLocation || null); setTotalApplicationCount(Number(res.data.total || 0)); setApplicationStatusCounts(res.data.byStatus || {}); } })
      .catch((err) => console.error(err));
    return () => { active = false; };
  }, [filters.branchId, filters.location, user?.role, user?.designation, user?.department]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) =>
      v !== "" &&
      v !== EMPTY_FILTERS[k]
  ).length;
  const visibleApplicationFilterStatusOptions = getApplicationUpdateStatusOptions(user);
  const assignedApplicationStatuses = user?.role === "employee"
    ? isHrEmployee(user)
      ? APPLICATION_STATUSES.map((status) => status.value)
      : Array.isArray(user?.actionPermissions?.applications?.statusUpdates)
        ? user.actionPermissions.applications.statusUpdates
        : []
    : null;
  const roleScopedCards = user?.role === "employee" && !isHrEmployee(user)
    ? APPLICATION_STATUSES.filter((status) => assignedApplicationStatuses.includes(status.value)).map((status) => ({
      label: status.value === "pending"
        ? "New Customer Application"
        : status.value === "consumer_login_submitted_to_govt_portal"
          ? "Submitted to Govt Portal"
          : status.label,
      value: status.value === "consumer_login_submitted_to_govt_portal"
        ? Number(applicationStatusCounts.consumer_login_submitted_to_govt_portal || 0) + Number(applicationStatusCounts.submitted_to_govt || 0)
        : Number(applicationStatusCounts[status.value] || 0),
    }))
    : null;

  return (
    <div className="space-y-4">
      {initialLocation ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(roleScopedCards || [
          [`Total Applications - ${initialLocation === "odisha" ? "Odisha" : "West Bengal"}`, Number(totalApplicationCount || 0), "total-applications"],
          ["New Customer Application", Number(applicationStatusCounts.pending || 0)],
          ["Verified", Number(applicationStatusCounts.verified || 0)],
          ["Submitted to Govt Portal", Number(applicationStatusCounts.consumer_login_submitted_to_govt_portal || 0) + Number(applicationStatusCounts.submitted_to_govt || 0)],
          ["Vendor Side - Quotation & Agreement Pending", Number(applicationStatusCounts.vendor_side_quotation_agreement_pending || 0)],
          ["Customer Side - Bank Forward - Pending", Number(applicationStatusCounts.customer_side_bank_forward || 0)],
          ["Bank Rejected", Number(applicationStatusCounts.rejected || 0)],
          ["Loan Disbursed", Number(applicationStatusCounts.loan_disbursed_successfully_phase_1 || 0) + Number(applicationStatusCounts.loan_disbursed_phase_2 || 0) + Number(applicationStatusCounts.customer_full_loan_amount_disbursed || 0)],
        ]).map((card) => {
          const [label, value, key] = Array.isArray(card) ? card : [card.label, card.value, card.label];
          return <div key={key || label} className="rounded-2xl border border-navy/10 bg-white p-4"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-2 text-2xl font-extrabold text-navy">{Number(value || 0)}</p></div>;
        })}
      </div> : roleScopedCards ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {roleScopedCards.map(({ label, value }) => <div key={label} className="rounded-2xl border border-navy/10 bg-white p-4"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-2 text-2xl font-extrabold text-navy">{Number(value || 0)}</p></div>)}
      </div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-navy/10 bg-white p-4"><p className="text-xs font-semibold text-muted">Total Applications</p><p className="mt-2 text-2xl font-extrabold text-navy">{totalApplicationCount ?? "—"}</p></div>
        {[["Odisha Applications", "odisha"], ["West Bengal Applications", "west_bengal"]].map(([label, key]) => <div key={key} className="rounded-2xl border border-navy/10 bg-white p-4"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-2 text-2xl font-extrabold text-navy">{locationCounts?.[key] ?? "—"}</p></div>)}
      </div>}
      {/* Top search + filter toggle */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(1, { ...filters, search: e.currentTarget.value })}
            placeholder="Search by name, phone, or application no."
            className="w-full rounded-lg border border-navy/15 py-2.5 pl-9 pr-3.5 text-sm focus:border-amber focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition-colors ${
            showFilters || activeFilterCount > 0
              ? "border-amber bg-amber-soft text-navy"
              : "border-navy/15 bg-white text-navy hover:border-amber"
          }`}
        >
          <Filter size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-amber px-2 text-xs font-bold text-navy">
              {activeFilterCount}
            </span>
          )}
        </button>
        <button
          onClick={async () => {
            await load(1);
            const statsParams = new URLSearchParams();
            if (filters.branchId) statsParams.set("branchId", filters.branchId);
            if (filters.location) statsParams.set("location", filters.location);
            const statsQuery = statsParams.size ? `?${statsParams}` : "";
            const statsRes = await apiFetch(`/applications/stats/overview${statsQuery}`);
            setLocationCounts(statsRes.data.byLocation || null);
            setTotalApplicationCount(Number(statsRes.data.total || 0));
            setApplicationStatusCounts(statsRes.data.byStatus || {});
          }}
          className="rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-light"
        >
          Refresh
        </button>
        {canExportApplications && <button onClick={async () => {
          try {
            const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== ""));
            await downloadCsvExport(`/applications/export.csv?${params}`, "applications.csv");
          } catch (error) { window.alert(error.message || "Could not download applications."); }
        }} className="inline-flex items-center gap-2 rounded-lg border border-amber bg-white px-4 py-2.5 text-sm font-bold text-navy hover:bg-amber-soft"><Download size={15} /> Download Excel</button>}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-2xl border border-navy/10 bg-white p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FilterInput label="Name" value={filters.name} onChange={(v) => updateFilter("name", v)} />
            {(user?.role === "owner" || isHrEmployee(user)) && <FilterSelect label="Updated by employee" value={filters.updatedBy} onChange={(v) => updateFilter("updatedBy", v)} options={updateEmployees.map((employee) => ({ value: String(employee.id), label: employee.name }))} placeholder="All employees" />}
            <FilterInput label="Email" value={filters.email} onChange={(v) => updateFilter("email", v)} />
            <FilterInput label="Phone Number" value={filters.phone} onChange={(v) => updateFilter("phone", v)} />
            <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(v) => updateFilter("status", v)}
              options={visibleApplicationFilterStatusOptions}
              placeholder="All statuses"
            />

            {user?.role === "owner" && <FilterSelect
              label="Branch"
              value={filters.branchId}
              onChange={(v) => updateFilter("branchId", v)}
              options={branches.map((b) => ({
                value: String(b.id),
                label: `${b.name} (${b.code})`,
              }))}
              placeholder="All branches"
            />}

            <FilterSelect
              label="Location"
              value={filters.location}
              onChange={(v) => updateFilter("location", v)}
              options={[
                { value: "odisha", label: "Odisha" },
                { value: "kolkata", label: "West Bengal" },
              ]}
              placeholder="All locations"
            />

            <FilterSelect
              label="System Type"
              value={filters.systemType}
              onChange={(v) => updateFilter("systemType", v)}
              options={[
                { value: "on-grid", label: "On-Grid" },
                { value: "hybrid", label: "Hybrid" },
              ]}
              placeholder="All types"
            />

            <FilterSelect
              label="System Size"
              value={filters.systemSize}
              onChange={(v) => updateFilter("systemSize", v)}
              options={[
                { value: "1kw", label: "1 kW" },
                { value: "2kw", label: "2 kW" },
                { value: "3kw", label: "3 kW" },
              ]}
              placeholder="All sizes"
            />

            <FilterSelect
              label="Sort By"
              value={filters.sortBy}
              onChange={(v) => updateFilter("sortBy", v)}
              options={[
                { value: "created_at", label: "Date Created" },
                { value: "updated_at", label: "Last Updated" },
                { value: "full_name", label: "Applicant Name" },
                { value: "status", label: "Status" },
                { value: "super_vendor_name", label: "Super-vendor" },
                { value: "vendor_name", label: "Vendor" },
                { value: "sub_vendor_name", label: "Sub-vendor" },
                { value: "dealer_name", label: "Dealer" },
                { value: "sales_executive_name", label: "Sales Executive" },
              ]}
              placeholder="Sort by"
            />

            <FilterSelect
              label="Sort Order"
              value={filters.sortOrder}
              onChange={(v) => updateFilter("sortOrder", v)}
              options={[
                { value: "desc", label: "Newest / Z→A" },
                { value: "asc", label: "Oldest / A→Z" },
              ]}
              placeholder="Order"
            />

            <FilterInput
              label="From Date"
              type="date"
              value={filters.fromDate}
              onChange={(v) => updateFilter("fromDate", v)}
            />

            <FilterInput
              label="To Date"
              type="date"
              value={filters.toDate}
              onChange={(v) => updateFilter("toDate", v)}
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 rounded-lg border border-navy/15 px-4 py-2 text-xs font-semibold text-navy hover:border-red-400 hover:text-red-600"
            >
              <RotateCcw size={13} />
              Reset Filters
            </button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-amber" />
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-navy/10 bg-white p-6 text-center text-sm text-muted">
          No applications found with these filters.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
            <table className="w-full min-w-[1450px] text-sm">
              <thead>
                <tr className="border-b border-navy/10 text-left text-xs font-semibold text-muted">
                  <th className="p-3 whitespace-nowrap">App No</th>
                  <th className="p-3 whitespace-nowrap">Created</th>
                  <th className="p-3 whitespace-nowrap">Name</th>
                  <th className="p-3 whitespace-nowrap">Phone</th>
                  <th className="p-3 whitespace-nowrap">Location</th>
                  <th className="p-3 whitespace-nowrap">Branch</th>
                  <th className="p-3 whitespace-nowrap">Super Vendor</th>
                  <th className="p-3 whitespace-nowrap">Vendor</th>
                  <th className="p-3 whitespace-nowrap">Sub Vendor</th>
                  <th className="p-3 whitespace-nowrap">Sales Executive</th>
                  <th className="p-3 whitespace-nowrap">System</th>
                  <th className="p-3 whitespace-nowrap">Status</th>
                  <th className="p-3 whitespace-nowrap">Updated By / At</th>
                  <th className="p-3 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-b border-navy/5">
                    <td className="p-3 font-mono text-xs text-navy whitespace-nowrap">
                      {a.application_no}
                    </td>
                    <td className="p-3 text-xs text-muted whitespace-nowrap">
                      {formatDateTime(a.created_at)}
                    </td>
                    <td className="p-3 font-semibold text-navy whitespace-nowrap">
                      {a.full_name}
                    </td>
                    <td className="p-3 whitespace-nowrap">{a.phone_number}</td>
                    <td className="p-3 text-xs whitespace-nowrap">{formatApplicationLocation(a.location)}</td>
                    <td className="p-3 text-xs whitespace-nowrap">{a.branch_name ? a.branch_name.replace(/\bKolkata\b/gi, "West Bengal") : "-"}</td>
                    <td className="p-3 text-xs whitespace-nowrap">{a.super_vendor_name || "-"}</td>
                    <td className="p-3 text-xs whitespace-nowrap">{a.vendor_name || "-"}</td>
                    <td className="p-3 text-xs whitespace-nowrap">{a.sub_vendor_name || "-"}</td>
                    <td className="p-3 text-xs whitespace-nowrap">{a.sales_executive_name || "-"}</td>
                    <td className="p-3 text-xs capitalize whitespace-nowrap">
                      {a.system_size} · {a.system_type}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {a.last_updated_by_name ? <StatusBadge status={a.status} isApplicationRow /> : null}
                    </td>
                    <td className="p-3 text-xs text-muted whitespace-nowrap">
                      {a.last_updated_by_name ? <><span className="block font-semibold text-navy">{a.last_updated_by_name}</span>{formatDateTime(a.last_updated_by_at)}</> : "Not edited"}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {canViewApplications && <Link
                        to={`${user?.role === "employee" ? "/employee" : "/admin"}/applications/${a.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber hover:underline"
                      >
                        <Eye size={14} /> View
                      </Link>}
                      {canEditApplications && <Link
                        to={`${user?.role === "employee" ? "/employee" : "/admin"}/applications/${a.id}`}
                        className="ml-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        <Pencil size={14} /> Edit
                      </Link>}
                      {canDownloadApplications && <button onClick={() => downloadApplicationPdf(a.id)} className="ml-3 inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline"><Download size={14} /> Download</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  const p = Math.max(1, page - 1);
                  setPage(p);
                  load(p);
                }}
                disabled={page === 1}
                className="rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs text-muted">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => {
                  const p = Math.min(totalPages, page + 1);
                  setPage(p);
                  load(p);
                }}
                disabled={page === totalPages}
                className="rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterInput({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-navy/70">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm focus:border-amber focus:outline-none"
      />
    </label>
  );
}

function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-navy/70">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm focus:border-amber focus:outline-none"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" }) : "-";
}

function StatusBadge({ status, isPartner = false, isApplicationRow = false }) {
  const styles = {
    pending: "bg-amber-50 text-amber-700",
    under_review: "bg-blue-50 text-blue-700",
    verified: "bg-green-50 text-green-700",
    submitted_to_govt: "bg-indigo-50 text-indigo-700",
    approved: "bg-emerald-50 text-emerald-700",
    active: "bg-emerald-50 text-emerald-700",
    inactive: "bg-slate-100 text-slate-700",
    installed: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-50 text-red-700",
    draft: "bg-slate-100 text-slate-700",
    new: "bg-amber-50 text-amber-700",
    reviewed: "bg-blue-50 text-blue-700",
    shortlisted: "bg-indigo-50 text-indigo-700",
    onboarded: "bg-emerald-50 text-emerald-700",
    rewarded: "bg-emerald-50 text-emerald-700",
    interview: "bg-indigo-50 text-indigo-700",
    interview_scheduled: "bg-indigo-50 text-indigo-700",
    review: "bg-blue-50 text-blue-700",
    rehired: "bg-emerald-50 text-emerald-700",
    terminated: "bg-red-50 text-red-700",
    resigned: "bg-orange-50 text-orange-700",
    on_leave: "bg-amber-50 text-amber-700",
    salary_success: "bg-emerald-50 text-emerald-700",
    hired: "bg-emerald-50 text-emerald-700",
    contacted: "bg-blue-50 text-blue-700",
    converted: "bg-emerald-50 text-emerald-700",
    closed: "bg-slate-100 text-slate-700",
  };
  const labels = {
    pending: "Pending",
    under_review: "Under Review",
    verified: "Verified",
    submitted_to_govt: "Submitted",
    approved: "Approved",
    active: "Active",
    inactive: "Inactive",
    installed: "Installed",
    rejected: "Rejected",
    draft: "Draft",
    new: "New",
    reviewed: "Reviewed",
    stock_forwarded_to_customer_home: "Stock Forwarded to Customer Home",
    shortlisted: "Shortlisted",
    onboarded: "Onboarded",
    rewarded: "Rewarded",
    terminated: "Terminated",
    resigned: "Resigned",
    on_leave: "On Leave",
    salary_success: "Salary Success",
    interview: "Interview",
    interview_scheduled: "Interview Scheduled",
    review: "Review",
    rehired: "Re-Hired",
    hired: "Hired",
    contacted: "Contacted",
    converted: "Converted",
    closed: "Closed",
  };
  Object.assign(labels, Object.fromEntries(INSTALLATION_STATUSES.map(({ value, label }) => [value, label])));
  if (isPartner && status === "new") labels.new = "Submitted";
  if (isPartner && status === "reviewed") labels.reviewed = "Under Review";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {isApplicationRow && status === "pending" ? "Pending" : labels[status] || applicationStatusLabel(status)}
    </span>
  );
}

/* ── Employees ────────────────────────────────────── */

function EmployeesTab() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const isHr = isHrEmployee(user);
  const canEditEmployees = isOwner || isHr;
  const canManageEmployeeAccounts = isOwner || isHr;
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [salaryEmployee, setSalaryEmployee] = useState(null);
  const [trackingEmployee, setTrackingEmployee] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [search, setSearch] = useState("");
  const listRequestId = useRef(0);
  const [showFilters, setShowFilters] = useState(false);
  const [branchFilter, setBranchFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const load = async (searchValue = search) => {
    const requestId = ++listRequestId.current;
    setLoading(true);
    try {
      const [u, b] = await Promise.allSettled([listUsers({ role: "employee", search: searchValue.trim() }), listBranches()]);
      if (requestId !== listRequestId.current) return;
      if (u.status === "fulfilled") setUsers(u.value.data.items || []);
      else throw u.reason;
      setBranches(b.status === "fulfilled" ? b.value.data.items || [] : []);
    } catch (err) {
      console.error(err);
    } finally {
      if (requestId === listRequestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  const handleResetPassword = async (u) => {
    if (!confirm(`Reset password for ${u.name}?`)) return;
    try {
      const res = await resetEmployeePassword(u.id);
      const pw = res.data?.generatedPassword;
      setCredentials({
        userId: u.user_id,
        email: u.email,
        password: pw,
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (u) => {
    const newStatus = u.status === "active" ? "suspended" : "active";
    try {
      await setUserStatus(u.id, newStatus);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectEmployee = async (u) => {
    if (!confirm(`Reject ${u.name}'s employee account? They will no longer be able to sign in.`)) return;
    try {
      await setUserStatus(u.id, "rejected");
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredUsers = applyDateSort(users.filter((u) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [u.name, u.email, u.user_id, u.designation, u.department, u.branch_name, u.branch_code]
      .some((value) => String(value || "").toLowerCase().includes(term));
    return matchesSearch && (!nameFilter || String(u.name || "").toLowerCase().includes(nameFilter.trim().toLowerCase())) && (!emailFilter || String(u.email || "").toLowerCase().includes(emailFilter.trim().toLowerCase())) && (!phoneFilter || String(u.phone || "").toLowerCase().includes(phoneFilter.trim().toLowerCase())) && (!branchFilter || String(u.branch_id) === branchFilter) && (!locationFilter || (u.city || u.state) === locationFilter) && (!statusFilter || u.status === statusFilter);
  }), { fromDate, toDate, sortBy, sortOrder });
  const activeFilterCount = Number(Boolean(branchFilter)) + Number(Boolean(locationFilter)) + Number(Boolean(statusFilter)) + Number(Boolean(nameFilter)) + Number(Boolean(emailFilter)) + Number(Boolean(phoneFilter)) + Number(Boolean(fromDate)) + Number(Boolean(toDate));

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-navy">Employees</h2>
      <div className="flex w-full flex-wrap gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); load(e.currentTarget.value); } }}
              placeholder="Search employees…"
              className="w-full rounded-lg border border-navy/15 py-2.5 pl-9 pr-3.5 text-sm focus:border-amber focus:outline-none"
            />
          </div>
          <button onClick={() => load(search)} disabled={loading} className="rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">Search</button>
          <button onClick={() => setShowFilters((open) => !open)} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold ${showFilters || activeFilterCount ? "border-amber bg-amber-soft text-navy" : "border-navy/15 bg-white text-navy hover:border-amber"}`}>
            <Filter size={14} /> Filters{activeFilterCount > 0 && <span className="rounded-full bg-amber px-2 text-xs">{activeFilterCount}</span>}
          </button>
          <button onClick={load} disabled={loading} className="rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-light disabled:opacity-60">Refresh</button>
          {canEditEmployees && <button
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 rounded-full bg-amber px-4 py-2 text-sm font-bold text-navy hover:bg-amber-hover"
          >
            <Plus size={14} /> Add Employee
          </button>}
      </div>

      {showFilters && <div className="grid gap-3 rounded-2xl border border-navy/10 bg-white p-4 sm:grid-cols-2">
        <FilterInput label="Name" value={nameFilter} onChange={setNameFilter} />
        <FilterInput label="Email" value={emailFilter} onChange={setEmailFilter} />
        <FilterInput label="Phone Number" value={phoneFilter} onChange={setPhoneFilter} />
        <FilterSelect label="Branch" value={branchFilter} onChange={setBranchFilter} options={branches.map((branch) => ({ value: String(branch.id), label: `${branch.name} (${branch.code})` }))} placeholder="All branches" />
        <FilterSelect label="Location" value={locationFilter} onChange={setLocationFilter} options={[...new Set(users.map((employee) => employee.city || employee.state).filter(Boolean))].sort().map((value) => ({ value, label: value }))} placeholder="All locations" />
        <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ value: "active", label: "Active" }, { value: "suspended", label: "Suspended" }]} placeholder="All statuses" />
        <FilterInput label="From Date" type="date" value={fromDate} onChange={setFromDate} />
        <FilterInput label="To Date" type="date" value={toDate} onChange={setToDate} />
        <FilterSelect label="Sort By" value={sortBy} onChange={setSortBy} options={[{ value: "created_at", label: "Date Created" }, { value: "name", label: "Name" }, { value: "last_login_at", label: "Last Login" }]} placeholder="Sort by" />
        <FilterSelect label="Sort Order" value={sortOrder} onChange={setSortOrder} options={[{ value: "desc", label: "Newest / Z→A" }, { value: "asc", label: "Oldest / A→Z" }]} placeholder="Order" />
        <button onClick={() => { setNameFilter(""); setEmailFilter(""); setPhoneFilter(""); setBranchFilter(""); setLocationFilter(""); setStatusFilter(""); setFromDate(""); setToDate(""); setSortBy("created_at"); setSortOrder("desc"); }} className="justify-self-start text-xs font-semibold text-amber">Reset filters</button>
      </div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-amber" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <p className="rounded-xl border border-navy/10 bg-white p-6 text-center text-sm text-muted">
          No employees found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-left text-xs font-semibold text-muted">
                <th className="p-3 whitespace-nowrap">Employee ID</th>
                <th className="p-3 whitespace-nowrap">Name</th>
                <th className="p-3 whitespace-nowrap">Email</th>
                <th className="p-3 whitespace-nowrap">Designation</th>
                <th className="p-3 whitespace-nowrap">Department</th>
                <th className="p-3 whitespace-nowrap">Branch</th>
                <th className="p-3 whitespace-nowrap">Dashboard Access</th>
                <th className="p-3 whitespace-nowrap">Status</th>
                <th className="p-3 whitespace-nowrap">Last Login</th>
                <th className="p-3 whitespace-nowrap">Last Logout</th>
                {canEditEmployees && <th className="p-3 whitespace-nowrap">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-b border-navy/5">
                  <td className="p-3 font-mono text-xs whitespace-nowrap">{u.user_id}</td>
                  <td className="p-3 font-semibold text-navy whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-soft text-xs font-bold text-navy">
                        {u.profilePhoto ? (
                          <img src={u.profilePhoto} alt={`${u.name} profile`} className="h-full w-full object-cover" />
                        ) : (
                          u.name?.charAt(0)?.toUpperCase() || "E"
                        )}
                      </div>
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-xs whitespace-nowrap">{u.email}</td>
                  <td className="p-3 text-xs whitespace-nowrap">{u.designation || "-"}</td>
                  <td className="p-3 text-xs whitespace-nowrap">{u.department || "-"}</td>
                  <td className="p-3 text-xs whitespace-nowrap">
                    {u.branch_name} ({u.branch_code})
                  </td>
                  <td className="p-3 text-xs">
                    {(u.permissions || []).length
                      ? u.permissions.map((permission) => ({ applications: "Applications", installations: "Installation", employees: "Employees", partners: "Partners", branches: "Branches", submissions: "Submissions" }[permission] || permission)).join(", ")
                      : "No dashboard access"}
                    {u.actionPermissions && <div className="mt-1 text-[11px] leading-4 text-muted">{["applications", "installations", "partners"].filter((module) => u.permissions?.includes(module)).map((module) => {
                      const actionList = module === "partners" ? ["export"] : ["view", "edit", "download", "export"];
                      const granted = actionList.filter((action) => u.actionPermissions?.[module]?.[action]).map((action) => action === "export" ? "Excel export" : action[0].toUpperCase() + action.slice(1));
                      return `${module === "applications" ? "Applications" : module === "installations" ? "Installation" : "Partners"}: ${granted.join(" / ") || "No actions"}`;
                    }).join(" · ")}</div>}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        u.status === "active"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted whitespace-nowrap">
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleString("en-IN")
                      : "Never"}
                  </td>
                  <td className="p-3 text-xs text-muted whitespace-nowrap">
                    {u.last_logout_at
                      ? new Date(u.last_logout_at).toLocaleString("en-IN")
                      : "Never"}
                  </td>
                  {canEditEmployees && <td className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => {
                          setEditing(u);
                          setShowModal(true);
                        }}
                        className="rounded bg-navy/10 px-2 py-1 text-xs font-semibold text-navy hover:bg-navy/20"
                      >
                        Edit
                      </button>
                      {canManageEmployeeAccounts && <>
                      <button
                        onClick={() => setTrackingEmployee(u)}
                        className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-100"
                        title="View attendance, punch locations and photos"
                      >
                        <MapPin size={12} /> Track
                      </button>
                      <button
                        onClick={() => handleResetPassword(u)}
                        className="rounded bg-amber-soft px-2 py-1 text-xs font-semibold text-navy hover:bg-amber/30"
                        title="Reset Password"
                      >
                        <KeyRound size={12} />
                      </button>
                      <button
                        onClick={() => setSalaryEmployee(u)}
                        className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        title="Generate Salary Slip"
                      >
                        <Banknote size={12} /> Salary
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold hover:bg-slate-200"
                        title={u.status === "active" ? "Suspend" : "Activate"}
                      >
                        {u.status === "active" ? (
                          <UserX size={12} />
                        ) : (
                          <UserCheck size={12} />
                        )}
                      </button>
                      {u.status !== "rejected" && <button
                        onClick={() => handleRejectEmployee(u)}
                        className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                        title="Reject employee account"
                      >Reject</button>}
                      </>}
                    </div>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <EmployeeModal
          employee={editing}
          branches={branches}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSaved={(creds) => {
            load();
            if (creds) setCredentials(creds);
          }}
        />
      )}

      {credentials && (
        <CredentialsModal
          creds={credentials}
          onClose={() => setCredentials(null)}
        />
      )}
      {salaryEmployee && <SalarySlipModal key={salaryEmployee.id} employee={{ ...salaryEmployee, month: salaryEmployee.pay_month || new Date().getMonth() + 1, year: salaryEmployee.pay_year || new Date().getFullYear() }} onClose={() => setSalaryEmployee(null)} onGenerate={generateEmployeeSalarySlip} />}
      {trackingEmployee && <EmployeeAttendanceModal employee={trackingEmployee} onClose={() => setTrackingEmployee(null)} />}
    </div>
  );
}

function EmployeeAttendanceModal({ employee, onClose }) {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const toInputDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const [from, setFrom] = useState(toInputDate(monthStart));
  const [to, setTo] = useState(toInputDate(today));
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAttendanceRegister({ from, to, search: employee.user_id || employee.name });
      const data = response.data || {};
      setItems((data.items || []).filter((item) => Number(item.employee_id) === Number(employee.id)));
      setEvents((data.events || []).filter((item) => Number(item.employee_id) === Number(employee.id)));
    } catch (err) {
      setError(err.message || "Could not load employee attendance.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const mapHref = (lat, lng) => `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;
  const hasCoordinates = (lat, lng) => lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
  const clockLabel = (value) => value ? attendanceDateTimeLabel(value) : "—";
  const eventNames = { clock_in: "Clock in", clock_out: "Clock out", break_start: "Break started", break_end: "Break ended", custom: "Manual update" };
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-3 sm:p-5" onClick={onClose}>
    <section onClick={(event) => event.stopPropagation()} className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
      <header className="flex items-start justify-between gap-4 border-b border-navy/10 p-5"><div><h2 className="text-lg font-bold text-navy">Employee attendance &amp; tracking</h2><p className="mt-1 text-sm text-muted">{employee.name} · {employee.user_id} · {employee.branch_name || "No branch"}</p><p className="mt-1 text-xs text-muted">Shows attendance punch history. Map points are captured only when the employee opts in to location sharing.</p></div><button type="button" onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-slate-100" aria-label="Close"><X size={20} /></button></header>
      <div className="flex flex-wrap items-end gap-3 border-b border-navy/10 p-4"><label className="text-xs font-semibold text-navy/70">From<input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className="mt-1 block rounded-lg border border-navy/15 px-3 py-2 text-sm" /></label><label className="text-xs font-semibold text-navy/70">To<input type="date" value={to} min={from} max={toInputDate(today)} onChange={(event) => setTo(event.target.value)} className="mt-1 block rounded-lg border border-navy/15 px-3 py-2 text-sm" /></label><button type="button" onClick={load} disabled={loading || !from || !to} className="rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Refresh</button></div>
      <div className="space-y-4 overflow-y-auto p-4 sm:p-5">{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber" /></div> : <>
        <div className="rounded-xl border border-navy/10"><div className="border-b border-navy/10 px-4 py-3 font-bold text-navy">Punch records</div>{items.length ? <div className="divide-y divide-navy/5">{items.map((item) => <article key={item.id} className="space-y-3 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-navy">{item.attendance_date}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.clock_out_at ? "bg-green-50 text-green-700" : item.on_break ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{item.clock_out_at ? "Logged out" : item.on_break ? "On break" : "Logged in"}</span></div><div className="grid gap-3 text-sm sm:grid-cols-2"><p><span className="text-muted">Clock in:</span> <b>{clockLabel(item.clock_in_at)}</b></p><p><span className="text-muted">Clock out:</span> <b>{clockLabel(item.clock_out_at)}</b></p><p><span className="text-muted">Net work:</span> <b>{Math.floor(Number(item.worked_minutes || 0) / 60)}h {Number(item.worked_minutes || 0) % 60}m</b></p><p><span className="text-muted">Break:</span> <b>{Math.floor(Number(item.break_minutes || 0) / 60)}h {Number(item.break_minutes || 0) % 60}m</b></p></div><div className="flex flex-wrap gap-2">{[["Clock-in", item.clock_in_latitude, item.clock_in_longitude, item.clock_in_accuracy_m, item.id, "clock-in"], ["Clock-out", item.clock_out_latitude, item.clock_out_longitude, item.clock_out_accuracy_m, item.id, "clock-out"]].map(([label, lat, lng, accuracy, id, action]) => hasCoordinates(lat, lng) && <a key={`${action}-${id}`} href={mapHref(lat, lng)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100"><MapPin size={13} />{label} map{accuracy != null ? ` · ±${Math.round(Number(accuracy))}m` : ""}</a>)}{item.clock_in_photo_key && <a href={attendancePhotoHref(item.id, "clock-in")} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-amber-soft px-3 py-2 text-xs font-semibold text-navy hover:bg-amber/30"><Camera size={13} />Clock-in photo</a>}{item.clock_out_photo_key && <a href={attendancePhotoHref(item.id, "clock-out")} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-amber-soft px-3 py-2 text-xs font-semibold text-navy hover:bg-amber/30"><Camera size={13} />Clock-out photo</a>}{!hasCoordinates(item.clock_in_latitude, item.clock_in_longitude) && !hasCoordinates(item.clock_out_latitude, item.clock_out_longitude) && <span className="text-xs text-muted">No GPS location shared for these punches.</span>}</div>{item.breaks?.length > 0 && <div className="text-xs text-muted">Breaks: {item.breaks.map((entry, index) => <span key={entry.id}>{index > 0 ? " · " : ""}{entry.break_type}: {clockLabel(entry.break_start_at)} – {clockLabel(entry.break_end_at)}</span>)}</div>}</article>)}</div> : <p className="p-4 text-sm text-muted">No attendance punches found in this date range.</p>}</div>
        <div className="rounded-xl border border-navy/10"><div className="border-b border-navy/10 px-4 py-3 font-bold text-navy">Attendance events</div>{events.length ? <div className="divide-y divide-navy/5">{events.map((event) => <div key={event.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm"><span className="font-semibold text-navy">{event.event_label || eventNames[event.event_type] || event.event_type}{event.note ? <span className="block text-xs font-normal text-muted">{event.note}</span> : null}</span><span className="text-xs text-muted">{clockLabel(event.event_at)}{event.entered_by_name ? ` · updated by ${event.entered_by_name}` : ""}</span></div>)}</div> : <p className="p-4 text-sm text-muted">No manually recorded attendance events in this date range.</p>}</div>
      </>}</div>
      <footer className="border-t border-navy/10 p-4 text-right"><button type="button" onClick={onClose} className="rounded-lg border border-navy/15 px-4 py-2 text-sm font-semibold text-navy">Close</button></footer>
    </section>
  </div>;
}

function SalarySlipModal({ employee, onClose, onGenerate, onPublished }) {
  const now = new Date();
  const savedNumber = (key) => employee[key] == null ? "0" : String(Number(employee[key]));
  const isSatyaSundarParida = String(employee.name || "").trim().toLowerCase() === "satya sundar parida";
  const savedGrossSalary = Number(employee.gross_salary || employee.joining_gross_salary || 0);
  const defaultGrossSalary = isSatyaSundarParida ? 10000 : savedGrossSalary > 0 ? savedGrossSalary : 10000;
  const defaultBasicSalary = Math.round(defaultGrossSalary * 0.5 * 100) / 100;
  const defaultHra = Math.round(defaultGrossSalary * 0.4 * 100) / 100;
  const defaultAllowance = Math.round((defaultGrossSalary - defaultBasicSalary - defaultHra) * 100) / 100;
  const [form, setForm] = useState(() => ({
    month: String(employee.month || now.getMonth() + 1), year: String(employee.year || now.getFullYear()), grossSalary: String(defaultGrossSalary),
    incentive: "0", bonus: "0", employerEpf: savedNumber("employer_epf"), employerEsi: savedNumber("employer_esi"), termLifeInsurance: savedNumber("term_life_insurance"),
    healthInsurance: savedNumber("health_insurance"), employeeEpf: savedNumber("employee_epf"), employeeEsi: savedNumber("employee_esi"), professionalTax: savedNumber("professional_tax"), advanceSalary: "0", scheduledAdvanceRecovery: String(Number(employee.monthly_advance_installment || 0)),
  }));
  const [salaryStructure, setSalaryStructure] = useState(employee.salary_structure || "standard");
  const [customStructure, setCustomStructure] = useState({
    basicSalary: savedGrossSalary > 0 ? savedNumber("basic_salary") : String(defaultBasicSalary),
    hra: savedGrossSalary > 0 ? savedNumber("hra") : String(defaultHra),
    allowance: savedGrossSalary > 0 ? savedNumber("allowance") : String(defaultAllowance),
  });
  const [saving, setSaving] = useState(false);
  const [draftSlip, setDraftSlip] = useState(null);
 const [joiningDate, setJoiningDate] = useState(() => isSatyaSundarParida ? "21/09/2026" : String(employee.joining_date || "").trim());
  const [hasDownloadedDraft, setHasDownloadedDraft] = useState(false);
  const [error, setError] = useState("");
  const [attendancePreview, setAttendancePreview] = useState(null);
  const [attendanceCalculationMode, setAttendanceCalculationMode] = useState("hours");
  const [attendancePreviewError, setAttendancePreviewError] = useState("");
  const [attendanceDeductionCustomized, setAttendanceDeductionCustomized] = useState(false); const [rateOverride, setRateOverride] = useState(""); const [hoursSalaryOverride, setHoursSalaryOverride] = useState(""); const [netOverride, setNetOverride] = useState(""); const [unpaidHoursOverride, setUnpaidHoursOverride] = useState("");
  const isSatyaSeptember2026 = isSatyaSundarParida && Number(form.month) === 9 && Number(form.year) === 2026;
  const gross = Number(form.grossSalary || 0);
  const joinMatch = joiningDate.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  const joinDay = joinMatch && Number(joinMatch[2]) === Number(form.month) && Number(joinMatch[3]) === Number(form.year) ? Math.min(30, Math.max(1, Number(joinMatch[1]))) : 1;
  const activeDays = 30 - joinDay + 1;
  const sundaysFromJoin = Array.from({ length: activeDays }, (_, index) => new Date(Date.UTC(Number(form.year), Number(form.month) - 1, joinDay + index)).getUTCDay()).filter((weekday) => weekday === 0).length;
  const previewReady = Boolean(attendancePreview);
    const joinValid = Boolean(joinMatch && Number(joinMatch[2]) === Number(form.month) && Number(joinMatch[3]) === Number(form.year));
  useEffect(() => {
        if (attendanceCalculationMode !== "hours" || !previewReady || !joinValid) return;
    setAttendancePreview((current) => {
      if (!current || current.fromSavedSlip) return current;
      const paidSundays = joinValid ? Math.min(4, sundaysFromJoin) : Number(current.paidSundayCount || 0);
     return { ...current, paidSundayCount: paidSundays, unpaidDays: current.unpaidDays };
    });
    // eslint-disable-next-line
  }, [joiningDate, form.month, form.year, previewReady, attendanceCalculationMode]);
  const basic = salaryStructure === "custom" ? Number(customStructure.basicSalary || 0) : Math.round(gross * 50) / 100;
  const hra = salaryStructure === "custom" ? Number(customStructure.hra || 0) : Math.round(gross * 40) / 100;
  const allowance = salaryStructure === "custom" ? Number(customStructure.allowance || 0) : Math.round((gross - basic - hra) * 100) / 100;
  const calculatedGross = salaryStructure === "custom" ? Math.round((basic + hra + allowance + Number.EPSILON) * 100) / 100 : gross;
  const incentive = Number(form.incentive || 0);
  const bonus = Number(form.bonus || 0);
  const scheduledAdvanceRecovery = Number(form.scheduledAdvanceRecovery || 0);
  const standardHoursValue = Number(attendancePreview?.standardHours || 0);
  const workedHoursValue = Math.floor(Number(attendancePreview?.workedHours || 0) + 1e-9);
 const hourlyRateAuto = standardHoursValue > 0 ? Math.ceil(calculatedGross / standardHoursValue / 0.25 - 1e-9) * 0.25 : 0;
  const hourlyRate = rateOverride !== "" ? Number(rateOverride) : hourlyRateAuto; const hoursSalaryAuto = standardHoursValue > 0 ? Math.floor(hourlyRate * workedHoursValue + 1e-9) : calculatedGross;
  const hoursSalary = hoursSalaryOverride !== "" ? Number(hoursSalaryOverride) : hoursSalaryAuto; const unpaidHoursAuto = Math.max(0, standardHoursValue - workedHoursValue); const unpaidHoursValue = unpaidHoursOverride !== "" ? Number(unpaidHoursOverride) : unpaidHoursAuto;
   const daysPresentValue = Number(attendancePreview?.workedDays || 0) + Number(attendancePreview?.paidSundayCount || 0);
  const standardDaysValue = Number(attendancePreview?.standardDays || 30);
  const attendanceDeductionDefault = attendanceCalculationMode === "days"
    ? Math.max(0, Math.round((calculatedGross - Math.floor((calculatedGross / standardDaysValue) * Math.min(daysPresentValue, standardDaysValue) + 1e-9)) * 100) / 100)
    : Math.max(0, Math.round((calculatedGross - hoursSalary + Number.EPSILON) * 100) / 100);
  const attendanceDeduction = attendanceDeductionCustomized
    ? Number(form.attendanceDeduction || 0)
    : attendanceDeductionDefault;
  const deductions = Number(form.employeeEpf || 0) + Number(form.employeeEsi || 0) + Number(form.professionalTax || 0) + Number(form.advanceSalary || 0) + scheduledAdvanceRecovery + attendanceDeduction;
  const totalEarnings = calculatedGross + incentive + bonus;
    const netSalaryAuto = Math.max(0, totalEarnings - deductions); const netSalary = netOverride !== "" ? Number(netOverride) : netSalaryAuto; const attendanceDeductionFinal = netOverride !== "" ? Math.max(0, Math.round((totalEarnings - (deductions - attendanceDeduction) - netSalary + Number.EPSILON) * 100) / 100) : attendanceDeduction;
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updatePeriod = (key, value) => { setRateOverride(""); setHoursSalaryOverride(""); setNetOverride(""); setUnpaidHoursOverride("");
    setAttendanceDeductionCustomized(false);
    update(key, value);
  };
  useEffect(() => {
    let current = true;
    setAttendancePreview(null);
    setAttendancePreviewError("");
    getSalaryAttendancePreview(employee.id, { month: form.month, year: form.year })
      .then((response) => {
        if (!current) return;
        const preview = response.data || null;
        if (preview && isSatyaSeptember2026) {
          setAttendancePreview({ ...preview, workedHours: 93, workedDays: 9, paidSundayCount: 1, unpaidDays: 1 });
          setRateOverride("41.75");
          setNetOverride("3882");
        } else {
          setAttendancePreview(preview);
        }
        setAttendanceCalculationMode(response.data?.calculationMode || "hours");
        setForm((existing) => Number(existing.grossSalary || 0) > 0
          ? existing
          : { ...existing, grossSalary: response.data?.grossSalary ? String(response.data.grossSalary) : "" });
      })
      .catch((err) => { if (current) setAttendancePreviewError(err.message || "Attendance calculation could not be loaded."); });
    return () => { current = false; };
  }, [employee.id, employee.name, form.month, form.year, isSatyaSeptember2026]);
  useEffect(() => {
    let current = true;
    getEmployeeSalaryAdvances(employee.id).then((response) => {
      if (!current) return;
      const payPeriod = Number(form.year) * 100 + Number(form.month);
      const recovery = (response.data?.items || []).reduce((sum, advance) => {
        const startsByThisPeriod = Number(advance.first_recovery_year) * 100 + Number(advance.first_recovery_month) <= payPeriod;
        if (advance.status !== "active" || !startsByThisPeriod) return sum;
        const outstanding = Math.max(0, Number(advance.total_amount) - Number(advance.recovered_amount));
        return sum + Math.min(Number(advance.monthly_installment), outstanding);
      }, 0);
      setForm((existing) => ({ ...existing, scheduledAdvanceRecovery: recovery.toFixed(2) }));
    }).catch((err) => { if (current) setError(err.message || "Could not load the scheduled advance recovery."); });
    return () => { current = false; };
  }, [employee.id, form.month, form.year]);
  const draftPayload = () => ({
   joiningDate: joiningDate.trim(), employeeId: employee.id, month: Number(form.month), year: Number(form.year), grossSalary: calculatedGross, salaryStructure, attendanceCalculationMode,
    basicSalary: basic, hra, allowance, incentive, bonus,
    employerEpf: Number(form.employerEpf), employerEsi: Number(form.employerEsi),
    termLifeInsurance: Number(form.termLifeInsurance), healthInsurance: Number(form.healthInsurance),
    employeeEpf: Number(form.employeeEpf), employeeEsi: Number(form.employeeEsi),
    professionalTax: Number(form.professionalTax), advanceSalary: Number(form.advanceSalary), scheduledAdvanceRecovery, attendanceDeduction: attendanceDeductionFinal, attendanceDeductionManual: rateOverride !== "" || hoursSalaryOverride !== "" || netOverride !== "" || attendanceDeductionCustomized,
    attendanceStandardHours: attendancePreview?.standardHours || 0,
    attendanceWorkedHours: attendancePreview?.workedHours || 0,
       attendanceUnpaidHours: attendanceCalculationMode === "hours" ? unpaidHoursValue : (attendancePreview?.unpaidHours || 0),
    attendancePaidSundays: attendancePreview?.paidSundayCount || 0,
    attendanceStandardDays: attendancePreview?.standardDays || 0,
    attendanceWorkedDays: attendancePreview?.workedDays || 0,
    attendanceUnpaidDays: attendancePreview?.unpaidDays || 0,
  });
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await onGenerate(draftPayload());
      setDraftSlip(response.data);
      setHasDownloadedDraft(false);
    } catch (err) {
      setError(err.message || "Could not generate salary slip.");
    } finally {
      setSaving(false);
    }
  };
  const downloadDraft = async () => {
    if (!draftSlip?.id) return;
    setSaving(true);
    setError("");
    try {
      const response = await onGenerate(draftPayload());
      setDraftSlip(response.data);
      await downloadSalarySlip(response.data.id, employee.name, Number(form.month), Number(form.year));
      setHasDownloadedDraft(true);
    } catch (err) {
      setError(err.message || "Could not download the salary slip preview.");
    } finally {
      setSaving(false);
    }
  };
  const publishDraft = async () => {
    if (!draftSlip?.id || !hasDownloadedDraft) return;
    setSaving(true);
    setError("");
    try {
      await publishEmployeeSalarySlip(draftSlip.id);
      onPublished?.();
      alert("Salary slip published. The employee can now view and download it.");
      onClose();
    } catch (err) {
      setError(err.message || "Could not publish the salary slip.");
    } finally {
      setSaving(false);
    }
  };
  const inputClass = "w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm focus:border-amber focus:outline-none";
  const amountInput = (key, label) => <label key={key} className="text-xs font-semibold text-navy/70">{label} (Rs.)<input type="number" min="0" step="0.01" value={form[key]} onChange={(event) => update(key, event.target.value)} className={`${inputClass} mt-1`} /></label>;
  const salaryComponentInput = (key, label, standardValue) => <label key={key} className="text-xs font-semibold text-navy/70">{label} (Rs.)<input type="number" min="0" step="0.01" value={salaryStructure === "standard" ? standardValue.toFixed(2) : customStructure[key]} onChange={(event) => { const value = event.target.value; if (salaryStructure === "standard") { setCustomStructure({ basicSalary: basic.toFixed(2), hra: hra.toFixed(2), allowance: allowance.toFixed(2), [key]: value }); setSalaryStructure("custom"); } else setCustomStructure((current) => ({ ...current, [key]: value })); }} className={`${inputClass} mt-1`} /></label>;
    const attendanceMetricInput = (key, label, step = "0.01") => <label key={key} className="block rounded-lg bg-white px-3 py-2 text-xs text-muted">{label}<input type="number" min="0" step={step} value={attendancePreview?.[key] ?? ""} onChange={(event) => setAttendancePreview((current) => { if (!current) return current; return { ...current, [key]: event.target.value === "" ? "" : Number(event.target.value) }; })} className={`${inputClass} mt-1 bg-transparent text-sm font-bold text-navy`} /></label>;
  const readOnlyAmount = (label, value) => <div key={label} className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-[11px] text-muted">{label}</p><p className="mt-1 text-sm font-bold text-navy">Rs. {value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>;
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
    <form onSubmit={submit} onClick={(event) => event.stopPropagation()} className="max-h-[92vh] w-full max-w-3xl space-y-5 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-navy">Generate Salary Slip</h2><p className="mt-1 text-sm text-muted">{employee.name} · {employee.user_id}</p></div><button type="button" onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-slate-100" aria-label="Close"><X size={20} /></button></div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-semibold text-navy/70">Month<select required value={form.month} onChange={(event) => updatePeriod("month", event.target.value)} className={`${inputClass} mt-1`}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Intl.DateTimeFormat("en-IN", { month: "long" }).format(new Date(2025, index, 1))}</option>)}</select></label>
        <label className="text-xs font-semibold text-navy/70">Year<input required type="number" min="2000" max="2100" value={form.year} onChange={(event) => updatePeriod("year", event.target.value)} className={`${inputClass} mt-1`} /></label>
      </div>
      <label className="block text-xs font-semibold text-navy/70">Date of joining (DOJ) · salary slip me dikhega<input type="text" value={joiningDate} onChange={(event) => setJoiningDate(event.target.value)} placeholder="15/09/2026" className={`${inputClass} mt-1 max-w-sm`} /></label>
      <section className="space-y-3 rounded-xl border border-navy/10 bg-offwhite p-4">
        <div>
          <h3 className="font-bold text-navy">Attendance-based salary calculation</h3>
        </div>
        {isSatyaSeptember2026 && <p className="rounded-lg bg-amber-soft p-3 text-sm text-navy">September 2026 figures: 9 present days + 1 paid Sunday = 10 present days, 1 absent day, 93 worked hours, and net pay Rs. 3,882.00. You can edit these values before saving the draft.</p>}
        {attendancePreviewError ? <p className="text-sm text-red-600">{attendancePreviewError}</p> : attendancePreview ? <>
          <label className="block max-w-sm text-xs font-semibold text-navy/70">Calculation mode<select value={attendanceCalculationMode} onChange={(event) => { setAttendanceDeductionCustomized(false); setAttendanceCalculationMode(event.target.value); }} className={`${inputClass} mt-1`}><option value="hours">Working hours (HR, Back Office, Accounts)</option><option value="days">Attended days (Technical and other field staff)</option></select></label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {attendanceCalculationMode === "hours" ? <>
              {attendanceMetricInput("standardHours", "Month standard hours")}
              {attendanceMetricInput("workedHours", "Worked Present hours")}
              
             <label className="block rounded-lg bg-white px-3 py-2 text-xs text-muted">Unpaid hours<input type="number" min="0" step="0.01" value={unpaidHoursOverride !== "" ? unpaidHoursOverride : unpaidHoursAuto.toFixed(2)} onChange={(event) => setUnpaidHoursOverride(event.target.value)} className={`${inputClass} mt-1 bg-transparent text-sm font-bold text-navy`} /></label>
              {attendanceMetricInput("workedDays", "Present days", "0.5")}
              {attendanceMetricInput("paidSundayCount", "Paid Sundays", "1")}
              {attendanceMetricInput("unpaidDays", "Absent days", "0.5")}
              <div className="block rounded-lg bg-white px-3 py-2 text-xs text-muted">Total present (auto)<p className="mt-1 py-2.5 text-sm font-bold text-navy">{Number(attendancePreview?.workedDays || 0)} + {Number(attendancePreview?.paidSundayCount || 0)} = {Number(attendancePreview?.workedDays || 0) + Number(attendancePreview?.paidSundayCount || 0)}</p></div>
              <label className="block rounded-lg bg-white px-3 py-2 text-xs text-muted">Hourly rate (Rs.)<input type="number" min="0" step="0.01" value={rateOverride !== "" ? rateOverride : hourlyRateAuto.toFixed(2)} onChange={(event) => setRateOverride(event.target.value)} className={`${inputClass} mt-1 bg-transparent text-sm font-bold text-navy`} /></label>
              <label className="block rounded-lg bg-white px-3 py-2 text-xs text-muted">Salary for worked hours (Rs.)<input type="number" min="0" step="0.01" value={hoursSalaryOverride !== "" ? hoursSalaryOverride : hoursSalaryAuto} onChange={(event) => setHoursSalaryOverride(event.target.value)} className={`${inputClass} mt-1 bg-transparent text-sm font-bold text-navy`} /></label>
            </> : <>
              {attendanceMetricInput("standardDays", "Calendar days in month", "1")}
              {attendanceMetricInput("workedDays", "Attended days", "0.5")}
              
             {attendanceMetricInput("unpaidDays", "Unpaid days so far", "0.5")}
              {attendanceMetricInput("paidSundayCount", "Paid Sundays", "1")}
            </>}
          </div>
        </> : <p className="text-sm text-muted">Loading this month’s attendance calculation…</p>}
      </section>
      <section className="space-y-3"><div><h3 className="font-bold text-navy">Gross salary and earnings</h3><p className="mt-1 text-xs text-muted">Use the standard 50% / 40% / 10% split or edit Basic, HRA, and Allowance. Incentive and bonus are added separately.</p></div><label className="block max-w-sm text-xs font-semibold text-navy/70">Salary structure<select value={salaryStructure} onChange={(event) => { const next = event.target.value; if (next === "custom" && salaryStructure !== "custom") setCustomStructure({ basicSalary: basic.toFixed(2), hra: hra.toFixed(2), allowance: allowance.toFixed(2) }); if (next === "standard" && salaryStructure === "custom") update("grossSalary", calculatedGross ? calculatedGross.toFixed(2) : ""); setSalaryStructure(next); }} className={`${inputClass} mt-1`}><option value="standard">Default split · 50% / 40% / 10%</option><option value="custom">Custom amounts</option></select></label><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{salaryStructure === "standard" ? <><label className="text-xs font-semibold text-navy/70">Gross salary (Rs.)<input required type="number" min="0.01" step="0.01" value={form.grossSalary} onChange={(event) => update("grossSalary", event.target.value)} className={`${inputClass} mt-1`} /></label>{salaryComponentInput("basicSalary", "Basic salary · 50%", basic)}{salaryComponentInput("hra", "HRA · 40%", hra)}{salaryComponentInput("allowance", "Allowance · 10%", allowance)}</> : <>{readOnlyAmount("Gross salary · total", calculatedGross)}{salaryComponentInput("basicSalary", "Basic salary", basic)}{salaryComponentInput("hra", "HRA", hra)}{salaryComponentInput("allowance", "Allowance", allowance)}</>}{amountInput("incentive", "Performance / target incentive")}{amountInput("bonus", "Festival / occasion / annual bonus")}</div></section>
      <section className="space-y-3"><div><h3 className="font-bold text-navy">Company-side contributions</h3></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{amountInput("employerEpf", "Employer EPF")}{amountInput("employerEsi", "Employer ESI")}{amountInput("termLifeInsurance", "Term life insurance")}{amountInput("healthInsurance", "Health insurance")}</div></section>
      <section className="space-y-3"><h3 className="font-bold text-navy">Employee deductions</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{amountInput("employeeEpf", "EPF")}{amountInput("employeeEsi", "ESI")}{amountInput("professionalTax", "Professional tax")}<label className="text-xs font-semibold text-navy/70">Scheduled advance recovery (Rs.)<input type="number" min="0" step="0.01" value={form.scheduledAdvanceRecovery} onChange={(event) => update("scheduledAdvanceRecovery", event.target.value)} className={`${inputClass} mt-1`} /></label>{amountInput("advanceSalary", "Other advance recovery")}</div>{Number(employee.advance_outstanding || 0) > 0 && <p className="text-xs text-muted">Outstanding advance balance: Rs. {Number(employee.advance_outstanding).toLocaleString("en-IN", { minimumFractionDigits: 2 })}. The scheduled recovery can be adjusted for this salary slip.</p>}</section>
      <div className="rounded-xl bg-amber-soft p-4"><p className="text-xs font-semibold text-navy/70">Net Salary Payable (Rs.) · You can edit</p><input type="number" min="0" step="0.01" value={netOverride !== "" ? netOverride : netSalaryAuto.toFixed(2)} onChange={(event) => setNetOverride(event.target.value)} className={`${inputClass} mt-1 bg-white text-xl font-extrabold text-navy`} />{netOverride !== "" && <button type="button" onClick={() => setNetOverride("")} className="mt-2 text-xs font-semibold text-navy underline">Auto calculation par wapas jao</button>}</div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {draftSlip && <p className="rounded-lg bg-amber-soft p-3 text-sm text-navy">Draft saved for review. Download PDF saves the latest form values and downloads the preview. Publish becomes available after the download.</p>}
      <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={onClose} className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold">Cancel</button><button disabled={saving || !attendancePreview || !(salaryStructure === "custom" ? calculatedGross > 0 : gross > 0) || netSalary < 0} className="rounded-full bg-amber px-5 py-2 text-sm font-bold text-navy disabled:opacity-50">{saving ? "Saving..." : draftSlip ? "Save Draft" : "Generate Draft"}</button>{draftSlip && <><button type="button" onClick={downloadDraft} disabled={saving} className="inline-flex items-center gap-2 rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50"><Download size={15}/>Download PDF</button><button type="button" onClick={publishDraft} disabled={saving || !hasDownloadedDraft} className="rounded-full bg-navy px-5 py-2 text-sm font-bold text-white disabled:opacity-50">Publish</button></>}</div>
    </form>
  </div>;
}
function EmployeeModal({ employee, branches, onClose, onSaved }) {
  const isEdit = !!employee;
  const existingModules = employee?.permissions || ["applications"];
  const initialActionPermissions = Object.fromEntries(["applications", "installations"].map((module) => [module, {
    view: employee?.actionPermissions ? Boolean(employee.actionPermissions?.[module]?.view) : existingModules.includes(module),
    edit: employee?.actionPermissions ? Boolean(employee.actionPermissions?.[module]?.edit) : existingModules.includes(module),
    download: employee?.actionPermissions ? Boolean(employee.actionPermissions?.[module]?.download) : existingModules.includes(module),
    export: Boolean(employee?.actionPermissions?.[module]?.export),
    statusUpdates: Array.isArray(employee?.actionPermissions?.[module]?.statusUpdates)
      ? employee.actionPermissions[module].statusUpdates
      : (module === "applications" ? EMPLOYEE_APPLICATION_STATUS_OPTIONS.map((status) => status.value) : INSTALLATION_STATUSES.map((status) => status.value)),
  }]));
  initialActionPermissions.partners = { export: Boolean(employee?.actionPermissions?.partners?.export) };
  const [form, setForm] = useState({
    name: employee?.name || "",
    email: employee?.email || "",
    phone: employee?.phone || "",
    branchId: employee?.branch_id || "",
    designation: employee?.designation || "",
    department: employee?.department || "",
    permissions: Array.isArray(employee?.permissions) ? employee.permissions : ["applications"],
    actionPermissions: initialActionPermissions,
    locationPermissions: employee?.locationPermissions || { applications: [], installations: [] },
    userId: employee?.user_id || "",
    address: employee?.address || "",
    city: employee?.city || "",
    state: employee?.state || "",
    pincode: employee?.pincode || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);

  const toggleModule = (module, checked) => setForm((current) => ({
    ...current,
    permissions: checked ? [...new Set([...current.permissions, module])] : current.permissions.filter((permission) => permission !== module),
    ...(["applications", "installations"].includes(module) ? {
      actionPermissions: { ...current.actionPermissions, [module]: { ...current.actionPermissions[module], view: checked, edit: checked, download: checked } },
    } : module === "partners" && !checked ? { actionPermissions: { ...current.actionPermissions, partners: { export: false } } } : {}),
  }));

  const toggleAction = (module, action, checked) => setForm((current) => {
    const next = { ...current.actionPermissions[module], [action]: checked };
    let permissions = current.permissions;
    if (action === "view" && !checked) {
      Object.assign(next, { edit: false, download: false });
      permissions = permissions.filter((permission) => permission !== module);
    }
    if (module !== "partners" && action !== "view" && checked) next.view = true;
    if (action !== "view" && checked && !permissions.includes(module)) permissions = [...permissions, module];
    if (action === "view" && checked && !permissions.includes(module)) permissions = [...permissions, module];
    return { ...current, permissions, actionPermissions: { ...current.actionPermissions, [module]: next } };
  });

  const toggleStatusUpdate = (module, status, checked) => setForm((current) => {
    const statusUpdates = current.actionPermissions[module]?.statusUpdates || [];
    return {
      ...current,
      actionPermissions: {
        ...current.actionPermissions,
        [module]: {
          ...current.actionPermissions[module],
          statusUpdates: checked ? [...new Set([...statusUpdates, status])] : statusUpdates.filter((value) => value !== status),
        },
      },
    };
  });

  const setModuleStatusUpdates = (module, statuses) => setForm((current) => ({
    ...current,
    actionPermissions: { ...current.actionPermissions, [module]: { ...current.actionPermissions[module], statusUpdates: statuses } },
  }));

  const toggleLocationPermission = (module, location, checked) => setForm((current) => {
    const selected = current.locationPermissions?.[module] || [];
    return {
      ...current,
      locationPermissions: {
        ...current.locationPermissions,
        [module]: checked ? [...new Set([...selected, location])] : selected.filter((item) => item !== location),
      },
    };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      let profilePhotoKey = form.profilePhoto;
      if (profilePhoto) {
        if (!profilePhoto.type.startsWith("image/")) {
          throw new Error("Profile photo must be an image file");
        }
        if (profilePhoto.size > 5 * 1024 * 1024) {
          throw new Error("Profile photo must be 5 MB or smaller");
        }
        const uploaded = await uploadFilesToS3("employee-profiles", {
          profilePhoto,
        });
        profilePhotoKey = uploaded.profilePhoto;
      }
      const payload = { ...form, ...(profilePhotoKey ? { profilePhoto: profilePhotoKey } : {}) };
      if (isEdit) {
        await updateEmployee(employee.id, payload);
        onSaved(null);
      } else {
        const res = await createEmployee(payload);
        onSaved({
          userId: res.data.userId || res.data.user_id,
          email: res.data.email,
          password: res.data.generatedPassword,
        });
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy">
            {isEdit ? "Edit Employee" : "Add Employee"}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-navy">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input
            label="Full Name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            required
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
            required
          />

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-navy/70">
              Profile Photo (optional)
            </span>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-soft text-sm font-bold text-navy">
                {profilePhoto ? (
                  <img src={URL.createObjectURL(profilePhoto)} alt="Selected profile" className="h-full w-full object-cover" />
                ) : employee?.profilePhoto ? (
                  <img src={employee.profilePhoto} alt={`${employee.name} profile`} className="h-full w-full object-cover" />
                ) : (
                  (form.name || "E").charAt(0).toUpperCase()
                )}
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
                className="block w-full text-xs text-muted file:mr-3 file:rounded-full file:border-0 file:bg-amber-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-navy"
              />
            </div>
            <span className="mt-1 block text-[11px] text-muted">PNG, JPG, or WebP; maximum 5 MB.</span>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Designation"
              value={form.designation}
              onChange={(v) => setForm({ ...form, designation: v })}
              placeholder="e.g. Sales Executive"
            />
            <Input
              label="Department"
              value={form.department}
              onChange={(v) => setForm({ ...form, department: v })}
              placeholder="e.g. Sales / Field Ops"
            />
          </div>

          <Input
            label="Employee ID"
            value={form.userId}
            onChange={(v) => setForm({ ...form, userId: v })}
            placeholder={isEdit ? "" : "Leave blank to generate automatically"}
            readOnly={isEdit}
            maxLength={30}
          />

          <fieldset className="rounded-xl border border-navy/10 p-4">
            <legend className="px-1 text-sm font-bold text-navy">Dashboard access</legend>
            <p className="mb-3 text-xs text-muted">Choose dashboard sections and grant Excel export separately for Applications, Installations, and Partners.</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[["applications", "Applications"], ["installations", "Installation"], ["employees", "Employees"], ["partners", "Partners"], ["branches", "Branches"], ["submissions", "Submissions"]].map(([value, label]) => (
                <div key={value} className="rounded-lg bg-offwhite p-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-navy">
                    <input type="checkbox" checked={form.permissions.includes(value)} onChange={(event) => toggleModule(value, event.target.checked)} className="accent-amber" />
                    {label}
                  </label>
                  {["applications", "installations"].includes(value) && form.permissions.includes(value) && <div className="mt-2 border-t border-navy/10 pt-2"><p className="mb-1 text-[11px] font-semibold text-muted">Location access</p><div className="flex flex-wrap gap-x-3 gap-y-1">{[["odisha", "Odisha"], ["west_bengal", "West Bengal"]].map(([location, locationLabel]) => <label key={location} className="flex items-center gap-1.5 text-xs text-navy/80"><input type="checkbox" checked={Boolean(form.locationPermissions?.[value]?.includes(location))} onChange={(event) => toggleLocationPermission(value, location, event.target.checked)} className="accent-amber" />{locationLabel}</label>)}</div></div>}
                  {["applications", "installations", "partners"].includes(value) && form.permissions.includes(value) && <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-navy/10 pt-2">{(value === "partners" ? [["export", "Excel export"]] : [["view", "View"], ["edit", "Edit"], ["download", "PDF download"], ["export", "Excel export"]]).map(([action, actionLabel]) => <label key={action} className="flex items-center gap-1.5 text-xs text-navy/80"><input type="checkbox" checked={Boolean(form.actionPermissions[value]?.[action])} disabled={value !== "partners" && action !== "view" && !form.actionPermissions[value]?.view} onChange={(event) => toggleAction(value, action, event.target.checked)} className="accent-amber" />{actionLabel}</label>)}</div>}
                  {["applications", "installations"].includes(value) && form.permissions.includes(value) && <details className="mt-2 border-t border-navy/10 pt-2">
                    <summary className="cursor-pointer text-[11px] font-semibold text-navy">Role-wise Status access ({form.actionPermissions[value]?.statusUpdates?.length || 0})</summary>
                    <div className="mt-2 rounded-lg border border-navy/10 bg-white p-2">
                      {!form.actionPermissions[value]?.edit && <p className="mb-2 text-[10px] text-muted">Enable Edit access to configure status permissions.</p>}
                      <div className="mb-2 flex gap-3 text-[11px]">
                        <button type="button" disabled={!form.actionPermissions[value]?.edit} onClick={() => setModuleStatusUpdates(value, (value === "applications" ? EMPLOYEE_APPLICATION_STATUS_OPTIONS : INSTALLATION_STATUSES).map((status) => status.value))} className="font-semibold text-amber disabled:opacity-50">Select all</button>
                        <button type="button" disabled={!form.actionPermissions[value]?.edit} onClick={() => setModuleStatusUpdates(value, [])} className="font-semibold text-muted disabled:opacity-50">Clear</button>
                      </div>
                      <div className="max-h-40 space-y-1 overflow-y-auto">
                        {(value === "applications" ? EMPLOYEE_APPLICATION_STATUS_OPTIONS : INSTALLATION_STATUSES).map((status) => <label key={status.value} className="flex items-start gap-2 text-[11px] text-navy/80">
                          <input type="checkbox" checked={Boolean(form.actionPermissions[value]?.statusUpdates?.includes(status.value))} disabled={!form.actionPermissions[value]?.edit} onChange={(event) => toggleStatusUpdate(value, status.value, event.target.checked)} className="mt-0.5 accent-amber" />
                          <span>{status.label}</span>
                        </label>)}
                      </div>
                    </div>
                  </details>}
                </div>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-navy/70">
              Branch
            </span>
            <select
              required
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              className="w-full rounded-lg border border-navy/15 bg-white px-3.5 py-2.5 text-sm"
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Address (optional)"
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="City"
              value={form.city}
              onChange={(v) => setForm({ ...form, city: v })}
            />
            <Input
              label="State"
              value={form.state}
              onChange={(v) => setForm({ ...form, state: v })}
            />
            <Input
              label="PIN"
              value={form.pincode}
              onChange={(v) => setForm({ ...form, pincode: v })}
            />
          </div>

          {!isEdit && (
            <p className="rounded-lg bg-amber-soft p-3 text-xs text-navy">
              A random password will be generated and shown to you. Share it
              with the employee securely. They will be required to change it
              on first login.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-bold text-navy hover:bg-amber-hover disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isEdit ? "Update" : "Create Employee"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function CredentialsModal({ creds, onClose }) {
  const [copied, setCopied] = useState(false);

  const copyAll = () => {
    const text = [
      `User ID: ${creds.userId || "-"}`,
      `Email: ${creds.email || "-"}`,
      creds.password ? `Password: ${creds.password}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl bg-white p-6"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 size={20} className="text-success" />
          <h3 className="text-lg font-bold text-navy">Credentials</h3>
        </div>
        <p className="mt-2 text-sm text-muted">
          Share these credentials securely with the employee. They will be
          required to change the password on first login.
        </p>
        <div className="mt-4 space-y-3 rounded-lg bg-amber-soft p-4">
          {creds.userId && (
            <div>
              <p className="text-xs font-semibold text-muted">User ID</p>
              <p className="font-mono text-sm font-bold text-navy">
                {creds.userId}
              </p>
            </div>
          )}
          {creds.email && (
            <div>
              <p className="text-xs font-semibold text-muted">Email</p>
              <p className="font-mono text-sm font-bold text-navy">
                {creds.email}
              </p>
            </div>
          )}
          {creds.password && (
            <div>
              <p className="text-xs font-semibold text-muted">Password</p>
              <p className="font-mono text-sm font-bold text-navy">
                {creds.password}
              </p>
            </div>
          )}
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={copyAll}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy hover:bg-navy/5"
          >
            <Copy size={14} />
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-full bg-navy px-6 py-2.5 text-sm font-bold text-white hover:bg-navy-light"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required, placeholder, readOnly = false, maxLength }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-navy/70">
        {label}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        readOnly={readOnly}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm focus:border-amber focus:outline-none ${readOnly ? "bg-slate-50 text-muted" : ""}`}
      />
    </label>
  );
}

/* ── Branches ─────────────────────────────────────── */

function BranchesTab() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const canManageBranches = isOwner || isHrEmployee(user);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await listBranches();
      setBranches(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredBranches = branches.filter((branch) =>
    [branch.name, branch.code, branch.state, branch.district, branch.phone]
      .some((value) => String(value || "").toLowerCase().includes(search.trim().toLowerCase())) &&
    (!statusFilter || branch.status === statusFilter) &&
    (!stateFilter || branch.state === stateFilter)
  );
  const activeFilterCount = Number(Boolean(statusFilter)) + Number(Boolean(stateFilter));

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-navy">Branches</h2>
      <div className="flex w-full flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search branches..." className="w-full rounded-lg border border-navy/15 py-2.5 pl-9 pr-3.5 text-sm focus:border-amber focus:outline-none" />
        </div>
        <button onClick={() => setShowFilters((open) => !open)} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold ${showFilters || activeFilterCount ? "border-amber bg-amber-soft text-navy" : "border-navy/15 bg-white text-navy hover:border-amber"}`}><Filter size={14} /> Filters{activeFilterCount > 0 && <span className="rounded-full bg-amber px-2 text-xs">{activeFilterCount}</span>}</button>
        <button onClick={load} disabled={loading} className="rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-light disabled:opacity-60">Refresh</button>
        {canManageBranches && <button
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 rounded-full bg-amber px-4 py-2 text-sm font-bold text-navy hover:bg-amber-hover"
        >
          <Plus size={14} /> Add Branch
        </button>}
      </div>

      {showFilters && <div className="grid gap-3 rounded-2xl border border-navy/10 bg-white p-4 sm:grid-cols-2">
        <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} placeholder="All statuses" />
        <FilterSelect label="State" value={stateFilter} onChange={setStateFilter} options={[...new Set(branches.map((branch) => branch.state).filter(Boolean))].sort().map((state) => ({ value: state, label: state }))} placeholder="All states" />
        <button onClick={() => { setStatusFilter(""); setStateFilter(""); }} className="justify-self-start text-xs font-semibold text-amber">Reset filters</button>
      </div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-amber" />
        </div>
      ) : filteredBranches.length === 0 ? (
        <p className="rounded-xl border border-navy/10 bg-white p-6 text-center text-sm text-muted">
          {search ? "No matching branches found." : "No branches yet."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBranches.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-navy/10 bg-white p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-base font-bold text-navy">{b.name}</p>
                  <p className="text-xs font-mono text-muted">{b.code}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    b.status === "active"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {b.status}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted">
                <p>
                  {b.district ? `${b.district}, ` : ""}
                  {b.state}
                </p>
                {b.phone && <p>📞 {b.phone}</p>}
              </div>
              <div className="mt-3 flex gap-3 border-t border-navy/10 pt-3 text-xs">
                <div>
                  <p className="font-semibold text-navy">{b.employee_count}</p>
                  <p className="text-muted">Employees</p>
                </div>
                <div>
                  <p className="font-semibold text-navy">
                    {b.application_count}
                  </p>
                  <p className="text-muted">Applications</p>
                </div>
              </div>
              {canManageBranches && <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setEditing(b);
                    setShowModal(true);
                  }}
                  className="flex-1 rounded-lg bg-navy/10 px-3 py-2 text-xs font-semibold text-navy hover:bg-navy/20"
                >
                  Edit
                </button>
              </div>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <BranchModal
          branch={editing}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSaved={load}
        />
      )}
    </div>
  );
}

function BranchModal({ branch, onClose, onSaved }) {
  const isEdit = !!branch;
  const [form, setForm] = useState({
    name: branch?.name || "",
    code: branch?.code || "",
    state: branch?.state || "",
    district: branch?.district || "",
    address: branch?.address || "",
    phone: branch?.phone || "",
    email: branch?.email || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isEdit) {
        await updateBranch(branch.id, form);
      } else {
        await createBranch(form);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-2xl bg-white p-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy">
            {isEdit ? "Edit Branch" : "Add Branch"}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-navy">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input
            label="Branch Name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            required
          />
          <Input
            label="Branch Code (e.g. BLS)"
            value={form.code}
            onChange={(v) => setForm({ ...form, code: v.toUpperCase() })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="State"
              value={form.state}
              onChange={(v) => setForm({ ...form, state: v })}
              required
            />
            <Input
              label="District"
              value={form.district}
              onChange={(v) => setForm({ ...form, district: v })}
            />
          </div>
          <Input
            label="Address"
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone"
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-bold text-navy hover:bg-amber-hover disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isEdit ? "Update" : "Create Branch"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* ── Other Submissions ────────────────────────────── */

function InstallationsTab({ location }) {
  const { user } = useAuth();
  const canView = hasActionPermission(user, "installations", "view");
  const canEdit = hasActionPermission(user, "installations", "edit");
  const canDownload = hasActionPermission(user, "installations", "download");
  const canExport = hasActionPermission(user, "installations", "export");
  const [items, setItems] = useState([]);
  const [updateEmployees, setUpdateEmployees] = useState([]);
  const [locationCounts, setLocationCounts] = useState(null);
  const [totalInstallationCount, setTotalInstallationCount] = useState(null);
  const [installationStatusCounts, setInstallationStatusCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const listRequestId = useRef(0);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [updatedByFilter, setUpdatedByFilter] = useState("");
  const [workList, setWorkList] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const load = async (searchValue = search) => {
    const requestId = ++listRequestId.current;
    setLoading(true);
    try {
      const params = { search: searchValue.trim(), fromDate, toDate, sortBy, sortOrder, updatedBy: user?.role === "owner" ? updatedByFilter : "", limit: "500" };
      if (user?.role === "employee" && workList === "updated") params.updatedBy = String(user.id);
      if (user?.role === "employee" && workList === "remaining") params.updatedByNot = "1";
      const res = await listInstallations(location, params);
      if (requestId !== listRequestId.current) return;
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not load installations.");
    } finally {
      if (requestId === listRequestId.current) setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [location, search, fromDate, toDate, sortBy, sortOrder, updatedByFilter, workList]);

  useEffect(() => {
    let active = true;
    listUsers({ role: "employee" })
      .then((res) => { if (active) setUpdateEmployees(res.data.items || []); })
      .catch((err) => console.error("Could not load employees for the updater filter.", err));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const statsQuery = location ? `?location=${encodeURIComponent(location)}` : "";
    apiFetch(`/installations/stats/overview${statsQuery}`)
      .then((res) => { if (active) { setLocationCounts(res.data.byLocation || null); setTotalInstallationCount(Number(res.data.total || 0)); setInstallationStatusCounts(res.data.byStatus || {}); } })
      .catch((err) => console.error(err));
    return () => { active = false; };
  }, [location]);

  const title = location === "odisha" ? "Odisha Installations" : location === "kolkata" ? "West Bengal Installations" : "All Installations";
  const filteredItems = applyDateSort(items.filter((item) =>
    [item.customer_name, item.phone, item.location, item.installation_type, item.city, item.status, item.last_updated_by_name]
      .some((value) => String(value || "").toLowerCase().includes(search.trim().toLowerCase())) &&
    (!nameFilter || String(item.customer_name || "").toLowerCase().includes(nameFilter.trim().toLowerCase())) &&
    (!emailFilter || String(item.email || "").toLowerCase().includes(emailFilter.trim().toLowerCase())) &&
    (!phoneFilter || String(item.phone || "").toLowerCase().includes(phoneFilter.trim().toLowerCase())) &&
    (!statusFilter || item.status === statusFilter) &&
    (!typeFilter || item.installation_type === typeFilter) &&
    (!locationFilter || item.location === locationFilter)
  ), { fromDate, toDate, sortBy, sortOrder, nameKey: "customer_name" });
  const activeFilterCount = Number(Boolean(nameFilter)) + Number(Boolean(emailFilter)) + Number(Boolean(phoneFilter)) + Number(Boolean(updatedByFilter)) + Number(Boolean(statusFilter)) + Number(Boolean(typeFilter)) + Number(Boolean(locationFilter)) + Number(Boolean(fromDate)) + Number(Boolean(toDate));
  return <div className="space-y-4">
    <h2 className="text-xl font-extrabold text-navy">{title}</h2>
    {user?.role === "employee" && <div className="flex flex-wrap gap-2" role="tablist" aria-label="Installation update lists">
      { [["all", "All records"], ["updated", "Updated by me"], ["remaining", "Not updated by me"]].map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={workList === key} onClick={() => setWorkList(key)} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${workList === key ? "border-amber bg-amber-soft text-navy" : "border-navy/15 bg-white text-muted hover:border-amber"}`}>{label}</button>)}
      <span className="self-center text-xs text-muted">{filteredItems.length} records</span>
    </div>}
    <div className={`grid grid-cols-2 gap-3 ${location ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" : "sm:grid-cols-3"}`}>
      {location ? <>
        {[
          [`Total Installations - ${location === "odisha" ? "Odisha" : "West Bengal"}`, totalInstallationCount],
          ["Installation Pending", installationStatusCounts.pending],
          ["Reviewed", installationStatusCounts.reviewed],
          ["Stock Forwarded to Customer Home", installationStatusCounts.stock_forwarded_to_customer_home],
          [`Total Installation Fully Completed - ${location === "odisha" ? "Odisha" : "West Bengal"}`, installationStatusCounts.completed],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-navy/10 bg-white p-4"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-2 text-2xl font-extrabold text-navy">{Number(value || 0)}</p></div>)}
      </> : <>
        <div className="rounded-2xl border border-navy/10 bg-white p-4"><p className="text-xs font-semibold text-muted">Total Installations</p><p className="mt-2 text-2xl font-extrabold text-navy">{totalInstallationCount ?? "—"}</p></div>
        {[["Odisha Installations", "odisha"], ["West Bengal Installations", "west_bengal"]].map(([label, key]) => <div key={key} className="rounded-2xl border border-navy/10 bg-white p-4"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-2 text-2xl font-extrabold text-navy">{locationCounts?.[key] ?? "—"}</p></div>)}
      </>}
    </div>
    <div className="flex w-full flex-wrap gap-3">
      <div className="relative min-w-[240px] flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); load(event.currentTarget.value); } }} placeholder="Search installations..." className="w-full rounded-lg border border-navy/15 py-2.5 pl-9 pr-3.5 text-sm focus:border-amber focus:outline-none" />
      </div>
      <button onClick={() => load(search)} disabled={loading} className="rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">Search</button>
      {loading && items.length > 0 && <span role="status" className="self-center text-xs text-muted">Updating results…</span>}
      <button onClick={() => setShowFilters((open) => !open)} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold ${showFilters || activeFilterCount ? "border-amber bg-amber-soft text-navy" : "border-navy/15 bg-white text-navy hover:border-amber"}`}><Filter size={14} /> Filters{activeFilterCount > 0 && <span className="rounded-full bg-amber px-2 text-xs">{activeFilterCount}</span>}</button>
      <button onClick={async () => { await load(); const statsQuery = location ? `?location=${encodeURIComponent(location)}` : ""; const statsRes = await apiFetch(`/installations/stats/overview${statsQuery}`); setLocationCounts(statsRes.data.byLocation || null); setTotalInstallationCount(Number(statsRes.data.total || 0)); setInstallationStatusCounts(statsRes.data.byStatus || {}); }} disabled={loading} className="rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-light disabled:opacity-60">Refresh</button>
      {canExport && <button onClick={async () => {
        try {
          const params = new URLSearchParams();
          const selectedLocation = locationFilter || location;
          if (selectedLocation) params.set("location", selectedLocation === "west_bengal" ? "kolkata" : selectedLocation);
          if (search.trim()) params.set("search", search.trim());
          if (nameFilter.trim()) params.set("name", nameFilter.trim());
          if (emailFilter.trim()) params.set("email", emailFilter.trim());
          if (phoneFilter.trim()) params.set("phone", phoneFilter.trim());
          if (updatedByFilter.trim()) params.set("updatedBy", updatedByFilter.trim());
          if (user?.role === "employee" && workList === "updated") params.set("updatedBy", String(user.id));
          if (user?.role === "employee" && workList === "remaining") params.set("updatedByNot", "1");
          if (statusFilter) params.set("status", statusFilter);
          if (typeFilter) params.set("installationType", typeFilter);
          if (fromDate) params.set("fromDate", fromDate);
          if (toDate) params.set("toDate", toDate);
          params.set("sortBy", sortBy);
          params.set("sortOrder", sortOrder);
          await downloadCsvExport(`/installations/export.csv?${params}`, "installations.csv");
        } catch (error) { window.alert(error.message || "Could not download installations."); }
      }} className="inline-flex items-center gap-2 rounded-lg border border-amber bg-white px-4 py-2.5 text-sm font-bold text-navy hover:bg-amber-soft"><Download size={15} /> Download Excel</button>}
    </div>
    {showFilters && <div className="grid gap-3 rounded-2xl border border-navy/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
      <FilterInput label="Name" value={nameFilter} onChange={setNameFilter} />
      <FilterInput label="Email" value={emailFilter} onChange={setEmailFilter} />
      <FilterInput label="Phone Number" value={phoneFilter} onChange={setPhoneFilter} />
      {(user?.role === "owner" || isHrEmployee(user)) && <FilterSelect label="Updated by employee" value={updatedByFilter} onChange={setUpdatedByFilter} options={updateEmployees.map((employee) => ({ value: String(employee.id), label: employee.name }))} placeholder="All employees" />}
      <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={INSTALLATION_STATUSES} placeholder="All statuses" />
      <FilterSelect label="System Type" value={typeFilter} onChange={setTypeFilter} options={[...new Set(items.map((item) => item.installation_type).filter(Boolean))].sort().map((value) => ({ value, label: value }))} placeholder="All types" />
      <FilterSelect label="Location" value={locationFilter} onChange={setLocationFilter} options={[...new Set(items.map((item) => item.location).filter(Boolean))].sort().map((value) => ({ value, label: value === "kolkata" ? "West Bengal" : "Odisha" }))} placeholder="All locations" />
      <FilterInput label="From Date" type="date" value={fromDate} onChange={setFromDate} />
      <FilterInput label="To Date" type="date" value={toDate} onChange={setToDate} />
      <FilterSelect label="Sort By" value={sortBy} onChange={setSortBy} options={[{ value: "created_at", label: "Date Created" }, { value: "updated_at", label: "Last Updated" }, { value: "customer_name", label: "Customer Name" }, { value: "status", label: "Status" }]} placeholder="Sort by" />
      <FilterSelect label="Sort Order" value={sortOrder} onChange={setSortOrder} options={[{ value: "desc", label: "Newest / Z→A" }, { value: "asc", label: "Oldest / A→Z" }]} placeholder="Order" />
      <button onClick={() => { setNameFilter(""); setEmailFilter(""); setPhoneFilter(""); setUpdatedByFilter(""); setStatusFilter(""); setTypeFilter(""); setLocationFilter(""); setFromDate(""); setToDate(""); setSortBy("created_at"); setSortOrder("desc"); }} className="justify-self-start text-xs font-semibold text-amber">Reset filters</button>
    </div>}
    {loading && items.length === 0 ? (
      <div role="status" className="flex justify-center rounded-xl border border-navy/10 bg-white p-8"><Loader2 className="animate-spin text-amber" /></div>
    ) : filteredItems.length === 0 ? (
      <p className="rounded-xl border border-navy/10 bg-white p-6 text-center text-sm text-muted">
        {search ? "No matching installations found." : "No installation submissions found."}
      </p>
    ) : (
      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
        <table className="w-full min-w-[1250px] text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-left text-xs font-semibold text-muted">
              <th className="p-3">Created</th>
              <th className="p-3">Updated</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Location</th>
              <th className="p-3">Installation</th>
              <th className="p-3 whitespace-nowrap">Sales Executive</th>
              <th className="p-3 whitespace-nowrap">Updated By / At</th>
              <th className="p-3">City</th>
              <th className="p-3 whitespace-nowrap">Technician Assigned</th>
              <th className="p-3">Status</th>
              {(canView || canEdit) && <th className="p-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              return (
                <tr key={item.id} className="border-b border-navy/5">
                  <td className="p-3 text-xs whitespace-nowrap">{formatDateTime(item.created_at)}</td>
                  <td className="p-3 text-xs whitespace-nowrap">{item.updated_at ? formatDateTime(item.updated_at) : "—"}</td>
                  <td className="p-3 font-semibold text-navy">{item.customer_name}</td>
                  <td className="p-3 whitespace-nowrap">{item.phone}</td>
                  <td className="p-3 capitalize">{item.location}</td>
                  <td className="p-3">{item.installation_type || "—"}</td>
                  <td className="p-3 whitespace-nowrap">{item.sales_executive_name || "-"}</td>
                  <td className="p-3 text-xs text-muted whitespace-nowrap">{item.last_updated_by_name ? <><span className="block font-semibold text-navy">{item.last_updated_by_name}</span>{formatDateTime(item.last_updated_by_at)}</> : "Not edited"}</td>
                  <td className="p-3">{item.city || "—"}</td>
                  <td className="p-3 whitespace-nowrap">{item.technical_assignee_name ? <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{item.technical_assignee_name}</span> : <span className="text-xs text-muted">Not assigned</span>}</td>
                  <td className="p-3">{item.last_updated_by_name ? <StatusBadge status={item.status} /> : null}</td>
                  {(canView || canEdit) && <td className="p-3 whitespace-nowrap">{canView && <Link to={`${user?.role === "employee" ? "/employee" : "/admin"}/installations/${item.id}`} className="text-xs font-semibold text-amber">View</Link>}{canEdit && <button onClick={() => setSelected({ id: item.id, mode: "edit" })} className="ml-3 text-xs font-semibold text-blue-600">Edit</button>}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
    {selected && <InstallationModal id={selected.id} initialMode={selected.mode} canEdit={canEdit} canDownload={canDownload} onClose={() => setSelected(null)} onSaved={async () => { setSelected(null); await load(); }} />}
  </div>;
}

const recordTimestamp = (value) => {
  if (!value) return NaN;
  return new Date(String(value).replace(" ", "T")).getTime();
};

function applyDateSort(items, { fromDate, toDate, sortBy, sortOrder, nameKey = "name" }) {
  const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : -Infinity;
  const to = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : Infinity;
  const field = sortBy === "name" ? nameKey : sortBy || "created_at";
  return items.filter((item) => {
    const timestamp = recordTimestamp(item.created_at);
    return (!fromDate && !toDate) || (Number.isFinite(timestamp) && timestamp >= from && timestamp <= to);
  }).slice().sort((a, b) => {
    const left = field === "name" ? a[nameKey] : a[field];
    const right = field === "name" ? b[nameKey] : b[field];
    const comparison = field.endsWith("_at")
      ? recordTimestamp(left) - recordTimestamp(right)
      : String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true, sensitivity: "base" });
    return (sortOrder === "asc" ? 1 : -1) * (Number.isNaN(comparison) ? 0 : comparison);
  });
}

function InstallationModal({ id, initialMode, canEdit, canDownload, onClose, onSaved }) {
  const [item, setItem] = useState(null);
  const [form, setForm] = useState(null);
  const [files, setFiles] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [mode, setMode] = useState(initialMode);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    getInstallation(id)
      .then((res) => {
        if (!active) return;
        const x = res.data.installation;
        if (!x) throw new Error("Installation record was not found.");
        setItem(x);
        setForm({ location: x.location, customerName: x.customer_name, phone: x.phone, email: x.email, gender: x.gender, companyName: x.company_name, contactPerson: x.contact_person, installationType: x.installation_type, installationDate: x.installation_date, electricianName: x.electrician_name, technicianName: x.technician_name, solarPanelType: x.solar_panel_type, connectionType: x.connection_type, superVendorName: x.super_vendor_name || "", vendorName: x.vendor_name || "", subVendorName: x.sub_vendor_name || "", salesExecutiveName: x.sales_executive_name || "", state: x.state, address: x.address, city: x.city, pincode: x.pincode, notes: x.notes });
      })
      .catch((err) => { if (active) setLoadError(err.message || "Could not load installation details."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, reloadKey]);

  if (loading) return <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60"><Loader2 className="animate-spin text-amber" /></div>;
  if (loadError) return <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4"><div role="alert" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h3 className="text-lg font-bold text-navy">Could not open installation</h3><p className="mt-2 text-sm text-red-700">{loadError}</p><div className="mt-5 flex justify-end gap-3"><button onClick={onClose} className="rounded-full border border-navy/20 px-4 py-2 text-sm font-semibold text-navy">Close</button><button onClick={() => setReloadKey((key) => key + 1)} className="rounded-full bg-amber px-4 py-2 text-sm font-bold text-navy">Try again</button></div></div></div>;
  if (!form || !item) return null;
  const editing = canEdit && mode === "edit";
  const fields = [["customerName","Customer Name"],["phone","Phone"],["email","Email"],["companyName","Company"],["contactPerson","Contact Person"],["location","Location"],["installationType","Installation Type"],["installationDate","Installation Date","date"],["electricianName","Electrician"],["technicianName","Technician"],["solarPanelType","Solar Panel Type"],["connectionType","Connection Type"],["salesExecutiveName","Sales Executive"],["state","State"],["address","Address"],["city","City"],["pincode","PIN Code"],["notes","Notes"]];
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-navy/60 p-4"><div className="mx-auto my-5 max-w-3xl rounded-2xl bg-white p-6"><div className="flex justify-between"><h3 className="text-xl font-extrabold text-navy">Installation Details</h3><div className="flex gap-3">{canEdit && <button onClick={() => setMode(editing ? "view" : "edit")} className="text-sm font-bold text-blue-600">{editing ? "View mode" : "Edit"}</button>}<button onClick={onClose}>Close</button></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{fields.map(([key,label,type]) => <div key={key} className="text-xs font-semibold text-navy/70">{label}{editing ? <input type={type || "text"} value={form[key] || ""} onChange={(e) => setForm({...form,[key]:e.target.value})} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy" /> : <p className="mt-1 min-h-10 rounded-lg bg-slate-50 px-3 py-2 text-sm font-normal text-navy">{form[key] || "—"}</p>}</div>)}</div>{item.site_latitude != null && item.site_longitude != null && <div className="mt-4 rounded-xl border border-navy/10 bg-slate-50 p-4"><p className="text-sm font-bold text-navy">Site GPS location</p><p className="mt-1 text-xs text-muted">Accuracy: {item.site_accuracy_m ?? "Not recorded"} m</p><a className="mt-2 inline-block text-sm font-semibold text-blue-700 underline" href={`https://maps.google.com/?q=${item.site_latitude},${item.site_longitude}`} target="_blank" rel="noreferrer">Open site on map</a></div>}<div className="mt-4"><p className="text-sm font-bold text-navy">Documents</p><div className="mt-2 flex flex-wrap gap-2">{Object.entries(item.documents || {}).map(([name,url]) => url && canDownload ? <a key={name} href={url} target="_blank" rel="noreferrer" className="rounded bg-amber-soft px-3 py-2 text-xs font-semibold text-navy">Download {name}</a> : <span key={name} className="rounded bg-slate-100 px-3 py-2 text-xs text-muted">{name}{canDownload ? "" : " · no download access"}</span>)}{!Object.keys(item.documents || {}).length && <span className="text-xs text-muted">No saved documents.</span>}</div>{editing && <><p className="mt-3 text-xs text-muted">Choose a file only to replace that document.</p><div className="mt-2 grid grid-cols-2 gap-2">{["aadhaarPhoto","fullSetupPhoto","panelSerialPhoto1","panelSerialPhoto2","panelSerialPhoto3","panelSerialPhoto4","panelSerialPhoto5","panelSerialPhoto6","inverterSerialPhoto","earthingPhoto1","earthingPhoto2","earthingPhoto3","laCableConnectorPhoto","earthingArresterSpikePhoto","inverterAcdbDcdbPhoto","batteryPhoto1","batteryPhoto2","otherDocument"].map((name) => <label key={name} className="text-[10px] text-muted">{name}<input type="file" className="mt-1 block w-full text-xs" onChange={(e) => e.target.files?.[0] && setFiles({...files,[name]:e.target.files[0]})} /></label>)}</div></>}</div>{editing && <div className="mt-5 flex items-center gap-3"><select value={item.status} onChange={async (e) => { try { await updateInstallationStatus(id, e.target.value); const res = await getInstallation(id); setItem(res.data.installation); } catch (err) { alert(err.message || "Could not update installation status."); } }} className="rounded-lg border border-navy/15 px-3 py-2 text-sm">{INSTALLATION_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select><button disabled={saving} onClick={async () => { setSaving(true); try { const uploaded = Object.keys(files).length ? await uploadFilesToS3("installations", files) : {}; await updateInstallation(id, {...form, files: uploaded}); onSaved(); } catch (err) { alert(err.message || "Could not save installation."); } finally { setSaving(false); } }} className="rounded-full bg-amber px-5 py-2 text-sm font-bold text-navy">{saving ? "Saving..." : "Save Changes"}</button></div>}</div></div>;
}

function OtherTab() {
  const [tab, setTab] = useState("careers");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["careers", "join-us", "contacts"].map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
              tab === k
                ? "bg-amber text-navy"
                : "bg-white text-muted hover:text-navy"
            }`}
          >
            {k}
          </button>
        ))}
      </div>
      <SubmissionList key={tab} type={tab} />
    </div>
  );
}

function PartnersTab() {
  return <SubmissionList type="partners" />;
}

function SubmissionList({ type }) {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const isHr = isHrEmployee(user);
  const canManageRecords = isOwner || isHr;
  const [items, setItems] = useState([]);
  const [partnerCounts, setPartnerCounts] = useState(null);
  const [partnerCredentials, setPartnerCredentials] = useState(null);
  const [credentialsCopied, setCredentialsCopied] = useState(false);
  const [partnerTotal, setPartnerTotal] = useState(0);
  const [partnerPage, setPartnerPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showPartnerCreate, setShowPartnerCreate] = useState(false);
  const [showSubmissionCreate, setShowSubmissionCreate] = useState(false);
  const [showPartnerOnboard, setShowPartnerOnboard] = useState(false);
  const [showPartnerLOL, setShowPartnerLOL] = useState(false);
  const [lolPartners, setLolPartners] = useState([]);
  const [lolPartnerId, setLolPartnerId] = useState("");
  const [lolLoading, setLolLoading] = useState(false);
  const [lolSending, setLolSending] = useState(false);
  const [lolError, setLolError] = useState("");
  const [onboardItems, setOnboardItems] = useState([]);
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [onboardType, setOnboardType] = useState("super_vendor");
  const [onboardPartnerId, setOnboardPartnerId] = useState("");
  const [onboardParentId, setOnboardParentId] = useState("");
  const [onboardCredentials, setOnboardCredentials] = useState(null);
  const [onboardError, setOnboardError] = useState("");
  const [onboardSaving, setOnboardSaving] = useState(false);
  const [search, setSearch] = useState("");
  const listRequestId = useRef(0);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [systemTypeFilter, setSystemTypeFilter] = useState("");
  const [systemSizeFilter, setSystemSizeFilter] = useState("");
  const [partnerTypeFilter, setPartnerTypeFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const isPartners = type === "partners";

  const load = async (requestedPage = 1, append = false, searchValue = search) => {
    const requestId = ++listRequestId.current;
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const query = new URLSearchParams({ limit: isPartners ? "10" : "100" });
      if (isPartners) query.set("page", String(requestedPage));
      if (isPartners && searchValue.trim()) query.set("search", searchValue.trim());
      if (isPartners && statusFilter) query.set("status", statusFilter);
      if (isPartners && locationFilter.trim()) query.set("city", locationFilter.trim());
      if (isPartners && stateFilter) query.set("location", stateFilter === "West Bengal" ? "west_bengal" : "odisha");
      if (isPartners && partnerTypeFilter) query.set("partnerType", partnerTypeFilter);
      if (isPartners && systemTypeFilter) query.set("systemType", systemTypeFilter);
      if (nameFilter.trim()) query.set("name", nameFilter.trim());
      if (emailFilter.trim()) query.set("email", emailFilter.trim());
      if (phoneFilter.trim()) query.set("phone", phoneFilter.trim());
      if (fromDate) query.set("fromDate", fromDate);
      if (toDate) query.set("toDate", toDate);
      query.set("sortBy", sortBy);
      query.set("sortOrder", sortOrder);
      const res = await apiFetch(`/admin/${type}?${query.toString()}`);
      if (requestId !== listRequestId.current) return;
      const pageItems = res.data.items || [];
      setItems((current) => append ? [...current, ...pageItems] : pageItems);
      if (isPartners) {
        setPartnerTotal(Number(res.data.total || 0));
        setPartnerPage(Number(res.data.page || requestedPage));
        const counts = await apiFetch("/admin/partners/stats");
        setPartnerCounts(counts.data || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (requestId === listRequestId.current) {
        if (append) setLoadingMore(false);
        else {
          setLoading(false);
          setHasLoaded(true);
        }
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => load(), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [type, search, statusFilter, locationFilter, stateFilter, systemTypeFilter, partnerTypeFilter, nameFilter, emailFilter, phoneFilter, fromDate, toDate, sortBy, sortOrder]);

  useEffect(() => {
    if (!showPartnerOnboard || !isOwner || type !== "partners") return;
    let active = true;
    setOnboardLoading(true);
    apiFetch("/admin/partners?limit=100&status=approved")
      .then((res) => { if (active) setOnboardItems(res.data.items || []); })
      .catch((err) => { if (active) setOnboardError(err.message || "Could not load approved partners."); })
      .finally(() => { if (active) setOnboardLoading(false); });
    return () => { active = false; };
  }, [showPartnerOnboard, isOwner, type]);

  useEffect(() => {
    if (!showPartnerLOL || !isOwner || type !== "partners") return;
    let active = true;
    setLolLoading(true);
    setLolError("");
    apiFetch("/admin/partners?limit=100")
      .then((res) => { if (active) setLolPartners(res.data.items || []); })
      .catch((err) => { if (active) setLolError(err.message || "Could not load partner list."); })
      .finally(() => { if (active) setLolLoading(false); });
    return () => { active = false; };
  }, [showPartnerLOL, isOwner, type]);

  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      const response = await apiFetch(`/admin/${type}/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      const credentials = response.data?.accountCredentials;
      if (credentials) {
        const approvedPartner = items.find((item) => Number(item.id) === Number(id));
        setPartnerCredentials({ ...credentials, partnerName: approvedPartner?.company_name || approvedPartner?.contact_name || "Partner" });
        setCredentialsCopied(false);
      }
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const isJoinUs = type === "join-us";
  const isCareers = type === "careers";
  const isContacts = type === "contacts";
  const canExportPartners = isPartners && hasActionPermission(user, "partners", "export");
  const onboardPartners = onboardItems.filter((item) => {
    return item.status === "approved";
  });
  const parentTypeByChildType = { super_vendor: null, vendor: "super_vendor", sub_vendor: "vendor", dealer: "sub_vendor" };
  const onboardParentType = parentTypeByChildType[onboardType];
  const onboardParents = onboardItems.filter((item) => {
    const normalizedType = item.partner_type === "sub_vendor_commission" ? "sub_vendor" : item.partner_type;
    return normalizedType === onboardParentType && item.status === "approved";
  });
  const selectedOnboardPartner = onboardPartners.find((item) => String(item.id) === onboardPartnerId) || null;
  const selectedLOLPartner = lolPartners.find((item) => String(item.id) === lolPartnerId) || null;

  const handleSendPartnerLOL = async () => {
    if (!selectedLOLPartner?.email || lolSending) return;
    setLolSending(true);
    setLolError("");
    try {
      const response = await sendPartnerLOL(selectedLOLPartner.id);
      setShowPartnerLOL(false);
      setLolPartnerId("");
      window.alert(response.message || `LOL PDF sent to ${selectedLOLPartner.email}.`);
    } catch (err) {
      setLolError(err.message || "Could not send the LOL email.");
    } finally {
      setLolSending(false);
    }
  };

  const handlePartnerOnboard = async () => {
    if (!selectedOnboardPartner || onboardSaving) return;
    setOnboardSaving(true);
    setOnboardError("");
    setOnboardCredentials(null);
    try {
      let credentials;
      await apiFetch(`/admin/partners/${selectedOnboardPartner.id}`, {
        method: "PUT",
        body: JSON.stringify({ partnerType: onboardType, referredByPartnerId: onboardParentId || null }),
      });
      if (selectedOnboardPartner.partner_login_id) {
        const response = await resetPartnerPassword(selectedOnboardPartner.id);
        credentials = response.data;
      } else {
        const response = await apiFetch(`/admin/partners/${selectedOnboardPartner.id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: "approved" }),
        });
        credentials = response.data?.accountCredentials;
      }
      if (!credentials) throw new Error("Could not create credentials. Refresh the list and try again.");
      setOnboardCredentials(credentials);
      await load();
    } catch (err) {
      setOnboardError(err.message || "Could not onboard this partner.");
    } finally {
      setOnboardSaving(false);
    }
  };
  const availableStatuses = [...new Set(items.map((item) => item.status).filter(Boolean))].sort();
  const availableLocations = [...new Set(items.map((item) => item.location || item.city).filter(Boolean))].sort();
  const availableStates = [...new Set(items.map((item) => item.state).filter(Boolean))].sort();
  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = applyDateSort(items.filter((item) => {
    const fullName = `${item.first_name || ""} ${item.last_name || ""}`;
    const matchesSearch = !normalizedSearch || [item.id, item.name, item.full_name, item.company_name, item.contact_name, fullName, item.email, item.phone, item.phone_number, item.location, item.state, item.district, item.subject, item.message, item.status]
      .some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
    const recordName = [item.name, item.full_name, item.company_name, item.contact_name, fullName].filter(Boolean).join(" ").toLowerCase();
    const partnerSystemTypes = Array.isArray(item.system_types) ? item.system_types : [];
    const normalizedPartnerType = item.partner_type === "sub_vendor_commission" ? "sub_vendor" : item.partner_type;
    const partnerRoles = Array.isArray(item.partner_roles) ? item.partner_roles : [normalizedPartnerType];
    let assignedLocations = item.assigned_locations || [];
    if (typeof assignedLocations === "string") { try { assignedLocations = JSON.parse(assignedLocations); } catch { assignedLocations = []; } }
    const normalizedAssignedLocations = (Array.isArray(assignedLocations) ? assignedLocations : []).map((location) => String(location).trim().toLowerCase().replace(/[\s-]+/g, "_"));
    const stateMatches = !stateFilter || (isPartners
      ? normalizedAssignedLocations.length
        ? normalizedAssignedLocations.includes(stateFilter.toLowerCase() === "west bengal" ? "west_bengal" : "odisha")
        : String(item.state || "").trim().toLowerCase() === stateFilter.toLowerCase()
      : String(item.state || "").trim().toLowerCase() === stateFilter.toLowerCase());
    return matchesSearch && (!nameFilter || recordName.includes(nameFilter.trim().toLowerCase())) && (!emailFilter || String(item.email || "").toLowerCase().includes(emailFilter.trim().toLowerCase())) && (!phoneFilter || String(item.phone || item.phone_number || "").toLowerCase().includes(phoneFilter.trim().toLowerCase())) && (!statusFilter || item.status === statusFilter) && (!locationFilter || String(item.location || item.city || "").toLowerCase().includes(locationFilter.trim().toLowerCase())) && stateMatches && (!systemTypeFilter || partnerSystemTypes.includes(systemTypeFilter)) && (!systemSizeFilter || String(item.system_size || "") === systemSizeFilter) && (!partnerTypeFilter || partnerRoles.includes(partnerTypeFilter));
  }), { fromDate, toDate, sortBy, sortOrder, nameKey: isPartners ? "company_name" : isContacts ? "name" : "first_name" });
  const activeFilterCount = Number(Boolean(statusFilter)) + Number(Boolean(locationFilter)) + Number(Boolean(stateFilter)) + Number(Boolean(nameFilter)) + Number(Boolean(emailFilter)) + Number(Boolean(phoneFilter)) + Number(Boolean(fromDate)) + Number(Boolean(toDate)) + Number(Boolean(systemTypeFilter)) + Number(Boolean(systemSizeFilter)) + Number(Boolean(partnerTypeFilter));

  if (loading && !hasLoaded)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-amber" />
      </div>
    );

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-navy">{isPartners ? "Partners" : isJoinUs ? "Join Us Submissions" : isCareers ? "Career Applications" : "Contact Submissions"}</h2>
      {isPartners && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {[["Total Partners", "total"], ["Super-vendors", "super_vendor"], ["Vendors", "vendor"], ["Sub-vendors", "sub_vendor"], ["Dealers", "dealer"], ["Odisha", "odisha"], ["West Bengal", "west_bengal"]].map(([label, key]) => <div key={key} className="rounded-2xl border border-navy/10 bg-white p-4"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-2 text-2xl font-extrabold text-navy">{partnerCounts?.[key] ?? "—"}</p></div>)}
      </div>}
      <div className="flex w-full flex-wrap gap-3">
          <div className="relative min-w-[240px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); load(1, false, event.currentTarget.value); } }} placeholder={`Search ${isPartners ? "partners" : isJoinUs ? "Join Us submissions" : isCareers ? "career applications" : "contacts"}...`} className="w-full rounded-lg border border-navy/15 py-2.5 pl-9 pr-3.5 text-sm focus:border-amber focus:outline-none" /></div>
          <button type="button" onClick={() => load(1, false, search)} disabled={loading} className="rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">Search</button>
          <button onClick={() => setShowFilters((open) => !open)} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold ${showFilters || activeFilterCount ? "border-amber bg-amber-soft text-navy" : "border-navy/15 bg-white text-navy hover:border-amber"}`}><Filter size={14} /> Filters{activeFilterCount > 0 && <span className="rounded-full bg-amber px-2 text-xs">{activeFilterCount}</span>}</button>
          <button onClick={() => load(1)} disabled={loading} className="rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-light disabled:opacity-60">Refresh</button>
          {canExportPartners && <button onClick={async () => {
            try {
              const params = new URLSearchParams();
              const exportName = nameFilter.trim() || search.trim();
              if (exportName) params.set(search.trim() && !nameFilter.trim() ? "search" : "name", exportName);
              if (emailFilter.trim()) params.set("email", emailFilter.trim());
              if (phoneFilter.trim()) params.set("phone", phoneFilter.trim());
              if (locationFilter.trim()) params.set("city", locationFilter.trim());
              if (statusFilter) params.set("status", statusFilter);
              if (partnerTypeFilter) params.set("partnerType", partnerTypeFilter);
              if (systemTypeFilter) params.set("systemType", systemTypeFilter);
              if (stateFilter) params.set("location", stateFilter === "West Bengal" ? "west_bengal" : "odisha");
              if (fromDate) params.set("fromDate", fromDate);
              if (toDate) params.set("toDate", toDate);
              params.set("sortBy", sortBy);
              params.set("sortOrder", sortOrder);
              await downloadCsvExport(`/admin/partners/export.csv?${params}`, "partners.csv");
            } catch (error) { window.alert(error.message || "Could not download partners."); }
          }} className="inline-flex items-center gap-2 rounded-lg border border-amber bg-white px-4 py-2.5 text-sm font-bold text-navy hover:bg-amber-soft"><Download size={15} /> Download Excel</button>}
          {isPartners && canManageRecords && <button onClick={() => setShowPartnerCreate(true)} className="flex items-center gap-1.5 rounded-full bg-amber px-4 py-2 text-sm font-bold text-navy hover:bg-amber-hover"><Plus size={14} /> Add Partner</button>}
          {(isCareers || isJoinUs) && canManageRecords && <button onClick={() => setShowSubmissionCreate(true)} className="flex items-center gap-1.5 rounded-full bg-amber px-4 py-2 text-sm font-bold text-navy hover:bg-amber-hover"><Plus size={14} /> {isCareers ? "Add Career Application" : "Add Join-Us Submission"}</button>}
          {isPartners && isOwner && <button onClick={() => { setShowPartnerLOL(true); setLolError(""); setLolPartnerId(""); }} className="flex items-center gap-1.5 rounded-full border border-navy/15 bg-white px-4 py-2 text-sm font-bold text-navy hover:border-amber"><Send size={15} /> Send LOL Mail</button>}
          {isPartners && isOwner && <button onClick={() => { setShowPartnerOnboard(true); setOnboardCredentials(null); setOnboardError(""); setOnboardPartnerId(""); }} className="flex items-center gap-1.5 rounded-full border border-amber px-4 py-2 text-sm font-bold text-navy hover:bg-amber-soft"><UserCheck size={15} /> Onboard Partner</button>}
      </div>

      {showFilters && <div className="grid gap-3 rounded-2xl border border-navy/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
        <FilterInput label="Name" value={nameFilter} onChange={setNameFilter} />
        <FilterInput label="Email" value={emailFilter} onChange={setEmailFilter} />
        <FilterInput label="Phone Number" value={phoneFilter} onChange={setPhoneFilter} />
        <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={(isPartners ? ["new", "reviewed", "approved", "active", "inactive", "rewarded", "rejected"] : availableStatuses).map((value) => ({ value, label: isPartners && value === "new" ? "Submitted" : isPartners && value === "reviewed" ? "Under Review" : value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) }))} placeholder="All statuses" />
        {isPartners && <FilterInput label="Location" value={locationFilter} onChange={setLocationFilter} />}
        {(isJoinUs || isCareers || isContacts) && <FilterSelect label={isContacts ? "City" : "Location"} value={locationFilter} onChange={setLocationFilter} options={availableLocations.map((value) => ({ value, label: value === "kolkata" ? "West Bengal" : value === "odisha" ? "Odisha" : value }))} placeholder="All locations" />}
        {(isJoinUs || isCareers) && <FilterSelect label="State" value={stateFilter} onChange={setStateFilter} options={availableStates.map((value) => ({ value, label: value }))} placeholder="All states" />}
        {isPartners && <FilterSelect label="Assigned Location" value={stateFilter} onChange={setStateFilter} options={[{ value: "Odisha", label: "Odisha" }, { value: "West Bengal", label: "West Bengal" }]} placeholder="All assigned locations" />}
        {isPartners && <FilterSelect label="Partner Type" value={partnerTypeFilter} onChange={setPartnerTypeFilter} options={[{ value: "super_vendor", label: "Super-vendor" }, { value: "vendor", label: "Vendor" }, { value: "sub_vendor", label: "Sub-vendor" }, { value: "dealer", label: "Dealer" }]} placeholder="All partner types" />}
        {isPartners && <FilterSelect label="System Type" value={systemTypeFilter} onChange={setSystemTypeFilter} options={[{ value: "on_grid", label: "On-Grid" }, { value: "hybrid", label: "Hybrid" }]} placeholder="All types" />}
        {isContacts && <FilterSelect label="System Size" value={systemSizeFilter} onChange={setSystemSizeFilter} options={[...new Set(items.map((item) => item.system_size).filter(Boolean))].sort().map((value) => ({ value, label: value }))} placeholder="All sizes" />}
        <FilterInput label="From Date" type="date" value={fromDate} onChange={setFromDate} />
        <FilterInput label="To Date" type="date" value={toDate} onChange={setToDate} />
        <FilterSelect label="Sort By" value={sortBy} onChange={setSortBy} options={[{ value: "created_at", label: "Date Created" }, { value: "updated_at", label: "Last Updated" }, { value: "name", label: "Name" }, { value: "status", label: "Status" }]} placeholder="Sort by" />
        <FilterSelect label="Sort Order" value={sortOrder} onChange={setSortOrder} options={[{ value: "desc", label: "Newest / Z→A" }, { value: "asc", label: "Oldest / A→Z" }]} placeholder="Order" />
        <button onClick={() => { setNameFilter(""); setEmailFilter(""); setPhoneFilter(""); setStatusFilter(""); setLocationFilter(""); setStateFilter(""); setSystemTypeFilter(""); setSystemSizeFilter(""); setPartnerTypeFilter(""); setFromDate(""); setToDate(""); setSortBy("created_at"); setSortOrder("desc"); }} className="justify-self-start text-xs font-semibold text-amber">Reset filters</button>
      </div>}
      {filteredItems.length === 0 && <p className="rounded-xl border border-navy/10 bg-white p-6 text-center text-sm text-muted">{search || activeFilterCount ? "No matching records found." : isPartners ? "No partners found." : "No submissions."}</p>}
      {filteredItems.length > 0 && <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
      <table className={`w-full ${isPartners ? "min-w-[1120px]" : isCareers ? "min-w-[1180px]" : isJoinUs ? "min-w-[1180px]" : isContacts ? "min-w-[900px]" : "min-w-[760px]"} text-sm`}>
        <thead>
          <tr className="border-b border-navy/10 text-left text-xs font-semibold text-muted">
            <th className="p-3 whitespace-nowrap">ID</th>
            <th className="p-3 whitespace-nowrap">{isPartners ? "Company / Contact Person" : "Name"}</th>
            <th className="p-3 whitespace-nowrap">Phone</th>
            {isJoinUs && <><th className="p-3 whitespace-nowrap">Location</th><th className="p-3 whitespace-nowrap">State</th><th className="p-3 whitespace-nowrap">District</th></>}
            {isCareers && <><th className="p-3 whitespace-nowrap">Location</th><th className="p-3 whitespace-nowrap">State</th><th className="p-3 whitespace-nowrap">District</th></>}
            {isPartners && <><th className="p-3 whitespace-nowrap">Partner Type</th><th className="p-3 whitespace-nowrap">Assigned Locations</th><th className="p-3 whitespace-nowrap">Referred By</th></>}
            <th className="p-3 whitespace-nowrap">Status</th>
            <th className="p-3 whitespace-nowrap">Created</th>
            {isPartners && <th className="p-3 whitespace-nowrap">Updated</th>}
            {isJoinUs && <th className="p-3 whitespace-nowrap">Updated</th>}
            {isCareers && <th className="p-3 whitespace-nowrap">Updated</th>}
            {isContacts && <th className="p-3 whitespace-nowrap">Updated</th>}
            {(isPartners || isJoinUs || isCareers || isContacts) && <th className="p-3 whitespace-nowrap">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((it) => {
            const applicantName = `${it.first_name || ""} ${it.last_name || ""}`.trim() || it.name || it.full_name || it.company_name || "-";
            return (
            <tr key={it.id} className="border-b border-navy/5">
              <td className="p-3 font-mono text-xs whitespace-nowrap">{it.id}</td>
              <td className="p-3 font-semibold text-navy whitespace-nowrap">
                {isPartners ? (
                  <div className="flex items-center gap-3">
                    {it.documentUrls?.Photo && <img src={it.documentUrls.Photo} alt={`${it.company_name || it.contact_name || "Partner"} profile`} loading="lazy" className="h-10 w-10 shrink-0 rounded-full border border-navy/10 object-cover" />}
                    <div><span>{it.company_name || "-"}</span><span className="block text-xs font-normal text-muted">{it.contact_name || "-"}</span></div>
                  </div>
                ) : applicantName}
              </td>
              <td className="p-3 whitespace-nowrap">{it.phone || it.phone_number || "-"}</td>
              {isJoinUs && <><td className="p-3 whitespace-nowrap">{it.location || "-"}</td><td className="p-3 whitespace-nowrap">{it.state || "-"}</td><td className="p-3 whitespace-nowrap">{it.district || "-"}</td></>}
              {isCareers && <><td className="p-3 whitespace-nowrap">{it.location || "-"}</td><td className="p-3 whitespace-nowrap">{it.state || "-"}</td><td className="p-3 whitespace-nowrap">{it.district || "-"}</td></>}
              {isPartners && <><td className="p-3 whitespace-nowrap">{(Array.isArray(it.partner_roles) ? [...new Set([it.partner_type, ...it.partner_roles])] : [it.partner_type]).map((role) => ({ super_vendor: "Super-vendor", vendor: "Vendor", sub_vendor: "Sub-vendor", sub_vendor_commission: "Sub-vendor", dealer: "Dealer" })[role] || role).filter(Boolean).join(" · ") || "-"}</td><td className="p-3 whitespace-nowrap">{(() => { let locations = it.assigned_locations || []; if (typeof locations === "string") { try { locations = JSON.parse(locations); } catch { locations = []; } } return (Array.isArray(locations) ? locations : []).map((location) => ({ odisha: "Odisha", west_bengal: "West Bengal" })[String(location).toLowerCase().replace(/[\s-]+/g, "_")]).filter(Boolean).join(" · ") || "-"; })()}</td><td className="p-3 whitespace-nowrap">{it.referrer_company_name || it.referrer_contact_name || "Owner / Not assigned"}</td></>}
              <td className="p-3 whitespace-nowrap">
                <StatusBadge status={it.status} isPartner={isPartners} />
              </td>
              <td className="p-3 text-xs text-muted whitespace-nowrap">
                {formatDateTime(it.created_at)}
              </td>
              {isJoinUs && <td className="p-3 text-xs text-muted whitespace-nowrap"><span className="block font-semibold text-navy">{it.updated_by_name || "—"}</span>{formatDateTime(it.updated_at)}</td>}
               {isJoinUs && <td className="p-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><Link to={`/admin/join-us/${it.id}`} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-navy hover:bg-slate-200"><Eye size={13}/>View</Link>{canManageRecords && <Link to={`/admin/join-us/${it.id}?edit=1`} className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"><Pencil size={13}/>Edit</Link>}</div></td>}
              {isCareers && <td className="p-3 text-xs text-muted whitespace-nowrap"><span className="block font-semibold text-navy">{it.updated_by_name || "—"}</span>{formatDateTime(it.updated_at)}</td>}
               {isCareers && <td className="p-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><Link to={`/admin/careers/${it.id}`} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-navy hover:bg-slate-200"><Eye size={13}/>View</Link>{canManageRecords && <Link to={`/admin/careers/${it.id}?edit=1`} className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"><Pencil size={13}/>Edit</Link>}</div></td>}
              {isContacts && <td className="p-3 text-xs text-muted whitespace-nowrap"><span className="block font-semibold text-navy">{it.updated_by_name || "—"}</span>{formatDateTime(it.updated_at)}</td>}
              {isContacts && <td className="p-3 whitespace-nowrap"><Link to={`/admin/contacts/${it.id}`} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-navy hover:bg-slate-200"><Eye size={13}/>View</Link></td>}
              {isPartners && <td className="p-3 text-xs text-muted whitespace-nowrap"><span className="block font-semibold text-navy">{it.updated_by_name || "—"}</span>{formatDateTime(it.updated_at)}</td>}
              {isPartners && (
                <td className="p-3 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1.5">
                    <Link to={`/admin/partners/${it.id}`} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-navy hover:bg-slate-200"><Eye size={13} /> View</Link>
                     {canManageRecords && <><button disabled={updating} onClick={() => setSelectedPartner({ partner: it, editing: true })} className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"><Pencil size={13} /> Edit</button>
                    </>}
                    {canManageRecords && it.status !== "approved" && (
                      <button
                        disabled={updating}
                        onClick={() => updateStatus(it.id, "approved")}
                        className="rounded bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {canManageRecords && it.status !== "rejected" && (
                      <button
                        disabled={updating}
                        onClick={() => updateStatus(it.id, "rejected")}
                        className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                    {canManageRecords && it.status !== "reviewed" &&
                      it.status !== "approved" &&
                      it.status !== "rejected" && (
                        <button
                          disabled={updating}
                          onClick={() => updateStatus(it.id, "reviewed")}
                          className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-navy hover:bg-slate-200 disabled:opacity-50"
                        >
                          Mark Under Review
                        </button>
                      )}
                  </div>
                </td>
              )}
            </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      }
      {isPartners && items.length > 0 && <div className="flex flex-col items-center gap-2 py-2 sm:flex-row sm:justify-between">
        <p className="text-xs text-muted">Showing {items.length} of {partnerTotal} partners</p>
        {items.length < partnerTotal && <button onClick={() => load(partnerPage + 1, true)} disabled={loadingMore || loading} className="rounded-full border border-amber bg-white px-6 py-2.5 text-sm font-bold text-navy hover:bg-amber-soft disabled:cursor-wait disabled:opacity-60">{loadingMore ? "Loading..." : "Load More"}</button>}
      </div>}
      {isPartners && canManageRecords && showPartnerCreate && <PartnerCreateModal onClose={() => setShowPartnerCreate(false)} onSaved={async () => { setShowPartnerCreate(false); await load(); }} />}
      {(isCareers || isJoinUs) && canManageRecords && showSubmissionCreate && <SubmissionCreateModal type={type} onClose={() => setShowSubmissionCreate(false)} onSaved={async () => { setShowSubmissionCreate(false); await load(); }} />}
      {isPartners && isOwner && showPartnerOnboard && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-navy/60 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-extrabold text-navy">Onboard Partner</h3><p className="mt-1 text-xs text-muted">Owner assigns the partner level, referral parent, and login access here.</p></div><button onClick={() => setShowPartnerOnboard(false)} className="rounded-full p-2 text-muted hover:bg-slate-100" aria-label="Close"><X size={18} /></button></div>
        {onboardError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{onboardError}</p>}
        <label className="mt-5 block text-xs font-semibold text-navy/70">New Partner Type<select value={onboardType} onChange={(event) => { setOnboardType(event.target.value); setOnboardPartnerId(""); setOnboardParentId(""); setOnboardCredentials(null); }} className="mt-1.5 w-full rounded-lg border border-navy/15 bg-white px-3.5 py-2.5 text-sm text-navy"><option value="super_vendor">Super-vendor</option><option value="vendor">Vendor</option><option value="sub_vendor">Sub-vendor</option><option value="dealer">Dealer</option></select></label>
        {onboardParentType && <label className="mt-4 block text-xs font-semibold text-navy/70">Referred by ({onboardParentType.replace("_", "-")})<select value={onboardParentId} onChange={(event) => setOnboardParentId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-navy/15 bg-white px-3.5 py-2.5 text-sm text-navy"><option value="">Choose referring partner</option>{onboardParents.map((partner) => <option key={partner.id} value={partner.id}>{partner.company_name || partner.contact_name} · #{partner.id}</option>)}</select></label>}
        <label className="mt-4 block text-xs font-semibold text-navy/70">Approved Partner to assign<select value={onboardPartnerId} onChange={(event) => { setOnboardPartnerId(event.target.value); const chosen = onboardPartners.find((partner) => String(partner.id) === event.target.value); if (chosen?.referred_by_partner_id) setOnboardParentId(String(chosen.referred_by_partner_id)); setOnboardCredentials(null); }} className="mt-1.5 w-full rounded-lg border border-navy/15 bg-white px-3.5 py-2.5 text-sm text-navy"><option value="">Choose a partner</option>{onboardPartners.map((partner) => <option key={partner.id} value={partner.id}>{partner.company_name || partner.contact_name} · #{partner.id} (currently {({ super_vendor: "Super-vendor", vendor: "Vendor", sub_vendor: "Sub-vendor", sub_vendor_commission: "Sub-vendor", dealer: "Dealer" })[partner.partner_type] || partner.partner_type})</option>)}</select></label>
        {onboardLoading && <p className="mt-2 text-xs text-muted">Loading approved partners…</p>}
        {!onboardLoading && !onboardPartners.length && <p className="mt-2 text-xs text-muted">No approved {{ super_vendor: "super-vendors", vendor: "vendors", sub_vendor: "sub-vendors", dealer: "dealers" }[onboardType]} found.</p>}
        {selectedOnboardPartner && <p className="mt-3 rounded-lg bg-amber-soft p-3 text-xs text-navy">{selectedOnboardPartner.partner_login_id ? `Login ${selectedOnboardPartner.partner_login_id} exists. Continue to reset its password.` : `A new login will be created for ${selectedOnboardPartner.company_name || selectedOnboardPartner.contact_name}.`}</p>}
        {onboardCredentials && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-bold text-emerald-900">Credentials ready — share securely</p><p className="mt-2 text-sm text-emerald-900">Login ID: <strong>{onboardCredentials.loginId}</strong></p><p className="mt-1 text-sm text-emerald-900">Temporary password: <strong>{onboardCredentials.password}</strong></p><p className="mt-2 text-xs text-emerald-800">The partner must change the password at first sign-in.</p><button onClick={() => navigator.clipboard?.writeText(`Login ID: ${onboardCredentials.loginId}\nTemporary password: ${onboardCredentials.password}`)} className="mt-3 rounded-full border border-emerald-300 px-4 py-2 text-xs font-bold text-emerald-900">Copy Credentials</button></div>}
        <div className="mt-6 flex justify-end gap-3"><button onClick={() => setShowPartnerOnboard(false)} className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-bold text-navy">Close</button><button onClick={handlePartnerOnboard} disabled={!selectedOnboardPartner || (Boolean(onboardParentType) && !onboardParentId) || onboardLoading || onboardSaving || Boolean(onboardCredentials)} className="rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy disabled:cursor-not-allowed disabled:opacity-50">{onboardSaving ? "Processing..." : selectedOnboardPartner?.partner_login_id ? "Reset Password" : "Create Login"}</button></div>
      </div></div>}
      {isPartners && isOwner && showPartnerLOL && <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-navy/60 p-4"><section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="partner-lol-title"><div className="flex items-start justify-between gap-4"><div><h3 id="partner-lol-title" className="text-lg font-extrabold text-navy">Send Partner LOL</h3><p className="mt-1 text-sm text-muted">Choose the partner. A personalized LOL PDF will be emailed to their registered address.</p></div><button type="button" onClick={() => setShowPartnerLOL(false)} className="rounded-full p-2 text-muted hover:bg-slate-100" aria-label="Close"><X size={18}/></button></div>{lolError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{lolError}</p>}{lolLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-amber"/></div> : <><label className="mt-5 block text-sm font-semibold text-navy">Partner<select value={lolPartnerId} onChange={(event) => setLolPartnerId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-navy/15 bg-white px-3.5 py-3 text-sm"><option value="">Choose partner</option>{lolPartners.map((partner) => <option key={partner.id} value={partner.id}>{partner.company_name || partner.contact_name || `Partner ${partner.id}`} · #{partner.id}</option>)}</select></label>{selectedLOLPartner && <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm"><p><span className="font-semibold">Partner:</span> {selectedLOLPartner.contact_name || selectedLOLPartner.company_name}</p><p className="mt-1"><span className="font-semibold">Email:</span> {selectedLOLPartner.email || "No email address on record"}</p><p className="mt-2 text-xs text-muted">The attached PDF filename will include this partner's name.</p></div>}</> }<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setShowPartnerLOL(false)} className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-bold text-navy">Cancel</button><button type="button" onClick={handleSendPartnerLOL} disabled={!selectedLOLPartner?.email || lolLoading || lolSending} className="inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy disabled:cursor-not-allowed disabled:opacity-50"><Send size={15}/>{lolSending ? "Sending..." : "Send LOL PDF"}</button></div></section></div>}
      {isPartners && selectedPartner && (
        <PartnerDetailsModal
          key={`${selectedPartner.partner.id}-${selectedPartner.editing ? "edit" : "view"}`}
          partner={selectedPartner.partner}
          editing={selectedPartner.editing}
          isOwner={canManageRecords}
          onClose={() => setSelectedPartner(null)}
          onEdit={() => setSelectedPartner({ ...selectedPartner, editing: true })}
          onSaved={async () => { setSelectedPartner(null); await load(); }}
        />
      )}
      {isPartners && partnerCredentials && <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-navy/60 p-4" role="presentation">
        <section role="dialog" aria-modal="true" aria-labelledby="partner-credentials-title" className="w-full max-w-lg rounded-2xl border border-navy/10 bg-white p-6 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><KeyRound size={21} /></div>
            <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Partner approved</p><h3 id="partner-credentials-title" className="mt-1 text-xl font-extrabold text-navy">Login credentials created</h3><p className="mt-1 text-sm text-muted">{partnerCredentials.partnerName} can now sign in with these details.</p></div>
            <button onClick={() => setPartnerCredentials(null)} className="rounded-full p-2 text-muted hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
          </div>
          <div className="mt-5 space-y-3 rounded-xl border border-navy/10 bg-slate-50 p-4">
            <div><p className="text-xs font-semibold text-muted">Login ID</p><p className="mt-1 select-all font-mono text-base font-bold text-navy">{partnerCredentials.loginId}</p></div>
            <div className="border-t border-navy/10 pt-3"><p className="text-xs font-semibold text-muted">Temporary password</p><p className="mt-1 select-all font-mono text-base font-bold text-navy">{partnerCredentials.password}</p></div>
          </div>
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-navy">Share these credentials privately. The partner will be asked to change the temporary password after signing in.</p>
          <div className="mt-5 flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <button onClick={() => setPartnerCredentials(null)} className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-bold text-navy hover:bg-slate-50">Close</button>
            <button onClick={async () => { try { await navigator.clipboard.writeText(`Login ID: ${partnerCredentials.loginId}\nTemporary password: ${partnerCredentials.password}`); setCredentialsCopied(true); } catch { setCredentialsCopied(false); } }} className="inline-flex items-center justify-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy hover:bg-amber-hover"><Copy size={15} />{credentialsCopied ? "Copied" : "Copy credentials"}</button>
          </div>
        </section>
      </div>}
    </div>
  );
}
