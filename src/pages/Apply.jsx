import { useState } from "react";
import { motion } from "framer-motion";
import {
  SunMedium,
  User,
  MapPin,
  FileText,
  Zap,
  Landmark,
  Camera,
  Upload,
  Send,
} from "lucide-react";

const SYSTEM_TYPES = [
  { value: "on-grid", label: "On-Grid System" },
  { value: "hybrid", label: "Hybrid System" },
];

// Extra addition requested: capacity choice, matching our subsidy tiers
const SYSTEM_SIZES = [
  { value: "1kw", label: "1 kW" },
  { value: "2kw", label: "2 kW" },
  { value: "3kw", label: "3 kW" },
];

const initialState = {
  systemType: "",
  systemSize: "",
  fullName: "",
  phoneNumber: "",
  gender: "",
  dob: "",
  email: "",
  state: "",
  district: "",
  block: "",
  gramPanchayat: "",
  buildingPlot: "",
  villageName: "",
  city: "",
  postOffice: "",
  pinCode: "",
  landmark: "",
  consumerNumber: "",
  subDivision: "",
  tariff: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
};

export default function Apply() {
  const [form, setForm] = useState(initialState);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: wire this up to your backend / email service to actually
    // receive applications. For now this just confirms the click works.
    console.log("Application submitted:", form);
    alert("Thanks! Your application has been received. We'll call you shortly.");
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
            <span className="text-sm font-semibold text-amber">Get Started</span>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Apply for Rooftop Solar
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
              Fill in your details and our team will reach out to confirm
              your eligibility and next steps.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="bg-offwhite py-14 lg:py-20">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-[800px] flex-col gap-6 px-5 lg:px-8"
        >
          {/* System type */}
          <FormCard icon={SunMedium} title="Choose Your Solar System">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SYSTEM_TYPES.map((opt) => (
                <RadioOption
                  key={opt.value}
                  name="systemType"
                  value={opt.value}
                  label={opt.label}
                  checked={form.systemType === opt.value}
                  onChange={handleChange}
                />
              ))}
            </div>
          </FormCard>

          {/* System size — new addition */}
          <FormCard icon={Zap} title="Choose Your System Size">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {SYSTEM_SIZES.map((opt) => (
                <RadioOption
                  key={opt.value}
                  name="systemSize"
                  value={opt.value}
                  label={opt.label}
                  checked={form.systemSize === opt.value}
                  onChange={handleChange}
                />
              ))}
            </div>
          </FormCard>

          {/* Personal details */}
          <FormCard icon={User} title="Personal Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter your full name" />
              <Field label="Phone Number" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="Enter your phone number" type="tel" />
              <SelectField label="Gender" name="gender" value={form.gender} onChange={handleChange} options={["Male", "Female", "Other"]} placeholder="Select your gender" />
              <Field label="Date of Birth" name="dob" value={form.dob} onChange={handleChange} type="date" />
              <div className="sm:col-span-2">
                <Field label="Email Address" name="email" value={form.email} onChange={handleChange} placeholder="Enter your email address" type="email" />
              </div>
            </div>
          </FormCard>

          {/* Address details */}
          <FormCard icon={MapPin} title="Address Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField label="State" name="state" value={form.state} onChange={handleChange} options={["Odisha"]} placeholder="Select your state" />
              <Field label="District" name="district" value={form.district} onChange={handleChange} placeholder="Enter your district" />
              <Field label="Block" name="block" value={form.block} onChange={handleChange} placeholder="Enter your block" />
              <Field label="Gram Panchayat Name" name="gramPanchayat" value={form.gramPanchayat} onChange={handleChange} placeholder="Enter your Gram Panchayat" />
              <Field label="Building Name / Plot No." name="buildingPlot" value={form.buildingPlot} onChange={handleChange} placeholder="Enter your building name / plot no." />
              <Field label="Village Name" name="villageName" value={form.villageName} onChange={handleChange} placeholder="Enter your village name" />
              <Field label="City" name="city" value={form.city} onChange={handleChange} placeholder="Enter your city" />
              <Field label="Post Office Name" name="postOffice" value={form.postOffice} onChange={handleChange} placeholder="Enter your post office name" />
              <Field label="Pin Code" name="pinCode" value={form.pinCode} onChange={handleChange} placeholder="Enter your pin code" />
              <Field label="Landmark" name="landmark" value={form.landmark} onChange={handleChange} placeholder="Enter your landmark" />
            </div>
          </FormCard>

          {/* Identity documents */}
          <FormCard icon={FileText} title="Identity Documents">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FileUpload label="Aadhaar Card (Front & Back)" name="aadhaarFront" />
              <FileUpload label="PAN Card" name="panCard" />
              <FileUpload label="Photo" name="photo" />
              <FileUpload label="Signature" name="signature" />
            </div>
          </FormCard>

          {/* Electricity connection details */}
          <FormCard icon={Zap} title="Electricity Connection Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Consumer Number" name="consumerNumber" value={form.consumerNumber} onChange={handleChange} placeholder="Enter your consumer number" />
              <Field label="Sub Division" name="subDivision" value={form.subDivision} onChange={handleChange} placeholder="Enter your sub division" />
              <Field label="Tariff" name="tariff" value={form.tariff} onChange={handleChange} placeholder="Enter your tariff" />
              <FileUpload label="Latest Electricity Bill" name="electricityBill" />
            </div>
          </FormCard>

          {/* Bank details */}
          <FormCard icon={Landmark} title="Bank Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Bank Name" name="bankName" value={form.bankName} onChange={handleChange} placeholder="Enter your bank name" />
              <Field label="Bank Account Number" name="accountNumber" value={form.accountNumber} onChange={handleChange} placeholder="Enter your bank account number" />
              <Field label="Bank IFSC Code" name="ifscCode" value={form.ifscCode} onChange={handleChange} placeholder="Enter your bank IFSC code" />
              <FileUpload label="Cancelled Cheque / Passbook Front Page" name="chequePassbook" />
            </div>
          </FormCard>

          {/* Site documentation */}
          <FormCard icon={Camera} title="Site Documentation">
            <FileUpload label="Site Photo (Rooftop)" name="sitePhoto" />
          </FormCard>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-amber px-7 py-3.5 text-sm font-bold text-navy transition-colors hover:bg-amber-hover"
          >
            <Send size={16} strokeWidth={2.5} />
            Submit Application
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
        <option value="">{placeholder}</option>
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
        Click to upload a file
        <input type="file" name={name} className="hidden" />
      </div>
    </label>
  );
}