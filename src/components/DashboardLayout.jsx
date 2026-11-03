import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  LogOut,
  UserRoundX,
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
  PartyPopper,
  Cake,
  Sparkles,
  Heart,
  Gift,
  Star,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { assets } from "../assets/assets";
import { hasActionPermission } from "../utils/permissions";
import { isHrEmployee, isTejashHrEmployee } from "../utils/employeeRoles";
import { getTodaysEmployeeBirthdays } from "../services/api";

/* Sidebar navigation items — different for owner vs employee */
const OWNER_NAV = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "applications", label: "Applications", icon: FileText, children: [{ id: "applications-odisha", label: "Odisha" }, { id: "applications-kolkata", label: "West Bengal" }] },
  { id: "installations", label: "Installation", icon: Wrench, children: [{ id: "installations-odisha", label: "Odisha" }, { id: "installations-kolkata", label: "West Bengal" }] },
  { id: "employees", label: "Employees", icon: Users },
  { id: "salary-management", label: "Salary Management", icon: Banknote },
  { id: "leave-requests", label: "Leave Requests", icon: CalendarDays },
  { id: "exit-requests", label: "Resignation Requests", icon: LogOut },
  { id: "employee-terminations", label: "Employee Terminations", icon: UserRoundX },
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

/* ═══════════════════════════════════════════════════════════
   Birthday banner (confetti, balloons, glow ring, wishes)
   ═══════════════════════════════════════════════════════════ */
const BIRTHDAY_WISHES = [
  "May every sunrise bring you new energy, new wins and endless reasons to smile.",
  "Your hard work lights up our team like sunshine lights up a rooftop. Keep shining!",
  "Wishing you a year full of growth, good health, big dreams and bigger celebrations.",
  "Thank you for being such a bright part of the Manyata family. Have a fantastic day!",
  "Today the spotlight is all yours. Enjoy every moment, you truly deserve it!",
];

const CONFETTI_COLORS = ["#fbbf24", "#f472b6", "#60a5fa", "#34d399", "#fb923c", "#ffffff", "#a78bfa"];

const BALLOONS = [
  { left: "4%", color: "#f472b6", delay: "0s", dur: "9s" },
  { left: "13%", color: "#fbbf24", delay: "2.2s", dur: "11s" },
  { left: "86%", color: "#60a5fa", delay: "1s", dur: "10s" },
  { left: "95%", color: "#34d399", delay: "3.4s", dur: "12s" },
];

function Balloon({ color }) {
  return (
    <svg width="34" height="54" viewBox="0 0 34 54" aria-hidden="true">
      <ellipse cx="17" cy="19" rx="14" ry="17" fill={color} />
      <ellipse cx="11" cy="12" rx="4" ry="6" fill="#fff" opacity="0.35" />
      <path d="M17 36 l-3 5 h6 z" fill={color} />
      <path d="M17 41 q-5 5 0 9 q5 3 0 4" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1" fill="none" />
    </svg>
  );
}

function BirthdayBanner({ birthdays = [] }) {
  const [wishIndex, setWishIndex] = useState(0);

  // Rotate the wish text every 6 seconds
  useEffect(() => {
    const t = setInterval(() => setWishIndex((i) => (i + 1) % BIRTHDAY_WISHES.length), 6000);
    return () => clearInterval(t);
  }, []);

  // Confetti pieces — generated once
  const confetti = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        size: 6 + ((i * 7) % 7),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: `${((i * 13) % 60) / 10}s`,
        dur: `${5 + ((i * 11) % 40) / 10}s`,
        round: i % 3 === 0,
      })),
    []
  );

  if (!birthdays.length) return null;

  const names = birthdays.map((p) => p.name);
  const nameText =
    names.length > 1 ? `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}` : names[0];

  return (
    <section
      aria-live="polite"
      className="bday-root relative mb-6 overflow-hidden rounded-3xl border border-amber-300/40 bg-gradient-to-br from-[#0b1d3a] via-[#14305c] to-[#3b1d5a] text-white shadow-[0_18px_50px_rgba(11,29,58,0.45)]"
    >
      <style>{`
        @keyframes bday-fall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(300px) rotate(540deg); opacity: 0; } }
        @keyframes bday-rise { 0% { transform: translateY(260px) rotate(-4deg); opacity: 0; } 15% { opacity: .9; } 85% { opacity: .9; } 100% { transform: translateY(-120px) rotate(6deg); opacity: 0; } }
        @keyframes bday-shimmer { to { background-position: 200% center; } }
        @keyframes bday-spin { to { transform: rotate(360deg); } }
        @keyframes bday-pulse { 0%,100% { transform: scale(1); opacity: .55; } 50% { transform: scale(1.15); opacity: .9; } }
        @keyframes bday-twinkle { 0%,100% { transform: scale(.8) rotate(0); opacity: .5; } 50% { transform: scale(1.2) rotate(20deg); opacity: 1; } }
        @keyframes bday-wish { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes bday-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .bday-shimmer-text {
          background: linear-gradient(90deg, #fde68a, #ffffff, #fbbf24, #fde68a);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent; color: transparent;
          animation: bday-shimmer 4s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .bday-root *, .bday-root *::before { animation: none !important; }
        }
      `}</style>

      {/* Glow blobs */}
      <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-amber-400/25 blur-3xl" style={{ animation: "bday-pulse 5s ease-in-out infinite" }} />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-60 w-60 rounded-full bg-fuchsia-500/25 blur-3xl" style={{ animation: "bday-pulse 6s ease-in-out infinite 1s" }} />

      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="absolute top-0 block"
            style={{
              left: c.left,
              width: c.size,
              height: c.round ? c.size : c.size * 0.45,
              background: c.color,
              borderRadius: c.round ? "9999px" : "2px",
              animation: `bday-fall ${c.dur} linear ${c.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* Balloons */}
      <div className="pointer-events-none absolute inset-0 hidden sm:block" aria-hidden="true">
        {BALLOONS.map((b, i) => (
          <span
            key={i}
            className="absolute bottom-0"
            style={{ left: b.left, animation: `bday-rise ${b.dur} ease-in-out ${b.delay} infinite` }}
          >
            <Balloon color={b.color} />
          </span>
        ))}
      </div>

      {/* Twinkling stars */}
      <Star className="pointer-events-none absolute right-10 top-6 hidden h-5 w-5 fill-amber-300 text-amber-300 sm:block" style={{ animation: "bday-twinkle 2.4s ease-in-out infinite" }} aria-hidden="true" />
      <Sparkles className="pointer-events-none absolute right-24 top-14 hidden h-7 w-7 text-amber-200 sm:block" style={{ animation: "bday-twinkle 3s ease-in-out infinite .6s" }} aria-hidden="true" />
      <Star className="pointer-events-none absolute left-1/2 top-4 hidden h-4 w-4 fill-pink-300 text-pink-300 md:block" style={{ animation: "bday-twinkle 2.8s ease-in-out infinite 1.2s" }} aria-hidden="true" />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-5 px-5 py-7 text-center sm:flex-row sm:gap-8 sm:px-10 sm:py-8 sm:text-left">
        {/* Photos with rotating gold ring */}
        <div className="flex shrink-0 items-center justify-center -space-x-5">
          {birthdays.map((person) => (
            <div key={person.id} className="relative h-[104px] w-[104px]">
              <span
                className="absolute -inset-1.5 rounded-full"
                style={{
                  background: "conic-gradient(from 0deg, #fbbf24, #f472b6, #60a5fa, #34d399, #fbbf24)",
                  animation: "bday-spin 6s linear infinite",
                }}
                aria-hidden="true"
              />
              <span className="absolute -inset-1.5 rounded-full bg-amber-300/30 blur-md" aria-hidden="true" />
              {person.photo ? (
                <img
                  src={person.photo}
                  alt={`${person.name}, birthday celebrant`}
                  className="relative h-full w-full rounded-full border-4 border-white object-cover shadow-xl"
                />
              ) : (
                <span
                  className="relative grid h-full w-full place-items-center rounded-full border-4 border-white bg-gradient-to-br from-amber-300 to-orange-400 text-navy shadow-xl"
                  aria-label={`${person.name}, birthday celebrant`}
                >
                  <Cake size={38} />
                </span>
              )}
              <span className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-white text-lg shadow-lg ring-2 ring-amber-300" style={{ animation: "bday-bounce 2s ease-in-out infinite" }}>
                🎂
              </span>
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-300/50 bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200 backdrop-blur">
            <PartyPopper size={13} aria-hidden="true" /> Today we celebrate
          </div>

          <h2 className="bday-shimmer-text text-3xl font-black tracking-tight sm:text-4xl">
            Happy Birthday! 🎉
          </h2>

          <p className="mt-1 text-lg font-extrabold text-white sm:text-2xl">{nameText}</p>

          {/* Rotating wish */}
          <p
            key={wishIndex}
            className="mt-2 min-h-[3rem] max-w-2xl text-sm leading-6 text-white/85 sm:text-base"
            style={{ animation: "bday-wish .7s ease-out" }}
          >
            {BIRTHDAY_WISHES[wishIndex]}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/90 px-3.5 py-1.5 text-sm font-bold text-white shadow-lg shadow-rose-900/30">
              <Heart size={14} className="fill-white" aria-hidden="true" /> With love from the Manyata team
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-amber-100 ring-1 ring-white/20">
              <Gift size={13} aria-hidden="true" /> Make it a day to remember
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
  activeSection,
  onSectionChange,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [todaysBirthdays, setTodaysBirthdays] = useState([]);

  useEffect(() => {
    let active = true;
    if (!user || !["owner", "employee"].includes(user.role)) {
      setTodaysBirthdays([]);
      return () => { active = false; };
    }
    getTodaysEmployeeBirthdays()
      .then((response) => {
        if (active) setTodaysBirthdays(response?.data?.birthdays || []);
      })
      .catch((error) => {
        console.error("Could not load today's birthday greetings:", error);
        if (active) setTodaysBirthdays([]);
      });
    return () => { active = false; };
  }, [user?.role]);
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
  const employeeNavItems = user?.role === "employee" ? [...baseNavItems.map((item) => {
    if (!item.children) return item;
    if (isHr) return item;
    const module = item.id;
    const allowed = user?.locationPermissions?.[module];
    if (!Array.isArray(allowed) || allowed.length === 0) return { ...item, children: [] };
    return { ...item, children: item.children.filter((child) => allowed.includes(child.id.endsWith("odisha") ? "odisha" : "west_bengal")) };
  }), { id: "salary-slips", label: "Salary Slips", icon: Banknote }, { id: "leave-requests", label: "Leave Requests", icon: CalendarDays }, { id: "exit-requests", label: "Resignation Requests", icon: LogOut }, { id: "attendance", label: "Attendance", icon: Clock3 }, ...(isHr ? [{ id: "emp-attendance", label: "Manage Attendance", icon: Clock3 }, { id: "salary-management", label: "Salary Management", icon: Banknote }] : [])] : baseNavItems;
  const NAV_ITEMS = user?.role === "employee"
    ? employeeNavItems.filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
    : baseNavItems;
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
            {/* Birthday celebration banner */}
            <BirthdayBanner birthdays={todaysBirthdays} />
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