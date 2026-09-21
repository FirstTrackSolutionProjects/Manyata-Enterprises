import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { uploadFilesToS3 } from "../services/api";
import {
  User,
  MapPin,
  FileText,
  GraduationCap,
  Briefcase,
  Landmark,
  Upload,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const QUALIFICATIONS = [
  { value: "higher secondary", label: "Higher Secondary" },
  { value: "graduation", label: "Graduation" },
  { value: "post-grad", label: "Post Graduation / Master's" },
  { value: "other", label: "Other" },
];

const EXPERIENCE = [
  { value: "fresher", label: "Fresher" },
  { value: "0-1", label: "0 – 1 Year" },
  { value: "1-3", label: "1 – 3 Years" },
  { value: "3plus", label: "3+ Years" },
];

const initialState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dob: "",
  gender: "Male",
  guardianName: "",
  maritalStatus: "",
  streetAddress: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  sameAsAbove: false,
  permanentAddress: "",
  permanentCity: "",
  permanentState: "",
  permanentPostalCode: "",
  aadhaarNumber: "",
  panNumber: "",
  qualification: "",
  institutionName: "",
  yearOfPassing: "",
  experience: "",
  companyName: "",
  designation: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  description: "",
};

export default function JoinUs() {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const formRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSameAsAbove = (e) => {
    const checked = e.target.checked;
    setForm((prev) => ({
      ...prev,
      sameAsAbove: checked,
      permanentAddress: checked ? prev.streetAddress : "",
      permanentCity: checked ? prev.city : "",
      permanentState: checked ? prev.state : "",
      permanentPostalCode: checked ? prev.postalCode : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      // 1. Collect files from the form
      const formEl = formRef.current;
      const fileMap = {};
      if (formEl) {
        const fileInputs = formEl.querySelectorAll('input[type="file"]');
        fileInputs.forEach((input) => {
          if (input.files?.[0]) fileMap[input.name] = input.files[0];
        });
      }

      // 2. Upload files directly to S3 via presigned URLs
      const uploadedFiles = await uploadFilesToS3("join-us", fileMap);

      // 3. Submit JSON payload with S3 keys
      const payload = { ...form, files: uploadedFiles };
      const res = await fetch(`${API_URL}/join-us`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        const firstError =
          data.errors?.[0]?.message || data.message || "Submission failed.";
        throw new Error(firstError);
      }

      setSubmitSuccess(true);
      setForm(initialState);
      formEl?.reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Page banner */}
      <section className="bg-navy py-14 text-white lg:py-16">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-sm font-semibold text-amber">Join Us</span>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Become Part of Manyata Enterprises
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
              Share your details below — this helps us process your
              application and onboarding faster.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="bg-offwhite py-14 lg:py-20">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-[800px] flex-col gap-6 px-5 lg:px-8"
        >
          {/* Personal details */}
          <FormCard icon={User} title="Personal Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First Name" name="firstName" value={form.firstName} onChange={handleChange} placeholder="Eg: John" />
              <Field label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Eg: Doe" />
              <Field label="Email" name="email" value={form.email} onChange={handleChange} placeholder="Eg: john@doe.com" type="email" />
              <Field label="Phone Number" name="phone" value={form.phone} onChange={handleChange} placeholder="Enter your phone number" type="tel" />
              <Field label="Date of Birth" name="dob" value={form.dob} onChange={handleChange} type="date" />
              <SelectField label="Gender" name="gender" value={form.gender} onChange={handleChange} options={["Male", "Female", "Other"]} />
              <Field label="Father's / Husband's Name" name="guardianName" value={form.guardianName} onChange={handleChange} placeholder="Enter name" />
              <SelectField label="Marital Status" name="maritalStatus" value={form.maritalStatus} onChange={handleChange} options={["Single", "Married"]} placeholder="Select" />
            </div>
          </FormCard>

          {/* Address details */}
          <FormCard icon={MapPin} title="Address Details">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Street Address" name="streetAddress" value={form.streetAddress} onChange={handleChange} placeholder="Eg: 24 Wallaby Way" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="City" name="city" value={form.city} onChange={handleChange} placeholder="Eg: Bhubaneswar" />
                <Field label="State" name="state" value={form.state} onChange={handleChange} placeholder="Eg: Odisha" />
                <Field label="Postal Code" name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="Eg: 751001" />
              </div>
              <SelectField label="Country" name="country" value={form.country} onChange={handleChange} options={["India"]} />
            </div>

            <label className="mt-5 flex items-center gap-2.5 text-sm text-navy/80">
              <input
                type="checkbox"
                checked={form.sameAsAbove}
                onChange={handleSameAsAbove}
                className="h-4 w-4 accent-amber"
              />
              Permanent address same as above
            </label>

            {!form.sameAsAbove && (
              <div className="mt-4 grid grid-cols-1 gap-4">
                <Field label="Permanent Address" name="permanentAddress" value={form.permanentAddress} onChange={handleChange} placeholder="Enter permanent address" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="City" name="permanentCity" value={form.permanentCity} onChange={handleChange} placeholder="Eg: Bhubaneswar" />
                  <Field label="State" name="permanentState" value={form.permanentState} onChange={handleChange} placeholder="Eg: Odisha" />
                  <Field label="Postal Code" name="permanentPostalCode" value={form.permanentPostalCode} onChange={handleChange} placeholder="Eg: 751001" />
                </div>
              </div>
            )}
          </FormCard>

          {/* Identity documents */}
          <FormCard icon={FileText} title="Identity Documents">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Aadhaar Number" name="aadhaarNumber" value={form.aadhaarNumber} onChange={handleChange} placeholder="Enter your Aadhaar number" />
              <Field label="PAN Number" name="panNumber" value={form.panNumber} onChange={handleChange} placeholder="Enter your PAN number" />
              <FileUpload label="Aadhaar Card (Front)" name="aadhaarFront" />
              <FileUpload label="Aadhaar Card (Back)" name="aadhaarBack" />
              <FileUpload label="PAN Card (Front)" name="panFront" />
              <FileUpload label="PAN Card (Back)" name="panBack" />
              <FileUpload label="Passport-size Photo" name="photo" />
            </div>
          </FormCard>

          {/* Education & qualification */}
          <FormCard icon={GraduationCap} title="Education & Qualification">
            <div className="flex flex-col gap-3">
              {QUALIFICATIONS.map((opt) => (
                <RadioOption
                  key={opt.value}
                  name="qualification"
                  value={opt.value}
                  label={opt.label}
                  checked={form.qualification === opt.value}
                  onChange={handleChange}
                />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Institution Name" name="institutionName" value={form.institutionName} onChange={handleChange} placeholder="Enter your institution name" />
              <Field label="Year of Passing" name="yearOfPassing" value={form.yearOfPassing} onChange={handleChange} placeholder="Eg: 2023" />
            </div>
          </FormCard>

          {/* Work experience */}
          <FormCard icon={Briefcase} title="Work Experience">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {EXPERIENCE.map((opt) => (
                <RadioOption
                  key={opt.value}
                  name="experience"
                  value={opt.value}
                  label={opt.label}
                  checked={form.experience === opt.value}
                  onChange={handleChange}
                />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Current / Last Company (optional)" name="companyName" value={form.companyName} onChange={handleChange} placeholder="Enter company name" />
              <Field label="Current / Last Designation (optional)" name="designation" value={form.designation} onChange={handleChange} placeholder="Enter designation" />
            </div>
          </FormCard>

          {/* Bank details */}
          <FormCard icon={Landmark} title="Bank Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Bank Name" name="bankName" value={form.bankName} onChange={handleChange} placeholder="Enter your bank name" />
              <Field label="Bank Account Number" name="accountNumber" value={form.accountNumber} onChange={handleChange} placeholder="Enter your account number" />
              <Field label="Bank IFSC Code" name="ifscCode" value={form.ifscCode} onChange={handleChange} placeholder="Enter your IFSC code" />
              <FileUpload label="Cancelled Cheque / Passbook Front Page" name="chequePassbook" />
            </div>
          </FormCard>

          {/* About you */}
          <FormCard icon={User} title="About You">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-navy/70">
                Description
              </span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Tell us a bit about yourself.."
                rows={4}
                className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm text-navy placeholder:text-muted focus:border-amber focus:outline-none"
              />
            </label>
          </FormCard>

          {/* Upload CV */}
          <FormCard icon={Upload} title="Upload CV">
            <FileUpload label="Resume / CV" name="cv" />
          </FormCard>

          {submitSuccess && (
            <div className="flex items-start gap-3 rounded-xl border border-green-300 bg-green-50 p-4">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />
              <p className="text-sm text-green-800">
                Thanks for applying! Our HR team will get back to you soon.
              </p>
            </div>
          )}

          {submitError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
              <p className="text-sm text-red-800">{submitError}</p>
            </div>
          )}

          <motion.button
            type="submit"
            disabled={submitting}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-amber px-7 py-3.5 text-sm font-bold text-navy transition-colors hover:bg-amber-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send size={16} strokeWidth={2.5} />
                Submit Application
              </>
            )}
          </motion.button>
        </form>
      </section>
    </>
  );
}

/* ---- small internal form pieces (kept in this file, not shared) ---- */

function FormCard({ icon: Icon, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <Icon size={18} className="text-amber" />
        <h2 className="text-sm font-bold text-navy">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function Field({ label, name, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-navy/70">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm text-navy placeholder:text-muted focus:border-amber focus:outline-none"
      />
    </label>
  );
}

function SelectField({ label, name, value, onChange, options, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-navy/70">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-navy/15 bg-white px-3.5 py-2.5 text-sm text-navy focus:border-amber focus:outline-none"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function RadioOption({ name, value, label, checked, onChange }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
        checked ? "border-amber bg-amber-soft text-navy" : "border-navy/15 text-navy/80"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="accent-amber"
      />
      {label}
    </label>
  );
}

function FileUpload({ label, name }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-navy/70">{label}</span>
      <div className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-navy/25 px-3.5 py-4 text-xs text-muted transition-colors hover:border-amber hover:text-navy">
        <Upload size={16} />
        Choose File
        <input type="file" name={name} className="hidden" />
      </div>
    </label>
  );
}