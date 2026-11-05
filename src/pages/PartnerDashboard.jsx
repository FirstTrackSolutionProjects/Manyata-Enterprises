import { useEffect, useState } from "react";
import { Building2, FileText, Search, Loader2, Network, Banknote, UserRound, Filter, RotateCcw, Eye, X } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import DashboardWelcome from "../components/DashboardWelcome";
import { useAuth } from "../contexts/AuthContext";
import { fileUrl, getMyCommissionPayouts, getMyPartnerApplications, getMyPartnerHierarchy, setMyChildPartnerCommission } from "../services/api";
import { hasActionPermission } from "../utils/permissions";
import { formatApplicationLocation } from "../utils/applicationLocation";
import { APPLICATION_STATUSES, applicationStatusLabel } from "../constants/applicationStatuses";

const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—";
const titleCase = (value = "") => String(value).replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function PartnerDashboard() {
  const { user } = useAuth();
  const partnerType = ({ super_vendor: "Super-vendor", vendor: "Vendor", sub_vendor: "Sub-vendor", sub_vendor_commission: "Sub-vendor", dealer: "Dealer" })[user?.partnerType] || "Partner";
  const partnerRoles = [...new Set([user?.partnerType, ...(Array.isArray(user?.partnerRoles) ? user.partnerRoles : [])].filter(Boolean))];
  const partnerRoleLabels = partnerRoles.map((role) => ({ super_vendor: "Super-vendor", vendor: "Vendor", sub_vendor: "Sub-vendor", sub_vendor_commission: "Sub-vendor", dealer: "Dealer" })[role] || role);
  const [assignedLocations, setAssignedLocations] = useState(() => [...new Set(Array.isArray(user?.partnerAssignedLocations) ? user.partnerAssignedLocations : [])]);
  const assignedLocationLabels = assignedLocations.map((location) => ({ odisha: "Odisha", west_bengal: "West Bengal" })[location]).filter(Boolean);
  const canViewApplications = hasActionPermission(user, "applications", "view");
  const [section, setSection] = useState("dashboard");
  const [hierarchy, setHierarchy] = useState([]);
  const [incomingCommission, setIncomingCommission] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [districtBranches, setDistrictBranches] = useState([]);
  const [commissionDrafts, setCommissionDrafts] = useState({});
  const [savingCommissionId, setSavingCommissionId] = useState(null);
  const [commissionNotice, setCommissionNotice] = useState("");
  const [regionCounts, setRegionCounts] = useState({ odisha: 0, west_bengal: 0 });
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState({});
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [showApplicationFilters, setShowApplicationFilters] = useState(false);
  const [applicationFilters, setApplicationFilters] = useState({ status: "", location: "", salesExecutive: "", systemType: "", systemSize: "", fromDate: "", toDate: "", sortBy: "created_at", sortOrder: "desc" });
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const regionalCardCoveredStatuses = new Set([
    "pending", "verified", "consumer_login_submitted_to_govt_portal", "submitted_to_govt",
    "vendor_side_quotation_agreement_pending", "electricity_bill_name_mismatch",
    "electricity_bill_mismatch_ownership_transfer", "electricity_bill_ownership_transfer_customer_side_on_process",
    "electricity_bill_ownership_transfer_completed_successfully", "customer_not_interested", "rejected",
    "customer_side_bank_forward", "vendor_side_bank_forward", "customer_side_documents_issue", "bank_reject",
    "loan_disbursed_successfully_phase_1", "loan_disbursed_phase_2", "customer_full_loan_amount_disbursed",
  ]);
  const extraStatusCards = Object.entries(statusCounts)
    .filter(([status, count]) => status !== "loan_visible" && Number(count || 0) > 0 && !regionalCardCoveredStatuses.has(status))
    .map(([status, count]) => [applicationStatusLabel(status), Number(count), `status-${status}`]);
  const applicationCards = [
    ["New Customer Application", Number(statusCounts.pending || 0)],
    ["Verified", Number(statusCounts.verified || 0)],
    ["Submitted to Government Portal", Number(statusCounts.consumer_login_submitted_to_govt_portal || 0) + Number(statusCounts.submitted_to_govt || 0)],
    ["Vendor Side - Quotation & Agreement Pending", Number(statusCounts.vendor_side_quotation_agreement_pending || 0)],
    ["Electricity Bill - Name Mismatch", Number(statusCounts.electricity_bill_name_mismatch || 0)],
    ["Electricity Bill - Ownership Transfer", Number(statusCounts.electricity_bill_mismatch_ownership_transfer || 0) + Number(statusCounts.electricity_bill_ownership_transfer_customer_side_on_process || 0) + Number(statusCounts.electricity_bill_ownership_transfer_completed_successfully || 0)],
    ["Customer Not Interested", Number(statusCounts.customer_not_interested || 0)],
    ["Rejected", Number(statusCounts.rejected || 0)],
    ["Customer Side - Bank Forward", Number(statusCounts.customer_side_bank_forward || 0) + Number(statusCounts.vendor_side_bank_forward || 0)],
    ["Customer Side - Documents Issue", Number(statusCounts.customer_side_documents_issue || 0)],
    ["Bank Rejected", Number(statusCounts.bank_reject || 0)],
    ["Loan Disbursed", Number(statusCounts.loan_disbursed_successfully_phase_1 || 0) + Number(statusCounts.loan_disbursed_phase_2 || 0) + Number(statusCounts.customer_full_loan_amount_disbursed || 0)],
    ...extraStatusCards,
  ];
  const activePartnerApplicationFilterCount = Object.entries(applicationFilters)
    .filter(([key, value]) => value && key !== "sortBy" && key !== "sortOrder").length;

  useEffect(() => {
    let active = true;
    getMyPartnerHierarchy().then((response) => {
      if (!active) return;
      const children = response.data.children || [];
      setPartnerProfile(response.data.partner || null);
      setDistrictBranches(response.data.branches || []);
      setHierarchy(children);
      setIncomingCommission(response.data.partner?.incoming_commission || null);
      if (Array.isArray(response.data.partner?.assigned_locations)) setAssignedLocations([...new Set(response.data.partner.assigned_locations)]);
      const counts = { odisha: 0, west_bengal: 0 };
      children.forEach((partner) => {
        const state = String(partner.state || "").toLowerCase().replace(/[\s_-]/g, "");
        const assigned = Array.isArray(partner.assigned_locations) ? partner.assigned_locations : [];
        if (assigned.includes("odisha") || (!assigned.length && ["odisha", "orissa", "udisa", "odisa"].includes(state))) counts.odisha += 1;
        if (assigned.includes("west_bengal") || (!assigned.length && ["westbengal", "westbangol", "westbangal", "kolkata"].includes(state))) counts.west_bengal += 1;
      });
      setRegionCounts(counts);
    }).catch(() => {
      if (active) setHierarchy([]);
    });
    return () => { active = false; };
  }, []);

  const saveChildCommission = async (child) => {
    const draft = commissionDrafts[child.id] || {};
    setSavingCommissionId(child.id);
    setCommissionNotice("");
    try {
      const response = await setMyChildPartnerCommission(child.id, {
        on_grid: draft.on_grid ?? child.referral_commission_rates?.on_grid ?? "",
        hybrid: draft.hybrid ?? child.referral_commission_rates?.hybrid ?? "",
      });
      setHierarchy((current) => current.map((item) => Number(item.id) === Number(child.id)
        ? { ...item, referral_commission_model: response.data.commission.commission_model, referral_commission_rates: response.data.commission.commission_rates }
        : item));
      setCommissionNotice("Referral commission saved.");
    } catch (err) {
      setCommissionNotice(err.message || "Could not save referral commission.");
    } finally {
      setSavingCommissionId(null);
    }
  };

  useEffect(() => {
    if (!canViewApplications) return;
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getMyPartnerApplications({ page: String(page), limit: "20", search: search.trim(), ...Object.fromEntries(Object.entries(applicationFilters).filter(([, value]) => value)) });
        if (!active) return;
        setApplications(response.data.items || []);
        setTotal(response.data.total || 0);
        setStatusCounts(response.data.byStatus || {});
        setPages(response.data.pages || 1);
      } catch (err) {
        if (active) setError(err.message || "Could not load your applications.");
      } finally {
        if (active) setLoading(false);
      }
    }, 180);
    return () => { active = false; clearTimeout(timer); };
  }, [canViewApplications, page, search, applicationFilters]);

  return (
    <DashboardLayout
      title={section === "applications" ? "Applications" : section === "commissions" ? "Commission History" : section === "profile" ? "Partner Profile" : "Partner Dashboard"}
      subtitle={section === "applications" ? `Applications assigned to ${user?.partnerCompanyName || user?.name} and partners under your referral chain.` : section === "commissions" ? "Your earned, approved, and paid commission records." : section === "profile" ? "Your partner account and contact details." : `${partnerType} dashboard`}
      activeSection={section}
      onSectionChange={setSection}
    >
      {section === "commissions" ? <PartnerCommissionSection /> : section === "profile" ? <PartnerProfile profile={partnerProfile} partnerType={partnerType} /> : section === "dashboard" ? <>
        <div className="mb-6 flex items-center gap-4">
          {(partnerProfile?.documentUrls?.Photo || partnerProfile?.file_photo) ? <img src={partnerProfile.documentUrls?.Photo || fileUrl(partnerProfile.file_photo)} alt={`${user?.partnerCompanyName || user?.name || "Partner"} profile`} onError={(event) => event.currentTarget.remove()} className="h-16 w-16 shrink-0 rounded-full border-2 border-amber object-cover" /> : <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-amber-soft text-navy"><UserRound size={28} /></div>}
          <div className="min-w-0 flex-1"><DashboardWelcome name={user?.partnerCompanyName || user?.name || partnerType} description="Your partner account details and the sections the owner has allowed you to access." /></div>
        </div>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-xs font-semibold text-muted">Partner Name</p><p className="mt-1 text-lg font-extrabold text-navy">{user?.partnerCompanyName || user?.name || "—"}</p></div>
          <div className="rounded-2xl border border-navy/10 bg-white p-5"><p className="flex items-center gap-2 text-xs font-semibold text-muted"><Building2 size={15} /> Partner Roles</p><p className="mt-1 text-lg font-extrabold text-navy">{partnerRoleLabels.join(", ") || partnerType}</p></div>
          <div className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-xs font-semibold text-muted">Partner Login ID</p><p className="mt-1 font-mono text-lg font-extrabold text-navy">{user?.userId || user?.user_id || "—"}</p></div>
          <div className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-xs font-semibold text-muted">Contact email</p><p className="mt-1 font-bold text-navy">{user?.email || "—"}</p></div>
          {canViewApplications && <button onClick={() => setSection("applications")} className="rounded-2xl border border-navy/10 bg-white p-5 text-left hover:border-amber"><p className="flex items-center gap-2 text-xs font-semibold text-muted"><FileText size={15} /> Your Applications</p><p className="mt-1 text-2xl font-extrabold text-navy">{total}</p></button>}
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="flex items-center gap-2 text-xs font-semibold text-muted"><Building2 size={15} /> Assigned Locations</p>
          <div className="mt-3 flex flex-wrap gap-2">{assignedLocationLabels.length ? assignedLocationLabels.map((location) => <span key={location} className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-navy">{location}</span>) : <span className="text-sm text-muted">No locations assigned. Contact the owner.</span>}</div>
        </div>
        </div>
        <section className="mb-6 rounded-2xl border border-navy/10 bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-navy"><Building2 size={16} /> Branches in Your District</h2>
          <p className="mt-1 text-xs text-muted">Matched using your partner profile state and district.</p>
          {districtBranches.length ? <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{districtBranches.map((branch) => <article key={branch.id} className="rounded-xl border border-navy/10 bg-slate-50 p-4"><p className="font-bold text-navy">{branch.name}</p><p className="mt-1 text-sm text-muted">{branch.district}, {branch.state}</p>{branch.address && <p className="mt-1 text-xs text-muted">{branch.address}</p>}</article>)}</div> : <p className="mt-3 text-sm text-muted">No active branch matches {partnerProfile?.district ? `${partnerProfile.district}, ${partnerProfile.state || ""}` : "your district yet"}.</p>}
        </section>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:max-w-4xl">
          <div className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-xs font-semibold text-muted">Odisha Partners in Your Chain</p><p className="mt-2 text-2xl font-extrabold text-navy">{regionCounts.odisha}</p></div>
          <div className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-xs font-semibold text-muted">West Bengal Partners in Your Chain</p><p className="mt-2 text-2xl font-extrabold text-navy">{regionCounts.west_bengal}</p></div>
        </div>
        {incomingCommission && <div className="mb-6 rounded-2xl border border-amber/30 bg-amber-50 p-5"><h2 className="text-sm font-bold text-navy">Your commission from direct referrer</h2><div className="mt-3 flex flex-wrap gap-6 text-sm text-navy"><span>On-Grid: <strong>{incomingCommission.commission_rates?.on_grid === undefined ? "Not set" : `₹${Number(incomingCommission.commission_rates.on_grid).toLocaleString("en-IN")}`}</strong></span><span>Hybrid: <strong>{incomingCommission.commission_rates?.hybrid === undefined ? "Not set" : `₹${Number(incomingCommission.commission_rates.hybrid).toLocaleString("en-IN")}`}</strong></span><span className="text-muted">Per completed installation</span></div></div>}

        <div className="mt-6 rounded-2xl border border-navy/10 bg-white p-5"><h2 className="flex items-center gap-2 text-sm font-bold text-navy"><Network size={16} /> Referral Chain</h2><p className="mt-1 text-sm text-muted">See partner offers throughout your downstream chain. You can set or edit the offer for your direct referrals; upstream partner details stay private.</p>{commissionNotice && <p role="status" className="mt-3 text-sm text-amber">{commissionNotice}</p>}<div className="mt-3 divide-y divide-navy/5">{hierarchy.length ? hierarchy.map((item) => { const direct = Number(item.depth) === 1; const rates = item.referral_commission_rates || {}; const draft = commissionDrafts[item.id] || {}; const indent = `${Math.min(Number(item.depth || 1) - 1, 3) * 18}px`; return <div key={item.id} className="py-4"><div className="flex items-center justify-between gap-3 text-sm"><div className="flex min-w-0 items-center gap-3" style={{ paddingLeft: indent }}>{item.file_photo ? <img src={fileUrl(item.file_photo)} alt={`${item.company_name || item.contact_name || "Partner"} profile`} className="h-10 w-10 shrink-0 rounded-full border border-navy/10 object-cover" /> : <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-soft text-navy"><UserRound size={18} /></div>}<span className="truncate font-semibold text-navy">{item.company_name || item.contact_name}</span></div><span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-navy">{({ super_vendor: "Super-vendor", vendor: "Vendor", sub_vendor: "Sub-vendor", dealer: "Dealer" })[item.partner_type] || item.partner_type}</span></div>{direct ? <><div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="text-xs font-semibold text-muted">On-Grid offer<input type="number" min="0" step="1" value={draft.on_grid ?? rates.on_grid ?? ""} onChange={(event) => setCommissionDrafts((current) => ({ ...current, [item.id]: { ...(current[item.id] || {}), on_grid: event.target.value } }))} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy" /></label><label className="text-xs font-semibold text-muted">Hybrid offer<input type="number" min="0" step="1" value={draft.hybrid ?? rates.hybrid ?? ""} onChange={(event) => setCommissionDrafts((current) => ({ ...current, [item.id]: { ...(current[item.id] || {}), hybrid: event.target.value } }))} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy" /></label><button onClick={() => saveChildCommission(item)} disabled={savingCommissionId === item.id} className="rounded-full bg-amber px-4 py-2 text-xs font-bold text-navy disabled:opacity-50">{savingCommissionId === item.id ? "Saving..." : "Save offer"}</button></div><ReferralMargin incomingCommission={incomingCommission} offeredRates={{ on_grid: draft.on_grid ?? rates.on_grid, hybrid: draft.hybrid ?? rates.hybrid }} /></> : <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm" style={{ marginLeft: indent }}><p className="text-xs font-semibold text-muted">Offer to this partner from their direct referrer · per completed installation</p><div className="mt-2 flex flex-wrap gap-5 text-navy"><span>On-Grid: <strong>{rates.on_grid === undefined ? "Not set" : `₹${Number(rates.on_grid).toLocaleString("en-IN")}`}</strong></span><span>Hybrid: <strong>{rates.hybrid === undefined ? "Not set" : `₹${Number(rates.hybrid).toLocaleString("en-IN")}`}</strong></span></div></div>}</div>; }) : <p className="py-3 text-sm text-muted">No partners are linked below your account yet. Ask the Owner to set your account as the “Referred by” partner in their partner record.</p>}</div></div>
      </> : canViewApplications ? <>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-muted">Applications assigned to your account and partners in your referral chain are listed here.</p></div><div className="rounded-xl border border-navy/10 bg-white px-4 py-2"><span className="text-xs text-muted">Total </span><strong className="text-navy">{total}</strong></div></div>
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {[ ["Total Applications", total, "total"], ...applicationCards].map(([label, value, key]) => <div key={key || label} className="rounded-2xl border border-navy/10 bg-white p-4"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-2 text-2xl font-extrabold text-navy">{Number(value || 0)}</p></div>)}
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[240px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by name, phone, email, or application no." className="w-full rounded-lg border border-navy/15 bg-white py-3 pl-9 pr-4 text-sm focus:border-amber focus:outline-none" /></div>
          <button type="button" onClick={() => setShowApplicationFilters((shown) => !shown)} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold ${showApplicationFilters || activePartnerApplicationFilterCount ? "border-amber bg-amber-soft text-navy" : "border-navy/15 bg-white text-navy hover:border-amber"}`}><Filter size={15} /> Filters{activePartnerApplicationFilterCount > 0 && <span className="rounded-full bg-amber px-2 text-xs">{activePartnerApplicationFilterCount}</span>}</button>
        </div>
        {showApplicationFilters && <div className="mt-3 rounded-2xl border border-navy/10 bg-white p-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-semibold text-muted">Status<select value={applicationFilters.status} onChange={(event) => { setApplicationFilters((current) => ({ ...current, status: event.target.value })); setPage(1); }} className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy"><option value="">All statuses</option>{APPLICATION_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
          <label className="text-xs font-semibold text-muted">Location<select value={applicationFilters.location} onChange={(event) => { setApplicationFilters((current) => ({ ...current, location: event.target.value })); setPage(1); }} className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy"><option value="">All assigned locations</option>{assignedLocationLabels.map((location) => <option key={location} value={location === "West Bengal" ? "kolkata" : "odisha"}>{location}</option>)}</select></label>
          <label className="text-xs font-semibold text-muted">Sales Executive<input value={applicationFilters.salesExecutive} onChange={(event) => { setApplicationFilters((current) => ({ ...current, salesExecutive: event.target.value })); setPage(1); }} placeholder="Search Sales Executive name" className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy" /></label>
          <label className="text-xs font-semibold text-muted">System Type<select value={applicationFilters.systemType} onChange={(event) => { setApplicationFilters((current) => ({ ...current, systemType: event.target.value })); setPage(1); }} className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy"><option value="">All types</option><option value="on-grid">On-Grid</option><option value="hybrid">Hybrid</option></select></label>
          <label className="text-xs font-semibold text-muted">System Size<select value={applicationFilters.systemSize} onChange={(event) => { setApplicationFilters((current) => ({ ...current, systemSize: event.target.value })); setPage(1); }} className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy"><option value="">All sizes</option>{["1kw", "2kw", "3kw", "5kw", "10kw"].map((size) => <option key={size} value={size}>{titleCase(size)}</option>)}</select></label>
          <label className="text-xs font-semibold text-muted">From Date<input type="date" value={applicationFilters.fromDate} onChange={(event) => { setApplicationFilters((current) => ({ ...current, fromDate: event.target.value })); setPage(1); }} className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy" /></label>
          <label className="text-xs font-semibold text-muted">To Date<input type="date" value={applicationFilters.toDate} onChange={(event) => { setApplicationFilters((current) => ({ ...current, toDate: event.target.value })); setPage(1); }} className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy" /></label>
          <label className="text-xs font-semibold text-muted">Sort By<select value={applicationFilters.sortBy} onChange={(event) => { setApplicationFilters((current) => ({ ...current, sortBy: event.target.value })); setPage(1); }} className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy"><option value="created_at">Date Created</option><option value="updated_at">Last Updated</option><option value="full_name">Applicant Name</option><option value="status">Status</option><option value="sales_executive_name">Sales Executive</option></select></label>
          <label className="text-xs font-semibold text-muted">Sort Order<select value={applicationFilters.sortOrder} onChange={(event) => { setApplicationFilters((current) => ({ ...current, sortOrder: event.target.value })); setPage(1); }} className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy"><option value="desc">Newest / Z→A</option><option value="asc">Oldest / A→Z</option></select></label>
        </div><div className="mt-4 flex justify-end"><button type="button" onClick={() => { setApplicationFilters({ status: "", location: "", salesExecutive: "", systemType: "", systemSize: "", fromDate: "", toDate: "", sortBy: "created_at", sortOrder: "desc" }); setPage(1); }} className="inline-flex items-center gap-2 rounded-lg border border-navy/15 px-4 py-2 text-xs font-semibold text-navy"><RotateCcw size={13} /> Reset Filters</button></div></div>}
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-4 overflow-x-auto rounded-2xl border border-navy/10 bg-white">
          <table className="w-full min-w-[1080px] text-sm"><thead><tr className="border-b border-navy/10 text-left text-xs font-semibold text-muted"><th className="p-3">App No</th><th className="p-3">Created</th><th className="p-3">Customer</th><th className="p-3">Phone</th><th className="p-3">Location</th><th className="p-3">System</th><th className="p-3">Sales Executive</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan="9" className="p-8 text-center text-muted"><Loader2 className="mx-auto animate-spin text-amber" /></td></tr> : applications.length ? applications.map((application) => <tr key={application.id} className="border-b border-navy/5 last:border-0"><td className="p-3 font-mono text-xs">{application.application_no}</td><td className="p-3 text-xs text-muted">{formatDateTime(application.created_at)}</td><td className="p-3 font-semibold text-navy">{application.full_name}</td><td className="p-3">{application.phone_number}</td><td className="p-3">{formatApplicationLocation(application.location)}</td><td className="p-3">{titleCase(application.system_size)} · {titleCase(application.system_type)}</td><td className="p-3">{application.sales_executive_name || "—"}</td><td className="p-3"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-navy">{titleCase(application.status)}</span></td><td className="p-3"><button type="button" onClick={() => setSelectedApplication(application)} className="inline-flex items-center gap-1 rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy hover:border-amber"><Eye size={13} /> View</button></td></tr>) : <tr><td colSpan="9" className="p-8 text-center text-sm text-muted">No applications found with these filters.</td></tr>}</tbody>
          </table>
        </div>
        {selectedApplication && <div className="fixed inset-0 z-[90] grid place-items-center bg-navy/50 p-4" onClick={() => setSelectedApplication(null)}><section role="dialog" aria-modal="true" aria-label="Application details" onClick={(event) => event.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><header className="flex items-start justify-between gap-4 bg-navy p-5 text-white"><div><p className="text-xs text-white/70">Application details</p><h2 className="mt-1 text-lg font-extrabold">{selectedApplication.full_name || "Customer"}</h2><p className="mt-1 font-mono text-xs">{selectedApplication.application_no}</p></div><button type="button" onClick={() => setSelectedApplication(null)} className="rounded-full p-2 hover:bg-white/10" aria-label="Close"><X size={18} /></button></header><div className="grid gap-3 p-5 sm:grid-cols-2">{[["Phone", selectedApplication.phone_number], ["Email", selectedApplication.email], ["Location", formatApplicationLocation(selectedApplication.location)], ["System", `${titleCase(selectedApplication.system_size)} · ${titleCase(selectedApplication.system_type)}`], ["Status", applicationStatusLabel(selectedApplication.status)], ["Sales Executive", selectedApplication.sales_executive_name], ["Super-vendor", selectedApplication.super_vendor_name], ["Vendor", selectedApplication.vendor_name], ["Sub-vendor", selectedApplication.sub_vendor_name], ["Created", formatDateTime(selectedApplication.created_at)], ["Last updated", formatDateTime(selectedApplication.updated_at)], ["Updated by", selectedApplication.last_updated_by_name]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-1 break-words text-sm font-semibold text-navy">{value || "—"}</p></div>)}</div><footer className="flex justify-end border-t border-navy/10 p-4"><button type="button" onClick={() => setSelectedApplication(null)} className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy">Close</button></footer></section></div>}
        {pages > 1 && <div className="mt-4 flex items-center justify-center gap-3"><button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-lg border border-navy/15 px-3 py-2 text-xs font-semibold disabled:opacity-40">Previous</button><span className="text-xs text-muted">Page {page} of {pages}</span><button onClick={() => setPage((current) => Math.min(pages, current + 1))} disabled={page === pages} className="rounded-lg border border-navy/15 px-3 py-2 text-xs font-semibold disabled:opacity-40">Next</button></div>}
      </> : <div className="rounded-2xl border border-navy/10 bg-white p-6"><p className="text-lg font-bold text-navy">{user?.partnerCompanyName || user?.name}</p><p className="mt-1 text-sm text-muted">Your partner dashboard is ready. The owner will enable any additional sections you need.</p></div>}
    </DashboardLayout>
  );
}

function PartnerProfile({ profile, partnerType }) {
  const profilePhoto = profile?.documentUrls?.Photo || (profile?.file_photo ? fileUrl(profile.file_photo) : null);
  const details = [
    ["Company name", profile?.company_name], ["Partner type", partnerType],
    ["Partner roles", (profile?.partner_roles || []).map(titleCase).join(", ")],
    ["Contact person", profile?.contact_name], ["Email", profile?.email], ["Phone", profile?.phone],
    ["Gender", profile?.gender], ["Date of birth", profile?.dob ? new Date(profile.dob).toLocaleDateString("en-IN") : ""],
    ["Address", profile?.address], ["City", profile?.city], ["District", profile?.district], ["State", profile?.state], ["PIN code", profile?.pincode],
    ["Assigned locations", (profile?.assigned_locations || []).map(titleCase).join(", ")],
    ["System types", (profile?.system_types || []).map(titleCase).join(", ")],
    ["GST number", profile?.gst_number], ["PAN number", profile?.pan_number], ["Aadhaar number", profile?.aadhaar_number], ["MSME number", profile?.msme_number],
    ["Experience (years)", profile?.experience_years], ["Description", profile?.description],
    ["Bank name", profile?.bank_name], ["Account number", profile?.account_number], ["IFSC code", profile?.ifsc_code],
    ["Commission model", profile?.commission_model ? titleCase(profile.commission_model) : ""],
    ["On-Grid commission", profile?.commission_rates?.on_grid != null ? `₹${Number(profile.commission_rates.on_grid).toLocaleString("en-IN")}` : ""],
    ["Hybrid commission", profile?.commission_rates?.hybrid != null ? `₹${Number(profile.commission_rates.hybrid).toLocaleString("en-IN")}` : ""],
  ];
  const documents = Object.entries(profile?.documentUrls || {}).filter(([label]) => label !== "Photo");
  return <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
    <div className="relative border-b border-navy/10 pb-6">
      <div className="relative h-36 overflow-hidden bg-gradient-to-r from-navy via-navy to-[#263c60] sm:h-40"><div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-amber/20" /><div className="pointer-events-none absolute right-40 top-14 h-28 w-28 rounded-full bg-amber/10" /><div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber via-amber/60 to-transparent" /><div className="absolute right-5 top-5 flex flex-wrap justify-end gap-2"><span className="rounded-full bg-amber px-3 py-1 font-mono text-[11px] font-bold text-navy">Partner #{profile?.id || "—"}</span>{profile?.status && <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white">{titleCase(profile.status)}</span>}<span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white">{partnerType}</span></div></div>
      <div className="-mt-14 flex flex-wrap items-end gap-4 px-5 sm:-mt-16 sm:px-6">
        {profilePhoto ? <img src={profilePhoto} alt="Partner profile" onError={(event) => event.currentTarget.remove()} className="relative z-10 h-28 w-28 rounded-full border border-navy/10 object-cover shadow-lg ring-4 ring-white sm:h-32 sm:w-32" /> : <div className="relative z-10 grid h-28 w-28 place-items-center rounded-full bg-amber-soft text-3xl font-extrabold text-navy shadow-lg ring-4 ring-white sm:h-32 sm:w-32"><UserRound size={34} /></div>}
        <div className="min-w-[240px] flex-1 pb-1 sm:pb-2"><h2 className="break-words text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{profile?.company_name || profile?.contact_name || "Partner Profile"}</h2><div className="mt-3 flex flex-wrap gap-2">{profile?.contact_name && <span className="rounded-full bg-offwhite px-3 py-1.5 text-xs font-semibold text-navy">{profile.contact_name}</span>}{profile?.phone && <span className="rounded-full bg-offwhite px-3 py-1.5 text-xs font-semibold text-navy">{profile.phone}</span>}{profile?.email && <span className="break-all rounded-full bg-offwhite px-3 py-1.5 text-xs font-semibold text-navy">{profile.email}</span>}</div><p className="mt-3 text-xs text-muted">{profile?.created_at ? `Partner since ${new Date(profile.created_at).toLocaleDateString("en-IN")}` : "Partner account profile"}</p></div>
      </div>
    </div>
    <div className="p-5 sm:p-6"><h3 className="mb-3 text-base font-bold text-navy">Partner details</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{details.map(([label, value]) => <div key={label} className="rounded-xl border border-navy/5 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-navy">{value || "Not provided"}</p></div>)}</div>{documents.length > 0 && <><h3 className="mb-3 mt-6 text-base font-bold text-navy">Uploaded documents</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{documents.map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer" className="rounded-xl border border-navy/10 bg-white p-4 text-sm font-semibold text-navy hover:border-amber">{label}<span className="mt-1 block text-xs font-normal text-muted">Open document</span></a>)}</div></>}</div>
  </section>;
}

function ReferralMargin({ incomingCommission, offeredRates }) {
  const getMargin = (system) => {
    const incoming = incomingCommission?.commission_rates?.[system];
    const offered = offeredRates?.[system];
    if (incoming === undefined || incoming === null || offered === undefined || offered === null || offered === "") return null;
    const margin = Number(incoming) - Number(offered);
    return Number.isFinite(margin) ? margin : null;
  };
  const formatAmount = (amount) => amount < 0
    ? `−₹${Math.abs(amount).toLocaleString("en-IN")}`
    : `₹${amount.toLocaleString("en-IN")}`;
  const onGrid = getMargin("on_grid");
  const hybrid = getMargin("hybrid");

  return <div className="mt-3 rounded-xl border border-amber/20 bg-amber-50/70 p-3 text-sm">
    <p className="font-semibold text-navy">Your estimated commission left per completed installation for this referral</p>
    <p className="mt-1 text-xs text-muted">Your rate from the referrer minus the amount you offer this partner.</p>
    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-navy">
      <span>On-Grid: <strong>{onGrid === null ? "Set both rates" : formatAmount(onGrid)}</strong></span>
      <span>Hybrid: <strong>{hybrid === null ? "Set both rates" : formatAmount(hybrid)}</strong></span>
    </div>
  </div>;
}

function PartnerCommissionSection() {
  const [items, setItems] = useState([]);
  const [incomingCommission, setIncomingCommission] = useState(null);
  const [offerLoading, setOfferLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getMyPartnerHierarchy().then((response) => {
      if (active) setIncomingCommission(response.data?.partner?.incoming_commission || null);
    }).catch(() => {
      if (active) setIncomingCommission(null);
    }).finally(() => { if (active) setOfferLoading(false); });
    getMyCommissionPayouts().then((response) => {
      if (active) setItems(response.data?.items || []);
    }).catch((err) => {
      if (active) setError(err.message || "Could not load commission history.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const totalFor = (status) => status === "paid"
    ? items.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0)
    : items.filter((item) => item.status === status).reduce((sum, item) => sum + Number(status === "approved" ? item.outstanding_amount : item.amount || 0), 0);
  const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  return <section className="space-y-5">
    <div className="rounded-2xl border border-amber/30 bg-amber-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h2 className="font-bold text-navy">Agreed commission rates</h2><p className="mt-1 text-sm text-muted">Your referrer’s offer for each completed installation.</p></div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted">Per completed installation</span>
      </div>
      {offerLoading ? <div className="mt-4 flex items-center gap-2 text-sm text-muted"><Loader2 size={16} className="animate-spin text-amber"/>Loading rates…</div>
        : <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[['On-Grid', incomingCommission?.commission_rates?.on_grid], ['Hybrid', incomingCommission?.commission_rates?.hybrid]].map(([label, amount]) => <div key={label} className="rounded-xl border border-navy/10 bg-white p-4"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-1 text-xl font-extrabold text-navy">{amount === undefined || amount === null ? "Not set" : `₹${Number(amount).toLocaleString("en-IN")}`}</p></div>)}
        </div>}
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      {[["Pending review", "pending"], ["Approved", "approved"], ["Paid", "paid"]].map(([label, status]) => <div key={status} className="rounded-2xl border border-navy/10 bg-white p-4"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-1 text-xl font-extrabold text-navy">{money(totalFor(status))}</p></div>)}
    </div>
    <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
      <div className="flex items-center gap-2 border-b border-navy/10 px-5 py-4"><Banknote size={18} className="text-amber"/><h2 className="font-bold text-navy">Commission records</h2></div>
      {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-amber"/></div>
        : error ? <p role="alert" className="p-5 text-sm text-red-600">{error}</p>
        : !items.length ? <p className="p-5 text-sm text-muted">No commission has been recorded yet. It appears after an assigned project reaches installation completed and an applicable commission offer exists.</p>
        : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b border-navy/10 text-left text-xs text-muted"><th className="p-3">Project</th><th className="p-3">System</th><th className="p-3">Commission</th><th className="p-3">Status</th><th className="p-3">Payment reference</th><th className="p-3">History</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-navy/5 last:border-0"><td className="p-3"><p className="font-mono text-xs">{item.application_no}</p><p className="mt-1 font-semibold text-navy">{item.customer_name || "Customer"}</p><p className="mt-1 text-xs text-muted">Payer: {item.payer_name}</p></td><td className="p-3">{titleCase(item.system_type)}</td><td className="p-3 font-bold text-navy">{money(item.amount)}</td><td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "paid" ? "bg-emerald-50 text-emerald-700" : item.status === "cancelled" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-navy"}`}>{titleCase(item.status)}</span></td><td className="p-3 text-xs">{item.payment_reference || "—"}</td><td className="p-3 text-xs text-muted"><p>Recorded: {formatDateTime(item.created_at)}</p>{item.paid_at && <p className="mt-1">Paid: {formatDateTime(item.paid_at)}{item.paid_by_name ? ` · by ${item.paid_by_name}` : ""}</p>}</td></tr>)}</tbody></table></div>}
      <div className="border-t border-navy/10 p-5"><h3 className="font-bold text-navy">Payment details and proof</h3>{items.some((item) => item.payments?.length) ? <div className="mt-3 grid gap-3 md:grid-cols-2">{items.flatMap((item) => (item.payments || []).map((payment) => <article key={payment.id} className="rounded-xl border border-navy/10 bg-slate-50 p-4 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>{item.recipient_name}</strong><strong>{money(payment.amount)}</strong></div><p className="mt-1 text-xs text-muted">{item.recipient_phone || ""}{item.recipient_state ? ` · ${item.recipient_state}` : ""}</p><p className="mt-2">Paid {formatDateTime(payment.paid_at)} by {payment.paid_by_name || "Owner"}</p><p className="text-xs text-muted">{payment.payment_method?.replace("_", " ")} · UPI/number: {payment.upi_id_or_number || "—"}</p><p className="text-xs text-muted">Transaction reference: {payment.payment_reference || "Not provided"}</p>{payment.payment_proof_url && <a href={payment.payment_proof_url} target="_blank" rel="noreferrer" className="mt-2 inline-block font-semibold text-blue-700 underline">Open payment proof</a>}</article>))}</div> : <p className="mt-2 text-sm text-muted">No payment proof is available yet.</p>}</div>
      <p className="border-t border-navy/10 px-5 py-3 text-xs text-muted">Commission is recorded when installation is completed. Payment records and proof appear here after the owner records each transfer.</p>
    </div>
  </section>;
}
