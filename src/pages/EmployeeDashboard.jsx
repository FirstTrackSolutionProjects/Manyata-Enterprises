import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Loader2,
  Search,
  Pencil,
  Filter,
  RotateCcw,
  Download,
  UserRoundPen,
  X,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import DashboardWelcome from "../components/DashboardWelcome";
import { APPLICATION_STATUSES } from "../constants/applicationStatuses";
import { useAuth } from "../contexts/AuthContext";
import { listApplications, downloadApplicationPdf, updateMyEmployeeProfile, uploadFilesToS3 } from "../services/api";
import { hasActionPermission } from "../utils/permissions";
import { formatApplicationLocation } from "../utils/applicationLocation";
import LeaveRequests from "../components/LeaveRequests";
import CameraFileInput from "../components/CameraFileInput";

const EMPTY_FILTERS = {
  search: "",
  status: "",
  location: "",
  systemType: "",
  systemSize: "",
  fromDate: "",
  toDate: "",
  sortBy: "created_at",
  sortOrder: "desc",
};

export default function EmployeeDashboard() {
  const { user, refresh } = useAuth();
  const canViewApplications = hasActionPermission(user, "applications", "view");
  const canEditApplications = hasActionPermission(user, "applications", "edit");
  const canDownloadApplications = hasActionPermission(user, "applications", "download");
  const [tab, setTab] = useState("applications");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, verified: 0, submitted: 0 });
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const limit = 20;

  // Backend exposes both user_id and userId — support both here.
  const displayUserId = user?.userId || user?.user_id || "-";
  const branchName = user?.branchName || user?.branch_name || "-";
  const branchCode = user?.branchCode || user?.branch_code || "";

  const computeStats = (list) => {
    const s = { total: list.length, verified: 0, submitted: 0 };
    list.forEach((a) => {
      if (a.status === "verified") s.verified++;
      if (a.status === "submitted_to_govt") s.submitted++;
    });
    setStats(s);
  };

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.location) params.location = filters.location;
      if (filters.systemType) params.systemType = filters.systemType;
      if (filters.systemSize) params.systemSize = filters.systemSize;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.sortOrder) params.sortOrder = filters.sortOrder;

      const res = await listApplications(params);
      const list = res.data.items || [];
      setItems(list);
      setTotalPages(res.data.pages || 1);
      if (
        !filters.status &&
        !filters.search &&
        !filters.location &&
        !filters.systemType &&
        !filters.systemSize &&
        !filters.fromDate &&
        !filters.toDate
      ) {
        computeStats(list);
      }
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

  const resetFilters = () => setFilters(EMPTY_FILTERS);

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => v !== "" && v !== EMPTY_FILTERS[k]
  ).length;

  if (tab === "leave-requests") {
    return <DashboardLayout title="Leave Requests" subtitle="Submit a request and follow its review status." activeSection={tab} onSectionChange={setTab}><LeaveRequests /></DashboardLayout>;
  }

  return (
    <DashboardLayout
      title="Employee Dashboard"
      subtitle={`Manage applications for ${branchName}`}
      activeSection={tab}
      onSectionChange={setTab}
    >
      {/* ── Welcome banner ── */}
      <div className="mb-6">
        <DashboardWelcome
          name={user?.name || "Employee"}
          description="Here's a quick overview of your branch and applications."
        />
      </div>

      {/* Employee info cards */}
      <div className="mb-4 flex justify-end">
        <button onClick={() => setProfileEditorOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-navy/15 bg-white px-4 py-2.5 text-sm font-bold text-navy hover:border-amber">
          <UserRoundPen size={16} /> Edit my details
        </button>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-xs font-semibold text-muted">Your Branch</p>
          <p className="mt-1 text-lg font-extrabold text-navy">
            {branchName}
          </p>
          <p className="text-xs text-muted">{branchCode}</p>
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-xs font-semibold text-muted">Your User ID</p>
          <p className="mt-1 font-mono text-lg font-extrabold text-navy">
            {displayUserId}
          </p>
          {user?.designation && (
            <p className="text-xs text-muted mt-1">
              {user.designation}
              {user?.department ? ` · ${user.department}` : ""}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-xs font-semibold text-muted">
            Applications in Branch
          </p>
          <p className="mt-1 text-lg font-extrabold text-navy">
            {stats.total}
          </p>
        </div>
      </div>

      {profileEditorOpen && <EmployeeProfileModal user={user} onClose={() => setProfileEditorOpen(false)} onSave={async (payload, photo) => {
        const files = photo ? await uploadFilesToS3("employee-profiles", { profilePhoto: photo }) : {};
        const result = await updateMyEmployeeProfile({ ...payload, ...(files.profilePhoto ? { profilePhoto: files.profilePhoto } : {}) });
        await refresh();
        return result;
      }} />}

      {/* Search + filters */}
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
            placeholder="Search applications…"
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
        <div className="mt-3 rounded-2xl border border-navy/10 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(v) => updateFilter("status", v)}
              options={APPLICATION_STATUSES}
              placeholder="All statuses"
            />
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
        </div>
      )}

      <div className="mt-6">
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
              <table className="w-full min-w-[1400px] text-sm">
                <thead>
                  <tr className="border-b border-navy/10 text-left text-xs font-semibold text-muted">
                    <th className="p-3 whitespace-nowrap">App No</th>
                    <th className="p-3 whitespace-nowrap">Created</th>
                    <th className="p-3 whitespace-nowrap">Name</th>
                    <th className="p-3 whitespace-nowrap">Phone</th>
                    <th className="p-3 whitespace-nowrap">Location</th>
                    <th className="p-3 whitespace-nowrap">Super Vendor</th>
                    <th className="p-3 whitespace-nowrap">Vendor</th>
                    <th className="p-3 whitespace-nowrap">Sub Vendor</th>
                    <th className="p-3 whitespace-nowrap">Sales Executive</th>
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
                      <td className="p-3 text-xs text-muted whitespace-nowrap">{formatDateTime(a.created_at)}</td>
                      <td className="p-3 font-semibold text-navy whitespace-nowrap">
                        {a.full_name}
                      </td>
                      <td className="p-3 whitespace-nowrap">{a.phone_number}</td>
                      <td className="p-3 text-xs whitespace-nowrap">{formatApplicationLocation(a.location)}</td>
                      <td className="p-3 text-xs whitespace-nowrap">{a.super_vendor_name || "-"}</td>
                      <td className="p-3 text-xs whitespace-nowrap">{a.vendor_name || "-"}</td>
                      <td className="p-3 text-xs whitespace-nowrap">{a.sub_vendor_name || "-"}</td>
                      <td className="p-3 text-xs whitespace-nowrap">{a.sales_executive_name || "-"}</td>
                      <td className="p-3 text-xs capitalize whitespace-nowrap">
                        {a.system_size} · {a.system_type}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="p-3 text-xs text-muted whitespace-nowrap">{a.last_updated_by_name ? <><span className="block font-semibold text-navy">{a.last_updated_by_name}</span>{formatDateTime(a.last_updated_by_at)}</> : "Not edited"}</td>
                      <td className="p-3 whitespace-nowrap">
                        {canViewApplications && <Link
                          to={`/employee/applications/${a.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-amber hover:underline"
                        >
                          <FileText size={14} /> View
                        </Link>}
                        {canEditApplications && <Link to={`/employee/applications/${a.id}`} className="ml-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"><Pencil size={14} /> Edit</Link>}
                        {canDownloadApplications && <button onClick={() => downloadApplicationPdf(a.id)} className="ml-3 inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline"><Download size={14} /> Download</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
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
    </DashboardLayout>
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

function EmployeeProfileModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    pincode: user?.pincode || "",
  });
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form, photo);
      onClose();
    } catch (saveError) {
      setError(saveError.message || "Could not update your details.");
    } finally {
      setSaving(false);
    }
  };
  const inputClass = "mt-1 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy focus:border-amber focus:outline-none";
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-3 sm:p-5" onClick={onClose}>
    <form onSubmit={submit} onClick={(event) => event.stopPropagation()} className="max-h-[92vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-navy">Edit my details</h2><p className="mt-1 text-sm text-muted">Correct your personal and contact details. Changes update your employee profile.</p></div><button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-muted hover:bg-slate-100"><X size={20} /></button></div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-navy/70">Full name<input required minLength={2} maxLength={120} name="name" value={form.name} onChange={change} className={inputClass} /></label>
        <label className="text-xs font-semibold text-navy/70">Phone number<input required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} name="phone" value={form.phone} onChange={change} className={inputClass} /></label>
        <label className="text-xs font-semibold text-navy/70">Email (managed by Owner)<input disabled value={user?.email || ""} className={`${inputClass} bg-slate-100`} /></label>
        <label className="text-xs font-semibold text-navy/70">Address<input maxLength={500} name="address" value={form.address} onChange={change} className={inputClass} /></label>
        <label className="text-xs font-semibold text-navy/70">City / town<input maxLength={80} name="city" value={form.city} onChange={change} className={inputClass} /></label>
        <label className="text-xs font-semibold text-navy/70">State<input maxLength={80} name="state" value={form.state} onChange={change} className={inputClass} /></label>
        <label className="text-xs font-semibold text-navy/70">PIN code<input maxLength={12} name="pincode" value={form.pincode} onChange={change} className={inputClass} /></label>
        <div className="text-xs font-semibold text-navy/70"><span className="mb-1.5 block">Employee ID · Designation · Branch</span><div className="rounded-lg bg-slate-100 px-3 py-2.5 text-sm font-normal text-muted">{user?.userId || user?.user_id || "—"} · {user?.designation || "—"} · {user?.branchName || user?.branch_name || "—"}</div></div>
      </div>
      <div className="flex items-center gap-3">{user?.profilePhoto && !photo && <img src={user.profilePhoto} alt="Current profile" className="h-12 w-12 rounded-full object-cover" />}<div className="min-w-0 flex-1"><CameraFileInput label="Profile photo (optional)" name="profilePhoto" accept="image/jpeg,image/png,image/webp" onFile={setPhoto} /></div></div>
      <p className="text-xs text-muted">Email, employee ID, designation, department, branch and dashboard access are managed by the Owner.</p>
      <div className="flex justify-end gap-2 border-t border-navy/10 pt-4"><button type="button" onClick={onClose} className="rounded-lg border border-navy/15 px-4 py-2.5 text-sm font-semibold text-navy">Cancel</button><button disabled={saving} className="rounded-lg bg-amber px-5 py-2.5 text-sm font-bold text-navy disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button></div>
    </form>
  </div>;
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" }) : "-";
}

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-50 text-amber-700",
    under_review: "bg-blue-50 text-blue-700",
    verified: "bg-green-50 text-green-700",
    submitted_to_govt: "bg-indigo-50 text-indigo-700",
    approved: "bg-emerald-50 text-emerald-700",
    installed: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-50 text-red-700",
    draft: "bg-slate-100 text-slate-700",
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
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
