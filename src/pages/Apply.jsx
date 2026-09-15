// import { useState } from "react";
// import { motion } from "framer-motion";
// import {
//   SunMedium,
//   User,
//   MapPin,
//   FileText,
//   Zap,
//   Landmark,
//   Camera,
//   Upload,
//   Send,
// } from "lucide-react";

// const SYSTEM_TYPES = [
//   { value: "on-grid", label: "On-Grid System" },
//   { value: "hybrid", label: "Hybrid System" },
// ];

// // Extra addition requested: capacity choice, matching our subsidy tiers
// const SYSTEM_SIZES = [
//   { value: "1kw", label: "1 kW" },
//   { value: "2kw", label: "2 kW" },
//   { value: "3kw", label: "3 kW" },
// ];

// const initialState = {
//   systemType: "",
//   systemSize: "",
//   fullName: "",
//   phoneNumber: "",
//   gender: "",
//   dob: "",
//   email: "",
//   state: "",
//   district: "",
//   block: "",
//   gramPanchayat: "",
//   buildingPlot: "",
//   villageName: "",
//   city: "",
//   postOffice: "",
//   pinCode: "",
//   landmark: "",
//   consumerNumber: "",
//   subDivision: "",
//   tariff: "",
//   bankName: "",
//   accountNumber: "",
//   ifscCode: "",
// };

// export default function Apply() {
//   const [form, setForm] = useState(initialState);

//   const handleChange = (e) => {
//     setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     // TODO: wire this up to your backend / email service to actually
//     // receive applications. For now this just confirms the click works.
//     console.log("Application submitted:", form);
//     alert("Thanks! Your application has been received. We'll call you shortly.");
//   };

//   return (
//     <>
//       {/* Page banner */}
//       <section className="bg-navy py-14 text-white lg:py-16">
//         <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.4 }}
//           >
//             <span className="text-sm font-semibold text-amber">Get Started</span>
//             <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
//               Apply for Rooftop Solar
//             </h1>
//             <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
//               Fill in your details and our team will reach out to confirm
//               your eligibility and next steps.
//             </p>
//           </motion.div>
//         </div>
//       </section>

//       <section className="bg-offwhite py-14 lg:py-20">
//         <form
//           onSubmit={handleSubmit}
//           className="mx-auto flex max-w-[800px] flex-col gap-6 px-5 lg:px-8"
//         >
//           {/* System type */}
//           <FormCard icon={SunMedium} title="Choose Your Solar System">
//             <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
//               {SYSTEM_TYPES.map((opt) => (
//                 <RadioOption
//                   key={opt.value}
//                   name="systemType"
//                   value={opt.value}
//                   label={opt.label}
//                   checked={form.systemType === opt.value}
//                   onChange={handleChange}
//                 />
//               ))}
//             </div>
//           </FormCard>

//           {/* System size — new addition */}
//           <FormCard icon={Zap} title="Choose Your System Size">
//             <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
//               {SYSTEM_SIZES.map((opt) => (
//                 <RadioOption
//                   key={opt.value}
//                   name="systemSize"
//                   value={opt.value}
//                   label={opt.label}
//                   checked={form.systemSize === opt.value}
//                   onChange={handleChange}
//                 />
//               ))}
//             </div>
//           </FormCard>

//           {/* Personal details */}
//           <FormCard icon={User} title="Personal Details">
//             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//               <Field label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter your full name" />
//               <Field label="Phone Number" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="Enter your phone number" type="tel" />
//               <SelectField label="Gender" name="gender" value={form.gender} onChange={handleChange} options={["Male", "Female", "Other"]} placeholder="Select your gender" />
//               <Field label="Date of Birth" name="dob" value={form.dob} onChange={handleChange} type="date" />
//               <div className="sm:col-span-2">
//                 <Field label="Email Address" name="email" value={form.email} onChange={handleChange} placeholder="Enter your email address" type="email" />
//               </div>
//             </div>
//           </FormCard>

//           {/* Address details */}
//           <FormCard icon={MapPin} title="Address Details">
//             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//               <SelectField label="State" name="state" value={form.state} onChange={handleChange} options={["Odisha"]} placeholder="Select your state" />
//               <Field label="District" name="district" value={form.district} onChange={handleChange} placeholder="Enter your district" />
//               <Field label="Block" name="block" value={form.block} onChange={handleChange} placeholder="Enter your block" />
//               <Field label="Gram Panchayat Name" name="gramPanchayat" value={form.gramPanchayat} onChange={handleChange} placeholder="Enter your Gram Panchayat" />
//               <Field label="Building Name / Plot No." name="buildingPlot" value={form.buildingPlot} onChange={handleChange} placeholder="Enter your building name / plot no." />
//               <Field label="Village Name" name="villageName" value={form.villageName} onChange={handleChange} placeholder="Enter your village name" />
//               <Field label="City" name="city" value={form.city} onChange={handleChange} placeholder="Enter your city" />
//               <Field label="Post Office Name" name="postOffice" value={form.postOffice} onChange={handleChange} placeholder="Enter your post office name" />
//               <Field label="Pin Code" name="pinCode" value={form.pinCode} onChange={handleChange} placeholder="Enter your pin code" />
//               <Field label="Landmark" name="landmark" value={form.landmark} onChange={handleChange} placeholder="Enter your landmark" />
//             </div>
//           </FormCard>

//           {/* Identity documents */}
//           <FormCard icon={FileText} title="Identity Documents">
//             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//               <FileUpload label="Aadhaar Card (Front & Back)" name="aadhaarFront" />
//               <FileUpload label="PAN Card" name="panCard" />
//               <FileUpload label="Photo" name="photo" />
//               <FileUpload label="Signature" name="signature" />
//             </div>
//           </FormCard>

//           {/* Electricity connection details */}
//           <FormCard icon={Zap} title="Electricity Connection Details">
//             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//               <Field label="Consumer Number" name="consumerNumber" value={form.consumerNumber} onChange={handleChange} placeholder="Enter your consumer number" />
//               <Field label="Sub Division" name="subDivision" value={form.subDivision} onChange={handleChange} placeholder="Enter your sub division" />
//               <Field label="Tariff" name="tariff" value={form.tariff} onChange={handleChange} placeholder="Enter your tariff" />
//               <FileUpload label="Latest Electricity Bill" name="electricityBill" />
//             </div>
//           </FormCard>

//           {/* Bank details */}
//           <FormCard icon={Landmark} title="Bank Details">
//             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//               <Field label="Bank Name" name="bankName" value={form.bankName} onChange={handleChange} placeholder="Enter your bank name" />
//               <Field label="Bank Account Number" name="accountNumber" value={form.accountNumber} onChange={handleChange} placeholder="Enter your bank account number" />
//               <Field label="Bank IFSC Code" name="ifscCode" value={form.ifscCode} onChange={handleChange} placeholder="Enter your bank IFSC code" />
//               <FileUpload label="Cancelled Cheque / Passbook Front Page" name="chequePassbook" />
//             </div>
//           </FormCard>

//           {/* Site documentation */}
//           <FormCard icon={Camera} title="Site Documentation">
//             <FileUpload label="Site Photo (Rooftop)" name="sitePhoto" />
//           </FormCard>

//           <motion.button
//             type="submit"
//             whileTap={{ scale: 0.98 }}
//             className="mt-2 flex items-center justify-center gap-2 rounded-full bg-amber px-7 py-3.5 text-sm font-bold text-navy transition-colors hover:bg-amber-hover"
//           >
//             <Send size={16} strokeWidth={2.5} />
//             Submit Application
//           </motion.button>
//         </form>
//       </section>
//     </>
//   );
// }

// /* ---- small internal form pieces (kept in this file, not shared) ---- */

// function FormCard({ icon: Icon, title, children }) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 16 }}
//       whileInView={{ opacity: 1, y: 0 }}
//       viewport={{ once: true, amount: 0.2 }}
//       transition={{ duration: 0.35 }}
//       className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-6"
//     >
//       <div className="mb-5 flex items-center gap-2.5">
//         <Icon size={18} className="text-amber" />
//         <h2 className="text-sm font-bold text-navy">{title}</h2>
//       </div>
//       {children}
//     </motion.div>
//   );
// }

// function Field({ label, name, value, onChange, placeholder, type = "text" }) {
//   return (
//     <label className="block">
//       <span className="mb-1.5 block text-xs font-semibold text-navy/70">{label}</span>
//       <input
//         type={type}
//         name={name}
//         value={value}
//         onChange={onChange}
//         placeholder={placeholder}
//         className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm text-navy placeholder:text-muted focus:border-amber focus:outline-none"
//       />
//     </label>
//   );
// }

// function SelectField({ label, name, value, onChange, options, placeholder }) {
//   return (
//     <label className="block">
//       <span className="mb-1.5 block text-xs font-semibold text-navy/70">{label}</span>
//       <select
//         name={name}
//         value={value}
//         onChange={onChange}
//         className="w-full rounded-lg border border-navy/15 bg-white px-3.5 py-2.5 text-sm text-navy focus:border-amber focus:outline-none"
//       >
//         <option value="">{placeholder}</option>
//         {options.map((opt) => (
//           <option key={opt} value={opt}>
//             {opt}
//           </option>
//         ))}
//       </select>
//     </label>
//   );
// }

// function RadioOption({ name, value, label, checked, onChange }) {
//   return (
//     <label
//       className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
//         checked ? "border-amber bg-amber-soft text-navy" : "border-navy/15 text-navy/80"
//       }`}
//     >
//       <input
//         type="radio"
//         name={name}
//         value={value}
//         checked={checked}
//         onChange={onChange}
//         className="accent-amber"
//       />
//       {label}
//     </label>
//   );
// }

// function FileUpload({ label, name }) {
//   return (
//     <label className="block">
//       <span className="mb-1.5 block text-xs font-semibold text-navy/70">{label}</span>
//       <div className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-navy/25 px-3.5 py-4 text-xs text-muted transition-colors hover:border-amber hover:text-navy">
//         <Upload size={16} />
//         Click to upload a file
//         <input type="file" name={name} className="hidden" />
//       </div>
//     </label>
//   );
// }









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
  ArrowLeft,
  Map,
  CheckCircle2,
} from "lucide-react";

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

/* =========================================================
   SOLAR SYSTEM TYPES
========================================================= */

const SYSTEM_TYPES = [
  { value: "on-grid", label: "On-Grid System" },
  { value: "hybrid", label: "Hybrid System" },
];

/* =========================================================
   SYSTEM SIZES
========================================================= */

const SYSTEM_SIZES = [
  { value: "1kw", label: "1 kW" },
  { value: "2kw", label: "2 kW" },
  { value: "3kw", label: "3 kW" },
];

/* =========================================================
   INITIAL FORM
========================================================= */

const initialState = {
  systemType: "",
  systemSize: "",

  // Personal Details
  fullName: "",
  phoneNumber: "",
  gender: "",
  dob: "",
  email: "",

  // Location
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

  // Odisha specific
  subVendorName: "",
 
  // Kolkata / West Bengal specific
  subVendorName: "",


  // Kolkata / West Bengal specific
  municipality: "",
  wardNumber: "",
  streetLocality: "",

  // Electricity
  consumerNumber: "",
  subDivision: "",
  tariff: "",

  // Bank
  bankName: "",
  accountNumber: "",
  ifscCode: "",
};

/* =========================================================
   MAIN APPLY COMPONENT
========================================================= */

export default function Apply() {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [form, setForm] = useState(initialState);

  /* -------------------------------------------------------
     HANDLE INPUT CHANGE
  ------------------------------------------------------- */

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* -------------------------------------------------------
     SELECT LOCATION
  ------------------------------------------------------- */

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);

    setForm((prev) => ({
      ...prev,
      state: location === "odisha" ? "Odisha" : "West Bengal",
    }));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* -------------------------------------------------------
     CHANGE LOCATION
  ------------------------------------------------------- */

  const handleChangeLocation = () => {
    setSelectedLocation("");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* -------------------------------------------------------
     SUBMIT
  ------------------------------------------------------- */

  const handleSubmit = (e) => {
    e.preventDefault();

    const applicationData = {
      location: selectedLocation,
      ...form,
    };

    console.log("Application submitted:", applicationData);

    alert(
      `Thank you! Your ${
        selectedLocation === "odisha" ? "Odisha" : "Kolkata"
      } solar application has been received. Our team will contact you shortly.`
    );
  };

  /* =========================================================
     LOCATION SELECTION SCREEN
  ========================================================= */

  if (!selectedLocation) {
    return (
      <>
        {/* PAGE BANNER */}
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
                Select your location to continue with your solar application.
              </p>
            </motion.div>
          </div>
        </section>

        {/* LOCATION SECTION */}
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
              {/* =================================================
                  ODISHA CARD
              ================================================= */}

              <LocationCard
                icon={MapPin}
                title="Odisha"
                subtitle="For customers from Odisha"
                description="Apply for rooftop solar installation and subsidy services in Odisha."
                buttonText="Apply from Odisha"
                onClick={() => handleLocationSelect("odisha")}
              />

              {/* =================================================
                  KOLKATA CARD
              ================================================= */}

              <LocationCard
                icon={Map}
                title="Kolkata"
                subtitle="For customers from Kolkata / West Bengal"
                description="Apply for rooftop solar installation services in Kolkata and West Bengal."
                buttonText="Apply from Kolkata"
                onClick={() => handleLocationSelect("kolkata")}
              />
            </div>

            {/* INFO */}
            <div className="mt-8 flex items-start gap-3 rounded-xl border border-navy/10 bg-white p-4">
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0 text-amber"
              />

              <p className="text-xs leading-5 text-navy/65 sm:text-sm">
                Please select the location where your solar installation will
                take place. This helps us collect the correct address and
                electricity connection details.
              </p>
            </div>
          </div>
        </section>
      </>
    );
  }

  /* =========================================================
     APPLICATION FORM
  ========================================================= */

  return (
    <>
      {/* =====================================================
          PAGE BANNER
      ===================================================== */}

      <section className="bg-navy py-10 text-white sm:py-14 lg:py-16">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* CHANGE LOCATION */}
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
                    ? "Odisha Application"
                    : "Kolkata Application"}
                </span>

                <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl lg:text-4xl">
                  Apply for Rooftop Solar
                </h1>
              </div>
            </div>

            <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
              Fill in your details and our team will reach out to confirm your
              eligibility and next steps.
            </p>
          </motion.div>
        </div>
      </section>

      {/* =====================================================
          FORM
      ===================================================== */}

      <section className="bg-offwhite py-10 sm:py-14 lg:py-20">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-[800px] flex-col gap-5 px-4 sm:gap-6 sm:px-5 lg:px-8"
        >
          {/* =================================================
              APPLICATION LOCATION
          ================================================= */}

          <FormCard icon={MapPin} title="Application Location">
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

          {/* =================================================
              SYSTEM TYPE
          ================================================= */}

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

          {/* =================================================
              SYSTEM SIZE
          ================================================= */}

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

          {/* =================================================
              PERSONAL DETAILS
          ================================================= */}

          <FormCard icon={User} title="Personal Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Full Name"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />

              <Field
                label="Phone Number"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                placeholder="Enter your phone number"
                type="tel"
                required
              />

              <SelectField
                label="Gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                options={["Male", "Female", "Other"]}
                placeholder="Select your gender"
              />

              <Field
                label="Date of Birth"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                type="date"
              />

              <div className="sm:col-span-2">
                <Field
                  label="Email Address"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  type="email"
                />
              </div>
            </div>
          </FormCard>

          {/* =================================================
              ODISHA ADDRESS
          ================================================= */}

          {selectedLocation === "odisha" && (
            <FormCard icon={MapPin} title="Odisha Address Details">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="State"
                  name="state"
                  value="Odisha"
                  onChange={handleChange}
                  placeholder="Odisha"
                  readOnly
                />

                <Field
                  label="District"
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  placeholder="Enter your district"
                  required
                />

{/* SUB VENDOR DROPDOWN */}
      <SelectField
        label="SUB_VENDOR_NAME"
        name="subVendorName"
        value={form.subVendorName}
        onChange={handleChange}
        options={ODISHA_SUB_VENDORS}
        placeholder="Choose"
        required
      />

                <Field
                  label="Block"
                  name="block"
                  value={form.block}
                  onChange={handleChange}
                  placeholder="Enter your block"
                />

                <Field
                  label="Gram Panchayat Name"
                  name="gramPanchayat"
                  value={form.gramPanchayat}
                  onChange={handleChange}
                  placeholder="Enter your Gram Panchayat"
                />

                <Field
                  label="Building Name / Plot No."
                  name="buildingPlot"
                  value={form.buildingPlot}
                  onChange={handleChange}
                  placeholder="Enter building name / plot no."
                />

                <Field
                  label="Village Name"
                  name="villageName"
                  value={form.villageName}
                  onChange={handleChange}
                  placeholder="Enter your village name"
                />

                <Field
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Enter your city"
                />

                <Field
                  label="Post Office Name"
                  name="postOffice"
                  value={form.postOffice}
                  onChange={handleChange}
                  placeholder="Enter your post office name"
                />

                <Field
                  label="Pin Code"
                  name="pinCode"
                  value={form.pinCode}
                  onChange={handleChange}
                  placeholder="Enter your pin code"
                  type="number"
                  required
                />

                <Field
                  label="Landmark"
                  name="landmark"
                  value={form.landmark}
                  onChange={handleChange}
                  placeholder="Enter your landmark"
                />
              </div>
            </FormCard>
          )}

          {/* =================================================
              KOLKATA ADDRESS
          ================================================= */}

          {selectedLocation === "kolkata" && (
            <FormCard icon={Map} title="Kolkata Address Details">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="State"
                  name="state"
                  value="West Bengal"
                  onChange={handleChange}
                  placeholder="West Bengal"
                  readOnly
                />

                <Field
                  label="District"
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  placeholder="Enter your district"
                  required
                />

{/* SUB VENDOR DROPDOWN */}
      <SelectField
        label="SUB_VENDOR_NAME"
        name="subVendorName"
        value={form.subVendorName}
        onChange={handleChange}
        options={KOLKATA_SUB_VENDORS}
        placeholder="Choose"
        required
      />

                <Field
                  label="Municipality / Corporation"
                  name="municipality"
                  value={form.municipality}
                  onChange={handleChange}
                  placeholder="Enter municipality / corporation"
                />

                <Field
                  label="Ward Number"
                  name="wardNumber"
                  value={form.wardNumber}
                  onChange={handleChange}
                  placeholder="Enter ward number"
                />

                <Field
                  label="Building / House No."
                  name="buildingPlot"
                  value={form.buildingPlot}
                  onChange={handleChange}
                  placeholder="Enter building / house number"
                  required
                />

                <Field
                  label="Street / Locality"
                  name="streetLocality"
                  value={form.streetLocality}
                  onChange={handleChange}
                  placeholder="Enter street / locality"
                />

                <Field
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Kolkata"
                  required
                />

                <Field
                  label="Post Office Name"
                  name="postOffice"
                  value={form.postOffice}
                  onChange={handleChange}
                  placeholder="Enter your post office name"
                />

                <Field
                  label="Pin Code"
                  name="pinCode"
                  value={form.pinCode}
                  onChange={handleChange}
                  placeholder="Enter your pin code"
                  type="number"
                  required
                />

                <Field
                  label="Landmark"
                  name="landmark"
                  value={form.landmark}
                  onChange={handleChange}
                  placeholder="Enter your landmark"
                />
              </div>
            </FormCard>
          )}

          {/* =================================================
              IDENTITY DOCUMENTS
          ================================================= */}

          <FormCard icon={FileText} title="Identity Documents">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FileUpload
                label="Aadhaar Card (Front & Back)"
                name="aadhaarFront"
              />

              <FileUpload label="PAN Card" name="panCard" />

              <FileUpload label="Photo" name="photo" />

              <FileUpload label="Signature" name="signature" />
            </div>
          </FormCard>

          {/* =================================================
              ELECTRICITY CONNECTION
          ================================================= */}

          <FormCard
            icon={Zap}
            title="Electricity Connection Details"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Consumer Number"
                name="consumerNumber"
                value={form.consumerNumber}
                onChange={handleChange}
                placeholder="Enter your consumer number"
                required
              />

              <Field
                label="Sub Division"
                name="subDivision"
                value={form.subDivision}
                onChange={handleChange}
                placeholder="Enter your sub division"
              />

              <Field
                label="Tariff"
                name="tariff"
                value={form.tariff}
                onChange={handleChange}
                placeholder="Enter your tariff"
              />

              <FileUpload
                label="Latest Electricity Bill"
                name="electricityBill"
              />
            </div>
          </FormCard>

          {/* =================================================
              BANK DETAILS
          ================================================= */}

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
                label="Bank Account Number"
                name="accountNumber"
                value={form.accountNumber}
                onChange={handleChange}
                placeholder="Enter your bank account number"
              />

              <Field
                label="Bank IFSC Code"
                name="ifscCode"
                value={form.ifscCode}
                onChange={handleChange}
                placeholder="Enter your bank IFSC code"
              />

              <FileUpload
                label="Cancelled Cheque / Passbook Front Page"
                name="chequePassbook"
              />
            </div>
          </FormCard>

          {/* =================================================
              SITE DOCUMENTATION
          ================================================= */}

          <FormCard icon={Camera} title="Site Documentation">
            <FileUpload
              label="Site Photo (Rooftop)"
              name="sitePhoto"
            />
          </FormCard>

          {/* =================================================
              SUBMIT BUTTON
          ================================================= */}

          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-amber px-7 py-3.5 text-sm font-bold text-navy transition-colors hover:bg-amber-hover sm:w-auto sm:self-end"
          >
            <Send size={16} strokeWidth={2.5} />
            Submit{" "}
            {selectedLocation === "odisha" ? "Odisha" : "Kolkata"}{" "}
            Application
          </motion.button>
        </form>
      </section>
    </>
  );
}

/* =========================================================
   LOCATION CARD
========================================================= */

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
      {/* ICON */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-soft text-amber">
        <Icon size={26} />
      </div>

      {/* TITLE */}
      <h3 className="mt-5 text-xl font-extrabold text-navy sm:text-2xl">
        {title}
      </h3>

      <p className="mt-1 text-sm font-semibold text-amber">
        {subtitle}
      </p>

      {/* DESCRIPTION */}
      <p className="mt-3 min-h-[48px] text-sm leading-6 text-muted">
        {description}
      </p>

      {/* BUTTON */}
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

        <h2 className="text-sm font-bold text-navy sm:text-base">
          {title}
        </h2>
      </div>

      {children}
    </motion.div>
  );
}

/* =========================================================
   INPUT FIELD
========================================================= */

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

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
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

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
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
// function SelectField({
//   label,
//   name,
//   value,
//   onChange,
//   options,
//   placeholder,
// }) {
//   return (
//     <label className="block">
//       <span className="mb-1.5 block text-xs font-semibold text-navy/70">
//         {label}
//       </span>

//       <select
//         name={name}
//         value={value}
//         onChange={onChange}
//         className="w-full rounded-lg border border-navy/15 bg-white px-3.5 py-2.5 text-sm text-navy focus:border-amber focus:outline-none"
//       >
//         <option value="">{placeholder}</option>

//         {options.map((opt) => (
//           <option key={opt} value={opt}>
//             {opt}
//           </option>
//         ))}
//       </select>
//     </label>
//   );
// }

/* =========================================================
   RADIO OPTION
========================================================= */

function RadioOption({
  name,
  value,
  label,
  checked,
  onChange,
}) {
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

/* =========================================================
   FILE UPLOAD
========================================================= */

function FileUpload({ label, name }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-navy/70">
        {label}
      </span>

      <div className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-navy/25 px-3.5 py-4 text-center text-xs text-muted transition-colors hover:border-amber hover:text-navy">
        <Upload size={16} />

        <span>Click to upload a file</span>

        <input
          type="file"
          name={name}
          className="hidden"
        />
      </div>
    </label>
  );
}

