import { FileText, ClipboardCheck, PenTool, Wrench, Gauge, Banknote } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  { icon: FileText, title: "Apply" },
  { icon: ClipboardCheck, title: "Site Survey" },
  { icon: PenTool, title: "System Design" },
  { icon: Wrench, title: "Installation" },
  { icon: Gauge, title: "Net Metering" },
  { icon: Banknote, title: "Subsidy Release" },
];

export default function ProcessSteps() {
  return (
    <section id="process" className="bg-offwhite py-14 lg:py-20">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="max-w-xl"
        >
          <h2 className="text-2xl font-extrabold text-navy sm:text-3xl">
            How the process works
          </h2>
          <p className="mt-2 text-sm text-muted">
            Simple. Transparent. Hassle-free — from application to your first
            unit of solar power.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
          {STEPS.map(({ icon: Icon, title }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex flex-col items-center text-center lg:items-start lg:text-left"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-amber">
                <Icon size={18} strokeWidth={2} />
              </div>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-amber">
                Step {i + 1}
              </p>
              <p className="text-sm font-bold text-navy">{title}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}