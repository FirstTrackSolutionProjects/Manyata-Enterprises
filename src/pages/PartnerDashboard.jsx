import { useEffect, useState } from "react";
import { Building2, FileText, Search, Loader2, Network } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import DashboardWelcome from "../components/DashboardWelcome";
import { useAuth } from "../contexts/AuthContext";
import { getMyPartnerApplications, getMyPartnerHierarchy, setMyChildPartnerCommission } from "../services/api";
import { hasActionPermission } from "../utils/permissions";

const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—";
const titleCase = (value = "") => String(value).replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function PartnerDashboard() {
  const { user } = useAuth();
  const partnerType = ({ super_vendor: "Super-vendor", vendor: "Vendor", sub_vendor: "Sub-vendor", sub_vendor_commission: "Sub-vendor", dealer: "Dealer" })[user?.partnerType] || "Partner";
  const canViewApplications = hasActionPermission(user, "applications", "view");
  const [section, setSection] = useState("dashboard");
  const [hierarchy, setHierarchy] = useState([]);
  const [incomingCommission, setIncomingCommission] = useState(null);
  const [commissionDrafts, setCommissionDrafts] = useState({});
  const [savingCommissionId, setSavingCommissionId] = useState(null);
  const [commissionNotice, setCommissionNotice] = useState("");
  const [regionCounts, setRegionCounts] = useState({ odisha: 0, west_bengal: 0 });
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getMyPartnerHierarchy().then((response) => {
      if (!active) return;
      const children = response.data.children || [];
      setHierarchy(children);
      setIncomingCommission(response.data.partner?.incoming_commission || null);
      const chain = [response.data.partner, ...children].filter(Boolean);
      const counts = { odisha: 0, west_bengal: 0 };
      chain.forEach((partner) => {
        const state = String(partner.state || "").toLowerCase().replace(/[\s_-]/g, "");
        if (["odisha", "orissa", "udisa", "odisa"].includes(state)) counts.odisha += 1;
        if (["westbengal", "westbangol", "westbangal", "kolkata"].includes(state)) counts.west_bengal += 1;
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
        const response = await getMyPartnerApplications({ page: String(page), limit: "20", search: search.trim() });
        if (!active) return;
        setApplications(response.data.items || []);
        setTotal(response.data.total || 0);
        setPages(response.data.pages || 1);
      } catch (err) {
        if (active) setError(err.message || "Could not load your applications.");
      } finally {
        if (active) setLoading(false);
      }
    }, 180);
    return () => { active = false; clearTimeout(timer); };
  }, [canViewApplications, page, search]);

  return (
    <DashboardLayout
      title={section === "applications" ? "Applications" : "Partner Dashboard"}
      subtitle={section === "applications" ? `Applications assigned to ${user?.partnerCompanyName || user?.name}.` : `${partnerType} dashboard`}
      activeSection={section}
      onSectionChange={setSection}
    >
      {section === "dashboard" ? <>
        <div className="mb-6">
          <DashboardWelcome name={user?.partnerCompanyName || user?.name || partnerType} description="Your partner account details and the sections the owner has allowed you to access." />
        </div>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-xs font-semibold text-muted">Partner Name</p><p className="mt-1 text-lg font-extrabold text-navy">{user?.partnerCompanyName || user?.name || "—"}</p></div>
          <div className="rounded-2xl border border-navy/10 bg-white p-5"><p className="flex items-center gap-2 text-xs font-semibold text-muted"><Building2 size={15} /> Partner Type</p><p className="mt-1 text-lg font-extrabold text-navy">{partnerType}</p></div>
          <div className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-xs font-semibold text-muted">Partner Login ID</p><p className="mt-1 font-mono text-lg font-extrabold text-navy">{user?.userId || user?.user_id || "—"}</p></div>
          <div className="rounded-2xl border border-navy/10 bg-white p-5 sm:col-span-2 lg:col-span-3"><p className="text-xs font-semibold text-muted">Contact email</p><p className="mt-1 font-bold text-navy">{user?.email || "—"}</p></div>
          {canViewApplications && <button onClick={() => setSection("applications")} className="rounded-2xl border border-navy/10 bg-white p-5 text-left hover:border-amber"><p className="flex items-center gap-2 text-xs font-semibold text-muted"><FileText size={15} /> Your Applications</p><p className="mt-1 text-2xl font-extrabold text-navy">{total}</p></button>}
        </div>
        <div className="mb-6 grid grid-cols-2 gap-4 sm:max-w-2xl">
          <div className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-xs font-semibold text-muted">Odisha Partners in Your Chain</p><p className="mt-2 text-2xl font-extrabold text-navy">{regionCounts.odisha}</p></div>
          <div className="rounded-2xl border border-navy/10 bg-white p-5"><p className="text-xs font-semibold text-muted">West Bengal Partners in Your Chain</p><p className="mt-2 text-2xl font-extrabold text-navy">{regionCounts.west_bengal}</p></div>
        </div>
        {incomingCommission && <div className="mb-6 rounded-2xl border border-amber/30 bg-amber-50 p-5"><h2 className="text-sm font-bold text-navy">Your commission from direct referrer</h2><div className="mt-3 flex flex-wrap gap-6 text-sm text-navy"><span>On-Grid: <strong>{incomingCommission.commission_rates?.on_grid === undefined ? "Not set" : `₹${Number(incomingCommission.commission_rates.on_grid).toLocaleString("en-IN")}`}</strong></span><span>Hybrid: <strong>{incomingCommission.commission_rates?.hybrid === undefined ? "Not set" : `₹${Number(incomingCommission.commission_rates.hybrid).toLocaleString("en-IN")}`}</strong></span><span className="text-muted">Per completed installation</span></div></div>}
        {canViewApplications && <div className="rounded-2xl border border-navy/10 bg-white p-5"><h2 className="text-sm font-bold text-navy">Your Applications</h2><p className="mt-1 text-sm text-muted">{total} applications assigned to your partner account.</p><button onClick={() => setSection("applications")} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber hover:underline"><FileText size={15} /> Open applications</button></div>}
        <div className="mt-6 rounded-2xl border border-navy/10 bg-white p-5"><h2 className="flex items-center gap-2 text-sm font-bold text-navy"><Network size={16} /> Referral Chain</h2><p className="mt-1 text-sm text-muted">Set the commission you offer to each direct referral. Each partner can see only the amount offered to them.</p>{commissionNotice && <p role="status" className="mt-3 text-sm text-amber">{commissionNotice}</p>}<div className="mt-3 divide-y divide-navy/5">{hierarchy.length ? hierarchy.map((item) => { const direct = Number(item.depth) === 1; const rates = item.referral_commission_rates || {}; const draft = commissionDrafts[item.id] || {}; return <div key={item.id} className="py-4"><div className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-navy" style={{ paddingLeft: `${Math.min(Number(item.depth || 1) - 1, 3) * 18}px` }}>{item.company_name || item.contact_name}</span><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-navy">{({ super_vendor: "Super-vendor", vendor: "Vendor", sub_vendor: "Sub-vendor", dealer: "Dealer" })[item.partner_type] || item.partner_type}</span></div>{direct && <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="text-xs font-semibold text-muted">On-Grid amount<input type="number" min="0" step="1" value={draft.on_grid ?? rates.on_grid ?? ""} onChange={(event) => setCommissionDrafts((current) => ({ ...current, [item.id]: { ...(current[item.id] || {}), on_grid: event.target.value } }))} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy" /></label><label className="text-xs font-semibold text-muted">Hybrid amount<input type="number" min="0" step="1" value={draft.hybrid ?? rates.hybrid ?? ""} onChange={(event) => setCommissionDrafts((current) => ({ ...current, [item.id]: { ...(current[item.id] || {}), hybrid: event.target.value } }))} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy" /></label><button onClick={() => saveChildCommission(item)} disabled={savingCommissionId === item.id} className="rounded-full bg-amber px-4 py-2 text-xs font-bold text-navy disabled:opacity-50">{savingCommissionId === item.id ? "Saving..." : "Save offer"}</button></div>}{!direct && <p className="mt-1 text-xs text-muted" style={{ paddingLeft: `${Math.min(Number(item.depth || 1) - 1, 3) * 18}px` }}>Commission amounts are private to this partner and their direct referrer.</p>}</div>; }) : <p className="py-3 text-sm text-muted">No referrals in your chain yet.</p>}</div></div>
      </> : canViewApplications ? <>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-muted">Only applications assigned to your partner account are listed here.</p></div><div className="rounded-xl border border-navy/10 bg-white px-4 py-2"><span className="text-xs text-muted">Total </span><strong className="text-navy">{total}</strong></div></div>
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by name, phone, email, or application no." className="w-full rounded-lg border border-navy/15 bg-white py-3 pl-9 pr-4 text-sm focus:border-amber focus:outline-none" /></div>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-4 overflow-x-auto rounded-2xl border border-navy/10 bg-white">
          <table className="w-full min-w-[780px] text-sm"><thead><tr className="border-b border-navy/10 text-left text-xs font-semibold text-muted"><th className="p-3">App No</th><th className="p-3">Created</th><th className="p-3">Customer</th><th className="p-3">Phone</th><th className="p-3">Location</th><th className="p-3">System</th><th className="p-3">Status</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan="7" className="p-8 text-center text-muted"><Loader2 className="mx-auto animate-spin text-amber" /></td></tr> : applications.length ? applications.map((application) => <tr key={application.id} className="border-b border-navy/5 last:border-0"><td className="p-3 font-mono text-xs">{application.application_no}</td><td className="p-3 text-xs text-muted">{formatDateTime(application.created_at)}</td><td className="p-3 font-semibold text-navy">{application.full_name}</td><td className="p-3">{application.phone_number}</td><td className="p-3">{application.location === "kolkata" ? "West Bengal" : titleCase(application.location)}</td><td className="p-3">{titleCase(application.system_size)} · {titleCase(application.system_type)}</td><td className="p-3"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-navy">{titleCase(application.status)}</span></td></tr>) : <tr><td colSpan="7" className="p-8 text-center text-sm text-muted">No applications found for this partner.</td></tr>}</tbody>
          </table>
        </div>
        {pages > 1 && <div className="mt-4 flex items-center justify-center gap-3"><button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-lg border border-navy/15 px-3 py-2 text-xs font-semibold disabled:opacity-40">Previous</button><span className="text-xs text-muted">Page {page} of {pages}</span><button onClick={() => setPage((current) => Math.min(pages, current + 1))} disabled={page === pages} className="rounded-lg border border-navy/15 px-3 py-2 text-xs font-semibold disabled:opacity-40">Next</button></div>}
      </> : <div className="rounded-2xl border border-navy/10 bg-white p-6"><p className="text-lg font-bold text-navy">{user?.partnerCompanyName || user?.name}</p><p className="mt-1 text-sm text-muted">Your partner dashboard is ready. The owner will enable any additional sections you need.</p></div>}
    </DashboardLayout>
  );
}
