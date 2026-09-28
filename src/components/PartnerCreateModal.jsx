import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { apiFetch, createPartnerRecord, uploadFilesToS3 } from "../services/api";

const SYSTEMS = [
  ["on_grid", "On-Grid System"],
  ["hybrid", "Hybrid System"],
];
const LOCATIONS = [
  ["odisha", "Odisha"],
  ["west_bengal", "West Bengal"],
];
const PARTNER_ROLES = [["super_vendor", "Super-vendor"], ["vendor", "Vendor"], ["sub_vendor", "Sub-vendor"], ["dealer", "Dealer"]];
const PARENT_ROLE = { vendor: "super_vendor", sub_vendor: "vendor", dealer: "sub_vendor" };
const normalizeRole = (role) => role === "sub_vendor_commission" ? "sub_vendor" : role;
const hasRole = (partner, role) => {
  let roles = partner.partner_roles || [];
  if (typeof roles === "string") { try { roles = JSON.parse(roles); } catch { roles = []; } }
  return [partner.partner_type, ...(Array.isArray(roles) ? roles : [])].map(normalizeRole).includes(role);
};

const INITIAL_FORM = {
  partnerType: "vendor", partnerRoles: ["vendor"], referredByPartnerId: "", commissionModel: "", systemTypes: [], commissionRates: { on_grid: "20000", hybrid: "30000" }, companyName: "",
  assignedLocations: [],
  contactName: "", email: "", phone: "", gstNumber: "", panNumber: "",
  aadhaarNumber: "", gender: "", dob: "",
  msmeNumber: "", address: "", city: "", state: "", pincode: "",
  experienceYears: "", description: "", bankName: "", accountNumber: "", ifscCode: "",
};

const INPUTS = [
  ["companyName", "Company Name", true], ["contactName", "Contact Name", true],
  ["email", "Email (optional)", false, "email"], ["phone", "Phone (optional)", false, "tel"],
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
  const [approvedPartners, setApprovedPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoadingPartners(true);
    apiFetch("/admin/partners?status=approved&limit=100")
      .then((response) => { if (active) setApprovedPartners(response?.data?.items || []); })
      .catch(() => { if (active) setApprovedPartners([]); })
      .finally(() => { if (active) setLoadingPartners(false); });
    return () => { active = false; };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.assignedLocations.length) {
      setError("Select at least one partner location: Odisha or West Bengal.");
      return;
    }
    if (PARENT_ROLE[form.partnerType] && !form.referredByPartnerId) {
      setError(`Choose an approved ${PARTNER_ROLES.find(([role]) => role === PARENT_ROLE[form.partnerType])?.[1]} for this partner.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const uploadedFiles = await uploadFilesToS3("partners", files);
      await createPartnerRecord({ ...form, partnerRoles: [...new Set([form.partnerType, ...form.partnerRoles])], referredByPartnerId: form.referredByPartnerId ? Number(form.referredByPartnerId) : null, files: uploadedFiles });
      await onSaved();
    } catch (err) {
      setError(err.message || "Could not add partner.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (name, value) => setForm((current) => {
    if (name !== "partnerType") return { ...current, [name]: value };
    const requiredParentRole = PARENT_ROLE[value];
    const currentParent = approvedPartners.find((partner) => String(partner.id) === current.referredByPartnerId);
    return {
      ...current,
      partnerType: value,
      partnerRoles: [...new Set([...current.partnerRoles.filter((role) => role !== current.partnerType), value])],
      commissionModel: value === "sub_vendor" ? (current.commissionModel || "per_completed_installation") : "",
      referredByPartnerId: requiredParentRole && currentParent && hasRole(currentParent, requiredParentRole) ? current.referredByPartnerId : "",
    };
  });
  const parentRole = PARENT_ROLE[form.partnerType];
  const parentOptions = approvedPartners.filter((partner) => hasRole(partner, parentRole));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy/60 p-4">
      <form ref={formRef} onSubmit={handleSubmit} className="mx-auto my-5 max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="text-xl font-extrabold text-navy">Add Partner</h2><p className="mt-1 text-xs text-muted">You can add the basic record now and complete the remaining details later.</p></div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-navy"><X size={20} /></button>
        </div>
        {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Partner Type" value={form.partnerType} onChange={(value) => updateField("partnerType", value)} options={[["super_vendor", "Super-vendor"], ["vendor", "Vendor"], ["sub_vendor", "Sub-vendor"], ["dealer", "Dealer"]]} />
          {form.partnerType === "sub_vendor" && <Select label="Commission (optional)" value={form.commissionModel} required={false} onChange={(value) => updateField("commissionModel", value)} options={[["", "Set later"], ["per_completed_installation", "Per completed installation"]]} />}
          {parentRole && (
            <label className="rounded-xl border border-amber/40 bg-amber-50/50 p-4 text-xs font-semibold text-navy/70 sm:col-span-2">
              Referred by ({PARTNER_ROLES.find(([value]) => value === parentRole)?.[1]}) <span className="text-red-600">*</span>
              <select required value={form.referredByPartnerId} onChange={(event) => updateField("referredByPartnerId", event.target.value)} disabled={loadingPartners} className="mt-2 w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm font-normal text-navy disabled:bg-slate-100">
                <option value="">{loadingPartners ? "Loading approved partners..." : "Choose " + PARTNER_ROLES.find(([value]) => value === parentRole)?.[1]}</option>
                {parentOptions.map((partner) => <option key={partner.id} value={partner.id}>{partner.company_name || partner.contact_name} (ID {partner.id})</option>)}
              </select>
              <span className="mt-1 block font-normal text-muted">Required to connect this partner to the referral chain. Choose the person who referred them.</span>
              {!loadingPartners && parentOptions.length === 0 && <span className="mt-1 block font-normal text-red-700">No approved {PARTNER_ROLES.find(([role]) => role === parentRole)?.[1]} accounts are available. Approve or assign that role to a partner first.</span>}
            </label>
          )}
          <section className="rounded-xl border border-navy/10 p-4 sm:col-span-2">
            <h3 className="text-sm font-bold text-navy">Multi-role access</h3>
            <p className="mt-1 text-xs text-muted">Choose every role this partner should have. Partner Type remains the primary role.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">{PARTNER_ROLES.map(([value, label]) => <label key={value} className="flex items-center gap-2 rounded-lg border border-navy/10 p-3 text-sm text-navy"><input type="checkbox" checked={form.partnerRoles.includes(value)} disabled={value === form.partnerType} onChange={() => updateField("partnerRoles", form.partnerRoles.includes(value) ? form.partnerRoles.filter((role) => role !== value) : [...form.partnerRoles, value])} className="accent-amber" />{label}{value === form.partnerType ? " (primary)" : ""}</label>)}</div>
          </section>
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
            {form.commissionModel === "per_completed_installation" ? SYSTEMS.map(([value, label]) => <label key={value} className="grid grid-cols-[1fr_minmax(130px,200px)] items-center gap-3 border-b border-navy/5 px-3 py-2.5 text-sm text-navy last:border-0">
              <span>{label}</span><span className="flex items-center gap-2"><span className="text-muted">₹</span><input type="number" min="0" step="1" required={form.systemTypes.includes(value)} value={form.commissionRates[value]} onChange={(event) => updateField("commissionRates", { ...form.commissionRates, [value]: event.target.value })} className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm" /></span>
            </label>) : <p className="px-3 py-3 text-xs text-muted">You can add commission details later.</p>}
          </div>}
        </section>

        <section className="mt-5 rounded-xl border border-navy/10 p-4">
          <h3 className="text-sm font-bold text-navy">Multi-location Assignment</h3>
          <p className="mt-1 text-xs text-muted">Select every location this partner can work in.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {LOCATIONS.map(([value, label]) => <label key={value} className="flex items-center gap-2 rounded-lg border border-navy/10 p-3 text-sm text-navy">
              <input type="checkbox" checked={form.assignedLocations.includes(value)} onChange={() => updateField("assignedLocations", form.assignedLocations.includes(value) ? form.assignedLocations.filter((item) => item !== value) : [...form.assignedLocations, value])} className="accent-amber" />
              <span>{label}</span>
            </label>)}
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-navy/10 p-4">
          <h3 className="text-sm font-bold text-navy">Documents (optional)</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {FILES.map(([name, label]) => <label key={name} className="text-xs font-semibold text-navy/70">{label}<span className="mt-1 flex min-w-0 items-center gap-2 rounded-lg border border-dashed border-navy/20 p-2.5 font-normal text-muted"><Upload size={14} /><input type="file" accept={name === "photoFile" ? "image/jpeg,image/png,image/webp" : undefined} onChange={(event) => setFiles((current) => ({ ...current, [name]: event.target.files?.[0] || null }))} className="min-w-0 flex-1 text-xs" /></span>{files[name] && <span className="mt-1 block truncate text-xs font-medium text-emerald-700">Selected: {files[name].name}</span>}</label>)}
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

function Select({ label, value, onChange, options, required = true }) {
  return <label className="text-xs font-semibold text-navy/70">{label}<select required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm font-normal text-navy">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}
