import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  KeyRound,
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  Briefcase,
  Wrench,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { assets } from "../assets/assets";

/* Sidebar navigation items — different for owner vs employee */
const OWNER_NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "applications", label: "Applications", icon: FileText, children: [{ id: "applications-odisha", label: "Odisha" }, { id: "applications-kolkata", label: "Kolkata" }] },
  { id: "installations", label: "Installation", icon: Wrench, children: [{ id: "installations-odisha", label: "Odisha" }, { id: "installations-kolkata", label: "Kolkata" }] },
  { id: "employees", label: "Employees", icon: Users },
  { id: "branches", label: "Branches", icon: Building2 },
  { id: "other", label: "Other Submissions", icon: Briefcase },
];

const EMPLOYEE_NAV = [
  { id: "applications", label: "Applications", icon: FileText },
];

export default function DashboardLayout({
  children,
  title,
  subtitle,
  activeSection,
  onSectionChange,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({ applications: true, installations: true });

  const NAV_ITEMS = user?.role === "owner" ? OWNER_NAV : EMPLOYEE_NAV;
  const dashboardLink = user?.role === "owner" ? "/admin" : "/employee";

  // Backend exposes both user_id and userId — support both here.
  const displayUserId = user?.userId || user?.user_id || "";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleNavClick = (id) => {
    setSidebarOpen(false);
    if (onSectionChange) onSectionChange(id);
  };

  return (
    <div className="min-h-screen flex bg-offwhite">
      {/* ── Sidebar (desktop + mobile drawer) ──────────────
          - Desktop: sticky, h-screen, self-start → never stretches with content
          - Mobile: fixed drawer with overlay
      */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform bg-navy text-white transition-transform duration-200
          lg:sticky lg:top-0 lg:h-screen lg:self-start lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Brand — links to home */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <Link
              to="/"
              className="flex items-center gap-2.5"
              title="Go to home"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-1">
                <img
                  src={assets.logoImg}
                  alt="Manyata Enterprises"
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="text-lg font-extrabold tracking-tight text-amber">
                Manyata
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white/70 hover:text-white lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Role badge */}
          <div className="px-5 py-4">
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
              {user?.role === "owner" ? "Owner Panel" : "Employee Panel"}
            </span>
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto px-3 pb-4">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id || item.children?.some((child) => child.id === activeSection);
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavClick(item.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                        active
                          ? "bg-amber text-navy"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                      {item.children && <ChevronDown size={14} className={`ml-auto transition-transform ${openMenus[item.id] ? "rotate-180" : ""}`} />}
                    </button>
                    {item.children && openMenus[item.id] && <div className="ml-8 mt-1 space-y-1">{item.children.map((child) => <button key={child.id} onClick={() => handleNavClick(child.id)} className={`w-full rounded-md px-3 py-2 text-left text-xs font-semibold ${activeSection === child.id ? "bg-white/15 text-amber" : "text-white/65 hover:text-white"}`}>{child.label}</button>)}</div>}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom actions */}
          <div className="border-t border-white/10 px-3 py-4">
            <Link
              to={dashboardLink}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Home size={16} />
              Back to Site
            </Link>
            <Link
              to="/change-password"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <KeyRound size={16} />
              Change Password
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut size={16} />
              Logout
            </button>

            {/* User footer */}
            <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber text-navy">
                <UserIcon size={14} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-[10px] text-white/60">
                  {displayUserId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main content area ────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar for mobile (with hamburger) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-navy/10 bg-white px-4 py-3 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy p-1">
              <img
                src={assets.logoImg}
                alt="Manyata Enterprises"
                className="h-full w-full object-contain"
              />
            </span>
            <span className="text-base font-extrabold text-amber">Manyata</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-navy"
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>
        </header>

        {/* ── Manyata Enterprises branding bar (DESKTOP ONLY) ──
            Hidden on mobile because the mobile top bar already shows the logo.
        */}
        <div className="hidden border-b border-navy/10 bg-white lg:block">
          <div className="mx-auto max-w-[1400px] px-5 py-3 lg:px-8">
            <Link
              to="/"
              className="inline-flex items-center gap-3 transition-opacity hover:opacity-80"
              title="Manyata Enterprises — Home"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy p-1">
                <img
                  src={assets.logoImg}
                  alt="Manyata Enterprises logo"
                  className="h-full w-full object-contain"
                />
              </span>
              <div className="leading-tight">
                <p className="text-base font-extrabold tracking-tight text-amber sm:text-lg">
                  Manyata Enterprises
                </p>
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted sm:text-xs">
                  Rooftop Solar · Odisha
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Page header */}
        {(title || subtitle) && (
          <section className="border-b border-navy/10 bg-white py-6 lg:py-8">
            <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
              {title && (
                <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-2 text-sm text-muted">{subtitle}</p>
              )}
            </div>
          </section>
        )}

        <main className="flex-1">
          <div className="mx-auto max-w-[1400px] px-5 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>

        <footer className="border-t border-navy/10 bg-white py-4 text-center text-xs text-muted">
          © {new Date().getFullYear()} Manyata Enterprises · Internal Panel
        </footer>
      </div>
    </div>
  );
}
