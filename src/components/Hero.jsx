import { PiggyBank, Leaf, ShieldCheck, Sunrise, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { assets } from "../assets/assets";
const HIGHLIGHTS = [
  { icon: PiggyBank, label: "Save Money" },
  { icon: Leaf, label: "Clean Energy" },
  { icon: ShieldCheck, label: "Energy Independence" },
  { icon: Sunrise, label: "Better Tomorrow" },
];

export default function Hero() {
  return (
    <section className="relative flex min-h-[520px] items-center overflow-hidden bg-navy lg:min-h-[560px]">

  <img
    src={assets.HeroImg}
    alt="Home with rooftop solar panels"
    className="absolute inset-0 h-full w-full object-cover"
  />

  <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/25" />

  <div className="pointer-events-none absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-amber/20 blur-3xl" />

  <div className="relative mx-auto w-full max-w-[1200px] px-5 py-10 lg:px-8 lg:py-8 lg:-translate-y-4">

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="max-w-2xl"
    >

      <span className="inline-block rounded-full bg-amber-soft/10 px-4 py-1.5 text-sm font-semibold text-amber ring-1 ring-amber/30">
        PM Surya Ghar Muft Bijli Yojana
      </span>

      <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-[3.4rem]">
        Apne Ghar Ki Bijli,
        <br />
        Ab Surya Se
      </h1>

      <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
        Manyata Enterprises brings government-backed rooftop solar to
        homes across Odisha — free eligibility check, transparent
        pricing, and end-to-end support.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <a
          href="tel:+918114721300"
          className="flex items-center justify-center gap-2 rounded-full bg-amber px-7 py-3.5 text-sm font-bold text-navy transition-colors hover:bg-amber-hover"
        >
          <Phone size={18} strokeWidth={2.5} />
          Get Free Quote
        </a>

        <a
          href="#scheme"
          className="flex items-center justify-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-bold text-white transition-colors hover:border-white/50"
        >
          Check Your Subsidy
        </a>
      </div>

      <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {HIGHLIGHTS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5">
            <Icon size={20} className="shrink-0 text-amber" />
            <span className="text-sm font-medium text-white/85">
              {label}
            </span>
          </div>
        ))}
      </div>

    </motion.div>
  </div>
</section>
  )
}