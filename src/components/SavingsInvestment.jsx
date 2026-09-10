import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

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

export default function SavingsInvestment() {
  return (
    <section className="bg-white py-14 lg:py-20">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="max-w-xl"
        >
          <h2 className="text-2xl font-extrabold text-navy sm:text-3xl">
            Savings & investment
          </h2>
          <p className="mt-2 text-sm text-muted">
            Example for a 3 kW system — illustrative figures, your actual
            quote may vary.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5 lg:gap-8">
          {/* Cost breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-3"
          >
            <div className="divide-y divide-navy/10 rounded-2xl border border-navy/10">
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-sm text-muted">Approx. system cost</span>
                <span className="font-bold text-navy">
                  ₹<AnimatedNumber value={198000} />
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-sm text-muted">Government support</span>
                <span className="font-bold text-success">
                  − ₹<AnimatedNumber value={138000} />
                </span>
              </div>
              <div className="flex items-center justify-between rounded-b-2xl bg-navy px-5 py-5">
                <span className="text-sm font-semibold text-white">Your net investment</span>
                <span className="text-xl font-extrabold text-amber">
                  ₹<AnimatedNumber value={60000} />
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">
              Affordable EMI options available through eligible banks — low
              upfront burden, full documentation support included.
            </p>
          </motion.div>

          {/* Monthly savings callout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="flex h-full flex-col justify-center rounded-2xl bg-amber-soft p-6">
              <p className="text-xs font-semibold text-navy/70">
                Estimated monthly savings
              </p>
              <p className="mt-1 text-3xl font-extrabold text-navy">
                ₹1,500 – ₹1,800
              </p>
              <p className="mt-1 text-xs text-muted">
                Depending on usage & tariff
              </p>
              <div className="mt-4 border-t border-navy/10 pt-4">
                <p className="text-xl font-extrabold text-navy">25+ Years</p>
                <p className="mt-1 text-xs text-muted">
                  of clean energy and big savings
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}