export const INSTALLATION_STATUSES = [
  { value: "pending", label: "Installation Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "loan_disbursed_successfully_phase_1", label: "Loan Disbursed Successfully - Phase 1" },
  { value: "vendor_side_invoice_generated", label: "Vendor Side - Invoice Generated" },
  { value: "e_way_bill_generated", label: "E-Way Bill Generated" },
  { value: "dcr_completed", label: "DCR Completed" },
  { value: "stock_forwarded_to_customer_home", label: "Forward the Stock to Customer Home" },
  { value: "technical_installation_pending", label: "Technical Side - Installation Pending" },
  { value: "technical_installation_half_work_done", label: "Technical Side - Installation Half Work Done" },
  { value: "technical_installation_completed", label: "Technical Side - Installation Completed" },
  { value: "vendor_installation_work_docx_uploaded_to_govt_portal", label: "Vendor Side - Installation Work DOCX Uploaded to Govt Portal" },
  { value: "load_announcement", label: "Load Announcement" },
  { value: "net_metering_completed_by_electricals_dept", label: "Net Metering Completed - by Electricals Dept" },
  { value: "solar_installation_completion_certificate", label: "Solar Installation Completion Certificate" },
  { value: "gps_photo_generated", label: "GPS Photo Generated" },
  { value: "docx_forwarded_to_bank_loan_phase_2", label: "Forward the DOCX to Bank Loan - Phase 2" },
  { value: "je_verification_pending", label: "JE Verification Pending" },
  { value: "je_verification_approved", label: "JE Verification - Approved" },
  { value: "pending_for_loan_disbursement_phase_2", label: "Pending for Loan Disbursed - Phase 2" },
  { value: "loan_disbursed_phase_2", label: "Loan Disbursed - Phase 2" },
  { value: "consumer_subsidy_pending", label: "Consumer - Subsidy Pending" },
  { value: "consumer_subsidy_disbursed", label: "Consumer - Subsidy Disbursed" },
  { value: "other", label: "Other" },
  { value: "completed", label: "Fully Completed" },
];

export const installationStatusLabel = (value) =>
  INSTALLATION_STATUSES.find((status) => status.value === value)?.label ||
  String(value || "").replace(/_/g, " ");
