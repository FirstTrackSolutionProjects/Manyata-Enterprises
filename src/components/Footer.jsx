import {
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ArrowUp,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  MessageCircle,
  Sun,
} from "lucide-react";
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
    name: "Registered Office",
    address: "Dagarapada, Khaira, Baleswar, Odisha - 756047",
    phones: ["8114721300", "9827951364"],
  },
  {
    name: "Head Office",
    address: "College Square, Soro, Balasore, Odisha - 756045",
    phones: ["9827951364", "8114721300"],
  },
  {
    name: "Corporate Office",
    address: "Saheed Nagar, Bhubaneswar, Odisha - 751007",
    phones: ["8114721300", "9827951364"],
  },
  {
    name: "Rourkela Branch",
    address: "Bisra Road, Near Arundhati Jewellers, Rourkela, Sundargarh, Odisha - 770036",
    phones: ["9827951364", "8114721300"],
  },
  {
    name: "Kolkata Branch",
    address: "At: Baruipur Nera HP Petrol Pump, Kolkata, West Bengal - 700144",
    phones: ["9827951364", "8114721300"],
  },
];

// Apne real social links yahan daal dena.
const SOCIALS = [
  { label: "Facebook", icon: Facebook, href: "https://facebook.com/" },
  { label: "Instagram", icon: Instagram, href: "https://instagram.com/" },
  { label: "Twitter", icon: Twitter, href: "https://x.com/" },
  { label: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/" },
  { label: "YouTube", icon: Youtube, href: "https://youtube.com/" },
  { label: "WhatsApp", icon: MessageCircle, href: "https://wa.me/919827951364" },
];

export default function Footer() {
  return (
    <footer className="relative bg-navy text-white/80">
      {/* Top accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-amber to-transparent" />

      <div className="mx-auto max-w-[1200px] px-5 pb-8 pt-14 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-lg shadow-black/20">
                <img
                  src={assets.logoImg}
                  alt="Manyata Enterprises logo"
                  className="h-full w-full object-contain"
                />
              </span>
              <h3 className="text-2xl font-extrabold tracking-tight text-amber">
                Manyata
              </h3>
            </div>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              Transforming energy solutions across Odisha — from loan
              assistance to installation, warranty, and 5-year service.
            </p>

            {/* Social icons */}
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-widest text-white">
                Follow us
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {SOCIALS.map(({ label, icon: Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    title={label}
                    className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-all duration-300 hover:-translate-y-1 hover:border-amber hover:bg-amber hover:text-navy"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            {/* Scheme note */}
            <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/15">
                  <Sun size={16} className="text-amber" />
                </span>
                <h4 className="text-sm font-bold uppercase tracking-wide text-white">
                  PM Surya Ghar Yojana
                </h4>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Government of India flagship scheme for residential rooftop
                solar, with Central + Odisha State financial support.
              </p>
            </div>
          </div>

          {/* Quick links */}
          <div className="lg:col-span-2">
            <h4 className="relative inline-block text-sm font-bold uppercase tracking-widest text-white">
              Quick Links
              <span className="absolute -bottom-2 left-0 h-0.5 w-8 rounded-full bg-amber" />
            </h4>
            <ul className="mt-6 space-y-3">
              {QUICK_LINKS.map((link) => {
                const cls =
                  "group inline-flex items-center gap-1.5 text-sm text-white/65 transition-all duration-300 hover:translate-x-1 hover:text-amber";
                const inner = (
                  <>
                    <ChevronRight
                      size={14}
                      className="text-amber opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    />
                    <span className="-ml-5 transition-all duration-300 group-hover:ml-0">
                      {link.label}
                    </span>
                  </>
                );
                return (
                  <li key={link.href}>
                    {link.href.startsWith("#") ? (
                      <a href={link.href} className={cls}>
                        {inner}
                      </a>
                    ) : (
                      <Link to={link.href} className={cls}>
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-6">
            <h4 className="relative inline-block text-sm font-bold uppercase tracking-widest text-white">
              Contact
              <span className="absolute -bottom-2 left-0 h-0.5 w-8 rounded-full bg-amber" />
            </h4>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {BRANCHES.map((branch) => (
                <div
                  key={branch.name}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-amber/50 hover:bg-white/10"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-amber">
                    {branch.name}
                  </p>

                  <p className="mt-3 flex items-start gap-2.5 text-sm text-white/65">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-amber" />
                    <span>{branch.address}</span>
                  </p>

                  {branch.phones.length > 0 && (
                    <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/65">
                      <Phone size={16} className="shrink-0 text-amber" />
                      {branch.phones.map((number, i) => (
                        <span key={number} className="flex items-center gap-2">
                          {i > 0 && <span className="text-white/30">/</span>}
                          <a
                            href={`tel:+91${number}`}
                            className="transition-colors hover:text-amber"
                          >
                            +91 {number}
                          </a>
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              ))}

              {/* Email card */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-amber/50 hover:bg-white/10">
                <p className="text-xs font-bold uppercase tracking-wide text-amber">
                  Email Support
                </p>
                <p className="mt-3 flex items-center gap-2.5 text-sm text-white/65">
                  <Mail size={16} className="shrink-0 text-amber" />
                  <a
                    href="mailto:support@themanyata.com"
                    className="break-all transition-colors hover:text-amber"
                  >
                    support@themanyata.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/45 md:flex-row">
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} Manyata Enterprises · Developed by
            First Track Solution Technologies
          </p>
          <p className="text-center">
            Registered Office: Dagarapada, Khaira, Baleswar, Odisha - 756047
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 font-semibold text-white/70 transition-all duration-300 hover:border-amber hover:bg-amber hover:text-navy"
          >
            Back to top
            <ArrowUp
              size={14}
              className="transition-transform duration-300 group-hover:-translate-y-0.5"
            />
          </button>
        </div>
      </div>
    </footer>
  );
}