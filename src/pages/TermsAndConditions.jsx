import { motion } from "framer-motion";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By using this website or engaging Manyata Enterprises for rooftop solar installation, subsidy assistance, or related services, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services.",
  },
  {
    title: "2. Services Offered",
    content:
      "Manyata Enterprises provides rooftop solar system consultation, site survey, system design, installation, net-metering assistance, subsidy and loan guidance, and after-sales service under the PM Surya Ghar Muft Bijli Yojana and applicable Odisha State schemes.",
  },
  {
    title: "3. Eligibility & Government Subsidy",
    content:
      "Subsidy amounts, eligibility criteria, and disbursement timelines are determined by the Government of India and the Government of Odisha, not by Manyata Enterprises. We assist with documentation and application, but approval and final subsidy amount rest solely with the respective government authority.",
  },
  {
    title: "4. Pricing & Payment",
    content:
      "System cost, EMI eligibility, and net investment figures shared on this website or during consultation are indicative and subject to change based on site survey, system size, component availability, and bank/financing partner terms. A formal quotation will be shared before work begins.",
  },
  {
    title: "5. Installation & Timelines",
    content:
      "Installation timelines depend on site readiness, document approval, discom (electricity board) net-metering approval, and material availability. Manyata Enterprises will communicate realistic timelines but is not liable for delays caused by government departments, weather, or circumstances beyond our control.",
  },
  {
    title: "6. Warranty",
    content:
      "Product warranties (solar modules, inverters, ACDB/DCDB, mounting structures, cables) are provided as per respective manufacturer terms. Installation workmanship is covered as per Manyata Enterprises' own service terms, communicated at the time of installation.",
  },
  {
    title: "7. Customer Responsibilities",
    content:
      "Customers are responsible for providing accurate personal, property, and electricity connection details, ensuring rooftop access and structural suitability, and cooperating with site visits required for survey, installation, and net-metering.",
  },
  {
    title: "8. Limitation of Liability",
    content:
      "Manyata Enterprises is not liable for indirect or consequential losses, including but not limited to loss of expected savings, delays in subsidy disbursement, or discom-side delays, beyond the scope of services directly provided by us.",
  },
  {
    title: "9. Changes to These Terms",
    content:
      "We may update these Terms & Conditions from time to time. Continued use of our services after changes are posted constitutes acceptance of the revised terms.",
  },
  {
    title: "10. Contact Us",
    content:
      "For any questions about these Terms & Conditions, contact us at support@themanyata.com or call 8114721300 / 7008581300.",
  },
];

export default function TermsAndConditions() {
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
              Terms & Conditions
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
            Please read these Terms & Conditions carefully before using our
            website or engaging our services.
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