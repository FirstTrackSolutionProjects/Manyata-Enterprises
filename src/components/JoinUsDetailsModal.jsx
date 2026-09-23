import { useState } from "react";
import { fileUrl, updateJoinUs, uploadFilesToS3 } from "../services/api";

const FIELDS = [
  ["firstName", "First Name"], ["lastName", "Last Name"], ["email", "Email", "email"], ["phone", "Phone"],
  ["dob", "Date of Birth"], ["gender", "Gender"], ["guardianName", "Father's / Husband's Name"], ["maritalStatus", "Marital Status"],
  ["streetAddress", "Street Address"], ["city", "City"], ["state", "State"], ["postalCode", "Postal Code"], ["country", "Country"],
  ["permanentAddress", "Permanent Address"], ["permanentCity", "Permanent City"], ["permanentState", "Permanent State"], ["permanentPostalCode", "Permanent Postal Code"],
  ["aadhaarNumber", "Aadhaar Number"], ["panNumber", "PAN Number"], ["qualification", "Qualification"], ["institutionName", "Institution"], ["yearOfPassing", "Year of Passing"],
  ["experience", "Experience"], ["companyName", "Company"], ["designation", "Designation"], ["bankName", "Bank Name"], ["accountNumber", "Account Number"], ["ifscCode", "IFSC Code"], ["description", "About", "textarea"],
];
const DOCUMENTS = [["aadhaarFront", "Aadhaar Front", "Aadhaar Front"], ["aadhaarBack", "Aadhaar Back", "Aadhaar Back"], ["panFront", "PAN Front", "PAN Front"], ["panBack", "PAN Back", "PAN Back"], ["photo", "Photo", "Photo"], ["chequePassbook", "Cheque / Passbook", "Cheque / Passbook"], ["cv", "Resume / CV", "Resume / CV"]];

export default function JoinUsDetailsModal({ submission, onClose, onSaved }) {
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map(([key]) => [key, submission[key] ?? ""]).concat([["sameAsAbove", Boolean(submission.same_as_above)]])));
  const [files, setFiles] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try { const uploaded = await uploadFilesToS3("join-us", files); await updateJoinUs(submission.id, { ...form, files: uploaded }); await onSaved(); }
    catch (err) { setError(err.message || "Could not update Join Us details."); }
    finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-navy/60 p-4"><form onSubmit={save} className="mx-auto my-5 max-w-4xl rounded-2xl bg-white p-6 shadow-xl">
    <div className="flex justify-between gap-3"><div><h3 className="text-xl font-extrabold text-navy">Edit Join Us Submission</h3><p className="mt-1 text-xs text-muted">Submission #{submission.id} · Created {new Date(submission.created_at).toLocaleString("en-IN")}</p></div><button type="button" onClick={onClose} className="text-sm font-bold text-muted">Close</button></div>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">{FIELDS.map(([key,label,type]) => <label key={key} className={`text-xs font-semibold text-navy/70 ${type === "textarea" ? "sm:col-span-2" : ""}`}>{label}{type === "textarea" ? <textarea rows={3} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm"/> : <input type={type || "text"} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm"/>}</label>)}
      <label className="flex items-center gap-2 text-xs font-semibold text-navy/70"><input type="checkbox" checked={form.sameAsAbove} onChange={e=>setForm({...form,sameAsAbove:e.target.checked})}/>Permanent address same as current</label>
    </div>
    <h4 className="mt-5 border-t border-navy/10 pt-4 text-sm font-bold text-navy">Documents (choose a file to replace)</h4><div className="mt-3 grid gap-3 sm:grid-cols-2">{DOCUMENTS.map(([key,label,urlKey])=><label key={key} className="rounded-lg border border-navy/10 p-3 text-xs font-semibold text-navy">{label}{submission.documentUrls?.[urlKey] && <a href={fileUrl(submission.documentUrls[urlKey])} target="_blank" rel="noreferrer" className="ml-2 text-amber">View current</a>}<input type="file" onChange={e=>setFiles({...files,[key]:e.target.files?.[0] || null})} className="mt-2 block w-full text-xs"/></label>)}</div>
    <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy">Cancel</button><button disabled={saving} className="rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy disabled:opacity-60">{saving ? "Saving..." : "Save Changes"}</button></div>
  </form></div>;
}
