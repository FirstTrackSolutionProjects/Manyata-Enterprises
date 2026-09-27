import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { getApprovedPartnerNetwork } from "../services/api";

const FIELDS = [
  ["superVendorName", "Super-vendor", "allPartners"],
  ["vendorName", "Vendor", "allPartners"],
  ["subVendorName", "Sub-vendor", "allPartners"],
  ["salesExecutiveName", "Sales Executive", "salesExecutives"],
];

const distance = (left, right) => {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[right.length];
};

const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const matchesSearch = (name, search) => {
  const target = normalize(name);
  const query = normalize(search);
  if (!query || target.includes(query)) return true;
  const names = target.split(/\s+/);
  return query.split(/\s+/).every((word) => names.some((candidate) =>
    distance(word, candidate) <= Math.max(1, Math.floor(Math.max(word.length, candidate.length) * 0.45))
  ));
};

export default function PartnerNetworkFields({ location, form, onChange, fields = FIELDS }) {
  const [options, setOptions] = useState({});
  const [queries, setQueries] = useState({});
  const [openField, setOpenField] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    setError("");
    try {
      const response = await getApprovedPartnerNetwork(location);
      setOptions(response?.data || {});
    } catch (err) {
      setError(err.message || "Could not load partner names. You can still enter a name manually.");
      setOptions({});
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    setOptions({});
    setQueries({});
  }, [location]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {fields.map(([key, label, source]) => {
      const query = queries[key] ?? form[key] ?? "";
      const sourceNames = source === "allPartners"
        ? [...(options.superVendors || []), ...(options.vendors || []), ...(options.subVendors || []), ...(options.dealers || [])]
        : options[source] || [];
      const names = [...new Set(sourceNames.map((item) => typeof item === "string" ? item : item.name).filter(Boolean))];
      const matches = names.filter((name) => matchesSearch(name, query)).slice(0, 40);
      return <div key={key} className="relative">
        <label className="block text-xs font-semibold text-navy/70">
          <span className="mb-1.5 flex items-center justify-between gap-2"><span>{label}</span><button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1 font-semibold text-amber hover:underline disabled:opacity-50"><RefreshCw size={12} className={loading ? "animate-spin" : ""} />Refresh</button></span>
          <span className="flex gap-2">
            <input type="search" value={query} onChange={(event) => { const value = event.target.value; setQueries((current) => ({ ...current, [key]: value })); onChange({ target: { name: key, value } }); setOpenField(key); }} onFocus={() => setOpenField(key)} onBlur={() => setTimeout(() => setOpenField((current) => current === key ? "" : current), 120)} placeholder={`Search ${label.toLowerCase()} by name...`} autoComplete="off" className="min-w-0 flex-1 rounded-lg border border-navy/15 bg-white px-3.5 py-2.5 text-sm text-navy focus:border-amber focus:outline-none" />
            <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setOpenField((current) => current === key ? "" : key)} aria-label={`Search ${label}`} className="inline-flex items-center gap-1.5 rounded-lg border border-navy/15 px-3 text-xs font-bold text-navy hover:border-amber"><Search size={15} />Search</button>
          </span>
        </label>
        {openField === key && <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-navy/15 bg-white py-1 shadow-lg">
          {loading ? <p className="flex items-center gap-2 px-3 py-2 text-sm text-muted"><Loader2 size={14} className="animate-spin" />Loading names...</p> : matches.length ? matches.map((name) => <button key={name} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange({ target: { name: key, value: name } }); setQueries((current) => ({ ...current, [key]: name })); setOpenField(""); }} className="block w-full px-3.5 py-2 text-left text-sm text-navy hover:bg-amber-soft">{name}</button>) : <p className="px-3.5 py-2 text-sm text-muted">{error || `No matching ${label.toLowerCase()} names. You can enter the name manually.`}</p>}
        </div>}
        {form[key] && <p className="mt-1 text-[11px] text-muted">Selected / entered: {form[key]}</p>}
      </div>;
    })}
  </div>;
}
