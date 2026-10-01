import { useState } from "react";
import { createCareerApplication, createJoinUsSubmission } from "../services/api";

const CAREER_FIELDS = [
  ["dob", "Date of Birth", "date"], ["gender", "Gender", "select", ["Male", "Female", "Other"]],
  ["jobrole", "Position Applied For"], ["qualification", "Qualification", "select", ["", "higher secondary", "graduation", "post-grad", "other"]],
  ["location", "Preferred Location"], ["city", "City"], ["district", "District"], ["state", "State"],
  ["streetAddress", "Address"], ["postalCode", "Postal Code"], ["country", "Country"],
  ["description", "Notes", "textarea"],
];
const JOIN_FIELDS = [
  ["dob", "Date of Birth", "date"], ["gender", "Gender", "select", ["Male", "Female", "Other"]],
  ["fatherName", "Father's Name"], ["motherName", "Mother's Name"], ["maritalStatus", "Marital Status", "select", ["", "Single", "Married"]],
  ["location", "Preferred Location"], ["city", "City"], ["district", "District"], ["state", "State"],
  ["qualification", "Qualification", "select", ["", "higher secondary", "graduation", "post-grad", "other"]],
  ["institutionName", "Institution"], ["yearOfPassing", "Year of Passing"],
  ["experience", "Experience", "select", ["", "fresher", "0-1", "1-3", "3plus"]],
  ["companyName", "Previous / Current Company"], ["designation", "Previous / Current Designation"],
  ["description", "Notes", "textarea"],
];

export default function SubmissionCreateModal({ type, onClose, onSaved }) {
  const isCareer = type === "careers";
  const fields = isCareer ? CAREER_FIELDS : JOIN_FIELDS;
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", country: "India" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isCareer) await createCareerApplication(form);
      else await createJoinUsSubmission(form);
      await onSaved();
    } catch (err) {
      setError(err.message || "Could not add submission.");
    } finally {
      setSaving(false);
    }
  };

  const renderField = ([key, label, kind, options]) => (
    <label key={key} className={`text-xs font-semibold text-navy/70 ${kind === "textarea" ? "sm:col-span-2" : ""}`}>
      {label}
      {kind === "select" ? <select value={form[key] ?? (key === "gender" ? "Male" : "")} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy">
        {options.map((option) => <option key={option || "blank"} value={option}>{option || "Select"}</option>)}
      </select> : kind === "textarea" ? <textarea rows={3} value={form[key] || ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy" /> : <input type={kind || "text"} value={form[key] || ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy" />}
    </label>
  );

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-navy/60 p-4">
    <form onSubmit={save} className="mx-auto my-5 max-w-4xl rounded-2xl bg-white p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div><h3 className="text-xl font-extrabold text-navy">Add {isCareer ? "Career Application" : "Join-Us Submission"}</h3><p className="mt-1 text-sm text-muted">Enter the applicant's details. Required fields are marked with *.</p></div>
        <button type="button" onClick={onClose} className="text-sm font-bold text-muted">Close</button>
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <h4 className="mt-5 border-b border-navy/10 pb-2 text-sm font-bold text-navy">Contact Details</h4>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {[["firstName", "First Name", "text", true], ["lastName", "Last Name", "text", true], ["email", "Email Address", "email", true], ["phone", "Phone Number", "tel", true]].map(([key, label, kind]) => <label key={key} className="text-xs font-semibold text-navy/70">{label} <span className="text-red-600">*</span><input required type={kind} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy" /></label>)}
      </div>
      <h4 className="mt-5 border-b border-navy/10 pb-2 text-sm font-bold text-navy">{isCareer ? "Application Details" : "Applicant Details"}</h4>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{fields.map(renderField)}</div>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy">Cancel</button><button disabled={saving} className="rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy disabled:opacity-60">{saving ? "Adding..." : "Add Submission"}</button></div>
    </form>
  </div>;
}
