import { Phone, Mail, MapPin } from "lucide-react";
import { assets } from "../assets/assets";

const QUICK_LINKS = [
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Subsidy & Scheme", href: "#scheme" },
  { label: "Privacy & Policy", href: "/privacy" },
  { label: "Refund & Cancellation", href: "/refund" },
  { label: "Installation Form", href: "/installation" },
  { label: "Contact", href: "/contact" },
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
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  
                  <a  href={link.href}
                    className="text-sm text-white/65 transition-colors hover:text-amber"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-white">
              Contact
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-white/65">
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="shrink-0 text-amber" />
                <a href="tel:+918114721300" className="hover:text-amber">
                  8114721300
                </a>
                <span className="text-white/30">/</span>
                <a href="tel:+917008581300" className="hover:text-amber">
                  7008581300
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="shrink-0 text-amber" />
                
                 <a href="mailto:support@themanyata.com"
                  className="hover:text-amber"
                >
                  support@themanyata.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin size={16} className="shrink-0 text-amber" />
                 College Square, Soro, Balasore, Odisha - 
756045

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
          <p>© {new Date().getFullYear()} Manyata Enterprises | Developed by First Track Solution Technologies.  All rights reserved.</p>
          <p>Office Address: College Square, Soro, Balasore, Odisha - 
756045
</p>
        </div>
      </div>
    </footer>
  );
}