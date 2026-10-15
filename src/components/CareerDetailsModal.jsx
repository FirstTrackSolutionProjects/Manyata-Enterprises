import { useState } from "react";
import { Briefcase, FileText, Loader2, MapPin, Pencil, UserRound, X } from "lucide-react";
import { fileUrl, updateCareer, uploadFilesToS3 } from "../services/api";

const FIELDS = [
  ["firstName", "First Name"], ["lastName", "Last Name"], ["email", "Email", "email"],
  ["phone", "Phone"], ["dob", "Date of Birth"], ["gender", "Gender", "gender"],
  ["streetAddress", "Street Address"], ["city", "City"], ["district", "District"],
  ["state", "State"], ["postalCode", "Postal Code"], ["country", "Country"],
  ["jobrole", "Job Role"], ["location", "Location", "location"],
  ["qualification", "Qualification"], ["description", "Description", "textarea"],
];

const API_FIELD_NAMES = {
  firstName: "first_name",
  lastName: "last_name",
  streetAddress: "street_address",
  postalCode: "postal_code",
};
const INPUT = "mt-1.5 w-full rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm font-semibold text-navy transition focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30";

const readValue = (application, key) => {
  const value = application[key] ?? application[API_FIELD_NAMES[key]] ?? "";
  if (key === "location") {
    const normalized = String(value).trim().toLowerCase();
    if (normalized === "odisha") return "Odisha";
    if (normalized === "west bengal" || normalized === "kolkata") return "West Bengal";
    return "";
  }
  return value;
};

export default function CareerDetailsModal({ application, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    Object.fromEntries(FIELDS.map(([key]) => [key, readValue(application, key)])),
  );
  const [cv, setCv] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const files = await uploadFilesToS3("careers", cv ? { cv } : {});
      await updateCareer(application.id, { ...form, files });
      await onSaved();
    } catch (err) {
      setError(err.message || "Could not update career application.");
    } finally {
      setSaving(false);
    }
  };

  const renderField = ([key, label, type]) => (
    <label key={key} className={`text-xs font-semibold text-navy/70 ${type === "textarea" ? "sm:col-span-2" : ""}`}>
      {label}
      {type === "textarea" ? (
        <textarea rows={4} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className={`${INPUT} font-normal`} />
      ) : type === "gender" || type === "location" ? (
        <select required={type === "location"} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className={INPUT}>
          {type === "location" && <option value="" disabled>Select Odisha or West Bengal</option>}
          {(type === "gender" ? ["Male", "Female", "Other"] : ["Odisha", "West Bengal"]).map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      ) : (
        <input type={type || "text"} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className={INPUT} />
      )}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy/60 p-4 backdrop-blur-sm">
      <form onSubmit={save} className="mx-auto my-2 flex max-h-[calc(100vh-2rem)] max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-navy via-navy to-navy-light px-6 py-5">
          <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-amber/20" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber via-amber/60 to-transparent" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber text-navy"><Pencil size={20} /></span><div><h3 className="text-xl font-extrabold text-white">Edit Career Application</h3><p className="mt-0.5 text-xs text-white/70">Application #{application.id} · {`${form.firstName} ${form.lastName}`.trim()}</p></div></div>
            <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/25 transition hover:bg-white/20"><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto bg-offwhite/60 p-5 sm:p-6">
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">{error}</p>}
          <CareerEditSection icon={UserRound} title="Personal Details"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{FIELDS.filter(([key]) => ["firstName", "lastName", "email", "phone", "dob", "gender"].includes(key)).map(renderField)}</div></CareerEditSection>
          <CareerEditSection icon={MapPin} title="Address"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{FIELDS.filter(([key]) => ["streetAddress", "city", "district", "state", "postalCode", "country"].includes(key)).map(renderField)}</div></CareerEditSection>
          <CareerEditSection icon={Briefcase} title="Career Details"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{FIELDS.filter(([key]) => ["jobrole", "location", "qualification", "description"].includes(key)).map(renderField)}</div></CareerEditSection>
          <CareerEditSection icon={FileText} title="Resume / CV" subtitle="Upload a new file only if you want to replace the current resume.">
            {application.cvUrl ? <a href={fileUrl(application.cvUrl)} target="_blank" rel="noreferrer" className="mb-3 inline-flex items-center gap-2 rounded-lg border border-navy/10 bg-offwhite px-3 py-2 text-xs font-semibold text-navy hover:border-amber"><FileText size={15} className="text-amber" />View current CV</a> : <p className="mb-3 text-xs text-muted">No CV uploaded</p>}
            <input type="file" accept=".pdf,.doc,.docx" onChange={(event) => setCv(event.target.files?.[0] || null)} className="block w-full rounded-xl border border-navy/10 bg-white p-3 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-amber-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-navy" />
            {cv && <p className="mt-2 truncate text-xs font-semibold text-emerald-700">Selected: {cv.name}</p>}
          </CareerEditSection>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-navy/10 bg-white px-6 py-4"><button type="button" onClick={onClose} disabled={saving} className="rounded-full border border-navy/20 bg-white px-6 py-2.5 text-sm font-bold text-navy transition hover:border-amber hover:shadow-sm disabled:opacity-60">Cancel</button><button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-full bg-amber px-6 py-2.5 text-sm font-bold text-navy shadow-sm transition hover:bg-amber-hover hover:shadow-md disabled:opacity-60">{saving && <Loader2 size={16} className="animate-spin" />}{saving ? "Saving..." : "Save All Changes"}</button></div>
      </form>
    </div>
  );
}

function CareerEditSection({ icon: Icon, title, subtitle, children }) {
  return <section className="rounded-2xl border border-navy/10 bg-white"><div className="flex items-center gap-3 border-b border-navy/10 px-5 py-3.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-soft text-amber"><Icon size={18} /></span><div><h4 className="text-sm font-bold text-navy">{title}</h4>{subtitle && <p className="text-xs text-muted">{subtitle}</p>}</div></div><div className="p-5">{children}</div></section>;
}
