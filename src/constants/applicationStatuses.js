import { isHrEmployee } from "../utils/employeeRoles";

export const APPLICATION_STATUSES = [
  { value: "pending", label: "New Customer Application" },
  { value: "verified", label: "Verified" },
  { value: "mobile_number_linked", label: "Mobile Number Linked" },
  { value: "demand_note_payment", label: "Demand Note Payment" },
  { value: "ads_payment", label: "ADS Payment" },
  { value: "customer_cibil_score_low", label: "Customer - CIBIL Score Low" },
  { value: "purchased_by_cash_1", label: "Purchased By Cash 1" },
  { value: "purchased_by_cash_2", label: "Purchased By Cash 2" },
  { value: "purchased_by_full_cash", label: "Purchased By Full Cash" },
  { value: "customer_side_bank_forward", label: "Consumer Side - Bank Forward" },
  { value: "customer_aadhaar_not_linked_with_mobile_number", label: "Customer Side - Aadhaar Card Not Linked with Mobile Number" },
  { value: "customer_kyc_pending_from_bank_side", label: "Customer - KYC Pending from the Bank Side" },
  { value: "customer_kyc_completed_from_bank_side", label: "Customer - KYC Completed from the Bank Side" },
  { value: "vendor_side_quotation_agreement_generated", label: "Vendor Side - Quotation & Agreement Generated" },
  { value: "vendor_side_quotation_agreement_pending", label: "Vendor Side - Quotation & Agreement Pending" },
  { value: "electricity_bill_mismatch_customer_side_on_process", label: "Electricity Bill Mismatch - Customer Side - On Process" },
  { value: "electricity_bill_ownership_transfer_customer_side_on_process", label: "Electricity Bill Ownership Transfer - Customer Side - On Process" },
  { value: "electricity_bill_name_mismatch", label: "Electricity Bill - Name Mismatch" },
  { value: "electricity_bill_name_mismatch_completed_successfully", label: "Electricity Bill Name Mismatch – Completed Successfully" },
  { value: "electricity_bill_mismatch_ownership_transfer", label: "Electricity Bill - Ownership Transfer" },
  { value: "electricity_bill_ownership_transfer_completed_successfully", label: "Electricity Bill Ownership Transfer - Completed Successfully" },
  { value: "customer_side_login_otp_pending_customer_not_responding_call", label: "Customer Side - Login - OTP Pending - Customer Not Responding Call" },
  { value: "vendor_side_login_otp_pending_customer_not_responding_call", label: "Vendor Side - Login - OTP Pending - Customer Not Responding Call" },
  { value: "ownership_transfer_completed_successfully", label: "Ownership Transfer – Completed Successfully" },
  { value: "consumer_login_submitted_to_govt_portal", label: "Consumer Login - Submitted to Govt Portal" },
  { value: "bank_reject", label: "Bank Rejected" },
  { value: "vendor_side_re_bank_forward", label: "Vendor Side – Re-Bank Forward" },
  { value: "pending_for_loan_phase_1", label: "Pending for Loan – Phase 1" },
  { value: "loan_disbursed_successfully_phase_1", label: "Loan Disbursed - Phase 1" },
  { value: "vendor_side_invoice_generated", label: "Vendor Side – Invoice Generated" },
  { value: "e_way_bill_generated", label: "E-Way Bill Generated" },
  { value: "dcr_completed", label: "DCR Completed" },
  { value: "stock_forwarded_to_customer_home", label: "Forward the Stock to Customer Home" },
  { value: "technical_installation_pending", label: "Technical Side – Installation Pending" },
  { value: "technical_installation_half_work_done", label: "Technical Side – Installation Half Work Done" },
  { value: "technical_installation_completed", label: "Technical Side – Installation Completed" },
  { value: "vendor_installation_work_docx_uploaded_to_govt_portal", label: "Vendor Side – Installation Work DOCX Uploaded to Govt Portal" },
  { value: "load_announcement", label: "Load Announcement" },
  { value: "load_announcement_pending", label: "Load Announcement Pending" },
  { value: "load_announcement_on_process", label: "Load Announcement On Process" },
  { value: "load_announcement_completed_successfully", label: "Load Announcement Completed Successfully" },
  { value: "net_metering_completed_by_electricals_dept", label: "Net Metering Completed – by Electricals Dept" },
  { value: "solar_installation_completion_certificate", label: "Solar Installation Completion Certificate" },
  { value: "solar_installation_completion_certificate_generated", label: "Solar Installation Completion Certificate Generated" },
  { value: "gps_photo_generated", label: "GPS Photo Generated" },
  { value: "docx_forwarded_to_bank_loan_phase_2", label: "Forward the DOCX to Bank Loan – Phase 2" },
  { value: "je_verification_pending", label: "JE Verification Pending" },
  { value: "je_verification_approved", label: "JE Signature - Approved" },
  { value: "pending_for_loan_disbursement_phase_2", label: "Pending for Loan Disbursement – Phase 2" },
  { value: "loan_disbursed_phase_2", label: "Loan Disbursed – Phase 2" },
  { value: "customer_full_loan_amount_disbursed", label: "Customer - Full Loan Amount Disbursed" },
  { value: "consumer_subsidy_pending", label: "Consumer - Subsidy Apply" },
  { value: "consumer_subsidy_disbursed", label: "Consumer - Subsidy Disbursed" },
  { value: "other", label: "Other" },
  // Legacy values remain selectable so existing records can still be managed.
  { value: "under_review", label: "Under Review" },
  { value: "submitted_to_govt", label: "Submitted to Govt" },
  { value: "approved", label: "Approved" },
  { value: "installed", label: "Installation Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "office_side_issue", label: "Office Side Issue" },
  { value: "draft", label: "Draft" },
];

export const APPLICATION_UPDATE_STATUSES = [
  "pending", "verified", "electricity_bill_name_mismatch", "mobile_number_linked", "demand_note_payment", "ads_payment",
  "consumer_login_submitted_to_govt_portal", "customer_side_login_otp_pending_customer_not_responding_call",
  "vendor_side_quotation_agreement_pending", "vendor_side_login_otp_pending_customer_not_responding_call",
  "customer_side_bank_forward", "customer_aadhaar_not_linked_with_mobile_number", "customer_cibil_score_low",
  "bank_reject", "vendor_side_re_bank_forward", "customer_full_loan_amount_disbursed",
  "loan_disbursed_successfully_phase_1", "loan_disbursed_phase_2", "purchased_by_full_cash", "purchased_by_cash_1",
  "purchased_by_cash_2", "installed", "net_metering_completed_by_electricals_dept", "je_verification_approved",
  "consumer_subsidy_pending", "consumer_subsidy_disbursed", "office_side_issue", "other",
].map((value) => APPLICATION_STATUSES.find((status) => status.value === value));

export const getApplicationUpdateStatusOptions = (user) => {
  const isTechnicalEmployee = user?.role === "employee"
    && /technical|technician|installation engineer/i.test(`${user?.designation || ""} ${user?.department || ""}`);
  const technicalStatusValues = ["technical_installation_pending", "technical_installation_half_work_done", "technical_installation_completed"];
  const baseOptions = isTechnicalEmployee
    ? APPLICATION_STATUSES.filter((status) => technicalStatusValues.includes(status.value))
    : APPLICATION_UPDATE_STATUSES;
  const grantedStatusUpdates = isHrEmployee(user) ? null : user?.actionPermissions?.applications?.statusUpdates;

  return user?.role !== "owner" && Array.isArray(grantedStatusUpdates)
    ? baseOptions.filter((status) => grantedStatusUpdates.includes(status.value))
    : baseOptions;
};

export const applicationStatusLabel = (value) =>
  value === "vendor_side_pending_for_bank_forward"
    ? "Customer Side - Bank Forward - Pending"
    :
  APPLICATION_STATUSES.find((status) => status.value === value)?.label ||
  String(value || "").replace(/_/g, " ");
