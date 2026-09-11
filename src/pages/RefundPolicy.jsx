import { motion } from "framer-motion";

const SECTIONS = [
  {
    title: "1. Booking & Advance Payment",
    content:
      "Any advance or booking amount paid at the time of confirming a site survey or system order is collected to reserve your slot and initiate documentation. This amount forms part of your total system cost, as reflected in your formal quotation.",
  },
  {
    title: "2. Cancellation Before Installation",
    content:
      "You may cancel your order any time before installation begins by informing us in writing (email or WhatsApp). If cancellation is made before site survey or material procurement, the advance amount is refundable, minus any processing or bank charges already incurred.",
  },
  {
    title: "3. Cancellation After Material Procurement",
    content:
      "If solar modules, inverters, or other components have already been procured or dispatched for your specific installation, the cost of procured material will be deducted from any refund, as this equipment cannot always be returned to the manufacturer.",
  },
  {
    title: "4. Cancellation After Installation Begins",
    content:
      "Once on-site installation work has started, the advance and any installation costs already incurred become non-refundable, since labour, transportation, and site-specific work cannot be reversed.",
  },
  {
    title: "5. Government Subsidy Amount",
    content:
      "The government subsidy portion is not held by Manyata Enterprises — it is disbursed directly by the relevant government authority upon successful installation and net-metering approval. Cancellation does not entitle a customer to any subsidy amount, as this was never collected by us.",
  },
  {
    title: "6. Loan / EMI Cancellations",
    content:
      "If your system was financed through a bank or financing partner, cancellation is also subject to that partner's own loan cancellation and foreclosure terms. Please refer to your loan agreement or contact your financing partner directly.",
  },
  {
    title: "7. Refund Timeline",
    content:
      "Approved refunds are processed within 7–14 working days from the date of written cancellation confirmation, credited to the original mode of payment or bank account provided.",
  },
  {
    title: "8. Warranty Claims (Not a Refund)",
    content:
      "Manufacturing defects or performance issues within the warranty period are handled through repair or replacement under the respective manufacturer's or Manyata Enterprises' warranty terms — not through cancellation or refund of the full system cost.",
  },
  {
    title: "9. How to Request a Cancellation or Refund",
    content:
      "Email support@themanyata.com or call 8114721300 / 7008581300 with your name, application details, and reason for cancellation. Our team will confirm the applicable refund amount, if any, based on the stage of your order.",
  },
  {
    title: "10. Changes to This Policy",
    content:
      "We may update this Refund & Cancellation Policy periodically to reflect changes in our process or applicable government scheme terms. Continued use of our services after changes are posted constitutes acceptance of the revised policy.",
  },
];

export default function RefundPolicy() {
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
              Refund & Cancellation Policy
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
            This policy explains how cancellations and refunds are handled
            at different stages of your solar installation journey with
            Manyata Enterprises.
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