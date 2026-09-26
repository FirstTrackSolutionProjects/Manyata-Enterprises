import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { uploadFilesToS3 } from "../services/api";
import {
  User,
  Building2,
  MapPin,
  Upload,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Landmark,
} from "lucide-react";
import { submitPartner } from "../services/api";

const PARTNER_TYPES = [
  { value: "vendor", label: "Vendor" },
  { value: "dealer", label: "Dealer" },
  { value: "sub_vendor", label: "Sub-vendor" },
];
const COMMISSION_MODELS = [
  { value: "per_completed_installation", label: "Per completed installation" },
];

const PARTNER_SYSTEMS = [
  { value: "on_grid", label: "On-Grid System" },
  { value: "hybrid", label: "Hybrid System" },
];

const initialState = {
  partnerType: "vendor",
  commissionModel: "",
  commissionRates: { on_grid: "20000", hybrid: "30000" },
  systemTypes: [],
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  aadhaarNumber: "",
  gender: "",
  dob: "",
  gstNumber: "",
  panNumber: "",
  msmeNumber: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  experienceYears: "",
  description: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
};

export default function Partner() {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const formRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "partnerType" ? { commissionModel: value === "sub_vendor" ? "per_completed_installation" : "" } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setSubmitError("");

    if (!form.systemTypes.length) {
      setSubmitError("Select at least one system type: On-Grid or Hybrid.");
      setSubmitting(false);
      return;
    }

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
      const uploadedFiles = await uploadFilesToS3("partners", fileMap);

      // 3. Submit JSON payload with S3 keys
      const payload = { ...form, files: uploadedFiles };
      await submitPartner(payload);
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
      <section className="bg-navy py-14 text-white lg:py-16">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-sm font-semibold text-amber">
              Partner With Us
            </span>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Become a Manyata Partner
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
              Apply to become a vendor, dealer, or sub-vendor partner. Our team will
              review your application and reach out.
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
          <FormCard icon={Building2} title="Company Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label="Partner Type"
                name="partnerType"
                value={form.partnerType}
                onChange={handleChange}
                options={PARTNER_TYPES}
              />
              {form.partnerType === "sub_vendor" && (
                <SelectField
                  label="Commission"
                  name="commissionModel"
                  value={form.commissionModel}
                  onChange={handleChange}
                  options={COMMISSION_MODELS}
                />
              )}
              <Field
                label="Company Name"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="Enter your company name"
              />
              <Field
                label="GST Number"
                name="gstNumber"
                value={form.gstNumber}
                onChange={handleChange}
                placeholder="Enter GST number (optional)"
              />
              <Field
                label="PAN Number"
                name="panNumber"
                value={form.panNumber}
                onChange={handleChange}
                placeholder="Enter PAN number (optional)"
              />
              <Field
                label="MSME / Udyam Number"
                name="msmeNumber"
                value={form.msmeNumber}
                onChange={handleChange}
                placeholder="Enter MSME / Udyam number (optional)"
              />
              <Field
                label="Years of Experience"
                name="experienceYears"
                value={form.experienceYears}
                onChange={handleChange}
                placeholder="e.g. 5"
              />
            </div>
          </FormCard>

          <FormCard icon={Building2} title="System Types">
            <p className="mb-4 text-sm text-muted">Choose the systems you work with.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {PARTNER_SYSTEMS.map((system) => {
                const checked = form.systemTypes.includes(system.value);
                return (
                  <label key={system.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${checked ? "border-amber bg-amber-soft" : "border-navy/15 hover:border-amber/60"}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setForm((current) => ({
                        ...current,
                        systemTypes: checked
                          ? current.systemTypes.filter((value) => value !== system.value)
                          : [...current.systemTypes, system.value],
                      }))}
                      className="mt-1 accent-amber"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-navy">{system.label}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {!form.systemTypes.length && <p className="mt-2 text-xs text-muted">Select at least one system type to continue.</p>}
            {form.partnerType === "sub_vendor" && <div className="mt-5 overflow-hidden rounded-xl border border-navy/10">
              <h3 className="border-b border-navy/10 bg-slate-50 px-4 py-3 text-sm font-bold text-navy">Commission Chart (per completed installation)</h3>
              <div className="divide-y divide-navy/10">
                {PARTNER_SYSTEMS.map((system) => <label key={system.value} className="grid grid-cols-[1fr_minmax(150px,220px)] items-center gap-4 px-4 py-3 text-sm text-navy">
                  <span>{system.label}</span>
                  <span className="flex items-center gap-2"><span className="text-muted">₹</span><input type="number" min="0" step="1" required value={form.commissionRates[system.value]} onChange={(event) => setForm((current) => ({ ...current, commissionRates: { ...current.commissionRates, [system.value]: event.target.value } }))} className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm" aria-label={`${system.label} commission amount`} /></span>
                </label>)}
              </div>
            </div>}
          </FormCard>

          <FormCard icon={User} title="Contact Person">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Contact Name"
                name="contactName"
                value={form.contactName}
                onChange={handleChange}
                placeholder="Enter contact person name"
              />
              <Field
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email"
                type="email"
              />
              <Field
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                type="tel"
              />
              <Field
                label="Aadhaar Number"
                name="aadhaarNumber"
                value={form.aadhaarNumber}
                onChange={handleChange}
                placeholder="Enter 12-digit Aadhaar number (optional)"
                type="text"
              />
              <SelectField
                label="Gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                options={[{ value: "", label: "Select gender (optional)" }, { value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }]}
              />
              <Field
                label="Date of Birth"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                type="date"
              />
            </div>
          </FormCard>

          <FormCard icon={MapPin} title="Address">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter full address"
                />
              </div>
              <Field
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Enter city"
              />
              <SelectField
                label="State"
                name="state"
                value={form.state}
                onChange={handleChange}
                options={[{ value: "", label: "Select state" }, { value: "Odisha", label: "Odisha" }, { value: "West Bengal", label: "West Bengal" }]}
              />
              <Field
                label="PIN Code"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                placeholder="Enter PIN code"
              />
            </div>
          </FormCard>

          <FormCard icon={Upload} title="Documents">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FileUpload label="GST Certificate" name="gstFile" />
              <FileUpload label="PAN Card" name="panFile" />
              <FileUpload label="Aadhaar Card" name="aadhaarFile" />
              <FileUpload label="Partner Photo" name="photoFile" accept="image/jpeg,image/png,image/webp" />
              <FileUpload label="MSME Certificate" name="msmeFile" />
              <FileUpload label="Business Documents" name="businessDocFile" />
            </div>
          </FormCard>

          <FormCard icon={Landmark} title="Bank Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Bank Name"
                name="bankName"
                value={form.bankName}
                onChange={handleChange}
                placeholder="Enter your bank name"
              />
              <Field
                label="Account Number"
                name="accountNumber"
                value={form.accountNumber}
                onChange={handleChange}
                placeholder="Enter account number"
              />
              <Field
                label="IFSC Code"
                name="ifscCode"
                value={form.ifscCode}
                onChange={handleChange}
                placeholder="e.g. SBIN0001234"
              />
              <FileUpload label="Cancelled Cheque / Passbook" name="chequePassbook" />
            </div>
          </FormCard>

          <FormCard icon={User} title="Additional Information">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-navy/70">
                Description
              </span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Tell us about your business.."
                rows={4}
                className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm text-navy placeholder:text-muted focus:border-amber focus:outline-none"
              />
            </label>
          </FormCard>

          {submitSuccess && (
            <div className="flex items-start gap-3 rounded-xl border border-green-300 bg-green-50 p-4">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />
              <p className="text-sm text-green-800">
                Thank you! Your partner application has been received. Our
                team will reach out soon.
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
                Submit Partner Application
              </>
            )}
          </motion.button>
        </form>
      </section>
    </>
  );
}

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
      <span className="mb-1.5 block text-xs font-semibold text-navy/70">
        {label}
      </span>
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
      <span className="mb-1.5 block text-xs font-semibold text-navy/70">
        {label}
      </span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-navy/15 bg-white px-3.5 py-2.5 text-sm text-navy focus:border-amber focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FileUpload({ label, name, accept }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-navy/70">
        {label}
      </span>
      <div className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-navy/25 px-3.5 py-4 text-xs text-muted transition-colors hover:border-amber hover:text-navy">
        <Upload size={16} />
        Choose File
        <input type="file" name={name} accept={accept} className="hidden" />
      </div>
    </label>
  );
}
