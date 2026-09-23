import { useState } from "react";
import { fileUrl, updatePartner, uploadFilesToS3 } from "../services/api";

const FIELDS = [
  ["partnerType", "Partner Type", "select"],
  ["companyName", "Company Name"], ["contactName", "Contact Name"],
  ["phone", "Phone"], ["email", "Email", "email"],
  ["gstNumber", "GST Number"], ["panNumber", "PAN Number"], ["msmeNumber", "MSME Number"],
  ["address", "Address"], ["city", "City"], ["state", "State"], ["pincode", "PIN Code"],
  ["experienceYears", "Experience"], ["description", "Business Description", "textarea"],
  ["bankName", "Bank Name"], ["accountNumber", "Account Number"], ["ifscCode", "IFSC Code"],
];

const DOCUMENTS = [
  ["gstFile", "GST Certificate", "GST"], ["panFile", "PAN Card", "PAN"],
  ["aadhaarFile", "Aadhaar", "Aadhaar"], ["msmeFile", "MSME Certificate", "MSME"],
  ["businessDocFile", "Business Document", "Business Document"],
  ["chequePassbook", "Cheque / Passbook", "Cheque / Passbook"],
];

const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-IN") : "—";

export default function PartnerDetailsModal({ partner, editing, onClose, onEdit, onSaved }) {
  const [form, setForm] = useState({
    partnerType: partner.partner_type || "vendor",
    companyName: partner.company_name || "", contactName: partner.contact_name || "",
    phone: partner.phone || "", email: partner.email || "", gstNumber: partner.gst_number || "",
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
          {FIELDS.map(([key, label, type]) => (
            <label key={key} className={`text-xs font-semibold text-navy/70 ${type === "textarea" ? "sm:col-span-2" : ""}`}>
              {label}
              {!editing ? <span className="mt-1 block rounded-lg bg-slate-50 px-3 py-2 text-sm font-normal text-navy">{form[key] || "—"}</span> : type === "select" ? (
                <select value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm"><option value="vendor">Vendor</option><option value="dealer">Dealer</option><option value="other">Other</option></select>
              ) : type === "textarea" ? (
                <textarea rows={3} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm" />
              ) : (
                <input type={type || "text"} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm" />
              )}
            </label>
          ))}
        </div>
        <div className="mt-5 border-t border-navy/10 pt-4">
          <h4 className="text-sm font-bold text-navy">Partner Documents</h4>
          {editing && <p className="mt-1 text-xs text-muted">Upload a file only to replace that document.</p>}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DOCUMENTS.map(([key, label, urlKey]) => (
              <div key={key} className="rounded-lg border border-navy/10 p-3">
                <p className="text-xs font-semibold text-navy">{label}</p>
                {partner.documentUrls?.[urlKey] ? <a href={fileUrl(partner.documentUrls[urlKey])} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-amber hover:underline">View uploaded document</a> : <p className="mt-1 text-xs text-muted">No document uploaded</p>}
                {editing && <input type="file" onChange={(event) => setFiles({ ...files, [key]: event.target.files?.[0] || null })} className="mt-2 block w-full text-xs" />}
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
