import { useEffect, useState } from "react";
import {
  Building2, FileText, Search, Loader2, Network, Banknote, UserRound, Filter, RotateCcw, Eye, X,
  Mail, KeyRound, MapPin, BadgeCheck, Phone, Wallet, Clock, CheckCircle2, ExternalLink,
  ChevronLeft, ChevronRight, Inbox, ArrowUpRight, Layers,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import DashboardWelcome from "../components/DashboardWelcome";
import { useAuth } from "../contexts/AuthContext";
import { fileUrl, getMyCommissionPayouts, getMyPartnerApplications, getMyPartnerHierarchy, setMyChildPartnerCommission } from "../services/api";
import { hasActionPermission } from "../utils/permissions";
import { formatApplicationLocation } from "../utils/applicationLocation";
import { APPLICATION_STATUSES, applicationStatusLabel } from "../constants/applicationStatuses";

const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—";
const titleCase = (value = "") => String(value).replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
const rupees = (value) => `₹${Number(value).toLocaleString("en-IN")}`;
const initialsOf = (name = "") => String(name).trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "•";
const PARTNER_TYPE_LABELS = { super_vendor: "Super-vendor", vendor: "Vendor", sub_vendor: "Sub-vendor", sub_vendor_commission: "Sub-vendor", dealer: "Dealer" };
const EMPTY_FILTERS = { status: "", location: "", salesExecutive: "", systemType: "", systemSize: "", fromDate: "", toDate: "", sortBy: "created_at", sortOrder: "desc" };

/* ---------- small shared building blocks (same palette as before) ---------- */

const cardBase = "rounded-2xl border border-navy/10 bg-white shadow-sm transition duration-200";
const inputBase = "mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy transition focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30";

function IconChip({ icon: Icon, size = 18 }) {
  return <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-soft text-navy"><Icon size={size} /></span>;
}

function StatCard({ icon, label, value, mono = false, onClick, hint }) {
  const body = <>
    <div className="flex items-start justify-between gap-3">
      <IconChip icon={icon} />
      {onClick && <ArrowUpRight size={16} className="text-muted transition group-hover:text-navy" />}
    </div>
    <p className="mt-4 text-xs font-semibold text-muted">{label}</p>
    <p className={`mt-1 break-words text-lg font-extrabold leading-snug text-navy ${mono ? "font-mono" : ""}`}>{value}</p>
    {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
  </>;
  return onClick
    ? <button type="button" onClick={onClick} className={`${cardBase} group p-5 text-left hover:-translate-y-0.5 hover:border-amber hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber`}>{body}</button>
    : <div className={`${cardBase} p-5`}>{body}</div>;
}

function Panel({ icon: Icon, title, description, action, children, className = "" }) {
  return <section className={`${cardBase} overflow-hidden ${className}`}>
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-navy/5 px-5 py-4">
      <div className="flex items-start gap-3">
        {Icon && <IconChip icon={Icon} size={17} />}
        <div><h2 className="text-base font-bold text-navy">{title}</h2>{description && <p className="mt-0.5 max-w-2xl text-sm text-muted">{description}</p>}</div>
      </div>
      {action}
    </header>
    <div className="p-5">{children}</div>
  </section>;
}

function EmptyState({ icon: Icon = Inbox, title, text }) {
  return <div className="grid place-items-center px-6 py-10 text-center">
    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-soft text-navy"><Icon size={24} /></span>
    <p className="mt-4 text-sm font-bold text-navy">{title}</p>
    {text && <p className="mt-1 max-w-md text-sm text-muted">{text}</p>}
  </div>;
}

function Pill({ children, tone = "amber" }) {
  const tones = {
    amber: "bg-amber-50 text-navy",
    emerald: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-100 text-slate-600",
    white: "bg-white text-muted",
  };
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{children}</span>;
}

function Avatar({ src, name, size = "h-10 w-10" }) {
  return src
    ? <img src={src} alt={`${name || "Partner"} profile`} className={`${size} shrink-0 rounded-full border border-navy/10 object-cover`} />
    : <span className={`${size} grid shrink-0 place-items-center rounded-full bg-amber-soft text-xs font-extrabold text-navy`}>{initialsOf(name)}</span>;
}

function SkeletonRows({ cols, rows = 5 }) {
  return Array.from({ length: rows }).map((_, row) => <tr key={row} className="border-b border-navy/5">
    {Array.from({ length: cols }).map((__, col) => <td key={col} className="p-3"><div className="h-4 animate-pulse rounded bg-slate-100" style={{ width: `${55 + ((row + col) % 4) * 12}%` }} /></td>)}
  </tr>);
}

function RateBox({ label, amount }) {
  const missing = amount === undefined || amount === null;
  return <div className="rounded-xl border border-navy/10 bg-white p-4">
    <p className="text-xs font-semibold text-muted">{label}</p>
    <p className={`mt-1 font-extrabold ${missing ? "text-base text-muted" : "text-xl text-navy"}`}>{missing ? "Not set" : rupees(amount)}</p>
  </div>;
}

/* ------------------------------- main page -------------------------------- */

export default function PartnerDashboard() {
  const { user } = useAuth();
  const partnerType = PARTNER_TYPE_LABELS[user?.partnerType] || "Partner";
  const partnerRoles = [...new Set([user?.partnerType, ...(Array.isArray(user?.partnerRoles) ? user.partnerRoles : [])].filter(Boolean))];
  const partnerRoleLabels = partnerRoles.map((role) => PARTNER_TYPE_LABELS[role] || role);
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
  const [applicationFilters, setApplicationFilters] = useState(EMPTY_FILTERS);
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

  useEffect(() => {
    if (!selectedApplication) return undefined;
    const onKey = (event) => { if (event.key === "Escape") setSelectedApplication(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedApplication]);

  const setFilter = (key, value) => { setApplicationFilters((current) => ({ ...current, [key]: value })); setPage(1); };
  const setDraft = (id, key, value) => setCommissionDrafts((current) => ({ ...current, [id]: { ...(current[id] || {}), [key]: value } }));

  const filterChips = [
    applicationFilters.status && ["status", `Status: ${applicationStatusLabel(applicationFilters.status)}`],
    applicationFilters.location && ["location", `Location: ${titleCase(applicationFilters.location === "kolkata" ? "west_bengal" : applicationFilters.location)}`],
    applicationFilters.salesExecutive && ["salesExecutive", `Sales Exec: ${applicationFilters.salesExecutive}`],
    applicationFilters.systemType && ["systemType", `Type: ${titleCase(applicationFilters.systemType)}`],
    applicationFilters.systemSize && ["systemSize", `Size: ${titleCase(applicationFilters.systemSize)}`],
    applicationFilters.fromDate && ["fromDate", `From: ${applicationFilters.fromDate}`],
    applicationFilters.toDate && ["toDate", `To: ${applicationFilters.toDate}`],
  ].filter(Boolean);

  return (
    <DashboardLayout
      title={section === "applications" ? "Applications" : section === "commissions" ? "Commission History" : section === "profile" ? "Partner Profile" : "Partner Dashboard"}
      subtitle={section === "applications" ? `Applications assigned to ${user?.partnerCompanyName || user?.name} and partners under your referral chain.` : section === "commissions" ? "Your earned, approved, and paid commission records." : section === "profile" ? "Your partner account and contact details." : `${partnerType} dashboard`}
      activeSection={section}
      onSectionChange={setSection}
      profilePhoto={partnerProfile?.documentUrls?.Photo || (partnerProfile?.file_photo ? fileUrl(partnerProfile.file_photo) : null)}
    >
      <style>{`
        @keyframes pd-slide-in { from { transform: translateX(32px); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes pd-fade-in { from { opacity: 0 } to { opacity: 1 } }
        .pd-drawer { animation: pd-slide-in .22s ease-out }
        .pd-backdrop { animation: pd-fade-in .2s ease-out }
        @media (prefers-reduced-motion: reduce) { .pd-drawer, .pd-backdrop { animation: none } }
      `}</style>

      {section === "commissions" ? <PartnerCommissionSection />
        : section === "profile" ? <PartnerProfile profile={partnerProfile} partnerType={partnerType} />
        : section === "dashboard" ? <div className="space-y-6">
          <DashboardWelcome name={user?.partnerCompanyName || user?.name || partnerType} description="Your partner account details and the sections the owner has allowed you to access." />

          {/* Account overview */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard icon={UserRound} label="Partner name" value={user?.partnerCompanyName || user?.name || "—"} />
            <StatCard icon={BadgeCheck} label="Partner roles" value={partnerRoleLabels.join(", ") || partnerType} />
            <StatCard icon={KeyRound} label="Partner login ID" value={user?.userId || user?.user_id || "—"} mono />
            <StatCard icon={Mail} label="Contact email" value={user?.email || "—"} />
            {canViewApplications && <StatCard icon={FileText} label="Your applications" value={total} onClick={() => setSection("applications")} hint="Open the full list" />}
            <div className={`${cardBase} p-5`}>
              <IconChip icon={MapPin} />
              <p className="mt-4 text-xs font-semibold text-muted">Assigned locations</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {assignedLocationLabels.length
                  ? assignedLocationLabels.map((location) => <span key={location} className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-navy">{location}</span>)
                  : <span className="text-sm text-muted">No locations assigned. Contact the owner.</span>}
              </div>
            </div>
          </div>

          {/* Branches */}
          <Panel icon={Building2} title="Branches in your district" description="Matched using your partner profile state and district.">
            {districtBranches.length
              ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{districtBranches.map((branch) => <article key={branch.id} className="rounded-xl border border-navy/10 bg-slate-50 p-4 transition hover:border-amber">
                <div className="flex items-start gap-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-navy"><MapPin size={15} /></span>
                  <div className="min-w-0"><p className="font-bold text-navy">{branch.name}</p><p className="mt-0.5 text-sm text-muted">{branch.district}, {branch.state}</p>{branch.address && <p className="mt-1 text-xs text-muted">{branch.address}</p>}</div></div>
              </article>)}</div>
              : <EmptyState icon={MapPin} title="No branch in your district yet" text={`No active branch matches ${partnerProfile?.district ? `${partnerProfile.district}, ${partnerProfile.state || ""}` : "your district"}.`} />}
          </Panel>

          {/* Region counts */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:max-w-4xl">
            {[["Odisha partners in your chain", regionCounts.odisha], ["West Bengal partners in your chain", regionCounts.west_bengal]].map(([label, count]) => <div key={label} className={`${cardBase} flex items-center justify-between gap-4 p-5`}>
              <div><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-2 text-3xl font-extrabold text-navy">{count}</p></div>
              <IconChip icon={Layers} />
            </div>)}
          </div>

          {/* Incoming commission */}
          {incomingCommission && <section className="rounded-2xl border border-amber/30 bg-amber-50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-start gap-3"><IconChip icon={Wallet} /><div><h2 className="text-base font-bold text-navy">Your commission from direct referrer</h2><p className="mt-0.5 text-sm text-muted">What you earn on each completed installation.</p></div></div>
              <Pill tone="white">Per completed installation</Pill>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:max-w-3xl">
              <RateBox label="On-Grid" amount={incomingCommission.commission_rates?.on_grid} />
              <RateBox label="Hybrid" amount={incomingCommission.commission_rates?.hybrid} />
            </div>
          </section>}

          {/* Referral chain */}
          <Panel icon={Network} title="Referral chain" description="See partner offers throughout your downstream chain. You can set or edit the offer for your direct referrals; upstream partner details stay private.">
            {commissionNotice && <p role="status" className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-navy"><CheckCircle2 size={16} className="text-amber" />{commissionNotice}</p>}
            {hierarchy.length ? <div className="space-y-3">{hierarchy.map((item) => {
              const direct = Number(item.depth) === 1;
              const rates = item.referral_commission_rates || {};
              const draft = commissionDrafts[item.id] || {};
              const level = Math.min(Number(item.depth || 1) - 1, 3);
              const name = item.company_name || item.contact_name;
              return <article key={item.id} className="relative rounded-xl border border-navy/10 bg-white p-4" style={{ marginLeft: `${level * 20}px` }}>
                {level > 0 && <span aria-hidden="true" className="absolute -left-3 top-0 h-full w-px bg-navy/10" />}
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar src={item.file_photo ? fileUrl(item.file_photo) : null} name={name} />
                    <div className="min-w-0"><p className="truncate font-semibold text-navy">{name}</p><p className="text-xs text-muted">{direct ? "Direct referral" : `Level ${item.depth || 1} in your chain`}</p></div>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-navy">{PARTNER_TYPE_LABELS[item.partner_type] || item.partner_type}</span>
                </div>
                {direct ? <>
                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <label className="text-xs font-semibold text-muted">On-Grid offer (₹)
                      <input type="number" min="0" step="1" value={draft.on_grid ?? rates.on_grid ?? ""} onChange={(event) => setDraft(item.id, "on_grid", event.target.value)} className={inputBase} /></label>
                    <label className="text-xs font-semibold text-muted">Hybrid offer (₹)
                      <input type="number" min="0" step="1" value={draft.hybrid ?? rates.hybrid ?? ""} onChange={(event) => setDraft(item.id, "hybrid", event.target.value)} className={inputBase} /></label>
                    <button onClick={() => saveChildCommission(item)} disabled={savingCommissionId === item.id} className="inline-flex items-center justify-center gap-2 rounded-full bg-amber px-5 py-2.5 text-xs font-bold text-navy shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-navy disabled:opacity-50">
                      {savingCommissionId === item.id ? <><Loader2 size={14} className="animate-spin" />Saving…</> : "Save offer"}</button>
                  </div>
                  <ReferralMargin incomingCommission={incomingCommission} offeredRates={{ on_grid: draft.on_grid ?? rates.on_grid, hybrid: draft.hybrid ?? rates.hybrid }} />
                </> : <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                  <p className="text-xs font-semibold text-muted">Offer from their direct referrer · per completed installation</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 sm:max-w-md">
                    <div className="rounded-lg bg-white px-3 py-2"><span className="text-xs text-muted">On-Grid</span><p className="font-bold text-navy">{rates.on_grid === undefined ? "Not set" : rupees(rates.on_grid)}</p></div>
                    <div className="rounded-lg bg-white px-3 py-2"><span className="text-xs text-muted">Hybrid</span><p className="font-bold text-navy">{rates.hybrid === undefined ? "Not set" : rupees(rates.hybrid)}</p></div>
                  </div>
                </div>}
              </article>;
            })}</div>
              : <EmptyState icon={Network} title="No partners linked below you yet" text="Ask the Owner to set your account as the “Referred by” partner in their partner record." />}
          </Panel>
        </div>

        : canViewApplications ? <div className="space-y-5">
          {/* Summary */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-sm text-muted">Applications assigned to your account and partners in your referral chain are listed here.</p>
            <div className={`${cardBase} flex items-center gap-3 px-4 py-2.5`}><FileText size={16} className="text-amber" /><span className="text-xs text-muted">Total</span><strong className="text-lg text-navy">{total}</strong></div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {[["Total Applications", total, "total"], ...applicationCards].map(([label, value, key], index) => <div key={key || label} className={`${cardBase} p-4 ${index === 0 ? "border-amber/40 bg-amber-50" : "hover:border-amber/50"}`}>
              <p className="text-xs font-semibold leading-snug text-muted">{label}</p>
              <p className="mt-2 text-2xl font-extrabold text-navy">{Number(value || 0)}</p>
            </div>)}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by name, phone, email, or application no." className="w-full rounded-xl border border-navy/15 bg-white py-3 pl-10 pr-4 text-sm shadow-sm transition focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30" />
            </div>
            <button type="button" onClick={() => setShowApplicationFilters((shown) => !shown)} aria-expanded={showApplicationFilters} className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold shadow-sm transition ${showApplicationFilters || activePartnerApplicationFilterCount ? "border-amber bg-amber-soft text-navy" : "border-navy/15 bg-white text-navy hover:border-amber"}`}>
              <Filter size={15} /> Filters{activePartnerApplicationFilterCount > 0 && <span className="rounded-full bg-amber px-2 text-xs">{activePartnerApplicationFilterCount}</span>}
            </button>
          </div>

          {showApplicationFilters && <div className={`${cardBase} p-5`}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-xs font-semibold text-muted">Status<select value={applicationFilters.status} onChange={(event) => setFilter("status", event.target.value)} className={inputBase}><option value="">All statuses</option>{APPLICATION_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
              <label className="text-xs font-semibold text-muted">Location<select value={applicationFilters.location} onChange={(event) => setFilter("location", event.target.value)} className={inputBase}><option value="">All assigned locations</option>{assignedLocationLabels.map((location) => <option key={location} value={location === "West Bengal" ? "kolkata" : "odisha"}>{location}</option>)}</select></label>
              <label className="text-xs font-semibold text-muted">Sales Executive<input value={applicationFilters.salesExecutive} onChange={(event) => setFilter("salesExecutive", event.target.value)} placeholder="Search Sales Executive name" className={inputBase} /></label>
              <label className="text-xs font-semibold text-muted">System Type<select value={applicationFilters.systemType} onChange={(event) => setFilter("systemType", event.target.value)} className={inputBase}><option value="">All types</option><option value="on-grid">On-Grid</option><option value="hybrid">Hybrid</option></select></label>
              <label className="text-xs font-semibold text-muted">System Size<select value={applicationFilters.systemSize} onChange={(event) => setFilter("systemSize", event.target.value)} className={inputBase}><option value="">All sizes</option>{["1kw", "2kw", "3kw", "5kw", "10kw"].map((size) => <option key={size} value={size}>{titleCase(size)}</option>)}</select></label>
              <label className="text-xs font-semibold text-muted">From Date<input type="date" value={applicationFilters.fromDate} onChange={(event) => setFilter("fromDate", event.target.value)} className={inputBase} /></label>
              <label className="text-xs font-semibold text-muted">To Date<input type="date" value={applicationFilters.toDate} onChange={(event) => setFilter("toDate", event.target.value)} className={inputBase} /></label>
              <label className="text-xs font-semibold text-muted">Sort By<select value={applicationFilters.sortBy} onChange={(event) => setFilter("sortBy", event.target.value)} className={inputBase}><option value="created_at">Date Created</option><option value="updated_at">Last Updated</option><option value="full_name">Applicant Name</option><option value="status">Status</option><option value="sales_executive_name">Sales Executive</option></select></label>
              <label className="text-xs font-semibold text-muted">Sort Order<select value={applicationFilters.sortOrder} onChange={(event) => setFilter("sortOrder", event.target.value)} className={inputBase}><option value="desc">Newest / Z→A</option><option value="asc">Oldest / A→Z</option></select></label>
            </div>
            <div className="mt-5 flex justify-end">
              <button type="button" onClick={() => { setApplicationFilters(EMPTY_FILTERS); setPage(1); }} className="inline-flex items-center gap-2 rounded-lg border border-navy/15 px-4 py-2 text-xs font-semibold text-navy transition hover:border-amber"><RotateCcw size={13} /> Reset filters</button>
            </div>
          </div>}

          {filterChips.length > 0 && <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted">Active:</span>
            {filterChips.map(([key, label]) => <button key={key} type="button" onClick={() => setFilter(key, "")} className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-navy transition hover:bg-amber-soft" aria-label={`Remove filter ${label}`}>{label}<X size={12} /></button>)}
          </div>}

          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {/* Table */}
          <div className={`${cardBase} overflow-hidden`}>
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full min-w-[1080px] text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50"><tr className="border-b border-navy/10 text-left text-xs font-semibold text-muted">
                  {["App No", "Created", "Customer", "Phone", "Location", "System", "Sales Executive", "Status", "Action"].map((heading) => <th key={heading} className="whitespace-nowrap p-3.5">{heading}</th>)}
                </tr></thead>
                <tbody>
                  {loading ? <SkeletonRows cols={9} />
                    : applications.length ? applications.map((application) => <tr key={application.id} className="border-b border-navy/5 transition hover:bg-amber-50/50 last:border-0">
                      <td className="p-3.5 font-mono text-xs font-semibold text-navy">{application.application_no}</td>
                      <td className="whitespace-nowrap p-3.5 text-xs text-muted">{formatDateTime(application.created_at)}</td>
                      <td className="p-3.5"><div className="flex items-center gap-2.5"><Avatar name={application.full_name} size="h-8 w-8" /><span className="font-semibold text-navy">{application.full_name}</span></div></td>
                      <td className="whitespace-nowrap p-3.5">{application.phone_number}</td>
                      <td className="p-3.5">{formatApplicationLocation(application.location)}</td>
                      <td className="whitespace-nowrap p-3.5"><span className="font-semibold text-navy">{titleCase(application.system_size)}</span><span className="block text-xs text-muted">{titleCase(application.system_type)}</span></td>
                      <td className="p-3.5">{application.sales_executive_name || "—"}</td>
                      <td className="p-3.5"><Pill>{titleCase(application.status)}</Pill></td>
                      <td className="p-3.5"><button type="button" onClick={() => setSelectedApplication(application)} className="inline-flex items-center gap-1.5 rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-amber hover:bg-amber-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-amber"><Eye size={13} /> View</button></td>
                    </tr>)
                      : <tr><td colSpan="9"><EmptyState icon={FileText} title="No applications found" text="Try changing or resetting your search and filters." /></td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail drawer */}
          {selectedApplication && <div className="pd-backdrop fixed inset-0 z-[90] flex justify-end bg-navy/50" onClick={() => setSelectedApplication(null)}>
            <section role="dialog" aria-modal="true" aria-label="Application details" onClick={(event) => event.stopPropagation()} className="pd-drawer flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
              <header className="relative overflow-hidden bg-navy p-6 text-white">
                <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-amber/20" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-amber text-lg font-extrabold text-navy">{initialsOf(selectedApplication.full_name)}</span>
                    <div className="min-w-0"><p className="text-xs text-white/70">Application details</p><h2 className="mt-0.5 truncate text-xl font-extrabold">{selectedApplication.full_name || "Customer"}</h2><p className="mt-1 font-mono text-xs text-white/80">{selectedApplication.application_no}</p></div>
                  </div>
                  <button type="button" onClick={() => setSelectedApplication(null)} className="rounded-full p-2 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber" aria-label="Close"><X size={18} /></button>
                </div>
                <div className="relative mt-4"><span className="rounded-full bg-amber px-3 py-1 text-xs font-bold text-navy">{applicationStatusLabel(selectedApplication.status)}</span></div>
              </header>
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                {[
                  ["Customer", [["Phone", selectedApplication.phone_number], ["Email", selectedApplication.email], ["Location", formatApplicationLocation(selectedApplication.location)], ["System", `${titleCase(selectedApplication.system_size)} · ${titleCase(selectedApplication.system_type)}`]]],
                  ["Referral chain", [["Sales Executive", selectedApplication.sales_executive_name], ["Super-vendor", selectedApplication.super_vendor_name], ["Vendor", selectedApplication.vendor_name], ["Sub-vendor", selectedApplication.sub_vendor_name]]],
                  ["Timeline", [["Created", formatDateTime(selectedApplication.created_at)], ["Last updated", formatDateTime(selectedApplication.updated_at)], ["Updated by", selectedApplication.last_updated_by_name]]],
                ].map(([group, rows]) => <div key={group}>
                  <h3 className="mb-2 text-sm font-bold text-navy">{group}</h3>
                  <div className="grid gap-2.5 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="rounded-xl border border-navy/5 bg-slate-50 p-3"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-1 break-words text-sm font-semibold text-navy">{value || "—"}</p></div>)}</div>
                </div>)}
              </div>
              <footer className="flex justify-end border-t border-navy/10 p-4"><button type="button" onClick={() => setSelectedApplication(null)} className="rounded-full border border-navy/15 px-5 py-2 text-sm font-semibold text-navy transition hover:border-amber hover:bg-amber-soft">Close</button></footer>
            </section>
          </div>}

          {pages > 1 && <div className="flex items-center justify-center gap-3">
            <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="inline-flex items-center gap-1 rounded-lg border border-navy/15 bg-white px-3 py-2 text-xs font-semibold text-navy transition hover:border-amber disabled:opacity-40"><ChevronLeft size={14} />Previous</button>
            <span className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-muted shadow-sm">Page {page} of {pages}</span>
            <button onClick={() => setPage((current) => Math.min(pages, current + 1))} disabled={page === pages} className="inline-flex items-center gap-1 rounded-lg border border-navy/15 bg-white px-3 py-2 text-xs font-semibold text-navy transition hover:border-amber disabled:opacity-40">Next<ChevronRight size={14} /></button>
          </div>}
        </div>

        : <div className={`${cardBase} p-8`}>
          <IconChip icon={Building2} />
          <p className="mt-4 text-lg font-bold text-navy">{user?.partnerCompanyName || user?.name}</p>
          <p className="mt-1 text-sm text-muted">Your partner dashboard is ready. The owner will enable any additional sections you need.</p>
        </div>}
    </DashboardLayout>
  );
}

/* -------------------------------- profile --------------------------------- */

function PartnerProfile({ profile, partnerType }) {
  const profilePhoto = profile?.documentUrls?.Photo || (profile?.file_photo ? fileUrl(profile.file_photo) : null);
  const groups = [
    ["Contact", [
      ["Contact person", profile?.contact_name], ["Email", profile?.email], ["Phone", profile?.phone],
      ["Gender", profile?.gender], ["Date of birth", profile?.dob ? new Date(profile.dob).toLocaleDateString("en-IN") : ""],
    ]],
    ["Address", [
      ["Address", profile?.address], ["City", profile?.city], ["District", profile?.district], ["State", profile?.state], ["PIN code", profile?.pincode],
    ]],
    ["Business", [
      ["Company name", profile?.company_name], ["Partner type", partnerType],
      ["Partner roles", (profile?.partner_roles || []).map(titleCase).join(", ")],
      ["Assigned locations", (profile?.assigned_locations || []).map(titleCase).join(", ")],
      ["System types", (profile?.system_types || []).map(titleCase).join(", ")],
      ["GST number", profile?.gst_number], ["PAN number", profile?.pan_number], ["Aadhaar number", profile?.aadhaar_number], ["MSME number", profile?.msme_number],
      ["Experience (years)", profile?.experience_years], ["Description", profile?.description],
    ]],
    ["Bank & commission", [
      ["Bank name", profile?.bank_name], ["Account number", profile?.account_number], ["IFSC code", profile?.ifsc_code],
      ["Commission model", profile?.commission_model ? titleCase(profile.commission_model) : ""],
      ["On-Grid commission", profile?.commission_rates?.on_grid != null ? rupees(profile.commission_rates.on_grid) : ""],
      ["Hybrid commission", profile?.commission_rates?.hybrid != null ? rupees(profile.commission_rates.hybrid) : ""],
    ]],
  ];
  const documents = Object.entries(profile?.documentUrls || {}).filter(([label]) => label !== "Photo");
  return <section className="space-y-6">
    <div className={`${cardBase} overflow-hidden`}>
      <div className="relative h-36 overflow-hidden bg-gradient-to-r from-navy via-navy to-[#263c60] sm:h-40">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-amber/20" />
        <div className="pointer-events-none absolute right-40 top-14 h-28 w-28 rounded-full bg-amber/10" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber via-amber/60 to-transparent" />
        <div className="absolute right-5 top-5 flex flex-wrap justify-end gap-2">
          <span className="rounded-full bg-amber px-3 py-1 font-mono text-[11px] font-bold text-navy">Partner #{profile?.id || "—"}</span>
          {profile?.status && <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white">{titleCase(profile.status)}</span>}
          <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white">{partnerType}</span>
        </div>
      </div>
      <div className="-mt-14 flex flex-wrap items-end gap-4 px-5 pb-6 sm:-mt-16 sm:px-6">
        {profilePhoto
          ? <img src={profilePhoto} alt="Partner profile" onError={(event) => event.currentTarget.remove()} className="relative z-10 h-28 w-28 rounded-full border border-navy/10 object-cover shadow-lg ring-4 ring-white sm:h-32 sm:w-32" />
          : <div className="relative z-10 grid h-28 w-28 place-items-center rounded-full bg-amber-soft text-3xl font-extrabold text-navy shadow-lg ring-4 ring-white sm:h-32 sm:w-32"><UserRound size={34} /></div>}
        <div className="min-w-[240px] flex-1 pb-1 sm:pb-2">
          <h2 className="break-words text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{profile?.company_name || profile?.contact_name || "Partner Profile"}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile?.contact_name && <span className="inline-flex items-center gap-1.5 rounded-full bg-offwhite px-3 py-1.5 text-xs font-semibold text-navy"><UserRound size={12} />{profile.contact_name}</span>}
            {profile?.phone && <span className="inline-flex items-center gap-1.5 rounded-full bg-offwhite px-3 py-1.5 text-xs font-semibold text-navy"><Phone size={12} />{profile.phone}</span>}
            {profile?.email && <span className="inline-flex items-center gap-1.5 break-all rounded-full bg-offwhite px-3 py-1.5 text-xs font-semibold text-navy"><Mail size={12} />{profile.email}</span>}
          </div>
          <p className="mt-3 text-xs text-muted">{profile?.created_at ? `Partner since ${new Date(profile.created_at).toLocaleDateString("en-IN")}` : "Partner account profile"}</p>
        </div>
      </div>
    </div>

    {groups.map(([group, rows]) => <div key={group} className={`${cardBase} p-5 sm:p-6`}>
      <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-navy"><span className="h-5 w-1 rounded-full bg-amber" />{group}</h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(([label, value]) => <div key={label} className="rounded-xl border border-navy/5 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-muted">{label}</p>
          <p className={`mt-1 whitespace-pre-wrap break-words text-sm font-semibold ${value ? "text-navy" : "text-muted"}`}>{value || "Not provided"}</p>
        </div>)}
      </div>
    </div>)}

    {documents.length > 0 && <div className={`${cardBase} p-5 sm:p-6`}>
      <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-navy"><span className="h-5 w-1 rounded-full bg-amber" />Uploaded documents</h3>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {documents.map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-3 rounded-xl border border-navy/10 bg-white p-4 text-sm font-semibold text-navy transition hover:border-amber hover:bg-amber-50/50">
          <span className="flex items-center gap-3"><IconChip icon={FileText} size={16} /><span>{label}<span className="mt-0.5 block text-xs font-normal text-muted">Open document</span></span></span>
          <ExternalLink size={15} className="text-muted transition group-hover:text-navy" />
        </a>)}
      </div>
    </div>}
  </section>;
}

/* ---------------------------- referral margin ----------------------------- */

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
  const rows = [["On-Grid", getMargin("on_grid")], ["Hybrid", getMargin("hybrid")]];

  return <div className="mt-4 rounded-xl border border-amber/20 bg-amber-50/70 p-4 text-sm">
    <p className="font-semibold text-navy">Your estimated commission left per completed installation</p>
    <p className="mt-0.5 text-xs text-muted">Your rate from the referrer minus the amount you offer this partner.</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2 sm:max-w-md">
      {rows.map(([label, margin]) => <div key={label} className="rounded-lg bg-white px-3 py-2">
        <span className="text-xs text-muted">{label}</span>
        <p className={`font-extrabold ${margin === null ? "text-sm font-semibold text-muted" : margin < 0 ? "text-red-600" : "text-navy"}`}>{margin === null ? "Set both rates" : formatAmount(margin)}</p>
      </div>)}
    </div>
  </div>;
}

/* ------------------------------ commissions ------------------------------- */

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
  const totalCards = [["Pending review", "pending", Clock], ["Approved", "approved", CheckCircle2], ["Paid", "paid", Wallet]];
  const hasPayments = items.some((item) => item.payments?.length);

  return <section className="space-y-6">
    {/* Agreed rates */}
    <div className="rounded-2xl border border-amber/30 bg-amber-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3"><IconChip icon={Banknote} /><div><h2 className="font-bold text-navy">Agreed commission rates</h2><p className="mt-0.5 text-sm text-muted">Your referrer’s offer for each completed installation.</p></div></div>
        <Pill tone="white">Per completed installation</Pill>
      </div>
      {offerLoading ? <div className="mt-4 flex items-center gap-2 text-sm text-muted"><Loader2 size={16} className="animate-spin text-amber" />Loading rates…</div>
        : <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[["On-Grid", incomingCommission?.commission_rates?.on_grid], ["Hybrid", incomingCommission?.commission_rates?.hybrid]].map(([label, amount]) => <div key={label} className="rounded-xl border border-navy/10 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-muted">{label}</p>
            <p className="mt-1 text-2xl font-extrabold text-navy">{amount === undefined || amount === null ? "Not set" : rupees(amount)}</p>
          </div>)}
        </div>}
    </div>

    {/* Totals */}
    <div className="grid gap-4 sm:grid-cols-3">
      {totalCards.map(([label, status, Icon]) => <div key={status} className={`${cardBase} flex items-center justify-between gap-4 p-5 ${status === "paid" ? "border-amber/40" : ""}`}>
        <div><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-1 text-2xl font-extrabold text-navy">{money(totalFor(status))}</p></div>
        <IconChip icon={Icon} />
      </div>)}
    </div>

    {/* Records */}
    <div className={`${cardBase} overflow-hidden`}>
      <div className="flex items-center gap-3 border-b border-navy/10 px-5 py-4"><IconChip icon={Banknote} size={17} /><h2 className="font-bold text-navy">Commission records</h2></div>
      {loading ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><tbody><SkeletonRows cols={6} rows={3} /></tbody></table></div>
        : error ? <p role="alert" className="m-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
        : !items.length ? <EmptyState icon={Banknote} title="No commission recorded yet" text="It appears after an assigned project reaches installation completed and an applicable commission offer exists." />
        : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50"><tr className="border-b border-navy/10 text-left text-xs font-semibold text-muted"><th className="p-3.5">Project</th><th className="p-3.5">System</th><th className="p-3.5">Commission</th><th className="p-3.5">Status</th><th className="p-3.5">Payment reference</th><th className="p-3.5">History</th></tr></thead>
          <tbody>{items.map((item) => <tr key={item.id} className="border-b border-navy/5 transition hover:bg-amber-50/50 last:border-0">
            <td className="p-3.5"><p className="font-mono text-xs text-muted">{item.application_no}</p><p className="mt-1 font-semibold text-navy">{item.customer_name || "Customer"}</p><p className="mt-0.5 text-xs text-muted">Payer: {item.payer_name}</p></td>
            <td className="p-3.5">{titleCase(item.system_type)}</td>
            <td className="p-3.5 text-base font-extrabold text-navy">{money(item.amount)}</td>
            <td className="p-3.5"><Pill tone={item.status === "paid" ? "emerald" : item.status === "cancelled" ? "slate" : "amber"}>{titleCase(item.status)}</Pill></td>
            <td className="p-3.5 text-xs">{item.payment_reference || "—"}</td>
            <td className="p-3.5 text-xs text-muted"><p>Recorded: {formatDateTime(item.created_at)}</p>{item.paid_at && <p className="mt-1">Paid: {formatDateTime(item.paid_at)}{item.paid_by_name ? ` · by ${item.paid_by_name}` : ""}</p>}</td>
          </tr>)}</tbody>
        </table></div>}

      <div className="border-t border-navy/10 p-5">
        <h3 className="font-bold text-navy">Payment details and proof</h3>
        {hasPayments
          ? <div className="mt-4 grid gap-3 md:grid-cols-2">{items.flatMap((item) => (item.payments || []).map((payment) => <article key={payment.id} className="rounded-xl border border-navy/10 bg-slate-50 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-navy">{item.recipient_name}</strong><strong className="text-base text-navy">{money(payment.amount)}</strong></div>
            <p className="mt-1 text-xs text-muted">{item.recipient_phone || ""}{item.recipient_state ? ` · ${item.recipient_state}` : ""}</p>
            <div className="mt-3 space-y-1 rounded-lg bg-white p-3">
              <p className="text-xs text-navy">Paid {formatDateTime(payment.paid_at)} by {payment.paid_by_name || "Owner"}</p>
              <p className="text-xs text-muted">{payment.payment_method?.replace("_", " ")} · UPI/number: {payment.upi_id_or_number || "—"}</p>
              <p className="text-xs text-muted">Transaction reference: {payment.payment_reference || "Not provided"}</p>
            </div>
            {payment.payment_proof_url && <a href={payment.payment_proof_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 underline"><ExternalLink size={13} />Open payment proof</a>}
          </article>))}</div>
          : <p className="mt-2 text-sm text-muted">No payment proof is available yet.</p>}
      </div>
      <p className="border-t border-navy/10 bg-slate-50 px-5 py-3 text-xs text-muted">Commission is recorded when installation is completed. Payment records and proof appear here after the owner records each transfer.</p>
    </div>
  </section>;
}