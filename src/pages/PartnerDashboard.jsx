import { useNavigate } from "react-router-dom";
import { Building2, KeyRound, LogOut, UserRound } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { assets } from "../assets/assets";

export default function PartnerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const partnerType = user?.partnerType === "dealer" ? "Dealer" : "Sub-vendor";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-offwhite">
      <header className="flex items-center justify-between bg-navy px-5 py-4 text-white sm:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1">
            <img src={assets.logoImg} alt="Manyata Enterprises" className="h-full w-full object-contain" />
          </span>
          <div>
            <p className="font-bold text-amber">Manyata Enterprises</p>
            <p className="text-xs text-white/70">Partner Portal</p>
          </div>
        </div>
        <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-semibold hover:border-amber">
          <LogOut size={15} /> Log out
        </button>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-10 sm:py-16">
        <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-xs font-bold uppercase tracking-widest text-amber">{partnerType} account</p>
          <h1 className="mt-2 text-2xl font-extrabold text-navy sm:text-3xl">Welcome, {user?.partnerCompanyName || user?.name}</h1>
          <p className="mt-2 text-sm text-muted">Your partner login is separate from the employee system.</p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-navy/10 bg-offwhite p-4">
              <dt className="flex items-center gap-2 text-xs font-semibold text-muted"><UserRound size={15} /> Partner Login ID</dt>
              <dd className="mt-2 font-bold text-navy">{user?.userId || user?.user_id}</dd>
            </div>
            <div className="rounded-xl border border-navy/10 bg-offwhite p-4">
              <dt className="flex items-center gap-2 text-xs font-semibold text-muted"><Building2 size={15} /> Partner Type</dt>
              <dd className="mt-2 font-bold text-navy">{partnerType}</dd>
            </div>
            <div className="rounded-xl border border-navy/10 bg-offwhite p-4 sm:col-span-2">
              <dt className="text-xs font-semibold text-muted">Contact email</dt>
              <dd className="mt-2 font-bold text-navy">{user?.email}</dd>
            </div>
          </dl>

          <button onClick={() => navigate("/change-password")} className="mt-7 inline-flex items-center gap-2 rounded-full bg-amber px-5 py-3 text-sm font-bold text-navy hover:bg-amber-hover">
            <KeyRound size={16} /> Change Password
          </button>
        </div>
      </section>
    </main>
  );
}
