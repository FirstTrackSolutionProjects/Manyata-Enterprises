import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  SunMedium,
  Zap,
  CircuitBoard,
  BatteryCharging,
  Cable,
  Layers,
  Wrench,
  ArrowRight,
  ImageOff,
  ChevronLeft,
  ChevronRight,
  Phone,
} from "lucide-react";
import { assets } from "../assets/assets.js";


/*
  ── IMAGES STILL NEEDED ──────────────────────────────────────────────
  Products below use `assets.<key>`. If a key is missing in assets.js the
  card simply shows "Image coming soon" — nothing breaks. When you get a
  photo: import it in assets.js and export it under the key shown here.

  ACDB / DCDB : waareeacdb, waareedcdb, microtekacdb, microtekdcdb,
                luminousacdb, luminousdcdb, havellsacdb, havellsdcdb
  Battery     : microtekbattery
  Cable       : solcabla
  Earthing    : earthingkitlatops, earthingkitbasestand, earthingkitpintype,
                earthingkitsinglespike, pitcover
  Hardware    : anchorfastener, jbolt, ubolt, flangenut, gipatti, midclamp,
                endclamp, lncapbolt, springnut, zincspray
  PVC         : himgiripvctee, himgiripvcelbow, himgiripvcbend, himgiripvcpipe
  Electrical  : pinlug, cabletie, pvccabletray, mc4connector
*/

// Older images that still load from /public
const img = (file) => encodeURI(`/${file}`);

const IMAGES = {
  // ── Solar Panels (one image is shared by every wattage of that panel) ──
  tataPv: img("tata_pv.png"),
  adaniPanel: img("Adani-Bifacial-Solar-Panel.png"),
  waaree1: img("waaree1.jpg"),
  waaree2: img("waaree2.png"),

  // ── Inverters ──
  microtekInverter: img("Microtek inverter.png"),
  luminousInverter: img("luminous inverter.png"),

  // ── Lithium Batteries ──
  vtBattery: img("VT-battery.png"),

  // ── Cables (Wire) ──
  polycabAC: img("polycab-ac.png"),
  polycabDC: img("polycab-dc-cable.jpg"),
  finolexAC: img("finolex-ac.png"),
  finolexDC: img("finolex dc cable.png"),

  // ── Panel Structures ──
  tataFrame: img("tata panel frame.jpg"),
  jswFrame: img("jsw_panel_frame.png"),
  jindalFrame: img("jindal panel frame.jpeg"),
};

// Category ids are used in the URL (?category=...), so keep them in sync
// with the links in your Navbar dropdown.
const CATEGORIES = [
  { id: "solar-panel", label: "Solar Panel", icon: SunMedium },
  { id: "inverter", label: "Inverter", icon: Zap },
  { id: "acdb-dcdb", label: "ACDB / DCDB", icon: CircuitBoard },
  { id: "battery", label: "Lithium Battery", icon: BatteryCharging },
  { id: "cable", label: "Cable (Wire)", icon: Cable },
  { id: "panel-structure", label: "Panel Structure", icon: Layers },
  { id: "accessories", label: "All Accessories", icon: Wrench },
];

/*
  Fields per product (every product is its own card):
  - brand:  shown as the label and used for the filter chips
  - group:  used for the filter chips when there is no brand (accessories)
  - badge:  small tag (e.g. "TOPCon", "ACDB", "AC")
  - rating: e.g. "605 Wp"
*/
const PRODUCTS = [
  // ── Solar Panels (DCR) — one card per model / wattage ──
  { id: "waaree-topcon-605", category: "solar-panel", brand: "Waaree", name: "Waaree TOPCon 605 Wp", spec: "DCR", badge: "TOPCon", rating: "605 Wp", image: IMAGES.waaree1 },
  { id: "waaree-topcon-610", category: "solar-panel", brand: "Waaree", name: "Waaree TOPCon 610 Wp", spec: "DCR", badge: "TOPCon", rating: "610 Wp", image: IMAGES.waaree1 },
  { id: "waaree-topcon-615", category: "solar-panel", brand: "Waaree", name: "Waaree TOPCon 615 Wp", spec: "DCR", badge: "TOPCon", rating: "615 Wp", image: IMAGES.waaree1 },

  { id: "waaree-bifacial-525", category: "solar-panel", brand: "Waaree", name: "Waaree Bifacial 525 Wp", spec: "DCR", badge: "Bifacial", rating: "525 Wp", image: IMAGES.waaree2 },
  { id: "waaree-bifacial-540", category: "solar-panel", brand: "Waaree", name: "Waaree Bifacial 540 Wp", spec: "DCR", badge: "Bifacial", rating: "540 Wp", image: IMAGES.waaree2 },
  { id: "waaree-bifacial-550", category: "solar-panel", brand: "Waaree", name: "Waaree Bifacial 550 Wp", spec: "DCR", badge: "Bifacial", rating: "550 Wp", image: IMAGES.waaree2 },

  { id: "adani-topcon-605", category: "solar-panel", brand: "Adani", name: "Adani TOPCon 605 Wp", spec: "DCR", badge: "TOPCon", rating: "605 Wp", image: assets.adanitopcon },
  { id: "adani-topcon-610", category: "solar-panel", brand: "Adani", name: "Adani TOPCon 610 Wp", spec: "DCR", badge: "TOPCon", rating: "610 Wp", image: assets.adanitopcon },
  { id: "adani-topcon-615", category: "solar-panel", brand: "Adani", name: "Adani TOPCon 615 Wp", spec: "DCR", badge: "TOPCon", rating: "615 Wp", image: assets.adanitopcon },

  { id: "adani-bifacial-525", category: "solar-panel", brand: "Adani", name: "Adani Bifacial 525 Wp", spec: "DCR", badge: "Bifacial", rating: "525 Wp", image: IMAGES.adaniPanel },
  { id: "adani-bifacial-540", category: "solar-panel", brand: "Adani", name: "Adani Bifacial 540 Wp", spec: "DCR", badge: "Bifacial", rating: "540 Wp", image: IMAGES.adaniPanel },
  { id: "adani-bifacial-550", category: "solar-panel", brand: "Adani", name: "Adani Bifacial 550 Wp", spec: "DCR", badge: "Bifacial", rating: "550 Wp", image: IMAGES.adaniPanel },

  { id: "tata-topcon-605", category: "solar-panel", brand: "Tata", name: "Tata TOPCon 605 Wp", spec: "DCR", badge: "TOPCon", rating: "605 Wp", image: IMAGES.tataPv },
  { id: "tata-topcon-610", category: "solar-panel", brand: "Tata", name: "Tata TOPCon 610 Wp", spec: "DCR", badge: "TOPCon", rating: "610 Wp", image: IMAGES.tataPv },

  { id: "tata-bifacial-540", category: "solar-panel", brand: "Tata", name: "Tata Bifacial 540 Wp", spec: "DCR", badge: "Bifacial", rating: "540 Wp", image: assets.tatabifacial },

  // ── Inverters (3 brands) ──
  { id: "waaree-inverter", category: "inverter", brand: "Waaree", name: "Waaree Inverter", spec: "3.3 kW · 1 Phase", image: assets.waareeinverter },
  { id: "microtek-inverter", category: "inverter", brand: "Microtek", name: "Microtek Inverter", spec: "3.3 kW · 1 Phase", image: IMAGES.microtekInverter },
  { id: "luminous-inverter", category: "inverter", brand: "Luminous", name: "Luminous Inverter", spec: "3.3 kW · 1 Phase", image: IMAGES.luminousInverter },

  // ── ACDB / DCDB ──
  { id: "waaree-acdb", category: "acdb-dcdb", brand: "Waaree", name: "Waaree ACDB", spec: "32 A · 600 V", badge: "ACDB", image: assets.waareeacdb },
  { id: "waaree-dcdb", category: "acdb-dcdb", brand: "Waaree", name: "Waaree DCDB", spec: "1 IN · 1 OUT", badge: "DCDB", image: assets.waareedcdb },
  { id: "microtek-acdb", category: "acdb-dcdb", brand: "Microtek", name: "Microtek ACDB", spec: "32 A · 600 V", badge: "ACDB", image: assets.microtekacdb },
  { id: "microtek-dcdb", category: "acdb-dcdb", brand: "Microtek", name: "Microtek DCDB", spec: "1 IN · 1 OUT", badge: "DCDB", image: assets.microtekdcdb },
  { id: "luminous-acdb", category: "acdb-dcdb", brand: "Luminous", name: "Luminous ACDB", spec: "32 A · 600 V", badge: "ACDB", image: assets.luminousacdb },
  { id: "luminous-dcdb", category: "acdb-dcdb", brand: "Luminous", name: "Luminous DCDB", spec: "1 IN · 1 OUT", badge: "DCDB", image: assets.luminousdcdb },
  { id: "havells-acdb", category: "acdb-dcdb", brand: "Havells", name: "Havells ACDB", spec: "32 A · 600 V", badge: "ACDB", image: assets.havellsacdb },
  { id: "havells-dcdb", category: "acdb-dcdb", brand: "Havells", name: "Havells DCDB", spec: "1 IN · 1 OUT", badge: "DCDB", image: assets.havellsdcdb },

  // ── Lithium Batteries (51.2 V · 100 Ah) ──
  { id: "microtekbattery", category: "battery", brand: "Microtek", name: "Microtek Lithium Battery", spec: "51.2 V · 100 Ah (≈ 5.12 kWh)", badge: "Lithium", image: assets.microtekbattery },
  { id: "exidebattery", category: "battery", brand: "Exide", name: "Exide Lithium Battery", spec: "51.2 V · 100 Ah (≈ 5.12 kWh)", badge: "Lithium", image: assets.exidebattery },
  { id: "vguardbattery", category: "battery", brand: "V-Guard", name: "V-Guard Lithium Battery", spec: "51.2 V · 100 Ah (≈ 5.12 kWh)", badge: "Lithium", image: IMAGES.vtBattery },

  // ── Cables (Wire) ──
  { id: "polycab-ac", category: "cable", brand: "Polycab", name: "Polycab AC Cable", spec: "4 sq mm", badge: "AC", image: IMAGES.polycabAC },
  { id: "polycab-dc", category: "cable", brand: "Polycab", name: "Polycab DC Cable", spec: "4 sq mm", badge: "DC", image: IMAGES.polycabDC },
  { id: "finolex-ac", category: "cable", brand: "Finolex", name: "Finolex AC Cable", spec: "4 sq mm", badge: "AC", image: IMAGES.finolexAC },
  { id: "finolex-dc", category: "cable", brand: "Finolex", name: "Finolex DC Cable", spec: "4 sq mm", badge: "DC", image: IMAGES.finolexDC },
  { id: "solcab-la", category: "cable", brand: "Solcab", name: "Solcab LA Cable", spec: "16 sq mm", badge: "LA", image: assets.solcabla },

  // ── Panel Structures (galvanized) ──
  { id: "tata-frame", category: "panel-structure", brand: "Tata", name: "Tata Panel Mounting Structure", spec: "Galvanized", image: IMAGES.tataFrame },
  { id: "jsw-frame", category: "panel-structure", brand: "JSW", name: "JSW Panel Mounting Structure", spec: "Galvanized", image: IMAGES.jswFrame },
  { id: "jindal-frame", category: "panel-structure", brand: "Jindal", name: "Jindal Panel Mounting Structure", spec: "Galvanized", image: IMAGES.jindalFrame },

  // ── All Accessories ──
  // `group` makes the filter chips; add `brand` only where a brand is known.
  { id: "earthing-la-tops", category: "accessories", group: "Earthing", name: "Earthing Kit – LA Tops", spec: "4 inch", image: assets.earthingkitlatops },
  { id: "earthing-base-stand", category: "accessories", group: "Earthing", name: "Earthing Kit – Base Stand", spec: "Spec details coming soon", image: assets.earthingkitbasestand },
  { id: "earthing-pin-type", category: "accessories", group: "Earthing", name: "Earthing Kit – Pin Type", spec: "1 mtr", image: assets.earthingkitpintype },
  { id: "earthing-single-spike", category: "accessories", group: "Earthing", name: "Earthing Kit – Single Spike", spec: "1 mtr", image: assets.earthingkitsinglespike },
  { id: "pit-cover", category: "accessories", group: "Earthing", name: "Pit Cover", spec: "Spec details coming soon", image: assets.pitcover },
  { id: "anchor-fastener", category: "accessories", group: "Mounting Hardware", name: "Anchor Fastener", spec: "10 × 100", image: assets.anchorfastener },
  { id: "j-bolt", category: "accessories", group: "Mounting Hardware", name: "J-Bolt", spec: "60 × 40", image: assets.jbolt },
  { id: "u-bolt", category: "accessories", group: "Mounting Hardware", name: "U-Bolt", spec: "60 × 40 × 60", image: assets.ubolt },
  { id: "flange-nut", category: "accessories", group: "Mounting Hardware", name: "Flange Nut", spec: "Regular", image: assets.flangenut },
  { id: "gi-patti", category: "accessories", group: "Mounting Hardware", name: "GI Patti", spec: "4 inch · Double hole", image: assets.gipatti },
  { id: "mid-clamp", category: "accessories", group: "Mounting Hardware", name: "Mid Clamp", spec: "30 × 75", image: assets.midclamp },
  { id: "end-clamp", category: "accessories", group: "Mounting Hardware", name: "End Clamp", spec: "30 × 75", image: assets.endclamp },
  { id: "ln-cap-bolt", category: "accessories", group: "Mounting Hardware", name: "LN Cap Bolt", spec: "25 mm", image: assets.lncapbolt },
  { id: "spring-nut", category: "accessories", group: "Mounting Hardware", name: "Spring Nut", spec: "25 mm", image: assets.springnut },
  { id: "zinc-spray", category: "accessories", group: "Mounting Hardware", name: "Zinc Spray", spec: "400 ml", image: assets.zincspray },
  { id: "himgiri-pvc-tee", category: "accessories", brand: "Himgiri", group: "PVC Fittings", name: "Himgiri PVC Tee", spec: "25 mm", image: assets.himgiripvctee },
  { id: "himgiri-pvc-elbow", category: "accessories", brand: "Himgiri", group: "PVC Fittings", name: "Himgiri PVC Elbow", spec: "25 mm", image: assets.himgiripvcelbow },
  { id: "himgiri-pvc-bend", category: "accessories", brand: "Himgiri", group: "PVC Fittings", name: "Himgiri PVC Bend", spec: "25 mm", image: assets.himgiripvcbend },
  { id: "himgiri-pvc-pipe", category: "accessories", brand: "Himgiri", group: "PVC Fittings", name: "Himgiri PVC Pipe", spec: "25 mm", image: assets.himgiripvcpipe },
  { id: "pin-lug", category: "accessories", group: "Electrical", name: "Pin Lug", spec: "Pin copper · 8 mm", image: assets.pinlug },
  { id: "cable-tie", category: "accessories", group: "Electrical", name: "Cable Tie", spec: "PVC UV protected · 300 mm × 4.8 mm", image: assets.cabletie },
  { id: "pvc-cable-tray", category: "accessories", group: "Electrical", name: "PVC Cable Tray (Trunking)", spec: "45 × 25", image: assets.pvccabletray },
  { id: "mc4-connector", category: "accessories", group: "Electrical", name: "MC4 Connector", spec: "M/F", image: assets.mc4connector },
];

// Filter chip + label: brand when there is one, otherwise the group
const tagOf = (p) => p.group || p.brand;

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || CATEGORIES[0].id;
  const [activeBrand, setActiveBrand] = useState("All");
  const [selectedId, setSelectedId] = useState(null);

  const category =
    CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];

  const categoryProducts = PRODUCTS.filter((p) => p.category === category.id);
  const brands = [...new Set(categoryProducts.map(tagOf))];

  const list =
    activeBrand === "All"
      ? categoryProducts
      : categoryProducts.filter((p) => tagOf(p) === activeBrand);

  // Selected product (falls back to the first one whenever filters change)
  const index = Math.max(0, list.findIndex((p) => p.id === selectedId));
  const selected = list[index];

  const go = (step) =>
    setSelectedId(list[(index + step + list.length) % list.length].id);

  const handleCategoryChange = (id) => {
    setSearchParams({ category: id });
    setActiveBrand("All");
    setSelectedId(null);
  };

  const handleBrandChange = (brand) => {
    setActiveBrand(brand);
    setSelectedId(null);
  };

  // Floating chips around the product + fact tiles under the title
  const chips = [selected.badge, selected.rating];
  if (!selected.spec.startsWith("Spec details")) chips.push(selected.spec);
  const shownChips = chips.filter(Boolean).slice(0, 3);
  const chipPositions = [
    "right-0 top-8",
    "left-0 bottom-20",
    "right-2 bottom-3",
  ];

  const facts = [];
  if (selected.badge)
    facts.push([
      category.id === "solar-panel" ? "Technology" : "Type",
      selected.badge,
    ]);
  if (selected.rating) facts.push(["Rating", selected.rating]);
  facts.push(["Details", selected.spec]);
  facts.push(
    selected.brand ? ["Brand", selected.brand] : ["Group", selected.group]
  );

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

      {/* Showcase: pick a model on the left, see it large on the right */}
      <section className="bg-offwhite py-12 lg:py-16">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
          {brands.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {["All", ...brands].map((brand) => (
                <button
                  key={brand}
                  onClick={() => handleBrandChange(brand)}
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
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr] lg:gap-8">
            {/* Selector: horizontal strip on mobile, vertical list on desktop */}
            <div
              role="tablist"
              aria-label={`${category.label} models`}
              className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:max-h-[640px] lg:flex-col lg:overflow-y-auto lg:px-0 lg:pb-0 lg:pr-1"
            >
              {list.map((p) => {
                const active = p.id === selected.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedId(p.id)}
                    className={`relative flex w-[240px] shrink-0 snap-start items-center gap-3 rounded-2xl p-2.5 text-left ring-1 transition-all duration-300 lg:w-full ${
                      active
                        ? "bg-navy shadow-lg ring-navy"
                        : "bg-white ring-navy/10 hover:ring-amber/60"
                    }`}
                  >
                    <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-amber-soft to-[#E3EAF3]">
                      <ProductImage
                        compact
                        src={p.image}
                        alt={p.name}
                        className="p-1.5"
                      />
                    </span>
                    <span className="min-w-0 pr-4">
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-amber">
                        {p.brand || p.group}
                      </span>
                      <span
                        className={`line-clamp-2 block text-sm font-bold leading-snug ${
                          active ? "text-white" : "text-navy"
                        }`}
                      >
                        {p.name}
                      </span>
                      <span
                        className={`block truncate text-xs ${
                          active ? "text-white/60" : "text-muted"
                        }`}
                      >
                        {[p.badge, p.rating].filter(Boolean).join(" · ") ||
                          p.spec}
                      </span>
                    </span>
                    {active && (
                      <span className="absolute right-3.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-amber" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Stage */}
            <div className="relative overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-navy/10 sm:p-8 lg:p-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid items-center gap-10 md:grid-cols-2"
                >
                  {/* Product on an orbit backdrop */}
                  <div className="relative mx-auto aspect-square w-full max-w-[340px] md:order-last">
                    <div className="absolute -inset-3 rounded-full border border-dashed border-navy/15" />
                    <div className="absolute -inset-6 rounded-full border border-navy/[0.06]" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-soft via-offwhite to-[#DDE6F1]" />

                    <motion.div
                      className="absolute inset-6"
                      animate={{ y: [0, -7, 0] }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <ProductImage src={selected.image} alt={selected.name} />
                    </motion.div>

                    {shownChips.map((chip, i) => (
                      <motion.span
                        key={chip}
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          duration: 4 + i,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.4,
                        }}
                        className={`absolute z-10 rounded-full px-3 py-1.5 text-[11px] font-bold shadow-md ${chipPositions[i]} ${
                          i === 0
                            ? "bg-navy text-amber"
                            : "bg-white text-navy ring-1 ring-navy/10"
                        }`}
                      >
                        {chip}
                      </motion.span>
                    ))}
                  </div>

                  {/* Details */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-amber">
                      {selected.brand || selected.group} · {category.label}
                    </p>
                    <h2 className="mt-2 text-2xl font-extrabold leading-tight text-navy sm:text-3xl">
                      {selected.name}
                    </h2>

                    <dl className="mt-5 grid grid-cols-2 gap-3">
                      {facts.map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-xl bg-offwhite p-3 ring-1 ring-navy/5"
                        >
                          <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">
                            {label}
                          </dt>
                          <dd className="mt-0.5 text-sm font-bold text-navy">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 rounded-xl bg-amber px-5 py-3 text-sm font-bold text-navy transition-colors hover:bg-amber-hover"
                      >
                        Enquire now
                        <ArrowRight size={16} />
                      </Link>
                      <a
                        href="tel:+918114721300"
                        className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-navy ring-1 ring-navy/15 transition-colors hover:ring-amber"
                      >
                        <Phone size={16} />
                        Call us
                      </a>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Counter + prev / next */}
              <div className="mt-8 flex items-center justify-between border-t border-navy/10 pt-5">
                <p className="text-sm font-bold text-navy">
                  {String(index + 1).padStart(2, "0")}
                  <span className="text-muted">
                    {" "}
                    / {String(list.length).padStart(2, "0")}
                  </span>
                </p>
                {list.length > 1 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => go(-1)}
                      aria-label="Previous product"
                      className="flex h-10 w-10 items-center justify-center rounded-full text-navy ring-1 ring-navy/15 transition-colors hover:bg-amber hover:ring-amber"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => go(1)}
                      aria-label="Next product"
                      className="flex h-10 w-10 items-center justify-center rounded-full text-navy ring-1 ring-navy/15 transition-colors hover:bg-amber hover:ring-amber"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* Shows a neutral tile instead of a broken image
   while a product photo has not been added yet */
function ProductImage({ src, alt, compact = false, className = "" }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-navy/30">
        <ImageOff size={compact ? 20 : 32} strokeWidth={1.5} />
        {!compact && (
          <span className="text-[11px] font-medium">Image coming soon</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`h-full w-full object-contain mix-blend-multiply ${className}`}
    />
  );
}