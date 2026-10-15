import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Handshake,
  Wrench,
  ChevronDown,
  ChevronRight,
  Banknote,
  CalendarDays,
  Clock3,
  Trash2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { assets } from "../assets/assets";
import { hasActionPermission } from "../utils/permissions";
import { isHrEmployee, isTejashHrEmployee } from "../utils/employeeRoles";

/* Sidebar navigation items — different for owner vs employee */
const OWNER_NAV = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "applications", label: "Applications", icon: FileText, children: [{ id: "applications-odisha", label: "Odisha" }, { id: "applications-kolkata", label: "West Bengal" }] },
  { id: "installations", label: "Installation", icon: Wrench, children: [{ id: "installations-odisha", label: "Odisha" }, { id: "installations-kolkata", label: "West Bengal" }] },
  { id: "employees", label: "Employees", icon: Users },
  { id: "salary-management", label: "Salary Management", icon: Banknote },
  { id: "leave-requests", label: "Leave Requests", icon: CalendarDays },
  { id: "emp-attendance", label: "Manage Attendance", icon: Clock3 },
  { id: "partners", label: "Partners", icon: Handshake },
  { id: "commission-payouts", label: "Commission Payouts", icon: Banknote },
  { id: "branches", label: "Branches", icon: Building2 },
  { id: "submissions", label: "Submissions", icon: Briefcase },
  { id: "owner-trash", label: "Trash / Restore", icon: Trash2 },
];

/* UI-only: shared sidebar styles */
const FOOT_LINK = "group flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white";
const FOOT_ICON = "grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 transition group-hover:bg-amber/20 group-hover:text-amber";

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
  const [openMenus, setOpenMenus] = useState(() => ({
    applications: user?.role === "employee",
    installations: user?.role === "employee",
  }));

  const isHr = isHrEmployee(user);
  const baseNavItems = user?.role === "owner"
    ? OWNER_NAV
    : isHr
      ? OWNER_NAV.filter((item) => !["salary-management", "emp-attendance"].includes(item.id) && (item.id !== "owner-trash" || isTejashHrEmployee(user)))
    : user?.role === "partner"
      ? [
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { id: "commissions", label: "Commission History", icon: Banknote },
          ...(hasActionPermission(user, "applications", "view") ? [{ id: "applications", label: "Applications", icon: FileText }] : []),
        ]
      : OWNER_NAV.filter((item) => item.id !== "overview" && item.id !== "emp-attendance" && item.id !== "salary-management" && (item.id === "applications" || item.id === "installations"
        ? hasActionPermission(user, item.id, "view")
        : (item.id === "employees" && isHr) || (user?.permissions || ["applications"]).includes(item.id)));
  const NAV_ITEMS = user?.role === "employee" ? [...baseNavItems.map((item) => {
    if (!item.children) return item;
    if (isHr) return item;
    const module = item.id;
    const allowed = user?.locationPermissions?.[module];
    if (!Array.isArray(allowed) || allowed.length === 0) return { ...item, children: [] };
    return { ...item, children: item.children.filter((child) => allowed.includes(child.id.endsWith("odisha") ? "odisha" : "west_bengal")) };
  }), { id: "salary-slips", label: "Salary Slips", icon: Banknote }, { id: "leave-requests", label: "Leave Requests", icon: CalendarDays }, { id: "attendance", label: "Attendance", icon: Clock3 }, ...(isHr ? [{ id: "emp-attendance", label: "Manage Attendance", icon: Clock3 }, { id: "salary-management", label: "Salary Management", icon: Banknote }] : [])] : baseNavItems;
  // Backend exposes both user_id and userId — support both here.
  const displayUserId = user?.userId || user?.user_id || "";
  const isEmployeeDashboard = user?.role === "employee";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleNavClick = (id) => {
    setSidebarOpen(false);
    if (onSectionChange) {
      onSectionChange(id);
    } else if (user?.role === "owner") {
      navigate(`/admin?section=${encodeURIComponent(id)}`);
    } else {
      navigate(`/employee?section=${encodeURIComponent(id)}`);
    }
  };

  return (
    <div className={`dashboard-layout min-h-screen flex bg-offwhite ${isEmployeeDashboard ? "dashboard-layout--employee" : ""}`}>
      {/* ── Sidebar (desktop + mobile drawer) ──────────────
          - Desktop: sticky, h-screen, self-start → never stretches with content
          - Mobile: fixed drawer with overlay
      */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[min(16rem,86vw)] transform overflow-hidden bg-gradient-to-b from-navy via-navy to-navy-light text-white shadow-2xl transition-transform duration-200
          lg:sticky lg:top-0 lg:h-screen lg:self-start lg:translate-x-0 lg:shadow-none
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-amber/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex h-full flex-col">
          {/* Brand — links to home */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <Link
              to="/"
              className="group flex items-center gap-2.5"
              title="Go to home"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1.5 shadow-md ring-2 ring-amber/40 transition group-hover:scale-105">
                <img
                  src={assets.logoImg}
                  alt="Manyata Enterprises"
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="leading-tight">
                <span className="block text-lg font-extrabold tracking-tight text-amber">Manyata</span>
                <span className="block text-[9px] font-semibold uppercase tracking-widest text-white/50">Rooftop Solar</span>
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Role badge */}
          <div className="px-5 py-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 ring-1 ring-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-amber" />
              {user?.role === "owner" ? "Owner Panel" : user?.role === "partner" ? "Partner Panel" : "Employee Panel"}
            </span>
          </div>

          {/* Nav items */}
          <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-color:rgba(255,255,255,0.25)_transparent] [scrollbar-width:thin]">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/40">Menu</p>
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id || item.children?.some((child) => child.id === activeSection);
                return (
                  <li key={item.id}>
                    <div
                      className={`group flex w-full items-center rounded-xl pr-1.5 text-left text-sm font-semibold transition-all duration-200 ${
                        active
                          ? "bg-amber text-navy shadow-lg shadow-black/25"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <button onClick={() => handleNavClick(item.id)} className="flex min-w-0 flex-1 items-center gap-3 px-2 py-1.5 text-left">
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${active ? "bg-navy/10" : "bg-white/5 group-hover:bg-amber/20 group-hover:text-amber"}`}>
                          <Icon size={16} />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </button>
                      {item.children && <button onClick={() => setOpenMenus((p) => ({ ...p, [item.id]: !p[item.id] }))} className={`rounded-md p-1.5 transition ${active ? "hover:bg-navy/10" : "hover:bg-white/10"}`} aria-label={`Toggle ${item.label} menu`}><ChevronDown size={14} className={`transition-transform ${openMenus[item.id] ? "rotate-180" : ""}`} /></button>}
                    </div>
                    {item.children && openMenus[item.id] && <div className="ml-6 mt-1 space-y-0.5 border-l border-white/10 pl-3">{item.children.map((child) => <button key={child.id} onClick={() => handleNavClick(child.id)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${activeSection === child.id ? "bg-white/10 text-amber" : "text-white/65 hover:bg-white/5 hover:text-white"}`}><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${activeSection === child.id ? "bg-amber" : "bg-white/25"}`} />{child.label}</button>)}</div>}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom actions */}
          <div className="border-t border-white/10 bg-black/10 px-3 py-4">
            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              className={FOOT_LINK}
            >
              <span className={FOOT_ICON}><Home size={16} /></span>
              Back to Site
            </Link>
            <Link
              to="/change-password"
              onClick={() => setSidebarOpen(false)}
              className={FOOT_LINK}
            >
              <span className={FOOT_ICON}><KeyRound size={16} /></span>
              Change Password
            </Link>
            {user?.role === "employee" && (
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  handleNavClick("employee-profile");
                }}
                className={FOOT_LINK}
              >
                <span className={FOOT_ICON}><UserIcon size={16} /></span>
                Employee Profile
              </button>
            )}
            <button
              onClick={handleLogout}
              className={FOOT_LINK}
            >
              <span className={FOOT_ICON}><LogOut size={16} /></span>
              Logout
            </button>

            {/* User footer */}
            <button
              type="button"
              onClick={() => user?.role === "employee" && handleNavClick("employee-profile")}
              className="mt-3 flex w-full items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-left ring-1 ring-white/10 transition-colors hover:bg-white/10"
              aria-label="Edit employee profile"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber text-navy ring-2 ring-amber/60">
                {user?.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt={`${user?.name || "User"} profile`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon size={16} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-[10px] text-white/60">
                  {displayUserId}
                </p>
              </div>
              {user?.role === "employee" && <ChevronRight size={14} className="shrink-0 text-white/50" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main content area ────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar for mobile (with hamburger) */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-navy/10 bg-white px-4 py-3 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white p-1 ring-1 ring-navy/10">
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
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1 ring-1 ring-navy/10">
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
          <div className="dashboard-page-content mx-auto max-w-[1400px] px-5 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>

        <footer className="border-t border-navy/10 bg-white py-4 text-center text-xs text-muted">
          &copy; {new Date().getFullYear()} Manyata Enterprises &middot; Developed by First Track Solution Technologies
        </footer>
      </div>
    </div>
  );
}