import { Check } from "lucide-react";
import { motion } from "framer-motion";

const CHECKLIST = [
  "Site survey",
  "System design",
  "Quality solar modules",
  "Inverter & mounting structure",
  "Installation",
  "Documentation support",
  "Net-metering assistance",
  "Subsidy & loan guidance",
  "After-sales support",
  "Complete peace of mind",
];

const STATS = [
  { value: "25 Yrs", label: "Solar module warranty" },
  { value: "5 Yrs", label: "Comprehensive service included" },
  { value: "₹500", label: "Paid service only, after year 5" },
];

export default function WhyChooseUs() {
  return (
    <section id="why-us" className="bg-offwhite py-14 lg:py-20">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="max-w-xl"
        >
          <h2 className="text-2xl font-extrabold text-navy sm:text-3xl">
            What you get with Manyata Enterprises
          </h2>
          <p className="mt-2 text-sm text-muted">
            We're with you at every stage — and long after installation too.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {CHECKLIST.map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35, delay: i * 0.03 }}
              className="flex items-center gap-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                <Check size={14} strokeWidth={3} />
              </span>
              <span className="text-sm text-navy">{item}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-10 grid gap-6 rounded-3xl bg-navy p-6 text-white sm:grid-cols-3 sm:p-8"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <p className="text-2xl font-extrabold text-amber sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs text-white/70 sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}