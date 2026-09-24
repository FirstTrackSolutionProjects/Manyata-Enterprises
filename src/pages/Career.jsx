import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { uploadFilesToS3 } from "../services/api";
import {
  User,
  MapPin,
  GraduationCap,
  Upload,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

const QUALIFICATIONS = [
  { value: "post-grad", label: "Post Graduation / Master's" },
  { value: "graduation", label: "Graduation" },
  { value: "higher secondary", label: "Higher Secondary" },
  { value: "other", label: "Other" },
];
const ROLE =[
  {value:"HR Intern",label:"HR Intern"},
  {value:"HR Executive",label:"HR Executive"},
  {value:"Back Office Executive",label:"Back Office Executive"},
  {value:"Sales Executive",label:"Sales Executive"},
  {value:"Sr. Sales Executive",label:"Sr. Sales Executive"},
  {value:"Sales Manager",label:"Sales Manager"},
  {value:"Technical Engineer",label:"Technical Engineer"},
  
  
]
const initialState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dob: "",
  gender: "Male",
  streetAddress: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  description: "",
  qualification: "",
  jobrole:"",
  location: "",
};

export default function Career() {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const formRef = useRef(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
      const uploadedFiles = await uploadFilesToS3("careers", fileMap);

      // 3. Submit JSON payload with S3 keys
      const payload = { ...form, files: uploadedFiles };
      const res = await fetch(`${API_URL}/careers`, {
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
            <span className="text-sm font-semibold text-amber">Careers</span>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Join Manyata Enterprises
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
              We're building Odisha's rooftop solar future — and we're always
              looking for people who want to build it with us.
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
              <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="Enter your phone number" type="tel" />
              <Field label="Date of Birth" name="dob" value={form.dob} onChange={handleChange} type="date" />
              <SelectField label="Gender" name="gender" value={form.gender} onChange={handleChange} options={["Male", "Female"]} />
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
          </FormCard>

          {/* Description */}
          <FormCard icon={User} title="About You">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-navy/70">
                Description
              </span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Your message here.."
                rows={4}
                className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm text-navy placeholder:text-muted focus:border-amber focus:outline-none"
              />
            </label>
          </FormCard>

          {/* Highest qualification */}
          <FormCard icon={GraduationCap} title="Highest Qualification">
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
          </FormCard>
<FormCard icon={GraduationCap} title="Job Role">
            <div className="flex flex-col gap-3">
              {ROLE.map((opt) => (
                <RadioOption
                  key={opt.value}
                  name="jobrole"
                  value={opt.value}
                  label={opt.label}
                  checked={form.jobrole === opt.value}
                  onChange={handleChange}
                />
              ))}
            </div>
            <div className="mt-5">
              <SelectField label="Preferred Location" name="location" value={form.location} onChange={handleChange} options={["Odisha", "West Bengal"]} />
            </div>
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

function SelectField({ label, name, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-navy/70">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-navy/15 bg-white px-3.5 py-2.5 text-sm text-navy focus:border-amber focus:outline-none"
      >
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
