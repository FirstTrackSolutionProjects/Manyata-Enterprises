import {
  SunMedium,
  Zap,
  Layers,
  Cable,
  BatteryCharging,
  Radio,
  Gauge,
  Wrench,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

const PRODUCTS = [
  { icon: SunMedium, title: "Solar PV Modules" },
  { icon: Zap, title: "On-Grid Solar Inverter" },
  { icon: Layers, title: "Mounting Structure" },
  { icon: Cable, title: "DC / AC Cables" },
  { icon: BatteryCharging, title: "DCDB & ACDB" },
  { icon: Radio, title: "Earthing & Lightning Protection" },
  { icon: Gauge, title: "Net Metering Equipment" },
  { icon: Wrench, title: "Installation & Commissioning" },
];

const BRANDS = ["Waaree", "Adani", "Tata", "Microtek", "Luminous", "Jindal", "Polycab", "Havells"];

export default function ProductHighlight() {
  return (
    <section id="products" className="bg-white py-14 lg:py-20">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div className="max-w-xl">
            <h2 className="text-2xl font-extrabold text-navy sm:text-3xl">
              Solar products we provide
            </h2>
            <p className="mt-2 text-sm text-muted">
              Trusted, industry-leading brands across every component of your
              solar system.
            </p>
          </div>
          {/* Wire this to a real Products page route once it exists */}
          
          <a  href="#contact"
            className="flex items-center gap-1.5 text-sm font-bold text-navy hover:text-amber"
          >
            View all products <ArrowRight size={16} />
          </a>
        </motion.div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PRODUCTS.map(({ icon: Icon, title }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="flex h-full flex-col items-center gap-2.5 rounded-2xl border border-navy/10 p-4 text-center transition-colors hover:border-amber"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-amber">
                <Icon size={18} strokeWidth={2} />
              </div>
              <p className="text-xs font-semibold text-navy">{title}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-navy/10 pt-6"
        >
          {BRANDS.map((brand) => (
            <span key={brand} className="text-xs font-bold text-muted">
              {brand}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}