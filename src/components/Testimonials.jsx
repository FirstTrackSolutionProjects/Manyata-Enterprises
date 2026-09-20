import { Quote, Star } from "lucide-react";
import { motion } from "framer-motion";

/*
 * ── TESTIMONIALS DATA ──────────────────────────────────────────────────
 * Replace with real customer feedback.
 * Set `avatar` to a hosted image URL (or leave as the placeholder).
 */
const TESTIMONIALS = [
  {
    name: "Sasmita Mohanty",
    location: "Bhubaneswar, Odisha",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    quote:
      "The team handled everything — from subsidy paperwork to net metering. Our electricity bill dropped from ₹2,800 to under ₹300. Truly hassle-free.",
    system: "3 kW On-Grid",
  },
  {
    name: "Rajesh Kumar Sahoo",
    location: "Cuttack, Odisha",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    quote:
      "Very transparent pricing and the installation was done within a week. The after-sales support team actually picks up the phone. Highly recommended.",
    system: "2 kW On-Grid",
  },
  {
    name: "Priyanka Das",
    location: "Balasore, Odisha",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
    rating: 4,
    quote:
      "I was skeptical about the subsidy process, but Manyata Enterprises made it simple. Got my ₹78,000 subsidy credited without any follow-up stress.",
    system: "3 kW Hybrid",
  },
  {
    name: "Abhijit Banerjee",
    location: "Kolkata, West Bengal",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    quote:
      "Professional installation, clean workmanship, and on-time delivery. The 5-year service commitment gave me real peace of mind.",
    system: "3 kW On-Grid",
  },
  {
    name: "Sunita Patel",
    location: "Puri, Odisha",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    quote:
      "From the first site survey to final commissioning, everything was smooth. The team explained every step clearly. Best decision for our home.",
    system: "1 kW On-Grid",
  },
  {
    name: "Debashish Nayak",
    location: "Soro, Balasore",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    rating: 5,
    quote:
      "They assisted with the bank loan too. Zero upfront burden and the EMI is less than what I used to pay for electricity. Win-win.",
    system: "3 kW Hybrid",
  },
];

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={
            s <= rating
              ? "fill-amber text-amber"
              : "fill-none text-navy/20"
          }
        />
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="bg-offwhite py-14 lg:py-20">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <span className="text-sm font-semibold text-amber">
            Customer Feedback
          </span>
          <h2 className="mt-2 text-2xl font-extrabold text-navy sm:text-3xl">
            What our customers say
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
            Real stories from homes across Odisha and West Bengal that have
            switched to solar with Manyata Enterprises.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex h-full flex-col rounded-2xl border border-navy/10 bg-white p-6 transition-shadow hover:shadow-lg"
            >
              <Quote size={28} className="text-amber/40" />
              <p className="mt-3 flex-1 text-sm leading-relaxed text-navy/80">
                "{t.quote}"
              </p>

              <div className="mt-4">
                <StarRating rating={t.rating} />
              </div>

              <div className="mt-4 flex items-center gap-3 border-t border-navy/10 pt-4">
                <img
                  src={t.avatar}
                  alt={t.name}
                  loading="lazy"
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-navy">
                    {t.name}
                  </p>
                  <p className="truncate text-xs text-muted">{t.location}</p>
                  <p className="truncate text-[10px] font-semibold text-amber">
                    {t.system}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}