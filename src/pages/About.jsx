import { motion } from "framer-motion";
import { ShieldCheck, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { assets } from "../assets/assets";

const WARRANTY = [
  { product: "Solar Modules", warranty: "25 Years Warranty" },
  { product: "Solar Inverter", warranty: "10 Years Warranty" },
  { product: "ACDB / DCDB", warranty: "1 Year Warranty" },
  { product: "Mounting Structure", warranty: "As per Manufacturer Terms" },
  { product: "Cables & Protection Equipment", warranty: "As per Manufacturer Terms" },
  { product: "Installation Work", warranty: "As per Manyata Enterprises Terms" },
];


export default function About() {
  return (
    <>
      {/* Page banner */}
      <section className="bg-navy py-14 text-white lg:py-16">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-sm font-semibold text-amber">About Us</span>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Manyata Enterprises
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
              Transforming energy solutions across Odisha — we support you
              from application to installation, and long after.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Company intro + image */}
      <section className="bg-white py-14 lg:py-20">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 lg:grid-cols-2 lg:gap-14 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-extrabold text-navy sm:text-3xl">
              Odisha's trusted rooftop solar partner
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
              Manyata Enterprises is an Odisha-based solar solutions company
              helping homeowners switch to clean, affordable rooftop solar
              under the PM Surya Ghar Muft Bijli Yojana. From your first site
              survey to years of after-sales support, we handle the entire
              journey — subsidy paperwork, financing guidance, quality
              components from trusted brands, professional installation, and
              net-metering assistance — so you don't have to navigate it
              alone.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
              Our focus is simple: transparent pricing, dependable
              workmanship, and a long-term relationship — not just a one-time
              installation.
            </p>
          </motion.div>

          {/* TODO: replace with a licensed, bright daytime photo of a solar
              installation team at work or a completed rooftop array under
              clear skies (Unsplash/Pexels) */}
          <motion.img
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            src={assets.aboutImg}
            alt="Manyata Enterprises solar installation team"
            className="h-full w-full rounded-2xl object-cover"
          />
        </div>
      </section>

      {/* Warranty table */}
      <section className="bg-offwhite py-14 lg:py-20">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={20} className="text-amber" />
              <h2 className="text-2xl font-extrabold text-navy sm:text-3xl">
                Product warranty
              </h2>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-8 overflow-hidden rounded-2xl border border-navy/10 bg-white"
          >
            {WARRANTY.map((row, i) => (
              <div
                key={row.product}
                className={`flex flex-col justify-between gap-1 px-5 py-4 sm:flex-row sm:items-center ${
                  i !== WARRANTY.length - 1 ? "border-b border-navy/10" : ""
                }`}
              >
                <span className="text-sm font-semibold text-navy">{row.product}</span>
                <span className="text-sm text-muted">{row.warranty}</span>
              </div>
            ))}
          </motion.div>
          <p className="mt-3 text-xs text-muted">
            *Warranty as per respective manufacturer / Manyata Enterprises terms.
          </p>
        </div>
      </section>
      

      {/* CTA */}
      <section className="bg-navy-light py-14 text-white lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="mx-auto flex max-w-[1200px] flex-col items-center gap-5 px-5 text-center lg:px-8"
        >
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            Ready to start your solar journey?
          </h2>
          <p className="max-w-md text-sm text-white/70">
            Talk to our team for a free eligibility check and quote tailored
            to your home.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            
             <a href="tel:+918114721300"
              className="flex items-center justify-center gap-2 rounded-full bg-amber px-7 py-3 text-sm font-bold text-navy transition-colors hover:bg-amber-hover"
            >
              <Phone size={16} strokeWidth={2.5} />
              Get Free Quote
            </a>
            <Link
              to="/contact"
              className="flex items-center justify-center gap-2 rounded-full border border-white/25 px-7 py-3 text-sm font-bold text-white transition-colors hover:border-white/50"
            >
              Contact Us
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}