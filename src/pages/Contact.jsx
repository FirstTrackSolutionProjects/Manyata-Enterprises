// import { useState } from "react";
// import { motion } from "framer-motion";
// // Add these imports here:
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import sendContactUs from "../services/contact/send_contact_us.contact.service";
// import {
//   Phone,
//   Mail,
//   MapPin,
//   Clock,
//   Send,
//   CheckCircle2,
// } from "lucide-react";



// export default function Contact() {
//     const INITIAL_CONTACT_FORM_STATE = Object.freeze({
//       name: "",
//       phone: "",
//       email: "",
//       city: "",
//       message: "",

      
//     })
//     const [form, setForm] = useState(INITIAL_CONTACT_FORM_STATE);
//     const [submitted, setSubmitted] = useState(false);
//     const [focused, setFocused] = useState("");
    
//     // 1. Uncomment the loading state
//     const [loading, setLoading] = useState(false);
   
//     const handleChange = (e) =>
//       setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  
//     const handleSubmit = async (e) => {
//       e.preventDefault(); // Prevent default form submission behavior
//       try {
//         setLoading(true);
        
//         // 2. Use 'form' instead of 'formData', as that is your active state variable
//         // Note: Ensure `sendContactUs` is imported at the top of your file!
//         await sendContactUs(form); //send actual form data to backend
        
//         // 3. Trigger your success UI by setting submitted to true 
//         // (This replaces the commented out setFormData logic)
//         setSubmitted(true); 
        
//         // Note: Ensure `toast` is imported (e.g., from 'react-hot-toast' or 'react-toastify')
//         toast.success("Message sent successfully");
//       } catch (error) {
//         console.error(error.message || "Something Went Wrong");
//         toast.error(error.message || "Failed to send message")
//       } finally {
//         setLoading(false); //finally block ensures loading is reset regardless of success or failure(alwaye executed with try and catch block)
//       }
//     }
//   return (
//     <main className="bg-offwhite">
//       <ContactHero />
//       <ContactBody />
//     </main>
//   );
// }

// /* ---------- Hero ---------- */

// function ContactHero() {
//   return (
//     <section className="relative bg-navy text-offwhite overflow-hidden">
//       <div className="absolute inset-0 opacity-[0.06] pointer-events-none [background-image:linear-gradient(#F5A524_1px,transparent_1px),linear-gradient(90deg,#F5A524_1px,transparent_1px)] [background-size:40px_40px]" />
//       <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
//         <motion.p
//           initial={{ opacity: 0, y: 16 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true }}
//           transition={{ duration: 0.5 }}
//           className="text-amber text-sm sm:text-base font-medium tracking-wide"
//         >
//           Get in touch
//         </motion.p>
//         <motion.h1
//           initial={{ opacity: 0, y: 16 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true }}
//           transition={{ duration: 0.5, delay: 0.08 }}
//           className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight max-w-2xl"
//         >
//           Switch to solar. Save every month.
//         </motion.h1>
//         <motion.p
//           initial={{ opacity: 0, y: 16 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true }}
//           transition={{ duration: 0.5, delay: 0.16 }}
//           className="mt-4 text-base sm:text-lg max-w-xl text-[#C7CEDA]"
//         >
//           Tell us about your home and we'll get back with a free site survey
//           and a clear subsidy estimate — usually within a day.
//         </motion.p>
//       </div>
//     </section>
//   );
// }

// /* ---------- Body: info + form ---------- */

// const contactCards = [
//   {
//     icon: Phone,
//     label: "Call us",
//     lines: ["8114721300", "7008581300"],
//     href: "tel:+918114721300",
//   },
//   {
//     icon: Mail,
//     label: "Email us",
//     lines: ["support@themanyata.com"],
//     href: "mailto:support@themanyata.com",
//   },
//   {
//     icon: MapPin,
//     label: "Service area",
//     lines: ["Odisha — residential rooftop solar"],
//     href: null,
//   },
//   {
//     icon: Clock,
//     label: "Response time",
//     lines: ["We usually reply within 24 hours"],
//     href: null,
//   },
// ];


// function ContactBody() {
//   return (
//     <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 lg:py-20">
//       <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
//         {/* info column */}
//         <div className="lg:col-span-2 space-y-4">
//           {contactCards.map((c, i) => (
//             <motion.div
//               key={c.label}
//               initial={{ opacity: 0, y: 18 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.45, delay: i * 0.08 }}
//               className="rounded-xl border border-navy/10 bg-white p-5 flex items-start gap-4 hover:shadow-md transition-shadow"
//             >
//               <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-amber-soft text-amber shrink-0">
//                 <c.icon size={20} strokeWidth={1.75} />
//               </div>
//               <div>
//                 <p className="text-xs font-medium tracking-wide text-muted">
//                   {c.label}
//                 </p>
//                 {c.lines.map((line) =>
//                   c.href ? (
//                     <a
//                       key={line}
//                       href={c.href}
//                       className="block text-sm sm:text-base font-medium text-navy hover:text-amber transition-colors"
//                     >
//                       {line}
//                     </a>
//                   ) : (
//                     <p key={line} className="text-sm sm:text-base font-medium text-navy">
//                       {line}
//                     </p>
//                   )
//                 )}
//               </div>
//             </motion.div>
//           ))}

//           <motion.div
//             initial={{ opacity: 0, y: 18 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.45, delay: 0.32 }}
//             className="rounded-xl bg-navy text-offwhite p-5"
//           >
//             <p className="text-sm text-[#C7CEDA] leading-relaxed">
//               From loan assistance to installation, warranty, and 5-year
//               service — Manyata Enterprises supports you throughout your
//               solar journey.
//             </p>
//           </motion.div>
//         </div>

//         {/* form column */}
//         <motion.div
//           initial={{ opacity: 0, y: 18 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true }}
//           transition={{ duration: 0.5, delay: 0.1 }}
//           className="lg:col-span-3 rounded-2xl border border-navy/10 bg-white p-6 sm:p-8"
//         >
//           <ContactForm />
//         </motion.div>
//       </div>
//     </section>
//   );
// }

// /* ---------- Form ---------- */

// function ContactForm() {
//   const [values, setValues] = useState({
//     name: "",
//     phone: "",
//     email: "",
//     city: "",
//     systemSize: "",
//     message: "",
//   });
//   const [submitted, setSubmitted] = useState(false);
//   const [errors, setErrors] = useState({});

//   function handleChange(e) {
//     const { name, value } = e.target;
//     setValues((v) => ({ ...v, [name]: value }));
//   }

//   function validate() {
//     const next = {};
//     if (!values.name.trim()) next.name = "Please enter your name.";
//     if (!/^[6-9]\d{9}$/.test(values.phone.trim()))
//       next.phone = "Enter a valid 10-digit phone number.";
//     if (values.email && !/^\S+@\S+\.\S+$/.test(values.email))
//       next.email = "Enter a valid email address.";
//     return next;
//   }

//   function handleSubmit(e) {
//     e.preventDefault();
//     const next = validate();
//     setErrors(next);
//     if (Object.keys(next).length === 0) {
//       setSubmitted(true);
//     }
//   }

//   if (submitted) {
//     return (
//       <motion.div
//         initial={{ opacity: 0, y: 10 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.4 }}
//         className="flex flex-col items-center text-center py-10"
//       >
//         <CheckCircle2 className="text-success" size={40} strokeWidth={1.75} />
//         <h3 className="mt-4 text-lg font-semibold text-navy">
//           Thanks, {values.name.split(" ")[0]} — we've got your details.
//         </h3>
//         <p className="mt-2 text-sm text-muted max-w-sm">
//           Our team will call you at {values.phone} to schedule a free site
//           survey.
//         </p>
//       </motion.div>
//     );
//   }

//   return (
//     <form onSubmit={handleSubmit} noValidate className="space-y-5">
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
//         <Field
//           label="Full name"
//           name="name"
//           value={values.name}
//           onChange={handleChange}
//           error={errors.name}
//           placeholder="Your name"
//         />
//         <Field
//           label="Phone number"
//           name="phone"
//           value={values.phone}
//           onChange={handleChange}
//           error={errors.phone}
//           placeholder="98XXXXXXXX"
//           inputMode="numeric"
//         />
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
//         <Field
//           label="Email (optional)"
//           name="email"
//           value={values.email}
//           onChange={handleChange}
//           error={errors.email}
//           placeholder="you@example.com"
//           type="email"
//         />
//         <Field
//           label="City / town"
//           name="city"
//           value={values.city}
//           onChange={handleChange}
//           placeholder="e.g. Bhubaneswar"
//         />
//       </div>

      
//       <div>
//         <label className="block text-sm font-medium text-navy mb-2">
//           Message (optional)
//         </label>
//         <textarea
//           name="message"
//           value={values.message}
//           onChange={handleChange}
//           rows={4}
//           placeholder="Tell us about your rooftop, current bill, or any questions"
//           className="w-full rounded-lg border border-navy/15 px-4 py-3 text-sm text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition-shadow"
//         />
//       </div>
      

//       {/* Submit */}
//                     <button
//                       type="submit"
//                       disabled={loading}
//                       className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-white font-black text-sm tracking-wide py-4 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-[0_4px_24px_rgba(250,204,21,0.3)] hover:shadow-[0_6px_32px_rgba(250,204,21,0.45)] mt-1 group relative overflow-hidden"
//                     >
//                       <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 pointer-events-none" />
//                       <Send size={16} />
//                       {loading ? "Sending..." : "Send Message"}
//                     </button>
//     </form>
//   );
// }

// function Field({ label, name, value, onChange, error, placeholder, type = "text", inputMode }) {
//   return (
//     <div>
//       <label htmlFor={name} className="block text-sm font-medium text-navy mb-2">
//         {label}
//       </label>
//       <input
//         id={name}
//         name={name}
//         type={type}
//         inputMode={inputMode}
//         value={value}
//         onChange={onChange}
//         placeholder={placeholder}
//         className={`w-full rounded-lg border px-4 py-3 text-sm text-navy placeholder:text-muted focus:outline-none focus:ring-2 transition-shadow ${
//           error
//             ? "border-red-400 focus:ring-red-200"
//             : "border-navy/15 focus:ring-amber/50 focus:border-amber"
//         }`}
//       />
//       {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
//     </div>
//   );
// }




import { useState } from "react";
import { motion } from "framer-motion";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import sendContactUs from "../services/contact/send_contact_us.contact.service";

import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function Contact() {
  return (
    <main className="bg-offwhite">
      <ContactHero />
      <ContactBody />
    </main>
  );
}

/* ---------- Hero ---------- */

function ContactHero() {
  return (
    <section className="relative bg-navy text-offwhite overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none [background-image:linear-gradient(#F5A524_1px,transparent_1px),linear-gradient(90deg,#F5A524_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-amber text-sm sm:text-base font-medium tracking-wide"
        >
          Get in touch
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight max-w-2xl"
        >
          Switch to solar. Save every month.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="mt-4 text-base sm:text-lg max-w-xl text-[#C7CEDA]"
        >
          Tell us about your home and we'll get back with a free site survey
          and a clear subsidy estimate — usually within a day.
        </motion.p>
      </div>
    </section>
  );
}

/* ---------- Contact Cards ---------- */

const contactCards = [
  {
    icon: Phone,
    label: "Call us",
    lines: ["8114721300", "7008581300"],
    href: "tel:+918114721300",
  },
  {
    icon: Mail,
    label: "Email us",
    lines: ["support@themanyata.com"],
    href: "mailto:support@themanyata.com",
  },
  {
    icon: MapPin,
    label: "Service area",
    lines: ["Odisha — residential rooftop solar"],
    href: null,
  },
  {
    icon: Clock,
    label: "Response time",
    lines: ["We usually reply within 24 hours"],
    href: null,
  },
];

/* ---------- Body ---------- */

function ContactBody() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14 lg:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">

        {/* Info column */}

        <div className="lg:col-span-2 space-y-4">
          {contactCards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="rounded-xl border border-navy/10 bg-white p-5 flex items-start gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-amber-soft text-amber shrink-0">
                <c.icon size={20} strokeWidth={1.75} />
              </div>

              <div>
                <p className="text-xs font-medium tracking-wide text-muted">
                  {c.label}
                </p>

                {c.lines.map((line) =>
                  c.href ? (
                    <a
                      key={line}
                      href={c.href}
                      className="block text-sm sm:text-base font-medium text-navy hover:text-amber transition-colors"
                    >
                      {line}
                    </a>
                  ) : (
                    <p
                      key={line}
                      className="text-sm sm:text-base font-medium text-navy"
                    >
                      {line}
                    </p>
                  )
                )}
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.32 }}
            className="rounded-xl bg-navy text-offwhite p-5"
          >
            <p className="text-sm text-[#C7CEDA] leading-relaxed">
              From loan assistance to installation, warranty, and 5-year
              service — Manyata Enterprises supports you throughout your
              solar journey.
            </p>
          </motion.div>
        </div>

        {/* Form column */}

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-3 rounded-2xl border border-navy/10 bg-white p-6 sm:p-8"
        >
          <ContactForm />
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- Contact Form ---------- */

function ContactForm() {
  const [values, setValues] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    systemSize: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function validate() {
    const next = {};

    if (!values.name.trim()) {
      next.name = "Please enter your name.";
    }

    if (!/^[6-9]\d{9}$/.test(values.phone.trim())) {
      next.phone = "Enter a valid 10-digit phone number.";
    }

    if (
      values.email &&
      !/^\S+@\S+\.\S+$/.test(values.email.trim())
    ) {
      next.email = "Enter a valid email address.";
    }

    if (!values.city.trim()) {
      next.city = "Please enter your city/town.";
    }

    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const next = validate();

    setErrors(next);
    if (Object.keys(next).length === 0) {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center py-10"
      >
        <CheckCircle2
          className="text-success"
          size={40}
          strokeWidth={1.75}
        />

        <h3 className="mt-4 text-lg font-semibold text-navy">
          Thanks, {values.name.split(" ")[0]} — we've got your details.
        </h3>

        <p className="mt-2 text-sm text-muted max-w-sm">
          Our team will call you at {values.phone} to schedule a free site
          survey.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">

      {/* Name + Phone */}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field
          label="Full name"
          name="name"
          value={values.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Your name"
        />

        <Field
          label="Phone number"
          name="phone"
          value={values.phone}
          onChange={handleChange}
          error={errors.phone}
          placeholder="98XXXXXXXX"
          inputMode="numeric"
        />
      </div>

      {/* Email + City */}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field
          label="Email (optional)"
          name="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="you@example.com"
          type="email"
        />

        <Field
          label="City / town"
          name="city"
          value={values.city}
          onChange={handleChange}
          error={errors.city}
          placeholder="e.g. Bhubaneswar"
        />
      </div>

      {/* Message */}

      <div>
        <label className="block text-sm font-medium text-navy mb-2">
          Message (optional)
        </label>

        <textarea
          name="message"
          value={values.message}
          onChange={handleChange}
          rows={4}
          placeholder="Tell us about your rooftop, current bill, or any questions"
          className="w-full rounded-lg border border-navy/15 px-4 py-3 text-sm text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition-shadow"
        />
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-amber hover:bg-amber-hover text-navy font-medium px-6 py-3 rounded-lg transition-colors"
      >
        <Send size={18} />
        Request a free site survey
      </button>
    </form>
  );
}

/* ---------- Field Component ---------- */

function Field({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  inputMode,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-navy mb-2"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-4 py-3 text-sm text-navy placeholder:text-muted focus:outline-none focus:ring-2 transition-shadow ${
          error
            ? "border-red-400 focus:ring-red-200"
            : "border-navy/15 focus:ring-amber/50 focus:border-amber"
        }`}
      />

      {error && (
        <p className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}


