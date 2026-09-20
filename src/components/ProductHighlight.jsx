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

/*
 * ── IMAGE CONFIGURATION ────────────────────────────────────────────────
 * Replace these URLs with your own hosted images / CDN links.
 * These are used as background images for each product card.
 */
const PRODUCTS = [
  {
    icon: SunMedium,
    title: "Solar PV Modules",
    image:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80",
  },
  {
    icon: Zap,
    title: "On-Grid Solar Inverter",
    image:
      "https://images.unsplash.com/photo-1548337138-e87d889cc369?auto=format&fit=crop&w=800&q=80",
  },
  {
    icon: Layers,
    title: "Mounting Structure",
    image:
      "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=800&q=80",
  },
  {
    icon: Cable,
    title: "DC / AC Cables",
    image:
      "https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=800&q=80",
  },
  {
    icon: BatteryCharging,
    title: "DCDB & ACDB",
    image:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80",
  },
  {
    icon: Radio,
    title: "Earthing & Lightning Protection",
    image:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
  },
  {
    icon: Gauge,
    title: "Net Metering Equipment",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
  },
  {
    icon: Wrench,
    title: "Installation & Commissioning",
    image:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80",
  },
];

/*
 * ── BRAND LOGOS ────────────────────────────────────────────────────────
 * Replace each `logo` URL with the actual brand logo image URL.
 * These are displayed as a static grid (no marquee).
 */
const BRANDS = [
  { name: "Waaree", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyRuhPa2BbkW-3mlbxz_jJZhjYELfoNm-w9Ub1d25EJg&s=10" },
  { name: "Adani", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTEsjCWBcRtNuCjyD2Q9SMthXBn7RWDTN6xkhxQP0Exqg&s" },
  { name: "Tata", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTDA4ETNdPuR1y1aa3HqdRYRSfmof_xk8MrnPrDFOruQ&s=10" },
  { name: "Microtek", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRvR1Kl4iTsI_xE1w2UdHZCufKfROlL3IbBJZX7sT-wA&s=10" },
  { name: "Luminous", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxpcZBdyaOB6vEKA300GUGuzrY48_m4wEQMZzqnamHqA&s=10" },
  { name: "Jindal", logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqKYOb8YpXGr7vog1tU4FlldwGbgu-Y-JhMIGMaG5MHA&s=10" },
  { name: "Polycab", logo: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Polycab_India_logo.png/250px-Polycab_India_logo.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail" },
  { name: "Havells", logo: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/57/Havells_Logo.svg/250px-Havells_Logo.svg.png?utm_source=en.wikipedia.org&utm_campaign=parser&utm_content=thumbnail" },
];

export default function ProductHighlight() {
  return (
    <section id="products" className="bg-white py-14 lg:py-20 overflow-hidden">
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
          <a
            href="#contact"
            className="flex items-center gap-1.5 text-sm font-bold text-navy hover:text-amber"
          >
            View all products <ArrowRight size={16} />
          </a>
        </motion.div>

        {/* Product cards with background images */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map(({ icon: Icon, title, image }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group relative h-48 overflow-hidden rounded-2xl border border-navy/10"
            >
              {/* Background image */}
              <img
                src={image}
                alt={title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Dark gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/50 to-navy/10" />

              {/* Content */}
              <div className="relative flex h-full flex-col items-center justify-end gap-2 p-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber text-navy shadow-lg">
                  <Icon size={18} strokeWidth={2} />
                </div>
                <p className="text-xs font-bold text-white drop-shadow-md sm:text-sm">
                  {title}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Brand logos — static grid (no marquee) */}
        <div className="mt-12 border-t border-navy/10 pt-8">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted">
            Trusted Brands We Work With
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5 sm:gap-x-12 sm:gap-y-6">
            {BRANDS.map((brand) => (
              <div
                key={brand.name}
                className="flex items-center justify-center"
                title={brand.name}
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  loading="lazy"
                  className="h-8 w-auto max-w-[100px] object-contain opacity-90 transition-opacity hover:opacity-100 sm:h-10 sm:max-w-[120px]"
                  onError={(e) => {
                    // Fallback: hide broken image and show brand name
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextSibling.style.display = "inline";
                  }}
                />
                <span
                  className="hidden text-sm font-bold text-muted"
                  style={{ display: "none" }}
                >
                  {brand.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}