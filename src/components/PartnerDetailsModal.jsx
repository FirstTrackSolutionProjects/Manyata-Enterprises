import { useState } from "react";
import { fileUrl, updatePartner, uploadFilesToS3 } from "../services/api";

const PARTNER_TYPES = [
  ["vendor", "Vendor"],
  ["dealer", "Dealer"],
  ["sub_vendor", "Sub-vendor"],
];
const COMMISSION_MODELS = [["per_completed_installation", "Per completed installation"]];
const SYSTEM_TYPES = [
  ["on_grid", "On-Grid System"],
  ["hybrid", "Hybrid System"],
];
const FIELDS = [
  ["partnerType", "Partner Type", "select"],
  ["commissionModel", "Commission", "commission"],
  ["systemTypes", "System Types", "systems"],
  ["commissionRates", "Commission Chart", "commission-chart"],
  ["companyName", "Company Name"], ["contactName", "Contact Name"],
  ["phone", "Phone"], ["email", "Email", "email"],
  ["aadhaarNumber", "Aadhaar Number"], ["gender", "Gender", "gender"], ["dob", "Date of Birth", "date"],
  ["gstNumber", "GST Number"], ["panNumber", "PAN Number"], ["msmeNumber", "MSME Number"],
  ["address", "Address"], ["city", "City"], ["state", "State"], ["pincode", "PIN Code"],
  ["experienceYears", "Experience"], ["description", "Business Description", "textarea"],
  ["bankName", "Bank Name"], ["accountNumber", "Account Number"], ["ifscCode", "IFSC Code"],
];
const DOCUMENTS = [
  ["gstFile", "GST Certificate", "GST"], ["panFile", "PAN Card", "PAN"],
  ["aadhaarFile", "Aadhaar", "Aadhaar"], ["photoFile", "Partner Photo", "Photo"], ["msmeFile", "MSME Certificate", "MSME"],
  ["businessDocFile", "Business Document", "Business Document"],
  ["chequePassbook", "Cheque / Passbook", "Cheque / Passbook"],
];
const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-IN") : "—";
const readSystemTypes = (value) => {
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value || "[]"); } catch { return []; }
};
const readCommissionRates = (value) => {
  if (typeof value === "string") { try { value = JSON.parse(value); } catch { value = {}; } }
  return { on_grid: String(value?.on_grid ?? "20000"), hybrid: String(value?.hybrid ?? "30000") };
};

export default function PartnerDetailsModal({ partner, editing, onClose, onEdit, onSaved }) {
  const [form, setForm] = useState({
    partnerType: partner.partner_type === "sub_vendor_commission" ? "sub_vendor" : PARTNER_TYPES.some(([value]) => value === partner.partner_type) ? partner.partner_type : "",
    commissionModel: partner.commission_model || (partner.partner_type === "sub_vendor_commission" ? "per_completed_installation" : ""),
    systemTypes: readSystemTypes(partner.system_types),
    commissionRates: readCommissionRates(partner.commission_rates),
    companyName: partner.company_name || "", contactName: partner.contact_name || "",
    phone: partner.phone || "", email: partner.email || "", aadhaarNumber: partner.aadhaar_number || "",
    gender: partner.gender || "", dob: partner.dob ? String(partner.dob).slice(0, 10) : "", gstNumber: partner.gst_number || "",
    panNumber: partner.pan_number || "", msmeNumber: partner.msme_number || "",
    address: partner.address || "", city: partner.city || "", state: partner.state || "",
    pincode: partner.pincode || "", experienceYears: partner.experience_years || "",
    description: partner.description || "", bankName: partner.bank_name || "",
    accountNumber: partner.account_number || "", ifscCode: partner.ifsc_code || "",
  });
  const [files, setFiles] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (event) => {
    event.preventDefault();
    if (!form.systemTypes.length) {
      setError("Select at least one system type: On-Grid or Hybrid.");
      return;
    }
    if (form.partnerType === "sub_vendor" && !form.commissionModel) {
      setError("Select a commission model for the sub-vendor.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const uploaded = await uploadFilesToS3("partners", files);
      await updatePartner(partner.id, { ...form, files: uploaded });
      await onSaved();
    } catch (err) {
      setError(err.message || "Could not update partner details.");
    } finally {
      setSaving(false);
    }
  };

  const systemLabels = form.systemTypes
    .map((value) => SYSTEM_TYPES.find(([system]) => system === value)?.[1] || value)
    .join(", ");

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy/60 p-4">
      <form onSubmit={save} className="mx-auto my-5 max-w-4xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div><h3 className="text-xl font-extrabold text-navy">{editing ? "Edit Partner" : "Partner Details"}</h3><p className="mt-1 text-xs text-muted">Partner ID: {partner.id} · Status: {partner.status}</p></div>
          <button type="button" onClick={onClose} className="text-sm font-bold text-muted">Close</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted"><span>Created: {formatDateTime(partner.created_at)}</span><span>Updated by: {partner.updated_by_name || "—"} · {formatDateTime(partner.updated_at)}</span></div>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FIELDS.map(([key, label, type]) => {
            const FieldWrapper = type === "systems" || type === "commission-chart" ? "div" : "label";
            return (
            <FieldWrapper key={key} className={`text-xs font-semibold text-navy/70 ${type === "textarea" || type === "systems" || type === "commission-chart" ? "sm:col-span-2" : ""}`}>
              {label}
              {!editing ? (
                <span className="mt-1 block rounded-lg bg-slate-50 px-3 py-2 text-sm font-normal text-navy">
                  {key === "systemTypes" ? systemLabels || "—" : key === "commissionRates" ? form.partnerType === "sub_vendor" ? `On-Grid: ₹${Number(form.commissionRates.on_grid || 0).toLocaleString("en-IN")} · Hybrid: ₹${Number(form.commissionRates.hybrid || 0).toLocaleString("en-IN")}` : "—" : key === "partnerType" ? PARTNER_TYPES.find(([value]) => value === form[key])?.[1] || (partner.partner_type === "other" ? "Other (legacy)" : "—") : key === "commissionModel" ? COMMISSION_MODELS.find(([value]) => value === form[key])?.[1] || "—" : key === "gender" ? ({ male: "Male", female: "Female", other: "Other" }[form[key]] || "—") : form[key] || "—"}
                </span>
              ) : type === "select" ? (
                <select required value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm">
                  <option value="" disabled>Select partner type</option>
                  {PARTNER_TYPES.map(([value, optionLabel]) => <option key={value} value={value}>{optionLabel}</option>)}
                </select>
              ) : type === "gender" ? (
                <select value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm">
                  <option value="">Not specified</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                </select>
              ) : type === "systems" ? (
                <span className="mt-2 grid gap-2 sm:grid-cols-2">
                  {SYSTEM_TYPES.map(([value, optionLabel]) => (
                    <label key={value} className="flex items-center gap-2 rounded-lg border border-navy/10 p-3 text-sm font-normal text-navy">
                      <input type="checkbox" checked={form.systemTypes.includes(value)} onChange={() => setForm({ ...form, systemTypes: form.systemTypes.includes(value) ? form.systemTypes.filter((item) => item !== value) : [...form.systemTypes, value] })} className="accent-amber" />
                      {optionLabel}
                    </label>
                  ))}
                </span>
              ) : type === "commission-chart" ? (
                form.partnerType === "sub_vendor" ? <div className="mt-2 overflow-hidden rounded-lg border border-navy/10">
                  {[ ["on_grid", "On-Grid System"], ["hybrid", "Hybrid System"] ].map(([system, optionLabel]) => <label key={system} className="grid grid-cols-[1fr_minmax(140px,220px)] items-center gap-3 border-b border-navy/5 px-3 py-2.5 text-sm font-normal text-navy last:border-0">
                    <span>{optionLabel}</span><span className="flex items-center gap-2"><span className="text-muted">₹</span><input type="number" min="0" step="1" required={form.systemTypes.includes(system)} value={form.commissionRates[system]} onChange={(event) => setForm({ ...form, commissionRates: { ...form.commissionRates, [system]: event.target.value } })} className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm" /></span>
                  </label>)}
                </div> : <span className="mt-1 block rounded-lg bg-slate-50 px-3 py-2 text-sm font-normal text-navy">—</span>
              ) : type === "commission" ? (
                form.partnerType === "sub_vendor" ? (
                  <select required value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm">
                    <option value="" disabled>Select commission model</option>
                    {COMMISSION_MODELS.map(([value, optionLabel]) => <option key={value} value={value}>{optionLabel}</option>)}
                  </select>
                ) : <span className="mt-1 block rounded-lg bg-slate-50 px-3 py-2 text-sm font-normal text-navy">—</span>
              ) : type === "textarea" ? (
                <textarea rows={3} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm" />
              ) : (
                <input type={type || "text"} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm" />
              )}
            </FieldWrapper>
            );
          })}
        </div>
        <div className="mt-5 border-t border-navy/10 pt-4">
          <h4 className="text-sm font-bold text-navy">Partner Documents</h4>
          {editing && <p className="mt-1 text-xs text-muted">Upload a file only to replace that document.</p>}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DOCUMENTS.map(([key, label, urlKey]) => (
              <div key={key} className="rounded-lg border border-navy/10 p-3">
                <p className="text-xs font-semibold text-navy">{label}</p>
                {partner.documentUrls?.[urlKey] ? <a href={fileUrl(partner.documentUrls[urlKey])} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-amber hover:underline">View uploaded document</a> : <p className="mt-1 text-xs text-muted">No document uploaded</p>}
                {editing && <input type="file" accept={key === "photoFile" ? "image/jpeg,image/png,image/webp" : undefined} onChange={(event) => setFiles({ ...files, [key]: event.target.files?.[0] || null })} className="mt-2 block w-full text-xs" />}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={editing ? onClose : onEdit} className="rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy">{editing ? "Cancel" : "Edit Details"}</button>
          {editing && <button type="submit" disabled={saving} className="rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy disabled:opacity-60">{saving ? "Saving..." : "Save Changes"}</button>}
        </div>
      </form>
    </div>
  );
}
