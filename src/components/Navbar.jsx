import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Phone, User, LogOut, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { assets } from "../assets/assets";
import { useAuth } from "../contexts/AuthContext";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Products",
    children: [
      { label: "Solar Panel", href: "/products?category=solar-panel" },
      { label: "Inverter", href: "/products?category=inverter" },
      { label: "Battery", href: "/products?category=battery" },
      { label: "Cable", href: "/products?category=cable" },
      { label: "Panel Structure", href: "/products?category=panel-structure" },
    ],
  },
  { label: "Service", href: "/service" },
  { label: "Careers", href: "/career" },
  { label: "Partner", href: "/partner" },
  { label: "Contact", href: "/contact" },
  { label: "Track", href: "/track" },
  { label: "Join Us", href: "/join-us-mnyt2026" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // desktop dropdown (by label)
  const [openMobileDropdown, setOpenMobileDropdown] = useState(null); // mobile accordion
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
    setOpenDropdown(null);
    setOpenMobileDropdown(null);
  }, [navigate]);

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/");
  };

  const dashboardLink =
    user?.role === "owner"
      ? "/admin"
      : user?.role === "employee"
      ? "/employee"
      : user?.role === "partner"
      ? "/partner/dashboard"
      : null;

  return (
    <header
      className={`sticky top-0 z-50 bg-navy transition-shadow duration-300 ${
        scrolled ? "shadow-md" : ""
      }`}
    >
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3.5 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white p-1 sm:h-10 sm:w-10">
            <img
              src={assets.logoImg}
              alt="Manyata Enterprises logo"
              className="h-full w-full object-contain"
            />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-amber">
            Manyata
          </span>
        </Link>

        <ul ref={dropdownRef} className="hidden items-center gap-6 xl:flex">
          {NAV_LINKS.map((link) =>
            link.children ? (
              <li key={link.label} className="relative">
                <button
                  onClick={() =>
                    setOpenDropdown((prev) => (prev === link.label ? null : link.label))
                  }
                  className="flex items-center gap-1 text-sm font-medium text-white/85 transition-colors hover:text-amber"
                >
                  {link.label}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      openDropdown === link.label ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {openDropdown === link.label && (
                    <motion.ul
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                      className="absolute left-0 top-full mt-3 w-56 overflow-hidden rounded-xl border border-white/10 bg-navy-light shadow-xl"
                    >
                      {link.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            to={child.href}
                            onClick={() => setOpenDropdown(null)}
                            className="block px-4 py-3 text-sm text-white/85 transition-colors hover:bg-white/5 hover:text-amber"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            ) : (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="text-sm font-medium text-white/85 transition-colors hover:text-amber"
                >
                  {link.label}
                </Link>
              </li>
            )
          )}
        </ul>

        <div className="flex items-center gap-3">
          {user && dashboardLink && (
            <Link
              to={dashboardLink}
              className="hidden items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:border-amber hover:text-amber sm:flex"
            >
              <User size={14} />
              Dashboard
            </Link>
          )}

          {user ? (
            <button
              onClick={handleLogout}
              className="hidden items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:border-amber hover:text-amber sm:flex"
            >
              <LogOut size={14} />
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="hidden items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:border-amber hover:text-amber sm:flex"
            >
              <User size={14} />
              Staff Login
            </Link>
          )}

          <Link
            to="/apply"
            className="flex items-center gap-1.5 rounded-full bg-amber px-4 py-2 text-xs font-bold text-navy transition-colors hover:bg-amber-hover sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            <Phone size={15} strokeWidth={2.5} />
            <span className="hidden xs:inline">Apply Form</span>
            <span className="xs:hidden">Apply</span>
          </Link>

          <button
            className="text-white xl:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden bg-navy xl:hidden"
          >
            <ul className="flex flex-col gap-1 border-t border-white/10 px-5 py-3">
              {NAV_LINKS.map((link) =>
                link.children ? (
                  <li key={link.label}>
                    <button
                      onClick={() =>
                        setOpenMobileDropdown((prev) =>
                          prev === link.label ? null : link.label
                        )
                      }
                      className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-white/90 hover:bg-white/5 hover:text-amber"
                    >
                      {link.label}
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          openMobileDropdown === link.label ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {openMobileDropdown === link.label && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden pl-4"
                        >
                          {link.children.map((child) => (
                            <li key={child.href}>
                              <Link
                                to={child.href}
                                onClick={() => setOpen(false)}
                                className="block rounded-lg px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-amber"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </li>
                ) : (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-3 text-white/90 hover:bg-white/5 hover:text-amber"
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              )}
              {user && dashboardLink && (
                <li>
                  <Link
                    to={dashboardLink}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-3 text-amber hover:bg-white/5"
                  >
                    Dashboard
                  </Link>
                </li>
              )}
              {user ? (
                <li>
                  <button
                    onClick={handleLogout}
                    className="block w-full rounded-lg px-3 py-3 text-left text-white/90 hover:bg-white/5 hover:text-amber"
                  >
                    Logout
                  </button>
                </li>
              ) : (
                <li>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-3 text-white/90 hover:bg-white/5 hover:text-amber"
                  >
                    Staff Login
                  </Link>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
