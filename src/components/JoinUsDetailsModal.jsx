import { useState } from "react";
import { Briefcase, Building2, FileText, GraduationCap, Landmark, Loader2, MapPin, Paperclip, Pencil, ShieldCheck, User, X } from "lucide-react";
import { fileUrl, updateJoinUs, uploadFilesToS3 } from "../services/api";
import CameraFileInput from "./CameraFileInput";

const FIELDS = [
  ["firstName", "First Name"], ["lastName", "Last Name"], ["email", "Email", "email"], ["phone", "Phone"],
  ["dob", "Date of Birth", "date"], ["gender", "Gender"], ["fatherName", "Father's Name"], ["motherName", "Mother's Name"], ["bloodGroup", "Blood Group"], ["guardianName", "Guardian Name"], ["guardianMobile", "Guardian Mobile Number"], ["maritalStatus", "Marital Status"],
  ["streetAddress", "Street Address"], ["city", "City"], ["district", "District"], ["state", "State"], ["location", "Location / Posting Preference"], ["postalCode", "Postal Code"], ["country", "Country"],
  ["permanentAddress", "Permanent Address"], ["permanentCity", "Permanent City"], ["permanentState", "Permanent State"], ["permanentPostalCode", "Permanent Postal Code"],
  ["aadhaarNumber", "Aadhaar Number"], ["panNumber", "PAN Number"], ["qualification", "Qualification"], ["institutionName", "Institution"], ["yearOfPassing", "Year of Passing"],
  ["experience", "Experience"], ["companyName", "Company"], ["designation", "Current / Last Designation"], ["bankName", "Bank Name"], ["accountNumber", "Account Number"], ["ifscCode", "IFSC Code"], ["description", "About", "textarea"],
];
const LOA_FIELDS = [
  ["appointmentDesignation", "Appointment Designation", true], ["joiningDate", "Date of Joining", true],
  ["officeLocation", "Place of Posting"], ["referenceNumber", "LOA Reference Number"],
  ["grossSalary", "Monthly Gross Salary", true], ["netSalary", "Monthly Net Salary", true],
  ["allowance", "Monthly Allowance (optional)"], ["annualCtc", "Annual CTC", true],
  ["probationPeriod", "Probation Period"], ["noticePeriod", "Notice Period"],
];
const SALES_APPOINTMENT_ROLES = ["Sales Executive", "Sr. Sales Executive", "Sales Manager", "Branch Head"];
const DOCUMENTS = [["aadhaarFront", "Aadhaar Front", "Aadhaar Front"], ["aadhaarBack", "Aadhaar Back", "Aadhaar Back"], ["panFront", "PAN Front", "PAN Front"], ["panBack", "PAN Back", "PAN Back"], ["photo", "Photo", "Photo"], ["chequePassbook", "Cheque / Passbook", "Cheque / Passbook"], ["cv", "Resume / CV", "Resume / CV"], ["educationCertificate", "Education Certificate / Marksheet", "Education Certificate / Marksheet"], ["experienceDocument", "Experience Certificate / Work Proof", "Experience Certificate / Work Proof"]];

/* ── UI-only: how the fields are grouped on screen ─── */

const GROUPS = [
  { title: "Personal Details", icon: User, keys: ["firstName", "lastName", "email", "phone", "dob", "gender", "fatherName", "motherName", "bloodGroup", "guardianName", "guardianMobile", "maritalStatus"] },
  { title: "Current Address", icon: MapPin, keys: ["streetAddress", "city", "district", "state", "location", "postalCode", "country"] },
  { title: "Permanent Address", icon: Building2, keys: ["permanentAddress", "permanentCity", "permanentState", "permanentPostalCode"], sameAsAboveToggle: true },
  { title: "Identity Details", icon: ShieldCheck, keys: ["aadhaarNumber", "panNumber"] },
  { title: "Education & Experience", icon: GraduationCap, keys: ["qualification", "institutionName", "yearOfPassing", "experience", "companyName", "designation"] },
  { title: "Bank Details", icon: Landmark, keys: ["bankName", "accountNumber", "ifscCode"] },
  { title: "About", icon: FileText, keys: ["description"] },
];
const FULL_WIDTH_KEYS = new Set(["streetAddress", "permanentAddress"]);
const INPUT = "mt-1.5 w-full rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm font-semibold text-navy transition focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30 disabled:bg-slate-100 disabled:text-muted";

function FormSection({ icon: Icon, title, subtitle, children }) {
  return <section className="rounded-2xl border border-navy/10 bg-white">
    <div className="flex items-center gap-3 border-b border-navy/10 px-5 py-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-soft text-amber"><Icon size={18} /></span>
      <div className="min-w-0"><h4 className="text-sm font-bold text-navy">{title}</h4>{subtitle && <p className="text-xs text-muted">{subtitle}</p>}</div>
    </div>
    <div className="p-5">{children}</div>
  </section>;
}

export default function JoinUsDetailsModal({ submission, onClose, onSaved, loaNotice = "", employeeProfile = false, onSaveProfile }) {
  const [form, setForm] = useState(() => Object.fromEntries([...FIELDS, ...(!employeeProfile ? LOA_FIELDS : [])].map(([key]) => {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    return [key, submission[key] ?? submission.profileDetails?.[key] ?? submission[snakeKey] ?? submission.profileDetails?.[snakeKey] ?? ""];
  }).concat([["sameAsAbove", Boolean(submission.sameAsAbove ?? submission.profileDetails?.sameAsAbove ?? submission.same_as_above ?? submission.profileDetails?.same_as_above)]])));
  const [files, setFiles] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(loaNotice);
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const uploaded = await uploadFilesToS3(employeeProfile ? "employee-profiles" : "join-us", files);
      if (employeeProfile) {
        await onSaveProfile({
          name: `${form.firstName} ${form.lastName}`.trim(),
          phone: form.phone,
          address: form.streetAddress,
          city: form.city,
          state: form.state,
          pincode: form.postalCode,
          profileDetails: { ...form, files: { ...(submission.profileDetails?.files || {}), ...uploaded } },
        });
      } else {
        await updateJoinUs(submission.id, { ...form, files: uploaded });
      }
      await onSaved();
    }
    catch (err) { setError(err.message || "Could not update Join Us details."); }
    finally { setSaving(false); }
  };

  const renderField = (key) => {
    const [, label, type] = FIELDS.find(([fieldKey]) => fieldKey === key) || [];
    if (!label) return null;
    return <label key={key} className={`text-xs font-semibold text-navy/70 ${type === "textarea" || FULL_WIDTH_KEYS.has(key) ? "sm:col-span-2" : ""}`}>{label}
      {type === "textarea"
        ? <textarea rows={4} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={`${INPUT} font-normal`} />
        : <input type={type || "text"} value={form[key]} disabled={employeeProfile && key === "email"} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={INPUT} />}
    </label>;
  };

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-navy/60 p-4 backdrop-blur-sm">
    <form onSubmit={save} className="mx-auto my-2 flex max-h-[calc(100vh-2rem)] max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-navy via-navy to-navy-light px-6 py-5">
        <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-amber/20" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber via-amber/60 to-transparent" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber text-navy shadow-sm"><Pencil size={20} /></span>
            <div className="min-w-0">
              <h3 className="text-xl font-extrabold text-white">{employeeProfile ? "Edit Join Us Profile" : "Edit Join Us Submission"}</h3>
              {!employeeProfile && <p className="mt-0.5 text-xs text-white/70">Submission #{submission.id} · Created {new Date(submission.created_at).toLocaleString("en-IN")}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/25 transition hover:bg-white/20"><X size={18} /></button>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto bg-offwhite/60 p-5 sm:p-6">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">{error}</p>}

        {GROUPS.map((group) => <FormSection key={group.title} icon={group.icon} title={group.title}>
          {group.sameAsAboveToggle && <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-navy/10 bg-offwhite px-4 py-3 text-sm font-semibold text-navy transition hover:border-amber/60"><input type="checkbox" checked={form.sameAsAbove} onChange={(e) => setForm({ ...form, sameAsAbove: e.target.checked })} className="h-5 w-5 shrink-0 cursor-pointer accent-amber" />Permanent address same as current</label>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{group.keys.map(renderField)}</div>
        </FormSection>)}

        {!employeeProfile && <FormSection icon={Briefcase} title="Appointment / LOA Details" subtitle="Fields marked * are needed to generate the appointment letter. You can save other edits without filling them.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{LOA_FIELDS.map(([key, label, required]) => <label key={key} className="text-xs font-semibold text-navy/70">{label}{required && <span className="ml-1 text-red-600">*</span>}{key === "appointmentDesignation" ? <select value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={INPUT}><option value="">Select appointment designation</option>{form[key] && !SALES_APPOINTMENT_ROLES.includes(form[key]) && <option value={form[key]}>{form[key]} (current)</option>}{SALES_APPOINTMENT_ROLES.map((role) => <option key={role} value={role}>{role}</option>}</select> : <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={INPUT} />}</label>)}</div>
        </FormSection>}

        <FormSection icon={Paperclip} title="Documents" subtitle="Choose a file to replace">
          <div className="grid gap-3 sm:grid-cols-2">{DOCUMENTS.map(([key, label, urlKey]) => <div key={key} className="rounded-xl border border-navy/10 bg-offwhite p-3">
            {!employeeProfile && submission.documentUrls?.[urlKey] && <a href={fileUrl(submission.documentUrls[urlKey])} target="_blank" rel="noreferrer" className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-soft px-3 py-1 text-xs font-bold text-navy transition hover:bg-amber/30">View current {label}</a>}
            <CameraFileInput label={label} name={key} onFile={(file) => setFiles((current) => ({ ...current, [key]: file }))} />
          </div>)}</div>
        </FormSection>
      </div>

      <div className="flex shrink-0 justify-end gap-3 border-t border-navy/10 bg-white px-6 py-4">
        <button type="button" onClick={onClose} className="rounded-full border border-navy/20 bg-white px-6 py-2.5 text-sm font-bold text-navy transition hover:-translate-y-0.5 hover:border-amber hover:shadow-sm active:translate-y-0">Cancel</button>
        <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-full bg-amber px-6 py-2.5 text-sm font-bold text-navy shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-hover hover:shadow-md active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none">{saving && <Loader2 size={16} className="animate-spin" />}{saving ? "Saving..." : "Save Changes"}</button>
      </div>
    </form>
  </div>;
}
