import { Phone, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { assets } from "../assets/assets";

const QUICK_LINKS = [
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Subsidy & Scheme", href: "#scheme" },
  { label: "Privacy & Policy", href: "/privacy" },
  { label: "Refund & Cancellation", href: "/refund" },
  { label: "Installation Form", href: "/installation" },
  { label: "Contact", href: "/contact" },
];

// Add a new branch or phone number here — the footer updates automatically.
const BRANCHES = [
  {
    name: "Main Office",
    address: "College Square, Soro, Balasore, Odisha - 756045",
    phones: ["8114721300", "7008581300"],
  },
  {
    name: "Sundargarh Branch",
    address: "At: Bisra, Rourkela, Sundargarh, Odisha - 770036",
    phones: ["8114721300"],
  },
  
];

export default function Footer() {
  return (
    <footer className="bg-navy text-white/80">
      <div className="mx-auto max-w-[1200px] px-5 py-14 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white p-1 sm:h-10 sm:w-10">
                        <img
                          src={assets.logoImg}
                          alt="Manyata Enterprises logo"
                          className="h-full w-full object-contain"
                        />
                      </span>
            <h3 className="text-lg flex font-extrabold text-amber">
              Manyata 
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Transforming energy solutions across Odisha — from loan
              assistance to installation, warranty, and 5-year service.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-white">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-2.5">
              {QUICK_LINKS.map((link) =>
                link.href.startsWith("#") ? (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-white/65 transition-colors hover:text-amber"
                    >
                      {link.label}
                    </a>
                  </li>
                ) : (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-white/65 transition-colors hover:text-amber"
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-white">
              Contact
            </h4>
            <ul className="mt-4 space-y-5 text-sm text-white/65">
              {BRANCHES.map((branch) => (
                <li key={branch.name}>
                  <p className="text-xs font-bold uppercase tracking-wide text-amber">
                    {branch.name}
                  </p>

                  <p className="mt-2 flex items-start gap-2.5">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-amber" />
                    <span>{branch.address}</span>
                  </p>

                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Phone size={16} className="shrink-0 text-amber" />
                    {branch.phones.map((number, i) => (
                      <span key={number} className="flex items-center gap-2">
                        {i > 0 && <span className="text-white/30">/</span>}
                        <a
                          href={`tel:+91${number}`}
                          className="transition-colors hover:text-amber"
                        >
                          {number}
                        </a>
                      </span>
                    ))}
                  </p>
                </li>
              ))}

              <li className="flex items-center gap-2.5">
                <Mail size={16} className="shrink-0 text-amber" />
                <a
                  href="mailto:support@themanyata.com"
                  className="hover:text-amber"
                >
                  support@themanyata.com
                </a>
              </li>
            </ul>
          </div>

          {/* Scheme note */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-white">
              PM Surya Ghar Yojana
            </h4>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Government of India flagship scheme for residential rooftop
              solar, with Central + Odisha State financial support.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row">
          <p>© {new Date().getFullYear()} Manyata Enterprises · Developed by First Track Solution Technologies</p>
          <p>Office Address: College Square, Soro, Balasore, Odisha - 756045</p>
        </div>
      </div>
    </footer>
  );
}