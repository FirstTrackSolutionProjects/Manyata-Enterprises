import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wrench,
  User,
  MapPin,
  FileText,
  Upload,
  Send,
  ArrowLeft,
  Map,
  CheckCircle2,
  CheckCircle,
  Sun,
  Battery,
  Zap,
} from "lucide-react";
import { uploadFilesToS3 } from "../services/api";

const API_URL = import.meta.env.VITE_API_URL;

const INSTALLATION_TYPES = [
  "New Installation",
  "Replacement",
  "Upgrade",
  "Maintenance",
];

const GENDER_OPTIONS = ["Male", "Female", "Other"];

const SOLAR_PANEL_TYPES = ["TOPCON", "BIFACIAL"];

const CONNECTION_TYPES = ["On-Grid", "Off-Grid", "Hybrid"];

// Add more names here as they're provided
const ELECTRICIANS = ["SRABAN KUMAR PATI"];

const initialState = {
  // Customer Information
  customerName: "",
  companyName: "",
  phone: "",
  email: "",
  contactPerson: "",
  gender: "",

  // Installation Details
  installationType: "",
  installationDate: "",
  technicianName: "",
  electricianName: "",
  solarPanelType: "",
  connectionType: "",

  // Location
  state: "",
  address: "",
  city: "",
  pincode: "",

  // Notes
  notes: "",
};

export default function Installation() {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [form, setForm] = useState(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  /* -------------------------------------------------------
     HANDLERS
  ------------------------------------------------------- */

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setForm((prev) => ({
      ...prev,
      state: location === "odisha" ? "Odisha" : "West Bengal",
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChangeLocation = () => {
    setSelectedLocation("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!API_URL) throw new Error("Server is not configured. Please try again later.");

      const fileMap = {};
      const fileInputs = e.currentTarget.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input) => {
        if (input.name && input.files?.[0]) {
          fileMap[input.name] = input.files[0];
        }
      });
      const uploadedFiles = await uploadFilesToS3("installations", fileMap);
      const payload = JSON.stringify({ location: selectedLocation, ...form, files: uploadedFiles });

      const res = await fetch(`${API_URL}/installations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Installation submission failed.");

      setLoading(false);
      setSubmitted(true);
    } catch (error) {
      setLoading(false);
      alert(error.message || "Installation submission failed. Please try again.");
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setForm({ ...initialState, state: form.state });
    setFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* =========================================================
     LOCATION SELECTION SCREEN
  ========================================================= */

  if (!selectedLocation) {
    return (
      <>
        <section className="bg-navy py-14 text-white lg:py-16">
          <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <span className="text-sm font-semibold text-amber">
                Technical Team
              </span>
              <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
                Installation Form
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm text-white/70 sm:text-base">
                Select your location to continue with the installation
                details form.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="min-h-[60vh] bg-offwhite px-5 py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-[900px]">
            <div className="mb-8 text-center">
              <h2 className="text-xl font-bold text-navy sm:text-2xl">
                Where is this installation?
              </h2>
              <p className="mt-2 text-sm text-muted">
                Choose the location to continue with the correct
                installation form.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <LocationCard
                icon={MapPin}
                title="Odisha"
                subtitle="For installations in Odisha"
                description="Submit technical installation details for a rooftop solar system in Odisha."
                buttonText="Continue with Odisha"
                onClick={() => handleLocationSelect("odisha")}
              />

              <LocationCard
                icon={Map}
                title="Kolkata"
                subtitle="For installations in Kolkata / West Bengal"
                description="Submit technical installation details for a rooftop solar system in Kolkata and West Bengal."
                buttonText="Continue with Kolkata"
                onClick={() => handleLocationSelect("kolkata")}
              />
            </div>

            <div className="mt-8 flex items-start gap-3 rounded-xl border border-navy/10 bg-white p-4">
              <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-amber" />
              <p className="text-xs leading-5 text-navy/65 sm:text-sm">
                Please select the location of the installation site. This
                helps us route the form correctly for your region.
              </p>
            </div>
          </div>
        </section>
      </>
    );
  }

  /* =========================================================
     SUBMITTED CONFIRMATION SCREEN
  ========================================================= */

  if (submitted) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-offwhite px-5 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-lg rounded-3xl border border-navy/10 bg-white p-8 text-center sm:p-12"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle size={32} />
          </div>

          <h1 className="mt-6 text-2xl font-extrabold text-navy sm:text-3xl">
            Installation Form Submitted
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-muted">
            Thank you for submitting the installation details for{" "}
            {selectedLocation === "odisha" ? "Odisha" : "Kolkata"}. Our team
            will review the information and reach out if required.
          </p>

          <button
            onClick={handleReset}
            className="mt-8 rounded-full bg-amber px-7 py-3 text-sm font-bold text-navy transition-colors hover:bg-amber-hover"
          >
            Submit Another Form
          </button>
        </motion.div>
      </section>
    );
  }

  /* =========================================================
     INSTALLATION FORM
  ========================================================= */

  return (
    <>
      <section className="bg-navy py-10 text-white sm:py-14 lg:py-16">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <button
              type="button"
              onClick={handleChangeLocation}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-amber hover:text-amber"
            >
              <ArrowLeft size={14} />
              Change Location
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber text-navy">
                {selectedLocation === "odisha" ? (
                  <MapPin size={20} />
                ) : (
                  <Map size={20} />
                )}
              </div>

              <div>
                <span className="text-sm font-semibold text-amber">
                  {selectedLocation === "odisha"
                    ? "Odisha Installation"
                    : "Kolkata Installation"}
                </span>
                <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl lg:text-4xl">
                  Technical Installation Form
                </h1>
              </div>
            </div>

            <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
              Please provide the required customer and installation
              information below.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="bg-offwhite py-10 sm:py-14 lg:py-20">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-[800px] flex-col gap-5 px-4 sm:gap-6 sm:px-5 lg:px-8"
        >
          {/* Installation Location badge */}
          <FormCard icon={MapPin} title="Installation Location">
            <div className="flex items-center justify-between rounded-xl border border-amber/30 bg-amber-soft p-4">
              <div className="flex items-center gap-3">
                {selectedLocation === "odisha" ? (
                  <MapPin size={22} className="text-amber" />
                ) : (
                  <Map size={22} className="text-amber" />
                )}
                <div>
                  <p className="text-xs font-medium text-navy/60">
                    Selected Location
                  </p>
                  <p className="text-base font-bold text-navy">
                    {selectedLocation === "odisha"
                      ? "Odisha"
                      : "Kolkata, West Bengal"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleChangeLocation}
                className="text-xs font-bold text-navy underline underline-offset-2"
              >
                Change
              </button>
            </div>
          </FormCard>

          {/* Customer Information */}
          <FormCard icon={User} title="Customer Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Customer Name"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder="Enter customer name"
                required
              />
              <Field
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                type="tel"
                required
              />
              <SelectField
                label="Gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                options={GENDER_OPTIONS}
                placeholder="Choose"
                required
              />
              <Field
                label="Company / Business Name"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="Enter company name"
              />
              <Field
                label="Email Address"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email address"
                type="email"
              />
              <Field
                label="Contact Person"
                name="contactPerson"
                value={form.contactPerson}
                onChange={handleChange}
                placeholder="Enter contact person"
              />
            </div>
          </FormCard>

          {/* Installation Details */}
          <FormCard icon={Wrench} title="Installation Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label="Installation Type"
                name="installationType"
                value={form.installationType}
                onChange={handleChange}
                options={INSTALLATION_TYPES}
                placeholder="Select installation type"
                required
              />
              <Field
                label="Installation Date"
                name="installationDate"
                value={form.installationDate}
                onChange={handleChange}
                type="date"
                required
              />
              <SelectField
                label="Electricians Name"
                name="electricianName"
                value={form.electricianName}
                onChange={handleChange}
                options={ELECTRICIANS}
                placeholder="Choose"
                required
              />
              <Field
                label="Technician Name"
                name="technicianName"
                value={form.technicianName}
                onChange={handleChange}
                placeholder="Enter technician name"
              />
              <SelectField
                label="Solar Panel Type"
                name="solarPanelType"
                value={form.solarPanelType}
                onChange={handleChange}
                options={SOLAR_PANEL_TYPES}
                placeholder="Choose"
                required
              />
              <SelectField
                label="Connection Type"
                name="connectionType"
                value={form.connectionType}
                onChange={handleChange}
                options={CONNECTION_TYPES}
                placeholder="Choose"
                required
              />
            </div>
          </FormCard>

          {/* Installation Location details */}
          <FormCard icon={MapPin} title="Site Address">
            <div className="grid grid-cols-1 gap-4">
              <Field
                label="State"
                name="state"
                value={form.state}
                onChange={handleChange}
                readOnly
              />
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-navy/70">
                  Full Address<span className="ml-1 text-red-500">*</span>
                </span>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter complete installation address"
                  rows={4}
                  required
                  className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm text-navy placeholder:text-muted focus:border-amber focus:outline-none"
                />
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                  required
                />
                <Field
                  label="PIN Code"
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  placeholder="Enter PIN code"
                  type="number"
                  required
                />
              </div>
            </div>
          </FormCard>

          {/* Consumer & Site Photos */}
          <FormCard icon={FileText} title="Consumer & Site Documentation">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FileUpload
                label="Consumer Aadhaar Card Photo (Front & Back Side)"
                name="aadhaarPhoto"
                required
              />
              <FileUpload
                label="Full Setup Installation GPS Camera Photo With Consumer"
                name="fullSetupPhoto"
                required
              />
            </div>
          </FormCard>

          {/* Panel Documentation */}
          <FormCard icon={Sun} title="Solar Panel Documentation">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FileUpload label="Panel Serial Number Photo 1" name="panelSerialPhoto1" required />
              <FileUpload label="Panel Serial Number Photo 2" name="panelSerialPhoto2" required />
              <FileUpload label="Panel Serial Number Photo 3" name="panelSerialPhoto3" required />
              <FileUpload label="Panel Serial Number Photo 4" name="panelSerialPhoto4" required />
              <FileUpload label="Panel Serial Number Photo 5" name="panelSerialPhoto5" required />
              <FileUpload label="Panel Serial Number Photo 6" name="panelSerialPhoto6" required />
            </div>
          </FormCard>

          {/* Inverter & Earthing Documentation */}
          <FormCard icon={Zap} title="Inverter & Earthing Documentation">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FileUpload
                label="Inverter Serial Number With GPS Camera Photo"
                name="inverterSerialPhoto"
                required
              />
              <FileUpload label="Earthing GPS Photo 1" name="earthingPhoto1" required />
              <FileUpload label="Earthing GPS Photo 2" name="earthingPhoto2" required />
              <FileUpload label="Earthing GPS Photo 3" name="earthingPhoto3" required />
              <FileUpload
                label="LA Cable Connector GPS Photo"
                name="laCableConnectorPhoto"
                required
              />
              <FileUpload
                label="Earthing Arrester & Spike GPS Photo"
                name="earthingArresterSpikePhoto"
                required
              />
              <div className="sm:col-span-2">
                <FileUpload
                  label="Inverter, ACDB & DCDB GPS Camera Photo"
                  name="inverterAcdbDcdbPhoto"
                  required
                />
              </div>
            </div>
          </FormCard>

          {/* Battery Documentation */}
          <FormCard icon={Battery} title="Battery Documentation">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FileUpload label="Battery GPS Photo 1" name="batteryPhoto1" required />
              <FileUpload label="Battery GPS Photo 2" name="batteryPhoto2" required />
            </div>
          </FormCard>

          {/* Documents */}
          <FormCard icon={FileText} title="Other Documents / Attachment">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-navy/70">
                Upload Document
              </span>
              <div className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-navy/25 px-3.5 py-8 text-center text-xs text-muted transition-colors hover:border-amber hover:text-navy">
                <Upload size={20} />
                <span className="font-semibold text-navy">
                  Click to upload
                </span>
                <span className="text-muted">
                  PDF, JPG, PNG or other supported file
                </span>
                <input
                  type="file"
                  name="otherDocument"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </div>
            </label>

            {file && (
              <div className="mt-3 rounded-lg bg-amber-soft px-4 py-2.5 text-xs text-navy">
                Selected file: <span className="font-bold">{file.name}</span>
              </div>
            )}
          </FormCard>

          {/* Notes / Remarks */}
          <FormCard icon={FileText} title="Remarks">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-navy/70">
                Additional Notes (optional)
              </span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Enter any additional installation information.."
                rows={4}
                className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm text-navy placeholder:text-muted focus:border-amber focus:outline-none"
              />
            </label>
          </FormCard>

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-amber px-7 py-3.5 text-sm font-bold text-navy transition-colors hover:bg-amber-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-end"
          >
            <Send size={16} strokeWidth={2.5} />
            {loading ? "Submitting..." : "Submit Installation Form"}
          </motion.button>
        </form>
      </section>
    </>
  );
}

/* =========================================================
   LOCATION CARD
========================================================= */

function LocationCard({ icon: Icon, title, subtitle, description, buttonText, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group rounded-2xl border border-navy/10 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg sm:p-7"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-soft text-amber">
        <Icon size={26} />
      </div>
      <h3 className="mt-5 text-xl font-extrabold text-navy sm:text-2xl">{title}</h3>
      <p className="mt-1 text-sm font-semibold text-amber">{subtitle}</p>
      <p className="mt-3 min-h-[48px] text-sm leading-6 text-muted">{description}</p>
      <button
        type="button"
        onClick={onClick}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-amber hover:text-navy"
      >
        {buttonText}
        <Send size={15} />
      </button>
    </motion.div>
  );
}

/* =========================================================
   FORM CARD
========================================================= */

function FormCard({ icon: Icon, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-navy/10 bg-white p-4 sm:p-6"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-soft">
          <Icon size={17} className="text-amber" />
        </div>
        <h2 className="text-sm font-bold text-navy sm:text-base">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

/* =========================================================
   INPUT FIELD
========================================================= */

function Field({ label, name, value, onChange, placeholder, type = "text", required = false, readOnly = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-navy/70">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        className={`w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm text-navy placeholder:text-muted focus:border-amber focus:outline-none ${
          readOnly ? "cursor-not-allowed bg-slate-50" : "bg-white"
        }`}
      />
    </label>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({ label, name, value, onChange, options, placeholder, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-navy/70">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
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

/* =========================================================
   FILE UPLOAD
========================================================= */

function FileUpload({ label, name, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-navy/70">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <div className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-navy/25 px-3.5 py-4 text-center text-xs text-muted transition-colors hover:border-amber hover:text-navy">
        <Upload size={16} />
        <span>Click to upload a file</span>
        <input type="file" name={name} required={required} className="sr-only" />
      </div>
    </label>
  );
}
