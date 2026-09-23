import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { motion, useInView } from "framer-motion";

const SCHEME_POINTS = [
  "Government of India flagship scheme for residential rooftop solar",
  "Central + West Bengal State financial support combined",
  "Up to 3 kW subsidy for residential consumers",
  "Easy process — transparent and fully digital",
];

const SUBSIDY_TIERS = [
  { size: "1 kW", central: 30000, total: 30000 },
  { size: "2 kW", central: 60000, total: 60000 },
  { size: "3 kW", central: 78000, state: 15000, stateNote: "State Subsidy Applicable only to SC/ST category", total: 93000, featured: true },
];

// Counts up from 0 to `value` once it scrolls into view.
function AnimatedNumber({ value, prefix = "", suffix = "", duration = 1200 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = null;
    const step = (timestamp) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplay(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(step);
      else setDisplay(value);
    };
    requestAnimationFrame(step);
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
};

export default function SchemeSubsidy() {
  return (
    <section id="scheme" className="bg-offwhite py-20 text-navy lg:py-28">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
              <span className="text-2xl font-semibold text-navy">
                PM Surya Ghar Yojana — West Bengal
              </span>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Government support, made simple
              </h2>
            </motion.div>

            <ul className="mt-7 space-y-4">
              {SCHEME_POINTS.map((point, i) => (
                <motion.li
                  key={point}
                  {...fadeUp}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-amber" />
                  <span className="text-navy/70">{point}</span>
                </motion.li>
              ))}
            </ul>

            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mt-10 grid grid-cols-2 gap-5 border-t border-navy/10 pt-8"
            >
              <div>
                <p className="text-3xl font-extrabold text-amber sm:text-4xl">
                  <AnimatedNumber value={200000} suffix="+" />
                </p>
                <p className="mt-1 text-sm text-navy/60">
                  Rooftop solar installations targeted across West Bengal
                </p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-amber sm:text-4xl">
                  ₹<AnimatedNumber value={100} />
                  Cr
                </p>
                <p className="mt-1 text-sm text-navy/60">
                  West Bengal 2026–27 budget for state solar support
                </p>
              </div>
            </motion.div>
          </div>

          {/* Subsidy pricing cards */}
          <div className="grid gap-5">
            {SUBSIDY_TIERS.map((tier, i) => (
              <motion.div
                key={tier.size}
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`rounded-2xl border p-6 ${
                  tier.featured
                    ? "border-amber bg-white shadow-sm"
                    : "border-navy/10 bg-white/70"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-navy/60">
                      {tier.size} System
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-navy sm:text-3xl">
                      ₹<AnimatedNumber value={tier.total} /> total subsidy
                    </p>
                  </div>
                  {tier.featured && (
                    <span className="rounded-full bg-amber px-3 py-1 text-xs font-bold text-navy">
                      Most Popular
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-navy/60">
                  <span>
                    Central: ₹{tier.central.toLocaleString("en-IN")}
                  </span>

                  {tier.state && (
                    <span>
                      West Bengal State: ₹{tier.state.toLocaleString("en-IN")}
                    </span>
                  )}

                  {tier.stateNote && (
                    <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                      {tier.stateNote}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}