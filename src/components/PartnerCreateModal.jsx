import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { submitPartner, uploadFilesToS3 } from "../services/api";

const SYSTEMS = [
  ["on_grid", "On-Grid System"],
  ["hybrid", "Hybrid System"],
];

const INITIAL_FORM = {
  partnerType: "vendor", commissionModel: "", systemTypes: [], commissionRates: { on_grid: "20000", hybrid: "30000" }, companyName: "",
  contactName: "", email: "", phone: "", gstNumber: "", panNumber: "",
  aadhaarNumber: "", gender: "", dob: "",
  msmeNumber: "", address: "", city: "", state: "", pincode: "",
  experienceYears: "", description: "", bankName: "", accountNumber: "", ifscCode: "",
};

const INPUTS = [
  ["companyName", "Company Name", true], ["contactName", "Contact Name", true],
  ["email", "Email", true, "email"], ["phone", "Phone", true, "tel"],
  ["aadhaarNumber", "Aadhaar Number"], ["dob", "Date of Birth", false, "date"],
  ["gstNumber", "GST Number"], ["panNumber", "PAN Number"], ["msmeNumber", "MSME / Udyam Number"],
  ["experienceYears", "Years of Experience"], ["address", "Address"], ["city", "City"],
  ["pincode", "PIN Code"], ["bankName", "Bank Name"],
  ["accountNumber", "Account Number"], ["ifscCode", "IFSC Code"],
];

const FILES = [
  ["gstFile", "GST Certificate"], ["panFile", "PAN Card"], ["aadhaarFile", "Aadhaar Card"],
  ["photoFile", "Partner Photo"],
  ["msmeFile", "MSME Certificate"], ["businessDocFile", "Business Documents"],
  ["chequePassbook", "Cancelled Cheque / Passbook"],
];

export default function PartnerCreateModal({ onClose, onSaved }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [files, setFiles] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.systemTypes.length) {
      setError("Select at least one system type: On-Grid or Hybrid.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const uploadedFiles = await uploadFilesToS3("partners", files);
      await submitPartner({ ...form, files: uploadedFiles });
      await onSaved();
    } catch (err) {
      setError(err.message || "Could not add partner.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (name, value) => setForm((current) => ({
    ...current,
    [name]: value,
    ...(name === "partnerType" ? { commissionModel: value === "sub_vendor" ? "per_completed_installation" : "" } : {}),
  }));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy/60 p-4">
      <form ref={formRef} onSubmit={handleSubmit} className="mx-auto my-5 max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="text-xl font-extrabold text-navy">Add Partner</h2><p className="mt-1 text-xs text-muted">New applications start with Submitted status.</p></div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-navy"><X size={20} /></button>
        </div>
        {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Partner Type" value={form.partnerType} onChange={(value) => updateField("partnerType", value)} options={[["vendor", "Vendor"], ["dealer", "Dealer"], ["sub_vendor", "Sub-vendor"]]} />
          {form.partnerType === "sub_vendor" && <Select label="Commission" value={form.commissionModel} onChange={(value) => updateField("commissionModel", value)} options={[["per_completed_installation", "Per completed installation"]]} />}
          {INPUTS.map(([name, label, required, type]) => <Field key={name} label={label} value={form[name]} required={required} type={type || "text"} onChange={(value) => updateField(name, value)} />)}
          <Select label="State" value={form.state} onChange={(value) => updateField("state", value)} options={[["", "Select state"], ["Odisha", "Odisha"], ["West Bengal", "West Bengal"]]} />
          <Select label="Gender" value={form.gender} required={false} onChange={(value) => updateField("gender", value)} options={[["", "Select gender (optional)"], ["male", "Male"], ["female", "Female"], ["other", "Other"]]} />
          <label className="text-xs font-semibold text-navy/70 sm:col-span-2">Business Description<textarea rows={3} value={form.description} onChange={(event) => updateField("description", event.target.value)} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm font-normal" /></label>
        </div>

        <section className="mt-5 rounded-xl border border-navy/10 p-4">
          <h3 className="text-sm font-bold text-navy">System Types</h3>
          <p className="mt-1 text-xs text-muted">Select all systems the partner will work with.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {SYSTEMS.map(([value, label]) => <label key={value} className="flex items-start gap-2 rounded-lg border border-navy/10 p-3 text-sm text-navy">
              <input type="checkbox" checked={form.systemTypes.includes(value)} onChange={() => updateField("systemTypes", form.systemTypes.includes(value) ? form.systemTypes.filter((item) => item !== value) : [...form.systemTypes, value])} className="mt-0.5 accent-amber" />
              <span>{label}</span>
            </label>)}
          </div>
          {form.partnerType === "sub_vendor" && <div className="mt-4 overflow-hidden rounded-lg border border-navy/10">
            <h4 className="border-b border-navy/10 bg-slate-50 px-3 py-2.5 text-xs font-bold text-navy">Commission Chart (per completed installation)</h4>
            {SYSTEMS.map(([value, label]) => <label key={value} className="grid grid-cols-[1fr_minmax(130px,200px)] items-center gap-3 border-b border-navy/5 px-3 py-2.5 text-sm text-navy last:border-0">
              <span>{label}</span><span className="flex items-center gap-2"><span className="text-muted">₹</span><input type="number" min="0" step="1" required value={form.commissionRates[value]} onChange={(event) => updateField("commissionRates", { ...form.commissionRates, [value]: event.target.value })} className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm" /></span>
            </label>)}
          </div>}
        </section>

        <section className="mt-5 rounded-xl border border-navy/10 p-4">
          <h3 className="text-sm font-bold text-navy">Documents (optional)</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {FILES.map(([name, label]) => <label key={name} className="text-xs font-semibold text-navy/70">{label}<span className="mt-1 flex items-center gap-2 rounded-lg border border-dashed border-navy/20 p-2.5 font-normal text-muted"><Upload size={14} /><input type="file" accept={name === "photoFile" ? "image/jpeg,image/png,image/webp" : undefined} onChange={(event) => setFiles((current) => ({ ...current, [name]: event.target.files?.[0] || null }))} className="min-w-0 text-xs" /></span></label>)}
          </div>
        </section>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-navy/20 px-5 py-2.5 text-sm font-semibold text-navy">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy disabled:opacity-60">{saving && <Loader2 size={15} className="animate-spin" />}{saving ? "Adding..." : "Add Partner"}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, required = false, type = "text" }) {
  return <label className="text-xs font-semibold text-navy/70">{label}<input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm font-normal text-navy" /></label>;
}

function Select({ label, value, onChange, options }) {
  return <label className="text-xs font-semibold text-navy/70">{label}<select required value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm font-normal text-navy">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}
