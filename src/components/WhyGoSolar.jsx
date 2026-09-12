import { TrendingDown, Leaf, PiggyBank, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { assets } from "../assets/assets";

const BENEFITS = [
  {
    icon: TrendingDown,
    title: "Reduce monthly electricity bills",
    text: "Cut your dependency on grid power and watch your monthly bill shrink from day one.",
  },
  {
    icon: Leaf,
    title: "Generate clean electricity",
    text: "Produce your own renewable power straight from your rooftop, every single day.",
  },
  {
    icon: PiggyBank,
    title: "Long-term savings for your family",
    text: "One-time investment, decades of returns — solar pays for itself and keeps paying.",
  },
  {
    icon: ShieldCheck,
    title: "Increase energy independence",
    text: "Rely less on tariff hikes and power cuts; your home generates what it needs.",
  },
];

export default function WhyGoSolar() {
  return (
    <section id="why-solar" className="bg-white py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1200px] items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
        {/* TODO: replace with a licensed photo of a happy Indian family
            outdoors near their home (Unsplash/Pexels) */}
        <motion.img
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          src={assets.about}
          alt="Family enjoying their solar-powered home"
          className="order-2 h-full w-full rounded-3xl object-cover lg:order-1"
        />

        <div className="order-1 lg:order-2">
          <motion.h2
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-3xl font-extrabold text-navy sm:text-4xl"
          >
            Why go solar?
          </motion.h2>

          <div className="mt-8 space-y-6">
            {BENEFITS.map(({ icon: Icon, title, text }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
                className="flex gap-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-soft text-amber">
                  <Icon size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="font-bold text-navy">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.blockquote
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
            className="mt-8 border-l-4 border-amber pl-5 text-lg font-medium italic text-navy/80"
          >
            A small step today for a brighter and sustainable tomorrow.
          </motion.blockquote>
        </div>
      </div>
    </section>
  );
}