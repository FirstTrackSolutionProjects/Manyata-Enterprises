import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export default function PartnerReferralPicker({ options, value, onChange, disabled = false, placeholder = "Choose referring partner", getOptionLabel }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const selected = options.find((item) => String(item.id) === String(value));
  const labelFor = (item) => getOptionLabel ? getOptionLabel(item) : `${item.company_name || item.contact_name} · #${item.id}`;
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return options;
    return options.filter((item) => `${item.company_name || ""} ${item.contact_name || ""} ${item.id} ${getOptionLabel ? getOptionLabel(item) : ""}`.toLocaleLowerCase().includes(term));
  }, [options, search, getOptionLabel]);

  return (
    <div className="mt-1.5">
      <button type="button" disabled={disabled} aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-left text-sm font-normal text-navy disabled:bg-slate-100">
        <span className="truncate">{selected ? labelFor(selected) : placeholder}</span>
        <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && !disabled && <div className="mt-2 overflow-hidden rounded-xl border border-navy/15 bg-white shadow-lg">
        <label className="flex items-center gap-2 border-b border-navy/10 px-3 py-2 text-muted">
          <Search size={15} />
          <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search partner name or ID" className="min-w-0 flex-1 border-0 bg-transparent text-sm text-navy outline-none placeholder:text-muted" />
        </label>
        <div className="max-h-44 overflow-y-auto overscroll-contain p-1.5">
          {filtered.map((item) => <button key={item.id} type="button" onClick={() => { onChange(String(item.id)); setOpen(false); setSearch(""); }} className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-navy hover:bg-amber-50">
            <span className="truncate">{labelFor(item)}</span>
            {String(item.id) === String(value) && <Check size={15} className="shrink-0 text-emerald-600" />}
          </button>)}
          {!filtered.length && <p className="px-3 py-3 text-sm text-muted">No matching referral partners.</p>}
        </div>
      </div>}
    </div>
  );
}
