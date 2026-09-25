import { useEffect, useState } from "react";
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
  UserX,
  KeyRound,
  Trash2,
  X,
  Copy,
  CheckCircle2,
  Filter,
  RotateCcw,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import DashboardWelcome from "../components/DashboardWelcome";
import PartnerDetailsModal from "../components/PartnerDetailsModal";
import PartnerCreateModal from "../components/PartnerCreateModal";
import { APPLICATION_STATUSES, applicationStatusLabel } from "../constants/applicationStatuses";
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
} from "../services/api";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const permissions = user?.permissions || ["applications"];
  const initialEmployeeTab = ["applications", "installations", "employees", "partners", "branches", "submissions"].find((item) => permissions.includes(item));
  const tab = searchParams.get("section") || (user?.role === "owner" ? "overview" : initialEmployeeTab || "no-access");
  const requiredModule = tab.startsWith("applications") ? "applications" : tab.startsWith("installations") ? "installations" : tab;
  const hasAccess = user?.role === "owner" || permissions.includes(requiredModule);

  const handleSectionChange = (section) => {
    setSearchParams({ section }, { replace: true });
  };

  return (
    <DashboardLayout
      activeSection={tab}
      onSectionChange={handleSectionChange}
    >
      {!hasAccess || (tab === "overview" && user?.role !== "owner") ? <div className="rounded-2xl border border-navy/10 bg-white p-8 text-center text-muted">Owner ne abhi tak aapko kisi dashboard section ka access nahi diya hai.</div> : null}
      {hasAccess && tab === "overview" && <OverviewTab />}
      {hasAccess && tab === "applications" && <ApplicationsTab />}
      {hasAccess && tab === "applications-odisha" && <ApplicationsTab initialLocation="odisha" />}
      {hasAccess && tab === "applications-kolkata" && <ApplicationsTab initialLocation="kolkata" />}
      {hasAccess && tab.startsWith("installations") && <InstallationsTab location={tab === "installations-odisha" ? "odisha" : tab === "installations-kolkata" ? "kolkata" : ""} />}
      {hasAccess && tab === "employees" && <EmployeesTab />}
      {hasAccess && tab === "partners" && <PartnersTab />}
      {hasAccess && tab === "branches" && <BranchesTab />}
      {hasAccess && tab === "submissions" && <OtherTab />}
    </DashboardLayout>
  );
}

/* ── Overview ─────────────────────────────────────── */

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
        <StatCard label="Employees" value={stats.employees} icon={Users} />
        <StatCard label="Branches" value={stats.branches.total} icon={Building2} />
        <StatCard label="Partners" value={stats.partners} icon={Handshake} />
        <StatCard label="Installations" value={stats.installations.total} icon={Wrench} />
        <StatCard label="Careers" value={stats.careers} icon={FileText} />
        <StatCard label="Join Us" value={stats.joinUs} icon={Users} />
        <StatCard label="Contacts" value={stats.contacts} icon={FileText} />
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
              </tr>
            </thead>
            <tbody>
              {branchStats.length === 0 && (
                <tr><td colSpan={7} className="py-4 text-center text-muted">No branch data yet.</td></tr>
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
};

function ApplicationsTab({ initialLocation = "" }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(() => ({ ...EMPTY_FILTERS, location: initialLocation }));
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Load branches once for the branch filter dropdown
  useEffect(() => {
    if (user?.role !== "owner" && !(user?.permissions || []).includes("branches")) return;
    (async () => {
      try {
        const res = await listBranches();
        setBranches(res.data.items || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [user?.role, user?.permissions]);

  const load = async (p = page, overrideFilters) => {
    setLoading(true);
    const f = overrideFilters || filters;
    try {
      const params = { page: p, limit };
      if (f.search) params.search = f.search;
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
      setItems(res.data.items || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load(1);
    // eslint-disable-next-line
  }, [filters]);

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

  return (
    <div className="space-y-4">
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
            onKeyDown={(e) => e.key === "Enter" && load(1)}
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
          onClick={() => load(1)}
          className="rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-light"
        >
          Refresh
        </button>
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
            <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(v) => updateFilter("status", v)}
              options={APPLICATION_STATUSES}
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
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-navy/10 text-left text-xs font-semibold text-muted">
                  <th className="p-3 whitespace-nowrap">App No</th>
                  <th className="p-3 whitespace-nowrap">Created</th>
                  <th className="p-3 whitespace-nowrap">Name</th>
                  <th className="p-3 whitespace-nowrap">Phone</th>
                  <th className="p-3 whitespace-nowrap">Location</th>
                  <th className="p-3 whitespace-nowrap">Branch</th>
                  <th className="p-3 whitespace-nowrap">System</th>
                  <th className="p-3 whitespace-nowrap">Status</th>
                  <th className="p-3 whitespace-nowrap">Updated</th>
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
                    <td className="p-3 text-xs capitalize whitespace-nowrap">{a.location}</td>
                    <td className="p-3 text-xs whitespace-nowrap">{a.branch_name || "-"}</td>
                    <td className="p-3 text-xs capitalize whitespace-nowrap">
                      {a.system_size} · {a.system_type}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="p-3 text-xs text-muted whitespace-nowrap">
                      {a.last_updated_by_name ? <><span className="block font-semibold text-navy">{a.last_updated_by_name}</span>{formatDateTime(a.last_updated_by_at)}</> : "Not edited"}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <Link
                        to={`/admin/applications/${a.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber hover:underline"
                      >
                        <Eye size={14} /> View
                      </Link>
                      <Link
                        to={`/admin/applications/${a.id}`}
                        className="ml-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        <Pencil size={14} /> Edit
                      </Link>
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

function StatusBadge({ status, isPartner = false }) {
  const styles = {
    pending: "bg-amber-50 text-amber-700",
    under_review: "bg-blue-50 text-blue-700",
    verified: "bg-green-50 text-green-700",
    submitted_to_govt: "bg-indigo-50 text-indigo-700",
    approved: "bg-emerald-50 text-emerald-700",
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
    installed: "Installed",
    rejected: "Rejected",
    draft: "Draft",
    new: "New",
    reviewed: "Reviewed",
    shortlisted: "Shortlisted",
    onboarded: "Onboarded",
    rewarded: "Rewarded",
    terminated: "Terminated",
    resigned: "Resigned",
    on_leave: "On Leave",
    salary_success: "Salary Success",
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
  if (isPartner && status === "new") labels.new = "Submitted";
  if (isPartner && status === "reviewed") labels.reviewed = "Under Review";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {labels[status] || applicationStatusLabel(status)}
    </span>
  );
}

/* ── Employees ────────────────────────────────────── */

function EmployeesTab() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [u, b] = await Promise.allSettled([listUsers({ role: "employee" }), listBranches()]);
      if (u.status === "fulfilled") setUsers(u.value.data.items || []);
      else throw u.reason;
      setBranches(b.status === "fulfilled" ? b.value.data.items || [] : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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

  const filteredUsers = users.filter((u) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [u.name, u.email, u.user_id, u.designation, u.department, u.branch_name, u.branch_code]
      .some((value) => String(value || "").toLowerCase().includes(term));
    return matchesSearch && (!branchFilter || String(u.branch_id) === branchFilter) && (!statusFilter || u.status === statusFilter);
  });
  const activeFilterCount = Number(Boolean(branchFilter)) + Number(Boolean(statusFilter));

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
              placeholder="Search employees…"
              className="w-full rounded-lg border border-navy/15 py-2.5 pl-9 pr-3.5 text-sm focus:border-amber focus:outline-none"
            />
          </div>
          <button onClick={() => setShowFilters((open) => !open)} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold ${showFilters || activeFilterCount ? "border-amber bg-amber-soft text-navy" : "border-navy/15 bg-white text-navy hover:border-amber"}`}>
            <Filter size={14} /> Filters{activeFilterCount > 0 && <span className="rounded-full bg-amber px-2 text-xs">{activeFilterCount}</span>}
          </button>
          <button onClick={load} disabled={loading} className="rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-light disabled:opacity-60">Refresh</button>
          {isOwner && <button
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
        <FilterSelect label="Branch" value={branchFilter} onChange={setBranchFilter} options={branches.map((branch) => ({ value: String(branch.id), label: `${branch.name} (${branch.code})` }))} placeholder="All branches" />
        <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ value: "active", label: "Active" }, { value: "suspended", label: "Suspended" }]} placeholder="All statuses" />
        <button onClick={() => { setBranchFilter(""); setStatusFilter(""); }} className="justify-self-start text-xs font-semibold text-amber">Reset filters</button>
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
                {isOwner && <th className="p-3 whitespace-nowrap">Actions</th>}
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
                  {isOwner && <td className="p-3">
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
                      <button
                        onClick={() => handleResetPassword(u)}
                        className="rounded bg-amber-soft px-2 py-1 text-xs font-semibold text-navy hover:bg-amber/30"
                        title="Reset Password"
                      >
                        <KeyRound size={12} />
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
    </div>
  );
}

function EmployeeModal({ employee, branches, onClose, onSaved }) {
  const isEdit = !!employee;
  const [form, setForm] = useState({
    name: employee?.name || "",
    email: employee?.email || "",
    phone: employee?.phone || "",
    branchId: employee?.branch_id || "",
    designation: employee?.designation || "",
    department: employee?.department || "",
    permissions: Array.isArray(employee?.permissions) ? employee.permissions : ["applications"],
    userId: employee?.user_id || "",
    address: employee?.address || "",
    city: employee?.city || "",
    state: employee?.state || "",
    pincode: employee?.pincode || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);

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
            <p className="mb-3 text-xs text-muted">Choose which dashboard sections this employee can access.</p>
            <div className="grid grid-cols-2 gap-2">
              {[["applications", "Applications"], ["installations", "Installation"], ["employees", "Employees"], ["partners", "Partners"], ["branches", "Branches"], ["submissions", "Submissions"]].map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 rounded-lg bg-offwhite px-3 py-2 text-sm text-navy">
                  <input type="checkbox" checked={form.permissions.includes(value)} onChange={(event) => setForm((current) => ({ ...current, permissions: event.target.checked ? [...current.permissions, value] : current.permissions.filter((permission) => permission !== value) }))} className="accent-amber" />
                  {label}
                </label>
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
        {isOwner && <button
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
              {isOwner && <div className="mt-4 flex gap-2">
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
  const isOwner = user?.role === "owner";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      const res = await listInstallations(location);
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not load installations.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [location]);

  const title = location === "odisha" ? "Odisha Installations" : location === "kolkata" ? "Kolkata Installations" : "All Installations";
  const filteredItems = items.filter((item) =>
    [item.customer_name, item.phone, item.location, item.installation_type, item.city, item.status]
      .some((value) => String(value || "").toLowerCase().includes(search.trim().toLowerCase())) &&
    (!statusFilter || item.status === statusFilter) &&
    (!typeFilter || item.installation_type === typeFilter) &&
    (!locationFilter || item.location === locationFilter)
  );
  const activeFilterCount = Number(Boolean(statusFilter)) + Number(Boolean(typeFilter)) + Number(Boolean(locationFilter));
  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-amber" /></div>;
  return <div className="space-y-4">
    <h2 className="text-xl font-extrabold text-navy">{title}</h2>
    <div className="flex w-full flex-wrap gap-3">
      <div className="relative min-w-[240px] flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search installations..." className="w-full rounded-lg border border-navy/15 py-2.5 pl-9 pr-3.5 text-sm focus:border-amber focus:outline-none" />
      </div>
      <button onClick={() => setShowFilters((open) => !open)} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold ${showFilters || activeFilterCount ? "border-amber bg-amber-soft text-navy" : "border-navy/15 bg-white text-navy hover:border-amber"}`}><Filter size={14} /> Filters{activeFilterCount > 0 && <span className="rounded-full bg-amber px-2 text-xs">{activeFilterCount}</span>}</button>
      <button onClick={load} disabled={loading} className="rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-light disabled:opacity-60">Refresh</button>
    </div>
    {showFilters && <div className="grid gap-3 rounded-2xl border border-navy/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
      <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ value: "pending", label: "Pending" }, { value: "reviewed", label: "Reviewed" }, { value: "completed", label: "Completed" }]} placeholder="All statuses" />
      <FilterSelect label="Installation Type" value={typeFilter} onChange={setTypeFilter} options={[...new Set(items.map((item) => item.installation_type).filter(Boolean))].sort().map((value) => ({ value, label: value }))} placeholder="All types" />
      <FilterSelect label="Location" value={locationFilter} onChange={setLocationFilter} options={[...new Set(items.map((item) => item.location).filter(Boolean))].sort().map((value) => ({ value, label: value === "kolkata" ? "West Bengal" : "Odisha" }))} placeholder="All locations" />
      <button onClick={() => { setStatusFilter(""); setTypeFilter(""); setLocationFilter(""); }} className="justify-self-start text-xs font-semibold text-amber">Reset filters</button>
    </div>}
    {filteredItems.length === 0 ? <p className="rounded-xl border border-navy/10 bg-white p-6 text-center text-sm text-muted">{search ? "No matching installations found." : "No installation submissions found."}</p> : <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white"><table className="w-full min-w-[980px] text-sm"><thead><tr className="border-b border-navy/10 text-left text-xs font-semibold text-muted"><th className="p-3">Created</th><th className="p-3">Customer</th><th className="p-3">Phone</th><th className="p-3">Location</th><th className="p-3">Installation</th><th className="p-3">City</th><th className="p-3">Status</th>{isOwner && <th className="p-3">Actions</th>}</tr></thead><tbody>{filteredItems.map((item) => <tr key={item.id} className="border-b border-navy/5"><td className="p-3 text-xs">{formatDateTime(item.created_at)}</td><td className="p-3 font-semibold text-navy">{item.customer_name}</td><td className="p-3">{item.phone}</td><td className="p-3 capitalize">{item.location}</td><td className="p-3">{item.installation_type}</td><td className="p-3">{item.city}</td><td className="p-3"><StatusBadge status={item.status} /></td>{isOwner && <td className="p-3 whitespace-nowrap"><button onClick={() => setSelected(item.id)} className="text-xs font-semibold text-amber">View / Edit</button></td>}</tr>)}</tbody></table></div>}
    {isOwner && selected && <InstallationModal id={selected} onClose={() => setSelected(null)} onSaved={async () => { setSelected(null); await load(); }} />}
  </div>;
}

function InstallationModal({ id, onClose, onSaved }) {
  const [item, setItem] = useState(null); const [form, setForm] = useState(null); const [files, setFiles] = useState({}); const [saving, setSaving] = useState(false);
  useEffect(() => { (async () => { const res = await getInstallation(id); const x = res.data.installation; setItem(x); setForm({ location: x.location, customerName: x.customer_name, phone: x.phone, email: x.email, gender: x.gender, companyName: x.company_name, contactPerson: x.contact_person, installationType: x.installation_type, installationDate: x.installation_date, electricianName: x.electrician_name, technicianName: x.technician_name, solarPanelType: x.solar_panel_type, connectionType: x.connection_type, state: x.state, address: x.address, city: x.city, pincode: x.pincode, notes: x.notes }); })(); }, [id]);
  if (!form) return <div className="fixed inset-0 z-50 grid place-items-center bg-navy/60"><Loader2 className="animate-spin text-amber" /></div>;
  const fields = [["customerName","Customer Name"],["phone","Phone"],["email","Email"],["companyName","Company"],["contactPerson","Contact Person"],["installationType","Installation Type"],["installationDate","Installation Date","date"],["electricianName","Electrician"],["technicianName","Technician"],["solarPanelType","Solar Panel Type"],["connectionType","Connection Type"],["state","State"],["address","Address"],["city","City"],["pincode","PIN Code"],["notes","Notes"]];
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-navy/60 p-4"><div className="mx-auto my-5 max-w-3xl rounded-2xl bg-white p-6"><div className="flex justify-between"><h3 className="text-xl font-extrabold text-navy">Installation Details</h3><button onClick={onClose}>Close</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{fields.map(([key,label,type]) => <label key={key} className="text-xs font-semibold text-navy/70">{label}<input type={type || "text"} value={form[key] || ""} onChange={(e) => setForm({...form,[key]:e.target.value})} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm" /></label>)}</div><div className="mt-4"><p className="text-sm font-bold text-navy">Documents</p><div className="mt-2 flex flex-wrap gap-2">{Object.entries(item.documents || {}).map(([name,url]) => <a key={name} href={url} target="_blank" rel="noreferrer" className="rounded bg-amber-soft px-3 py-2 text-xs font-semibold text-navy">{name}</a>)}{!Object.keys(item.documents || {}).length && <span className="text-xs text-muted">No saved documents.</span>}</div><p className="mt-3 text-xs text-muted">Choose a file only to replace that document.</p><div className="mt-2 grid grid-cols-2 gap-2">{["aadhaarPhoto","fullSetupPhoto","panelSerialPhoto1","panelSerialPhoto2","panelSerialPhoto3","panelSerialPhoto4","panelSerialPhoto5","panelSerialPhoto6","inverterSerialPhoto","earthingPhoto1","earthingPhoto2","earthingPhoto3","laCableConnectorPhoto","earthingArresterSpikePhoto","inverterAcdbDcdbPhoto","batteryPhoto1","batteryPhoto2","otherDocument"].map((name) => <label key={name} className="text-[10px] text-muted">{name}<input type="file" className="mt-1 block w-full text-xs" onChange={(e) => e.target.files?.[0] && setFiles({...files,[name]:e.target.files[0]})} /></label>)}</div></div><div className="mt-5 flex items-center gap-3"><select value={item.status} onChange={async (e) => { await updateInstallationStatus(id, e.target.value); const res = await getInstallation(id); setItem(res.data.installation); }} className="rounded-lg border border-navy/15 px-3 py-2 text-sm"><option value="pending">Pending</option><option value="reviewed">Reviewed</option><option value="completed">Completed</option></select><button disabled={saving} onClick={async () => { setSaving(true); try { const uploaded = await uploadFilesToS3("installations", files); await updateInstallation(id, {...form, files: uploaded}); onSaved(); } finally { setSaving(false); } }} className="rounded-full bg-amber px-5 py-2 text-sm font-bold text-navy">{saving ? "Saving..." : "Save Changes"}</button></div></div></div>;
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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showPartnerCreate, setShowPartnerCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/${type}?limit=100`);
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [type]);

  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      await apiFetch(`/admin/${type}/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const isPartners = type === "partners";
  const isJoinUs = type === "join-us";
  const isCareers = type === "careers";
  const isContacts = type === "contacts";
  const availableStatuses = [...new Set(items.map((item) => item.status).filter(Boolean))].sort();
  const availableLocations = [...new Set(items.map((item) => item.location || item.city).filter(Boolean))].sort();
  const availableStates = [...new Set(items.map((item) => item.state).filter(Boolean))].sort();
  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = normalizedSearch
    ? items.filter((item) => {
        const name = `${item.first_name || ""} ${item.last_name || ""}`;
        const matchesSearch = [item.id, item.name, item.full_name, item.company_name, item.contact_name, name, item.email, item.phone, item.phone_number, item.location, item.state, item.district, item.subject, item.message, item.status]
          .some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
        return matchesSearch && (!statusFilter || item.status === statusFilter) && (!locationFilter || (item.location || item.city) === locationFilter) && (!stateFilter || item.state === stateFilter);
      })
    : items.filter((item) => (!statusFilter || item.status === statusFilter) && (!locationFilter || (item.location || item.city) === locationFilter) && (!stateFilter || item.state === stateFilter));
  const activeFilterCount = Number(Boolean(statusFilter)) + Number(Boolean(locationFilter)) + Number(Boolean(stateFilter));

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-amber" />
      </div>
    );

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-navy">{isPartners ? "Partners" : isJoinUs ? "Join Us Submissions" : isCareers ? "Career Applications" : "Contact Submissions"}</h2>
      <div className="flex w-full flex-wrap gap-3">
          <div className="relative min-w-[240px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${isPartners ? "partners" : isJoinUs ? "Join Us submissions" : isCareers ? "career applications" : "contacts"}...`} className="w-full rounded-lg border border-navy/15 py-2.5 pl-9 pr-3.5 text-sm focus:border-amber focus:outline-none" /></div>
          <button onClick={() => setShowFilters((open) => !open)} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold ${showFilters || activeFilterCount ? "border-amber bg-amber-soft text-navy" : "border-navy/15 bg-white text-navy hover:border-amber"}`}><Filter size={14} /> Filters{activeFilterCount > 0 && <span className="rounded-full bg-amber px-2 text-xs">{activeFilterCount}</span>}</button>
          <button onClick={load} disabled={loading} className="rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-light disabled:opacity-60">Refresh</button>
          {isPartners && isOwner && <button onClick={() => setShowPartnerCreate(true)} className="flex items-center gap-1.5 rounded-full bg-amber px-4 py-2 text-sm font-bold text-navy hover:bg-amber-hover"><Plus size={14} /> Add Partner</button>}
      </div>

      {showFilters && <div className="grid gap-3 rounded-2xl border border-navy/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
        <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={availableStatuses.map((value) => ({ value, label: isPartners && value === "new" ? "Submitted" : isPartners && value === "reviewed" ? "Under Review" : value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) }))} placeholder="All statuses" />
        {(isJoinUs || isCareers || isContacts) && <FilterSelect label={isContacts ? "City" : "Location"} value={locationFilter} onChange={setLocationFilter} options={availableLocations.map((value) => ({ value, label: value === "kolkata" ? "West Bengal" : value === "odisha" ? "Odisha" : value }))} placeholder="All locations" />}
        {(isJoinUs || isCareers) && <FilterSelect label="State" value={stateFilter} onChange={setStateFilter} options={availableStates.map((value) => ({ value, label: value }))} placeholder="All states" />}
        <button onClick={() => { setStatusFilter(""); setLocationFilter(""); setStateFilter(""); }} className="justify-self-start text-xs font-semibold text-amber">Reset filters</button>
      </div>}
      {filteredItems.length === 0 && <p className="rounded-xl border border-navy/10 bg-white p-6 text-center text-sm text-muted">{search || activeFilterCount ? "No matching records found." : isPartners ? "No partners found." : "No submissions."}</p>}
      {filteredItems.length > 0 && <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
      <table className={`w-full ${isPartners ? "min-w-[1120px]" : isCareers ? "min-w-[1180px]" : isJoinUs ? "min-w-[1180px]" : isContacts ? "min-w-[900px]" : "min-w-[760px]"} text-sm`}>
        <thead>
          <tr className="border-b border-navy/10 text-left text-xs font-semibold text-muted">
            <th className="p-3 whitespace-nowrap">ID</th>
            <th className="p-3 whitespace-nowrap">{isPartners ? "Company / Contact" : "Name"}</th>
            <th className="p-3 whitespace-nowrap">Phone</th>
            {isJoinUs && <><th className="p-3 whitespace-nowrap">Location</th><th className="p-3 whitespace-nowrap">State</th><th className="p-3 whitespace-nowrap">District</th></>}
            {isCareers && <><th className="p-3 whitespace-nowrap">Location</th><th className="p-3 whitespace-nowrap">State</th><th className="p-3 whitespace-nowrap">District</th></>}
            {isPartners && <th className="p-3 whitespace-nowrap">Email</th>}
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
          {filteredItems.map((it) => (
            <tr key={it.id} className="border-b border-navy/5">
              <td className="p-3 font-mono text-xs whitespace-nowrap">{it.id}</td>
              <td className="p-3 font-semibold text-navy whitespace-nowrap">
                {isPartners ? (
                  <><span>{it.company_name || "-"}</span><span className="block text-xs font-normal text-muted">{it.contact_name || "-"}</span></>
                ) : it.name ||
                  it.full_name ||
                  it.company_name ||
                  `${it.first_name || ""} ${it.last_name || ""}`.trim() ||
                  "-"}
              </td>
              <td className="p-3 whitespace-nowrap">{it.phone || it.phone_number || "-"}</td>
              {isJoinUs && <><td className="p-3 whitespace-nowrap">{it.location || "-"}</td><td className="p-3 whitespace-nowrap">{it.state || "-"}</td><td className="p-3 whitespace-nowrap">{it.district || "-"}</td></>}
              {isCareers && <><td className="p-3 whitespace-nowrap">{it.location || "-"}</td><td className="p-3 whitespace-nowrap">{it.state || "-"}</td><td className="p-3 whitespace-nowrap">{it.district || "-"}</td></>}
              {isPartners && <td className="p-3 whitespace-nowrap">{it.email || "-"}</td>}
              <td className="p-3 whitespace-nowrap">
                <StatusBadge status={it.status} isPartner={isPartners} />
              </td>
              <td className="p-3 text-xs text-muted whitespace-nowrap">
                {formatDateTime(it.created_at)}
              </td>
              {isJoinUs && <td className="p-3 text-xs text-muted whitespace-nowrap"><span className="block font-semibold text-navy">{it.updated_by_name || "—"}</span>{formatDateTime(it.updated_at)}</td>}
               {isJoinUs && <td className="p-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><Link to={`/admin/join-us/${it.id}`} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-navy hover:bg-slate-200"><Eye size={13}/>View</Link>{isOwner && <Link to={`/admin/join-us/${it.id}?edit=1`} className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"><Pencil size={13}/>Edit</Link>}</div></td>}
              {isCareers && <td className="p-3 text-xs text-muted whitespace-nowrap"><span className="block font-semibold text-navy">{it.updated_by_name || "—"}</span>{formatDateTime(it.updated_at)}</td>}
               {isCareers && <td className="p-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><Link to={`/admin/careers/${it.id}`} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-navy hover:bg-slate-200"><Eye size={13}/>View</Link>{isOwner && <Link to={`/admin/careers/${it.id}?edit=1`} className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"><Pencil size={13}/>Edit</Link>}</div></td>}
              {isContacts && <td className="p-3 text-xs text-muted whitespace-nowrap"><span className="block font-semibold text-navy">{it.updated_by_name || "—"}</span>{formatDateTime(it.updated_at)}</td>}
              {isContacts && <td className="p-3 whitespace-nowrap"><Link to={`/admin/contacts/${it.id}`} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-navy hover:bg-slate-200"><Eye size={13}/>View</Link></td>}
              {isPartners && <td className="p-3 text-xs text-muted whitespace-nowrap"><span className="block font-semibold text-navy">{it.updated_by_name || "—"}</span>{formatDateTime(it.updated_at)}</td>}
              {isPartners && (
                <td className="p-3 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1.5">
                    <Link to={`/admin/partners/${it.id}`} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-navy hover:bg-slate-200"><Eye size={13} /> View</Link>
                     {isOwner && <><button disabled={updating} onClick={() => setSelectedPartner({ partner: it, editing: true })} className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"><Pencil size={13} /> Edit</button>
                    </>}
                    {it.status !== "approved" && (
                      <button
                        disabled={updating}
                        onClick={() => updateStatus(it.id, "approved")}
                        className="rounded bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {it.status !== "rejected" && (
                      <button
                        disabled={updating}
                        onClick={() => updateStatus(it.id, "rejected")}
                        className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                    {it.status !== "reviewed" &&
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
          ))}
        </tbody>
      </table>
      </div>
      }
      {isPartners && isOwner && showPartnerCreate && <PartnerCreateModal onClose={() => setShowPartnerCreate(false)} onSaved={async () => { setShowPartnerCreate(false); await load(); }} />}
      {isPartners && selectedPartner && (
        <PartnerDetailsModal
          key={`${selectedPartner.partner.id}-${selectedPartner.editing ? "edit" : "view"}`}
          partner={selectedPartner.partner}
          editing={selectedPartner.editing}
          onClose={() => setSelectedPartner(null)}
          onEdit={() => setSelectedPartner({ ...selectedPartner, editing: true })}
          onSaved={async () => { setSelectedPartner(null); await load(); }}
        />
      )}
    </div>
  );
}
