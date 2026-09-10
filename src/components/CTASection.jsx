import { Phone, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <section id="contact" className="relative overflow-hidden bg-navy py-16 lg:py-20">
      {/* TODO: replace with a licensed photo of a solar installer/family
          celebrating on a rooftop (Unsplash/Pexels) */}
      <img
        src="https://picsum.photos/seed/solar-family-rooftop/1800/900"
        alt="Family with their rooftop solar installation"
        className="absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/95 to-navy/70" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4 }}
        className="relative mx-auto max-w-[1200px] px-5 text-center lg:px-8"
      >
        <h2 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
          Switch to solar. Save every month.
          <br />
          Build a brighter future.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/70 sm:text-base">
          From loan assistance to installation, warranty & 5-year service —
          Manyata Enterprises supports you throughout your solar journey.
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          
          <a  href="tel:+918114721300"
            className="flex items-center gap-2 rounded-full bg-amber px-7 py-3 text-sm font-bold text-navy transition-colors hover:bg-amber-hover"
          >
            <Phone size={16} strokeWidth={2.5} />
            8114721300 / 7008581300
          </a>
          
           <a href="mailto:support@themanyata.com"
            className="flex items-center gap-2 rounded-full border border-white/25 px-7 py-3 text-sm font-bold text-white transition-colors hover:border-white/50"
          >
            <Mail size={16} />
            support@themanyata.com
          </a>
        </div>
      </motion.div>
    </section>
  );
}