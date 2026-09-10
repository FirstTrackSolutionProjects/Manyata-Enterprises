import { Landmark, TrendingUp, BatteryCharging, Heart, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";

const REASONS = [
  { icon: Landmark, text: "Attractive government support" },
  { icon: TrendingUp, text: "Rising electricity costs" },
  { icon: BatteryCharging, text: "Free / low-cost electricity potential" },
  { icon: Heart, text: "Clean energy for your family" },
  { icon: LayoutGrid, text: "Limited rooftop space can still be planned efficiently" },
];

export default function WhyActNow() {
  return (
    <section className="bg-navy-light py-12 text-white lg:py-16">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="text-xl font-extrabold sm:text-2xl"
        >
          Why act now?
        </motion.h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {REASONS.map(({ icon: Icon, text }, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="flex items-start gap-2.5"
            >
              <Icon size={18} className="mt-0.5 shrink-0 text-amber" />
              <span className="text-sm text-white/80">{text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}