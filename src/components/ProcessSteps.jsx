import {
  FileText,
  ClipboardCheck,
  PenTool,
  Wrench,
  Gauge,
  Banknote,
} from "lucide-react";
import { motion } from "framer-motion";

/*
 * ── IMAGE CONFIGURATION ────────────────────────────────────────────────
 * Replace these URLs with your own hosted images.
 * Each step card uses its image as a background.
 */
const STEPS = [
  {
    icon: FileText,
    title: "Apply",
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=600&q=80",
  },
  {
    icon: ClipboardCheck,
    title: "Site Survey",
    image:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=600&q=80",
  },
  {
    icon: PenTool,
    title: "System Design",
    image:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80",
  },
  {
    icon: Wrench,
    title: "Installation",
    image:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80",
  },
  {
    icon: Gauge,
    title: "Net Metering",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80",
  },
  {
    icon: Banknote,
    title: "Subsidy Release",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80",
  },
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

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:gap-4">
          {STEPS.map(({ icon: Icon, title, image }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group relative h-44 overflow-hidden rounded-2xl border border-navy/10"
            >
              {/* Background image */}
              <img
                src={image}
                alt={title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/60 to-navy/20" />

              {/* Content */}
              <div className="relative flex h-full flex-col items-start justify-end p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber text-navy shadow-md">
                  <Icon size={16} strokeWidth={2.2} />
                </div>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-amber">
                  Step {i + 1}
                </p>
                <p className="text-sm font-bold text-white drop-shadow-sm">
                  {title}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}