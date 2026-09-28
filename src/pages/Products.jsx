import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  SunMedium,
  Zap,
  BatteryCharging,
  Cable,
  Layers,
  Package,
} from "lucide-react";

// Files live in /public, so they're served from the site root.
// encodeURI handles the spaces in file names (e.g. "jsw panel frame").
// ⚠️ Change each extension (.png / .jpg / .webp) to match your actual files.
const img = (file) => encodeURI(`/${file}`);

const IMAGES = {
  adaniPanel: img("Adani-Bifacial-Solar-Panel.png"),
  tataPv: img("tata_pv.png"),
  tataRooftop: img("TATA-Solar-On-Grid-Rooftop-Power-Plant.jpg"),
  waaree1: img("waaree1.jpg"),
  waaree2: img("waaree2.png"),
  microtekInverter: img("Microtek inverter.png"),
  luminousBattery: img("luminous battery.jpg"),
  microtekBattery: img("microtek battery.jpg"),
  microtekCable: img("microtek cable.png"),
  tataFrame: img("tata panel frame.jpg"),
  jswFrame: img("jsw_panel_frame.png"),
  jindalFrame: img("jindal panel frame.jpeg"),
};

const CATEGORIES = [
  { id: "solar-panel", label: "Solar Panel", icon: SunMedium },
  { id: "inverter", label: "Inverter", icon: Zap },
  { id: "battery", label: "Battery", icon: BatteryCharging },
  { id: "cable", label: "Cable", icon: Cable },
  { id: "panel-structure", label: "Panel Structure", icon: Layers },
];

// Placeholder specs — replace "Spec details coming soon" with real details later.
const PRODUCTS = [
  // Solar Panels
  {
    id: "tata-pv",
    category: "solar-panel",
    brand: "Tata Power Solar",
    name: "Tata Power Solar PV Module",
    spec: "Spec details coming soon",
    image: IMAGES.tataPv,
  },
  {
    id: "tata-rooftop",
    category: "solar-panel",
    brand: "Tata Power Solar",
    name: "Tata Power Solar On-Grid Rooftop Power Plant",
    spec: "Spec details coming soon",
    image: IMAGES.tataRooftop,
  },
  {
    id: "adani-bifacial",
    category: "solar-panel",
    brand: "Adani",
    name: "Adani Bifacial Solar Panel",
    spec: "Spec details coming soon",
    image: IMAGES.adaniPanel,
  },
  {
    id: "waaree-1",
    category: "solar-panel",
    brand: "Waaree",
    name: "Waaree Solar Panel",
    spec: "Spec details coming soon",
    image: IMAGES.waaree1,
  },
  {
    id: "waaree-2",
    category: "solar-panel",
    brand: "Waaree",
    name: "Waaree Solar Panel Range",
    spec: "Spec details coming soon",
    image: IMAGES.waaree2,
  },

  // Inverter
  {
    id: "microtek-inverter",
    category: "inverter",
    brand: "Microtek",
    name: "Microtek Solar Inverter",
    spec: "Spec details coming soon",
    image: IMAGES.microtekInverter,
  },

  // Battery
  {
    id: "luminous-battery",
    category: "battery",
    brand: "Luminous",
    name: "Luminous Solar Battery",
    spec: "Spec details coming soon",
    image: IMAGES.luminousBattery,
  },
  {
    id: "microtek-battery",
    category: "battery",
    brand: "Microtek",
    name: "Microtek Battery",
    spec: "Spec details coming soon",
    image: IMAGES.microtekBattery,
  },

  // Cable
  {
    id: "microtek-cable",
    category: "cable",
    brand: "Microtek",
    name: "Microtek Solar Cable",
    spec: "Spec details coming soon",
    image: IMAGES.microtekCable,
  },

  // Panel Structure
  {
    id: "tata-frame",
    category: "panel-structure",
    brand: "Tata",
    name: "Tata Panel Mounting Structure",
    spec: "Spec details coming soon",
    image: IMAGES.tataFrame,
  },
  {
    id: "jsw-frame",
    category: "panel-structure",
    brand: "JSW",
    name: "JSW Panel Mounting Structure",
    spec: "Spec details coming soon",
    image: IMAGES.jswFrame,
  },
  {
    id: "jindal-frame",
    category: "panel-structure",
    brand: "Jindal",
    name: "Jindal Panel Mounting Structure",
    spec: "Spec details coming soon",
    image: IMAGES.jindalFrame,
  },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || CATEGORIES[0].id;
  const [activeBrand, setActiveBrand] = useState("All");

  const category =
    CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];

  // Products in this category, and the brands that actually have products here
  const categoryProducts = PRODUCTS.filter((p) => p.category === category.id);
  const brands = [...new Set(categoryProducts.map((p) => p.brand))];

  const products =
    activeBrand === "All"
      ? categoryProducts
      : categoryProducts.filter((p) => p.brand === activeBrand);

  const handleCategoryChange = (id) => {
    setSearchParams({ category: id });
    setActiveBrand("All");
  };

  return (
    <>
      {/* Page banner */}
      <section className="bg-navy py-14 text-white lg:py-16">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-sm font-semibold text-amber">Products</span>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Solar Products We Provide
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
              Trusted, industry-leading brands across every component of
              your solar system.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category tabs */}
      <section className="border-b border-navy/10 bg-white">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-4">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.id === category.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-navy text-white"
                      : "bg-offwhite text-navy/70 hover:bg-amber-soft hover:text-navy"
                  }`}
                >
                  <Icon size={16} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Brand filter + product grid */}
      <section className="bg-offwhite py-14 lg:py-20">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveBrand("All")}
              className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                activeBrand === "All"
                  ? "border-amber bg-amber text-navy"
                  : "border-navy/15 bg-white text-navy/70 hover:border-amber"
              }`}
            >
              All Brands
            </button>
            {brands.map((brand) => (
              <button
                key={brand}
                onClick={() => setActiveBrand(brand)}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                  activeBrand === brand
                    ? "border-amber bg-amber text-navy"
                    : "border-navy/15 bg-white text-navy/70 hover:border-amber"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${category.id}-${activeBrand}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-navy/10 bg-white transition-colors hover:border-amber"
                >
                  {/* object-contain keeps the whole product visible (no cropping) */}
                  <div className="flex aspect-[4/3] w-full items-center justify-center bg-white p-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col gap-2 border-t border-navy/10 p-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-amber">
                      <Package size={16} />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber">
                      {product.brand}
                    </p>
                    <h3 className="text-sm font-bold text-navy">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted">{product.spec}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}