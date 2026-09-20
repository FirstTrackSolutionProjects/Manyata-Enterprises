import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  MapPin,
  Ruler,
  HardHat,
  Gauge,
  BadgeIndianRupee,
  Home as HomeIcon,
  Building2,
  Warehouse,
  Wallet,
  ShieldCheck,
  Wrench,
  PhoneCall,
  Sun,
  Cable,
  BatteryCharging,
  Zap,
  PlugZap,
  ClipboardCheck,
} from "lucide-react";

/* ---------- shared local helpers (kept per-file, no shared component) ---------- */

function useCountUp(target, isInView, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    let start;
    let raf;
    const step = (t) => {
      if (start === undefined) start = t;
      const progress = Math.min((t - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isInView, target, duration]);
  return value;
}

function formatINR(n) {
  return "₹" + n.toLocaleString("en-IN");
}

/* ---------- page ---------- */

export default function Service() {
  return (
    <main className="bg-offwhite">
      <ServiceHero />
      <SystemSizing />
      <ProcessSteps />
      <Financing />
      <ProductsWeProvide />
      <WarrantyTable />
      <OngoingService />
      <ServiceCTA />
    </main>
  );
}

/* ---------- 1. Hero ---------- */

function ServiceHero() {
  return (
    <section className="relative bg-navy text-offwhite overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none [background-image:linear-gradient(#F5A524_1px,transparent_1px),linear-gradient(90deg,#F5A524_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20 lg:py-24">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-amber text-sm sm:text-base font-medium tracking-wide"
        >
          Manyata Enterprises · Odisha
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight max-w-2xl"
        >
          From site survey to subsidy — we handle the whole rooftop solar journey
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="mt-4 text-muted-light text-base sm:text-lg max-w-xl text-[#C7CEDA]"
        >
          Sizing, financing, installation, subsidy processing, and five years of
          service — all under one roof, backed by PM Surya Ghar Yojana support.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-7 flex flex-wrap gap-3"
        >
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-amber hover:bg-amber-hover text-navy font-medium px-5 py-3 rounded-lg transition-colors"
          >
            <PhoneCall size={18} />
            Get a free site survey
          </a>
          <a
            href="#process"
            className="inline-flex items-center gap-2 border border-white/20 hover:border-amber/60 text-offwhite px-5 py-3 rounded-lg transition-colors"
          >
            See how it works
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- 2. How much solar does your home need ---------- */

const sizingOptions = [
  {
    icon: HomeIcon,
    size: "1 kW",
    desc: "Smaller electricity consumption — 1–2 person households or light daily usage.",
  },
  {
    icon: Building2,
    size: "2 kW",
    desc: "Typical family requirement — fans, lights, fridge, and a few daily appliances.",
  },
  {
    icon: Warehouse,
    size: "3 kW",
    desc: "Higher household consumption — AC, larger appliances, or bigger families.",
  },
];

function SystemSizing() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 lg:py-20">
      <SectionHeading
        eyebrow={null}
        title="How much solar does your home need?"
        sub="Final sizing depends on your electricity usage and site feasibility — our team confirms this during the free site survey."
      />
      <div className="mt-9 grid grid-cols-1 sm:grid-cols-3 gap-5">
        {sizingOptions.map((opt, i) => (
          <motion.div
            key={opt.size}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className="rounded-xl border border-navy/10 bg-white p-6 hover:shadow-md transition-shadow"
          >
            <opt.icon className="text-amber" size={28} strokeWidth={1.75} />
            <p className="mt-4 text-2xl font-semibold text-navy">{opt.size}</p>
            <p className="mt-2 text-sm text-muted leading-relaxed">{opt.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------- 3. Process steps ---------- */

const processSteps = [
  { icon: ClipboardList, step: "01", label: "Apply", desc: "Share your details and electricity bill to get started." },
  { icon: MapPin, step: "02", label: "Site survey", desc: "Our team visits your rooftop to check space and feasibility." },
  { icon: Ruler, step: "03", label: "System design", desc: "We size the right system for your consumption and roof." },
  { icon: HardHat, step: "04", label: "Installation", desc: "Certified technicians install and commission your system." },
  { icon: Gauge, step: "05", label: "Net metering", desc: "We apply and coordinate with DISCOM for your net meter." },
  { icon: BadgeIndianRupee, step: "06", label: "Subsidy release", desc: "Your government subsidy is processed to your account." },
];

function ProcessSteps() {
  return (
    <section id="process" className="bg-navy-soft/[0.04] border-y border-navy/5">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 lg:py-20">
        <SectionHeading
          title="How the process works"
          sub="Simple, transparent, hassle-free — from application to your first unit of solar power."
        />
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-3">
          {processSteps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-navy text-amber">
                <s.icon size={22} strokeWidth={1.75} />
              </div>
              <p className="mt-3 text-xs font-medium tracking-wide text-amber">
                Step {s.step}
              </p>
              <p className="mt-1 text-sm font-semibold text-navy">{s.label}</p>
              <p className="mt-1 text-xs text-muted leading-snug hidden sm:block">
                {s.desc}
              </p>
              {i < processSteps.length - 1 && (
                <span className="hidden lg:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-navy/15" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 4. Financing ---------- */

const financingPoints = [
  "Affordable EMI options through eligible banks and financial institutions",
  "Loan support for eligible residential customers",
  "Low upfront financial burden",
  "Assistance with documentation and application process",
];

function Financing() {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const loan = useCountUp(198000, isInView);
  const subsidy = useCountUp(138000, isInView);
  const remaining = useCountUp(60000, isInView);

  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 lg:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div>
          <SectionHeading
            align="left"
            title="Easy solar loan / financing"
            sub={null}
          />
          <ul className="mt-6 space-y-4">
            {financingPoints.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <Wallet className="text-success shrink-0 mt-0.5" size={20} />
                <span className="text-sm sm:text-base text-navy/90">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <motion.div
          ref={ref}
          onViewportEnter={() => setIsInView(true)}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl bg-navy text-offwhite p-6 sm:p-8"
        >
          <p className="text-amber text-xs font-medium tracking-wide">
            Example — 3 kW system
          </p>
          <div className="mt-5 space-y-4">
            <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
              <span className="text-sm text-[#C7CEDA]">Loan approval</span>
              <span className="text-xl sm:text-2xl font-semibold">
                {formatINR(loan)}
              </span>
            </div>
            <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
              <span className="text-sm text-[#C7CEDA]">Govt. subsidy</span>
              <span className="text-xl sm:text-2xl font-semibold text-amber">
                {formatINR(subsidy)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-[#C7CEDA]">Remaining loan</span>
              <span className="text-xl sm:text-2xl font-semibold">
                {formatINR(remaining)}
              </span>
            </div>
          </div>
          <p className="mt-5 text-[11px] text-[#8D96A6]">
            *Subject to eligibility and bank terms.
          </p>
          <a
            href="/contact"
            className="mt-2 inline-flex w-full sm:w-auto justify-center items-center gap-2 bg-amber hover:bg-amber-hover text-navy font-medium px-5 py-3 rounded-lg transition-colors"
          >
            Install solar today — pay conveniently through EMI
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- 5. Products we provide ---------- */

const productCategories = [
  { icon: Sun, name: "Solar PV modules", brands: "Waaree · Adani · Tata" },
  { icon: PlugZap, name: "On-grid solar inverter", brands: "Waaree · Microtek · Luminous" },
  { icon: HardHat, name: "Mounting structure", brands: "Jindal · JWS" },
  { icon: Cable, name: "DC / AC cables", brands: "Polycab · Havells" },
  { icon: BatteryCharging, name: "DCDB & ACDB", brands: "Waaree · Microtek · Luminous" },
  { icon: Zap, name: "Earthing & lightning protection", brands: "Forecast" },
  { icon: Gauge, name: "Net metering equipment / support", brands: "As per DISCOM norms" },
  { icon: ClipboardCheck, name: "Complete installation & commissioning", brands: "By our certified team" },
];

function ProductsWeProvide() {
  return (
    <section className="bg-navy-soft/[0.04] border-y border-navy/5">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 lg:py-20">
        <SectionHeading
          title="Solar products we provide"
          sub="Reliable, industry-trusted components sourced from established manufacturers."
        />
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {productCategories.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-xl bg-white border border-navy/10 p-5 hover:shadow-md transition-shadow"
            >
              <p.icon className="text-amber" size={22} strokeWidth={1.75} />
              <p className="mt-3 text-sm font-semibold text-navy leading-snug">
                {p.name}
              </p>
              <p className="mt-1 text-xs text-muted">{p.brands}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 6. Warranty table ---------- */

const warrantyRows = [
  { product: "Solar modules", warranty: "25 years warranty" },
  { product: "Solar inverter", warranty: "10 years warranty" },
  { product: "ACDB / DCDB", warranty: "1 year warranty" },
  { product: "Mounting structure", warranty: "As per manufacturer terms" },
  { product: "Cables & protection equipment", warranty: "As per manufacturer terms" },
  { product: "Installation work", warranty: "As per Manyata Enterprises terms" },
];

function WarrantyTable() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 lg:py-20">
      <SectionHeading title="Product warranty" sub={null} />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mt-8 overflow-x-auto rounded-xl border border-navy/10"
      >
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="bg-navy text-offwhite text-left">
              <th className="px-4 sm:px-6 py-3 font-medium whitespace-nowrap">Product</th>
              <th className="px-4 sm:px-6 py-3 font-medium whitespace-nowrap">Warranty</th>
            </tr>
          </thead>
          <tbody>
            {warrantyRows.map((row, i) => (
              <tr
                key={row.product}
                className={i % 2 === 0 ? "bg-white" : "bg-navy-soft/[0.03]"}
              >
                <td className="px-4 sm:px-6 py-3 text-navy/90 whitespace-nowrap">{row.product}</td>
                <td className="px-4 sm:px-6 py-3 text-muted whitespace-nowrap">{row.warranty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
      <p className="mt-3 text-xs text-muted">
        *Warranty as per respective manufacturer / Manyata Enterprises terms.
      </p>
    </section>
  );
}

/* ---------- 7. Ongoing service: 5 years + after 5 years ---------- */

const fiveYearItems = [
  "Regular system inspection",
  "Preventive maintenance",
  "Performance support",
  "Troubleshooting assistance",
  "Customer service support",
];

function OngoingService() {
  return (
    <section className="bg-navy-soft/[0.04] border-y border-navy/5">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl bg-white border border-navy/10 p-6 sm:p-8"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-success" size={22} />
            <p className="text-xs font-medium tracking-wide text-success">
              Included
            </p>
          </div>
          <h3 className="mt-3 text-xl font-semibold text-navy">
            5 years comprehensive service
          </h3>
          <ul className="mt-5 space-y-3">
            {fiveYearItems.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-navy/90">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm italic text-muted">
            We are with you, even after installation.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl bg-navy text-offwhite p-6 sm:p-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="text-amber" size={22} />
              <p className="text-xs font-medium tracking-wide text-amber">
                After 5 years
              </p>
            </div>
            <h3 className="mt-3 text-xl font-semibold">Paid service, on request</h3>
            <p className="mt-3 text-sm text-[#C7CEDA] leading-relaxed">
              Paid service available at just ₹500. Subject to applicable
              service terms and scope.
            </p>
          </div>
          <div className="mt-6 flex items-end gap-2">
            <span className="text-4xl font-semibold text-amber">₹500</span>
            <span className="text-sm text-[#C7CEDA] mb-1">only</span>
          </div>
          <p className="mt-4 text-xs italic text-[#8D96A6]">
            Long-term support, because your trust matters to us.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- 8. CTA ---------- */

function ServiceCTA() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 lg:py-20">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl bg-amber-soft border border-amber/30 p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
      >
        <div>
          <h3 className="text-xl sm:text-2xl font-semibold text-navy">
            Ready to start your solar journey?
          </h3>
          <p className="mt-2 text-sm sm:text-base text-navy/70">
            Book a free site survey — our team will confirm the right system
            size for your home.
          </p>
        </div>
        <a
          href="/contact"
          className="inline-flex items-center gap-2 bg-navy hover:bg-navy-light text-offwhite font-medium px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
        >
          <PhoneCall size={18} />
          Get your free quote
        </a>
      </motion.div>
    </section>
  );
}

/* ---------- shared local heading ---------- */

function SectionHeading({ title, sub, align = "center" }) {
  const isCenter = align === "center";
  return (
    <div className={isCenter ? "text-center max-w-2xl mx-auto" : "text-left"}>
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="text-2xl sm:text-3xl font-semibold text-navy"
      >
        {title}
      </motion.h2>
      {sub && (
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="mt-3 text-sm sm:text-base text-muted"
        >
          {sub}
        </motion.p>
      )}
    </div>
  );
}