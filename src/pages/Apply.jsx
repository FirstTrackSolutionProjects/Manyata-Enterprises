import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowLeft,
  ArrowRight,
  Map as MapIcon,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Save,
  RotateCcw,
  Download,
  Eye,
  Trash2,
} from "lucide-react";
import { submitApplication, downloadApplicationPdf, uploadFilesToS3 } from "../services/api";

/* ── Constants ────────────────────────────────────────── */

const ODISHA_SUB_VENDORS = [
  "MAYADHAR NAYAK",
  "PRADEEP KUMAR BEHERA",
  "PRAHFULA NAYAK",
  "BABUL BEHERA",
  "TEJASH PAREKH",
  "TARUN KUMAR BEHERA",
  "SOURAV KUMAR NAYAK",
  "ABHISHEK MANDAL",
  "PRAFULLA KUMAR MAHATA",
  "ASHOKE BHUNIA",
  "SIBA PRASAD SAHOO",
  "MADHUSUDAN ROUT",
  "NABAJIBAN BHOI",
  "MAORANJAN SAHOO",
  "JAYANTI MOHAPATRA",
  "MD NASIR KHAN",
  "SANJAYA KUMAR BEHERA",
  "SHANTUN KUMAR MISHRA",
  "DEBENDRANATH ACHARAY",
  "UMESH SING",
  "SUNAMATI DUTICHAND",
  "JAGANATHA BEHERA",
  "SARAT KUMAR SAHOO",
  "ABHISHEK SAHOO",
  "AJAYA KUMAR NAYAK",
  "MANYATA NENTERPRISES",
  "AJAYA KUAMR GOCHHAYAT",
  "SUBHASH CHANDRA DASH",
  "GIRIJA SANKAR SAHOO",
];

const KOLKATA_SUB_VENDORS = [
  "PRAFULLA KUMAR MAHATA",
  "SAILEN TUDU",
  "SUJIT GHOSH",
  "ASHOKE BHUNIA",
  "SUBAJEET BARMAN",
  "TAPANN KUAMR PRADHAN",
  "SWARUP MALIK",
  "SANJOY POREL",
  "HAWK SAHEB",
  "SHYAMAL MITRA",
  "MASKARA BESUNMA",
  "ARPITA SIKDAR",
  "UTPAL KOLE",
  "ARKA PRAVA BHUNIA",
  "SWAPNA PANDIT",
  "ASHIS BHATTAACHAJEE",
  "JAYANTA BERA",
  "KOUSTAV BISWAS",
  "SUMNARRAYAN DEY",
  "RINKU DAS",
  "MAHABUL ALAM",
  "MANIRUL ISLAM LASKAR",
  "SATYA RANJAN SARDAR",
  "PRABIR SABUD",
  "JAVED MONDAL",
];

const SYSTEM_TYPES = [
  { value: "on-grid", label: "On-Grid System" },
  { value: "hybrid", label: "Hybrid System" },
];

const SYSTEM_SIZES = [
  { value: "1kw", label: "1 kW" },
  { value: "2kw", label: "2 kW" },
  { value: "3kw", label: "3 kW" },
];

const INCOME_SOURCES = ["FARMER", "BUSINESS", "PRIVATE JOB", "GOVT JOB"];

const DRAFT_KEY = "manyata_apply_draft_v1";

const initialState = {
  systemType: "",
  systemSize: "",
  subVendorName: "",
  salesExecutiveName: "",
  incomeSource: "",

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
  municipality: "",
  wardNumber: "",
  streetLocality: "",

  consumerNumber: "",
  subDivision: "",
  tariff: "",

  bankName: "",
  accountNumber: "",
  ifscCode: "",

  remarks: "",
};

const STEPS = [
  { id: 1, label: "Location", icon: MapPin },
  { id: 2, label: "System Type", icon: SunMedium },
  { id: 3, label: "System Size", icon: Zap },
  { id: 4, label: "Vendor", icon: User },
  { id: 5, label: "Personal", icon: User },
  { id: 6, label: "Address", icon: MapIcon },
  { id: 7, label: "Identity Docs", icon: FileText },
  { id: 8, label: "Electricity", icon: Zap },
  { id: 9, label: "Bank", icon: Landmark },
  { id: 10, label: "Income", icon: Landmark },
  { id: 11, label: "Site Photo", icon: Camera },
  { id: 12, label: "Other Docs", icon: Upload },
  { id: 13, label: "Remarks", icon: FileText },
  { id: 14, label: "Preview", icon: Eye },
  { id: 15, label: "Submit", icon: Send },
];

const TOTAL_STEPS = 15;

/* ── Main Component ──────────────────────────────────── */

export default function Apply() {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [location, setLocation] = useState("");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(null); // { id, applicationNo }
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);

  /* ── Load draft from localStorage on mount ─────────── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft && draft.form && draft.location) {
        setShowResumePrompt(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  /* ── Auto-save draft on every change ───────────────── */
  useEffect(() => {
    if (!location || submitted) return;
    try {
      const draft = {
        location,
        step,
        form,
        savedAt: Date.now(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setDraftSavedAt(new Date());
    } catch {
      /* ignore */
    }
  }, [location, step, form, submitted]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setDraftSavedAt(null);
  };

  const resumeDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      setLocation(draft.location || "");
      setForm({ ...initialState, ...draft.form });
      setStep(draft.step || 1);
      setShowResumePrompt(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setShowResumePrompt(false);
    }
  };

  const startFresh = () => {
    clearDraft();
    setForm(initialState);
    setLocation("");
    setStep(1);
    setShowResumePrompt(false);
    if (formRef.current) formRef.current.reset();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (loc) => {
    setLocation(loc);
    setForm((prev) => ({
      ...prev,
      state: loc === "odisha" ? "Odisha" : "West Bengal",
    }));
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrev = () => {
    if (step > 1) {
      setStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
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
      const uploadedFiles = await uploadFilesToS3("applications", fileMap);

      // 3. Submit JSON payload with S3 keys
      const payload = {
        location,
        ...form,
        currentStep: TOTAL_STEPS,
        isComplete: true,
        files: uploadedFiles,
      };
      const res = await submitApplication(payload);
      setSubmitted({
        id: res.data.id,
        applicationNo: res.data.applicationNo,
      });
      clearDraft();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Resume prompt modal ───────────────────────────── */
  if (showResumePrompt) {
    return <ResumePrompt onResume={resumeDraft} onStartFresh={startFresh} />;
  }

  /* ── Success screen ────────────────────────────────── */
  if (submitted) {
    return (
      <SubmitSuccess
        applicationNo={submitted.applicationNo}
        applicationId={submitted.id}
        onTrack={() => navigate("/track")}
        onNew={() => {
          setSubmitted(null);
          setForm(initialState);
          setLocation("");
          setStep(1);
        }}
      />
    );
  }

  /* ── Location selection (Step 1) ───────────────────── */
  if (!location) {
    return (
      <LocationStep onSelect={handleLocationSelect} />
    );
  }

  /* ── Main wizard ───────────────────────────────────── */
  return (
    <WizardShell
      step={step}
      location={location}
      onPrev={goPrev}
      onNext={goNext}
      onJump={(s) => setStep(s)}
      draftSavedAt={draftSavedAt}
      onClearDraft={() => {
        if (confirm("Clear your saved draft? This cannot be undone.")) {
          startFresh();
        }
      }}
    >
      <form ref={formRef} onSubmit={handleSubmit} className="contents">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {step === 2 && (
              <SystemTypeStep form={form} onChange={handleChange} />
            )}
            {step === 3 && (
              <SystemSizeStep form={form} onChange={handleChange} />
            )}
            {step === 4 && (
              <VendorStep
                form={form}
                location={location}
                onChange={handleChange}
              />
            )}
            {step === 5 && (
              <PersonalStep form={form} onChange={handleChange} />
            )}
            {step === 6 && (
              <AddressStep
                form={form}
                location={location}
                onChange={handleChange}
              />
            )}
            {step === 7 && <DocumentsStep />}
            {step === 8 && (
              <ElectricityStep form={form} onChange={handleChange} />
            )}
            {step === 9 && <BankStep form={form} onChange={handleChange} />}
            {step === 10 && (
              <IncomeStep form={form} onChange={handleChange} />
            )}
            {step === 11 && <SitePhotoStep />}
            {step === 12 && <OtherDocsStep />}
            {step === 13 && <RemarksStep form={form} onChange={handleChange} />}
            {step === 14 && (
              <PreviewStep
                form={form}
                location={location}
                onEdit={(s) => setStep(s)}
              />
            )}
            {step === 15 && (
              <SubmitStep
                submitting={submitting}
                submitError={submitError}
                onSubmit={handleSubmit}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </form>
    </WizardShell>
  );
}

/* ── Step 1: Location ────────────────────────────────── */

function LocationStep({ onSelect }) {
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
              Get Started
            </span>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Apply for Rooftop Solar
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/70 sm:text-base">
              A 15-step guided form. Your progress saves automatically — you
              can come back any time.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="min-h-[60vh] bg-offwhite px-5 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[900px]">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-navy sm:text-2xl">
              Where are you applying from?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Choose your location to continue with the correct application
              form.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <LocationCard
              icon={MapPin}
              title="Odisha"
              subtitle="For customers from Odisha"
              description="Apply for rooftop solar installation and subsidy services in Odisha."
              buttonText="Apply from Odisha"
              onClick={() => onSelect("odisha")}
            />
            <LocationCard
              icon={MapIcon}
              title="Kolkata"
              subtitle="For customers from Kolkata / West Bengal"
              description="Apply for rooftop solar installation services in Kolkata and West Bengal."
              buttonText="Apply from Kolkata"
              onClick={() => onSelect("kolkata")}
            />
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-navy/10 bg-white p-4">
            <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-amber" />
            <p className="text-xs leading-5 text-navy/65 sm:text-sm">
              Your progress auto-saves. If you leave and come back, you'll be
              prompted to resume where you left off.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Wizard Shell (progress + nav) ───────────────────── */

function WizardShell({
  step,
  location,
  onPrev,
  onNext,
  onJump,
  draftSavedAt,
  onClearDraft,
  children,
}) {
  const progress = Math.round((step / TOTAL_STEPS) * 100);
  const current = STEPS.find((s) => s.id === step);

  return (
    <>
      <section className="bg-navy py-8 text-white lg:py-10">
        <div className="mx-auto max-w-[1100px] px-5 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Exit the application? Your progress is saved.")) {
                    window.location.href = "/";
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:border-amber hover:text-amber"
              >
                <ArrowLeft size={13} />
                Exit
              </button>
              <span className="text-xs font-semibold text-amber">
                {location === "odisha" ? "Odisha" : "Kolkata"} Application
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {draftSavedAt && (
                <span className="hidden items-center gap-1 text-white/60 sm:flex">
                  <Save size={12} />
                  Saved {draftSavedAt.toLocaleTimeString("en-IN")}
                </span>
              )}
              <button
                type="button"
                onClick={onClearDraft}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:border-red-400 hover:text-red-300"
              >
                <Trash2 size={12} />
                Clear Draft
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber">
                Step {step} of {TOTAL_STEPS}
              </p>
              <h1 className="mt-1 text-xl font-extrabold sm:text-2xl">
                {current?.label}
              </h1>
            </div>
            <span className="text-sm font-bold text-white/70">
              {progress}%
            </span>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-amber"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Step chips */}
          <div className="mt-5 flex flex-wrap gap-1.5">
            {STEPS.map((s) => {
              const isCurrent = s.id === step;
              const isPast = s.id < step;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => isPast && onJump(s.id)}
                  disabled={!isPast && !isCurrent}
                  title={s.label}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isCurrent
                      ? "bg-amber text-navy"
                      : isPast
                      ? "bg-white/20 text-white hover:bg-white/30"
                      : "bg-white/5 text-white/40"
                  }`}
                >
                  {s.id}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-offwhite py-8 lg:py-12">
        <div className="mx-auto max-w-[800px] px-4 sm:px-5 lg:px-8">
          {children}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onPrev}
              disabled={step <= 2}
              className="flex items-center gap-2 rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-navy/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft size={14} />
              Previous
            </button>

            {step < TOTAL_STEPS && (
              <button
                type="button"
                onClick={onNext}
                className="flex items-center gap-2 rounded-full bg-amber px-6 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-amber-hover"
              >
                Next
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Step 2: System Type ─────────────────────────────── */

function SystemTypeStep({ form, onChange }) {
  return (
    <FormCard icon={SunMedium} title="Choose Your Solar System Type">
      <p className="mb-4 text-sm text-muted">
        On-grid systems are connected to the electricity grid. Hybrid systems
        include battery backup.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SYSTEM_TYPES.map((opt) => (
          <RadioOption
            key={opt.value}
            name="systemType"
            value={opt.value}
            label={opt.label}
            checked={form.systemType === opt.value}
            onChange={onChange}
          />
        ))}
      </div>
    </FormCard>
  );
}

/* ── Step 3: System Size ─────────────────────────────── */

function SystemSizeStep({ form, onChange }) {
  return (
    <FormCard icon={Zap} title="Choose Your System Size">
      <p className="mb-4 text-sm text-muted">
        Not sure? A 3 kW system is typically suitable for homes with AC and
        larger appliances.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SYSTEM_SIZES.map((opt) => (
          <RadioOption
            key={opt.value}
            name="systemSize"
            value={opt.value}
            label={opt.label}
            checked={form.systemSize === opt.value}
            onChange={onChange}
          />
        ))}
      </div>
    </FormCard>
  );
}

/* ── Step 4: Vendor ──────────────────────────────────── */

function VendorStep({ form, location, onChange }) {
  const vendors =
    location === "odisha" ? ODISHA_SUB_VENDORS : KOLKATA_SUB_VENDORS;
  return (
    <FormCard icon={User} title="Vendor & Sales Details">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label="Sub Vendor Name"
          name="subVendorName"
          value={form.subVendorName}
          onChange={onChange}
          options={vendors}
          placeholder="Choose"
        />
        <Field
          label="Sales Executive Name"
          name="salesExecutiveName"
          value={form.salesExecutiveName}
          onChange={onChange}
          placeholder="Enter sales executive name"
        />
      </div>
    </FormCard>
  );
}

/* ── Step 5: Personal ────────────────────────────────── */

function PersonalStep({ form, onChange }) {
  return (
    <FormCard icon={User} title="Personal Details">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Full Name"
          name="fullName"
          value={form.fullName}
          onChange={onChange}
          placeholder="Enter your full name"
          required
        />
        <Field
          label="Phone Number"
          name="phoneNumber"
          value={form.phoneNumber}
          onChange={onChange}
          placeholder="10-digit mobile number"
          type="tel"
          required
        />
        <SelectField
          label="Gender"
          name="gender"
          value={form.gender}
          onChange={onChange}
          options={["Male", "Female", "Other"]}
          placeholder="Select gender"
        />
        <Field
          label="Date of Birth"
          name="dob"
          value={form.dob}
          onChange={onChange}
          type="date"
        />
        <div className="sm:col-span-2">
          <Field
            label="Email Address"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="you@example.com"
            type="email"
          />
        </div>
      </div>
    </FormCard>
  );
}

/* ── Step 6: Address ─────────────────────────────────── */

function AddressStep({ form, location, onChange }) {
  return (
    <FormCard
      icon={location === "odisha" ? MapPin : MapIcon}
      title="Consumer Address Details"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="State"
          name="state"
          value={form.state}
          onChange={onChange}
          readOnly
        />
        <Field
          label="District"
          name="district"
          value={form.district}
          onChange={onChange}
          placeholder="Enter your district"
        />
        {location === "odisha" ? (
          <>
            <Field
              label="Block"
              name="block"
              value={form.block}
              onChange={onChange}
              placeholder="Enter your block"
            />
            <Field
              label="Gram Panchayat"
              name="gramPanchayat"
              value={form.gramPanchayat}
              onChange={onChange}
              placeholder="Enter your Gram Panchayat"
            />
          </>
        ) : (
          <>
            <Field
              label="Municipality / Corporation"
              name="municipality"
              value={form.municipality}
              onChange={onChange}
              placeholder="Enter municipality / corporation"
            />
            <Field
              label="Ward Number"
              name="wardNumber"
              value={form.wardNumber}
              onChange={onChange}
              placeholder="Enter ward number"
            />
          </>
        )}
        <Field
          label="Building / Plot No."
          name="buildingPlot"
          value={form.buildingPlot}
          onChange={onChange}
          placeholder="Enter building / plot no."
        />
        {location === "odisha" ? (
          <Field
            label="Village Name"
            name="villageName"
            value={form.villageName}
            onChange={onChange}
            placeholder="Enter village name"
          />
        ) : (
          <Field
            label="Street / Locality"
            name="streetLocality"
            value={form.streetLocality}
            onChange={onChange}
            placeholder="Enter street / locality"
          />
        )}
        <Field
          label="City"
          name="city"
          value={form.city}
          onChange={onChange}
          placeholder="Enter your city"
        />
        <Field
          label="Post Office"
          name="postOffice"
          value={form.postOffice}
          onChange={onChange}
          placeholder="Enter post office"
        />
        <Field
          label="Pin Code"
          name="pinCode"
          value={form.pinCode}
          onChange={onChange}
          placeholder="6-digit PIN"
          type="number"
        />
        <Field
          label="Landmark"
          name="landmark"
          value={form.landmark}
          onChange={onChange}
          placeholder="Nearby landmark"
        />
      </div>
    </FormCard>
  );
}

/* ── Step 7: Documents ───────────────────────────────── */

function DocumentsStep() {
  return (
    <FormCard icon={FileText} title="Identity Documents">
      <p className="mb-4 text-sm text-muted">
        Upload clear photos or PDFs. Max 10 MB each. Accepted: JPG, PNG, WEBP, PDF.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FileUpload
          label="Aadhaar Card (Front & Back)"
          name="aadhaarFront"
        />
        <FileUpload label="PAN Card" name="panCard" />
        <FileUpload label="Passport-size Photo" name="photo" />
        <FileUpload label="Signature" name="signature" />
      </div>
    </FormCard>
  );
}

/* ── Step 8: Electricity ─────────────────────────────── */

function ElectricityStep({ form, onChange }) {
  return (
    <FormCard icon={Zap} title="Electricity Connection Details">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Consumer Number"
          name="consumerNumber"
          value={form.consumerNumber}
          onChange={onChange}
          placeholder="Enter your consumer number"
        />
        <Field
          label="Sub Division"
          name="subDivision"
          value={form.subDivision}
          onChange={onChange}
          placeholder="Enter sub division"
        />
        <Field
          label="Tariff"
          name="tariff"
          value={form.tariff}
          onChange={onChange}
          placeholder="Enter tariff category"
        />
        <FileUpload
          label="Latest Electricity Bill"
          name="electricityBill"
        />
      </div>
    </FormCard>
  );
}

/* ── Step 9: Bank ────────────────────────────────────── */

function BankStep({ form, onChange }) {
  return (
    <FormCard icon={Landmark} title="Bank Details">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Bank Name"
          name="bankName"
          value={form.bankName}
          onChange={onChange}
          placeholder="Enter your bank name"
        />
        <Field
          label="Account Number"
          name="accountNumber"
          value={form.accountNumber}
          onChange={onChange}
          placeholder="Enter account number"
        />
        <Field
          label="IFSC Code"
          name="ifscCode"
          value={form.ifscCode}
          onChange={onChange}
          placeholder="e.g. SBIN0001234"
        />
        <FileUpload
          label="Cancelled Cheque / Passbook"
          name="chequePassbook"
        />
      </div>
    </FormCard>
  );
}

/* ── Step 10: Income ─────────────────────────────────── */

function IncomeStep({ form, onChange }) {
  return (
    <FormCard icon={Landmark} title="Source of Income">
      <p className="mb-4 text-sm text-muted">
        Required for subsidy eligibility verification.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {INCOME_SOURCES.map((src) => (
          <RadioOption
            key={src}
            name="incomeSource"
            value={src}
            label={src}
            checked={form.incomeSource === src}
            onChange={onChange}
          />
        ))}
      </div>
    </FormCard>
  );
}

/* ── Step 11: Site Photo ─────────────────────────────── */

function SitePhotoStep() {
  return (
    <FormCard icon={Camera} title="Site Documentation">
      <p className="mb-4 text-sm text-muted">
        Please upload a GPS-tagged photo of your rooftop. This is used to
        verify installation site feasibility.
      </p>
      <div className="grid grid-cols-1 gap-4">
        <FileUpload label="GPS Photo (Rooftop)" name="sitePhoto" />
      </div>
    </FormCard>
  );
}

/* ── Step 12: Other Documents ────────────────────────── */

function OtherDocsStep() {
  return (
    <FormCard icon={Upload} title="Other Supporting Documents">
      <p className="mb-4 text-sm text-muted">
        Additional documents beyond the standard identity and address
        proofs can be shared with our team after submission via WhatsApp
        or email. You can skip this step for now.
      </p>
      <div className="rounded-lg bg-amber-soft p-4 text-xs text-navy">
        <p className="font-semibold">Need to share extra documents?</p>
        <p className="mt-1">
          Email them to{" "}
          <a
            href="mailto:support@themanyata.com"
            className="font-bold underline"
          >
            support@themanyata.com
          </a>{" "}
          or WhatsApp us at 8114721300 after submitting your application.
          Please mention your application number.
        </p>
      </div>
    </FormCard>
  );
}

/* ── Step 13: Remarks ────────────────────────────────── */

function RemarksStep({ form, onChange }) {
  return (
    <FormCard icon={FileText} title="Additional Notes">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-navy/70">
          Remarks (optional)
        </span>
        <textarea
          name="remarks"
          value={form.remarks}
          onChange={onChange}
          placeholder="Any additional information you'd like to share…"
          rows={5}
          className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm text-navy placeholder:text-muted focus:border-amber focus:outline-none"
        />
      </label>
    </FormCard>
  );
}

/* ── Step 14: Preview ────────────────────────────────── */

function PreviewStep({ form, location, onEdit }) {
  const sections = [
    {
      step: 2,
      title: "System Type",
      rows: [["System Type", form.systemType]],
    },
    {
      step: 3,
      title: "System Size",
      rows: [["System Size", form.systemSize]],
    },
    {
      step: 4,
      title: "Vendor",
      rows: [
        ["Sub Vendor", form.subVendorName],
        ["Sales Executive", form.salesExecutiveName],
      ],
    },
    {
      step: 5,
      title: "Personal",
      rows: [
        ["Full Name", form.fullName],
        ["Phone", form.phoneNumber],
        ["Gender", form.gender],
        ["DOB", form.dob],
        ["Email", form.email],
      ],
    },
    {
      step: 6,
      title: "Address",
      rows: [
        ["State", form.state],
        ["District", form.district],
        ["Block", form.block],
        ["Gram Panchayat", form.gramPanchayat],
        ["Municipality", form.municipality],
        ["Ward", form.wardNumber],
        ["Building / Plot", form.buildingPlot],
        ["Village", form.villageName],
        ["Street", form.streetLocality],
        ["City", form.city],
        ["Post Office", form.postOffice],
        ["PIN", form.pinCode],
        ["Landmark", form.landmark],
      ],
    },
    {
      step: 8,
      title: "Electricity",
      rows: [
        ["Consumer Number", form.consumerNumber],
        ["Sub Division", form.subDivision],
        ["Tariff", form.tariff],
      ],
    },
    {
      step: 9,
      title: "Bank",
      rows: [
        ["Bank Name", form.bankName],
        ["Account Number", form.accountNumber],
        ["IFSC", form.ifscCode],
      ],
    },
    {
      step: 10,
      title: "Income",
      rows: [["Income Source", form.incomeSource]],
    },
    {
      step: 13,
      title: "Remarks",
      rows: [["Remarks", form.remarks]],
    },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-amber/30 bg-amber-soft p-5">
        <div className="flex items-start gap-3">
          <Eye size={20} className="mt-0.5 shrink-0 text-amber" />
          <div>
            <h3 className="text-sm font-bold text-navy">
              Review your application
            </h3>
            <p className="mt-1 text-xs text-navy/70">
              Please review the information below. You can go back to any
              step to make changes before submitting.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-navy/10 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy">Application Location</h3>
          <button
            type="button"
            onClick={() => onEdit(1)}
            className="text-xs font-bold text-amber hover:underline"
          >
            Edit
          </button>
        </div>
        <p className="mt-2 text-sm text-navy">
          {location === "odisha" ? "Odisha" : "Kolkata / West Bengal"}
        </p>
      </div>

      {sections.map((section) => {
        const rows = section.rows.filter(
          ([, v]) => v !== undefined && v !== null && String(v).trim() !== ""
        );
        if (rows.length === 0) return null;
        return (
          <div
            key={section.title}
            className="rounded-2xl border border-navy/10 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy">{section.title}</h3>
              <button
                type="button"
                onClick={() => onEdit(section.step)}
                className="text-xs font-bold text-amber hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-muted">{label}</p>
                  <p className="mt-0.5 text-sm font-medium text-navy">
                    {String(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="rounded-2xl border border-navy/10 bg-white p-5">
        <h3 className="text-sm font-bold text-navy">Uploaded Documents</h3>
        <p className="mt-2 text-xs text-muted">
          Files you selected in earlier steps will be uploaded when you submit.
          If you missed any file, use the step chips above to go back.
        </p>
      </div>
    </div>
  );
}

/* ── Step 15: Submit ─────────────────────────────────── */

function SubmitStep({ submitting, submitError, onSubmit }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-amber/30 bg-amber-soft p-5">
        <div className="flex items-start gap-3">
          <Send size={20} className="mt-0.5 shrink-0 text-amber" />
          <div>
            <h3 className="text-sm font-bold text-navy">
              Ready to submit
            </h3>
            <p className="mt-1 text-xs text-navy/70">
              Click the button below to submit your application. You'll
              receive an application number to track progress.
            </p>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{submitError}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-amber px-7 py-4 text-sm font-bold text-navy transition-colors hover:bg-amber-hover disabled:cursor-not-allowed disabled:opacity-60"
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
      </button>
    </div>
  );
}

/* ── Success Screen ──────────────────────────────────── */

function SubmitSuccess({ applicationNo, applicationId, onTrack, onNew }) {
  return (
    <section className="flex min-h-[80vh] items-center justify-center bg-offwhite px-5 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-xl rounded-3xl border border-navy/10 bg-white p-8 text-center sm:p-12"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 size={32} />
        </div>

        <h1 className="mt-6 text-2xl font-extrabold text-navy sm:text-3xl">
          Application Submitted
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-muted">
          Thank you! Your application has been received. Our team will review
          it shortly.
        </p>

        <div className="mt-6 rounded-2xl bg-amber-soft p-5">
          <p className="text-xs font-semibold text-muted">
            Your Application Number
          </p>
          <p className="mt-1 font-mono text-xl font-extrabold text-navy">
            {applicationNo}
          </p>
          <p className="mt-2 text-xs text-navy/70">
            Please save this number. You'll need it (along with your phone
            number) to track your application.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => downloadApplicationPdf(applicationId)}
            className="flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-bold text-white hover:bg-navy-light"
          >
            <Download size={16} />
            Download PDF
          </button>
          <button
            onClick={onTrack}
            className="flex items-center justify-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-bold text-navy hover:bg-amber-hover"
          >
            Track Application
          </button>
        </div>

        <button
          onClick={onNew}
          className="mt-4 text-xs font-semibold text-muted hover:text-navy"
        >
          Submit another application
        </button>
      </motion.div>
    </section>
  );
}

/* ── Resume Prompt ───────────────────────────────────── */

function ResumePrompt({ onResume, onStartFresh }) {
  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-offwhite px-5 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-2xl border border-navy/10 bg-white p-8 text-center"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-soft text-amber">
          <Save size={22} />
        </div>
        <h1 className="mt-4 text-lg font-bold text-navy">
          Resume your application?
        </h1>
        <p className="mt-2 text-sm text-muted">
          We found a saved draft on this device. Would you like to continue
          where you left off, or start a fresh application?
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-bold text-navy hover:bg-amber-hover"
          >
            <RotateCcw size={16} />
            Resume Draft
          </button>
          <button
            onClick={onStartFresh}
            className="flex items-center justify-center gap-2 rounded-full border border-navy/20 px-6 py-3 text-sm font-bold text-navy hover:bg-navy/5"
          >
            <Trash2 size={16} />
            Start Fresh
          </button>
        </div>
      </motion.div>
    </section>
  );
}

/* ── Shared subcomponents ────────────────────────────── */

function LocationCard({
  icon: Icon,
  title,
  subtitle,
  description,
  buttonText,
  onClick,
}) {
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
      <h3 className="mt-5 text-xl font-extrabold text-navy sm:text-2xl">
        {title}
      </h3>
      <p className="mt-1 text-sm font-semibold text-amber">{subtitle}</p>
      <p className="mt-3 min-h-[48px] text-sm leading-6 text-muted">
        {description}
      </p>
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

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  readOnly = false,
}) {
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

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  required = false,
}) {
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

function RadioOption({ name, value, label, checked, onChange }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
        checked
          ? "border-amber bg-amber-soft text-navy"
          : "border-navy/15 text-navy/80 hover:border-amber/50"
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

function FileUpload({ label, name, required = false }) {
  const [filename, setFilename] = useState("");

  const handleChange = (e) => {
    const f = e.target.files?.[0];
    setFilename(f ? f.name : "");
  };

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-navy/70">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <div className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-navy/25 px-3.5 py-4 text-center text-xs text-muted transition-colors hover:border-amber hover:text-navy">
        <Upload size={16} />
        <span>{filename ? filename : "Click to upload a file"}</span>
        <input
          type="file"
          name={name}
          required={required}
          onChange={handleChange}
          className="sr-only"
        />
      </div>
    </label>
  );
}