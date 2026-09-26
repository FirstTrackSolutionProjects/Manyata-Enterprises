import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, FileText, KeyRound, LayoutDashboard, LogOut, Search, UserRound, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { assets } from "../assets/assets";
import { getMyPartnerApplications } from "../services/api";
import { hasActionPermission } from "../utils/permissions";

const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—";
const titleCase = (value = "") => String(value).replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function PartnerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const partnerType = user?.partnerType === "dealer" ? "Dealer" : "Sub-vendor";
  const canViewApplications = hasActionPermission(user, "applications", "view");
  const [section, setSection] = useState("dashboard");
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-offwhite">
      <header className="flex items-center justify-between bg-navy px-5 py-4 text-white sm:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1"><img src={assets.logoImg} alt="Manyata Enterprises" className="h-full w-full object-contain" /></span>
          <div><p className="font-bold text-amber">Manyata Enterprises</p><p className="text-xs text-white/70">{partnerType} Dashboard</p></div>
        </div>
        <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-semibold hover:border-amber"><LogOut size={15} /> Log out</button>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="h-fit rounded-2xl bg-navy p-3 text-white">
          <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/55">Partner Portal</p>
          <button onClick={() => setSection("dashboard")} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${section === "dashboard" ? "bg-amber text-navy" : "text-white/80 hover:bg-white/10"}`}><LayoutDashboard size={17} /> Dashboard</button>
          {canViewApplications && <button onClick={() => setSection("applications")} className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${section === "applications" ? "bg-amber text-navy" : "text-white/80 hover:bg-white/10"}`}><FileText size={17} /> Applications</button>}
          <button onClick={() => navigate("/change-password")} className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-white/80 hover:bg-white/10"><KeyRound size={17} /> Change Password</button>
        </aside>

        <section className="min-w-0">
          {section === "dashboard" ? <>
            <div className="rounded-2xl border border-amber/30 bg-gradient-to-r from-amber-soft to-white p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-amber">{partnerType} Account</p>
              <h1 className="mt-2 text-2xl font-extrabold text-navy sm:text-3xl">Welcome, {user?.partnerCompanyName || user?.name}</h1>
              <p className="mt-2 text-sm text-muted">Your partner dashboard shows your account and any sections the owner has enabled for you.</p>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-navy/10 bg-white p-5"><p className="flex items-center gap-2 text-xs font-semibold text-muted"><UserRound size={15} /> Partner Login ID</p><p className="mt-2 font-mono text-lg font-extrabold text-navy">{user?.userId || user?.user_id || "—"}</p></div>
              <div className="rounded-2xl border border-navy/10 bg-white p-5"><p className="flex items-center gap-2 text-xs font-semibold text-muted"><Building2 size={15} /> Partner Type</p><p className="mt-2 text-lg font-extrabold text-navy">{partnerType}</p></div>
              <div className="rounded-2xl border border-navy/10 bg-white p-5 sm:col-span-2"><p className="text-xs font-semibold text-muted">Contact email</p><p className="mt-2 font-bold text-navy">{user?.email || "—"}</p></div>
              {canViewApplications && <button onClick={() => setSection("applications")} className="rounded-2xl border border-navy/10 bg-white p-5 text-left hover:border-amber"><p className="flex items-center gap-2 text-xs font-semibold text-muted"><FileText size={15} /> Your Applications</p><p className="mt-2 text-2xl font-extrabold text-navy">{total}</p><p className="mt-1 text-xs text-amber">Open application list →</p></button>}
              {!canViewApplications && <div className="rounded-2xl border border-navy/10 bg-white p-5 sm:col-span-2"><p className="font-bold text-navy">More dashboard access</p><p className="mt-1 text-sm text-muted">Applications access has not been enabled. Contact the owner if you need it.</p></div>}
            </div>
          </> : <>
            <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-extrabold text-navy">Your Applications</h1><p className="mt-1 text-sm text-muted">Applications assigned to {user?.partnerCompanyName || user?.name}.</p></div><div className="rounded-xl border border-navy/10 bg-white px-4 py-2"><span className="text-xs text-muted">Total </span><strong className="text-navy">{total}</strong></div></div>
            <div className="relative mt-5"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by name, phone, email, or application no." className="w-full rounded-lg border border-navy/15 bg-white py-3 pl-9 pr-4 text-sm focus:border-amber focus:outline-none" /></div>
            {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="mt-4 overflow-x-auto rounded-2xl border border-navy/10 bg-white">
              <table className="w-full min-w-[780px] text-sm"><thead><tr className="border-b border-navy/10 text-left text-xs font-semibold text-muted"><th className="p-3">App No</th><th className="p-3">Created</th><th className="p-3">Customer</th><th className="p-3">Phone</th><th className="p-3">Location</th><th className="p-3">System</th><th className="p-3">Status</th></tr></thead>
                <tbody>{loading ? <tr><td colSpan="7" className="p-8 text-center text-muted"><Loader2 className="mx-auto animate-spin text-amber" /></td></tr> : applications.length ? applications.map((application) => <tr key={application.id} className="border-b border-navy/5 last:border-0"><td className="p-3 font-mono text-xs">{application.application_no}</td><td className="p-3 text-xs text-muted">{formatDateTime(application.created_at)}</td><td className="p-3 font-semibold text-navy">{application.full_name}</td><td className="p-3">{application.phone_number}</td><td className="p-3">{application.location === "kolkata" ? "West Bengal" : titleCase(application.location)}</td><td className="p-3">{titleCase(application.system_size)} · {titleCase(application.system_type)}</td><td className="p-3"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-navy">{titleCase(application.status)}</span></td></tr>) : <tr><td colSpan="7" className="p-8 text-center text-sm text-muted">No applications found for this partner.</td></tr>}</tbody>
              </table>
            </div>
            {pages > 1 && <div className="mt-4 flex items-center justify-center gap-3"><button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="inline-flex items-center gap-1 rounded-lg border border-navy/15 px-3 py-2 text-xs font-semibold disabled:opacity-40"><ChevronLeft size={14} /> Previous</button><span className="text-xs text-muted">Page {page} of {pages}</span><button onClick={() => setPage((current) => Math.min(pages, current + 1))} disabled={page === pages} className="inline-flex items-center gap-1 rounded-lg border border-navy/15 px-3 py-2 text-xs font-semibold disabled:opacity-40">Next <ChevronRight size={14} /></button></div>}
          </>}
        </section>
      </div>
    </main>
  );
}
