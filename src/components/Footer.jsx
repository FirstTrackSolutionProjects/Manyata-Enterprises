import {
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ArrowUp,
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
  { label: "Facebook", href: "https://facebook.com/" },
  { label: "Instagram", href: "https://instagram.com/" },
  { label: "X", href: "https://x.com/" },
  { label: "LinkedIn", href: "https://linkedin.com/" },
  { label: "YouTube", href: "https://youtube.com/" },
  { label: "WhatsApp", href: "https://wa.me/919827951364" },
];

function SocialIcon({ name }) {
  if (name === "Instagram") {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" /></svg>;
  }
  if (name === "YouTube") {
    return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" /></svg>;
  }
  if (name === "LinkedIn") {
    return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05a3.75 3.75 0 0 1 3.37-1.85c3.6 0 4.26 2.37 4.26 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" /></svg>;
  }
  if (name === "X") {
    return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23.2 22H17l-4.9-7.1L5.9 22H2.8l7.3-8.4L2.4 2h6.4l4.4 6.5L18.9 2Zm-1.1 18h1.7L7.9 3.9H6.1L17.8 20Z" /></svg>;
  }
  if (name === "WhatsApp") {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3 20l.9-4.7a8.5 8.5 0 1 1 16.6-3.6Z" /><path d="M8.5 8.2c.3-.7.6-.7 1-.7h.4c.2 0 .4.1.5.4l.8 1.9c.1.3.1.5-.1.7l-.6.7c-.2.2-.2.4 0 .7.5.8 1.2 1.5 2 2 .3.2.5.2.7 0l.7-.8c.2-.2.4-.3.7-.1l1.8.9c.3.1.4.3.4.5 0 .3-.1 1.1-.7 1.6-.5.5-1.3.7-2.1.5-1-.3-2.3-.9-3.6-2.1-1.7-1.5-2.8-3.4-3-4.4-.2-.9.1-1.5.5-1.8Z" /></svg>;
  }
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.7 0H1.3C.6 0 0 .6 0 1.3v21.4c0 .7.6 1.3 1.3 1.3h11.5v-9.3H9.7v-3.6h3.1V8.5c0-3.1 1.9-4.8 4.7-4.8 1.3 0 2.5.1 2.8.1v3.2h-1.9c-1.5 0-1.8.7-1.8 1.8v2.3h3.6l-.5 3.6h-3.1V24h6.1c.7 0 1.3-.6 1.3-1.3V1.3c0-.7-.6-1.3-1.3-1.3Z" /></svg>;
}

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
                {SOCIALS.map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    title={label}
                    className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-all duration-300 hover:-translate-y-1 hover:border-amber hover:bg-amber hover:text-navy"
                  >
                    <span className="h-[18px] w-[18px]"><SocialIcon name={label} /></span>
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
