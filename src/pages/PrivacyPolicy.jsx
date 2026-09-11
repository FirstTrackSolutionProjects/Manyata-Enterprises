import { motion } from "framer-motion";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    content:
      "When you apply for solar installation, careers, or contact us, we may collect your name, phone number, email address, date of birth, gender, home address, Aadhaar and PAN details, bank account details, electricity consumer number, and uploaded documents (ID proofs, photos, resumes, electricity bills, cancelled cheques).",
  },
  {
    title: "2. Why We Collect It",
    content:
      "This information is used to process your solar subsidy application, verify eligibility, generate quotations, coordinate site surveys and installation, process financing/EMI requests, and process job applications for our Careers or Join Us pages.",
  },
  {
    title: "3. How We Use Your Information",
    content:
      "Your details are shared only with parties directly involved in delivering our services — such as financing/banking partners for loan processing, the relevant electricity discom for net-metering, and government portals for subsidy application — and are not sold to third parties for marketing purposes.",
  },
  {
    title: "4. Document Security",
    content:
      "Identity documents (Aadhaar, PAN), bank details, and photographs are collected solely for application and verification purposes. We take reasonable measures to store this information securely and limit access to authorized personnel only.",
  },
  {
    title: "5. Data Retention",
    content:
      "We retain your information for as long as necessary to complete your application, installation, warranty, and service obligations, or as required by applicable government subsidy and financial regulations.",
  },
  {
    title: "6. Your Rights",
    content:
      "You may request to review, correct, or request deletion of your personal information by contacting us directly, subject to any ongoing legal, subsidy, or service obligations that require us to retain certain records.",
  },
  {
    title: "7. Cookies & Website Usage",
    content:
      "Our website may use basic cookies or analytics to understand site usage and improve user experience. We do not use this data to identify individual visitors for marketing purposes.",
  },
  {
    title: "8. Third-Party Links",
    content:
      "Our website may link to government scheme portals or partner bank websites. We are not responsible for the privacy practices of these external sites.",
  },
  {
    title: "9. Changes to This Policy",
    content:
      "We may update this Privacy Policy periodically. Continued use of our services after changes are posted constitutes acceptance of the revised policy.",
  },
  {
    title: "10. Contact Us",
    content:
      "For any privacy-related questions or requests, contact us at support@themanyata.com or call 8114721300 / 7008581300.",
  },
];

export default function PrivacyPolicy() {
  return (
    <>
      <section className="bg-navy py-14 text-white lg:py-16">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-sm font-semibold text-amber">Legal</span>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-3 text-sm text-white/60">Last updated: September 2026</p>
          </motion.div>
        </div>
      </section>

      <section className="bg-white py-14 lg:py-20">
        <div className="mx-auto max-w-[800px] px-5 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.35 }}
            className="text-sm leading-relaxed text-muted"
          >
            Your privacy matters to us. This policy explains what
            information we collect through our website and application
            forms, and how it is used.
          </motion.p>

          <div className="mt-8 flex flex-col gap-8">
            {SECTIONS.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.3) }}
              >
                <h2 className="text-lg font-bold text-navy">{section.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {section.content}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}