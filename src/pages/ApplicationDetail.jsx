import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
  Send,
  AlertCircle,
  ChevronDown,
  Search,
} from "lucide-react";
import {
  getApplication,
  getApplicationTimeline,
  updateApplicationStatus,
  updateApplication,
  submitToGovt,
  uploadFilesToS3,
  downloadApplicationPdf,
  fileUrl,
  listUsers,
  assignApplicationTechnicalWork,
  getApplicationForwardOptions,
  forwardApplicationToEmployee,
} from "../services/api";
import { APPLICATION_STATUSES, APPLICATION_UPDATE_STATUSES, applicationStatusLabel, getApplicationUpdateStatusOptions } from "../constants/applicationStatuses";
import { useAuth } from "../contexts/AuthContext";
import { hasActionPermission } from "../utils/permissions";
import PartnerNetworkFields from "../components/PartnerNetworkFields";
import CameraFileInput from "../components/CameraFileInput";
import { formatApplicationLocation } from "../utils/applicationLocation";

export default function ApplicationDetail() {
  const { user } = useAuth();
  const canEdit = hasActionPermission(user, "applications", "edit");
  const canDownload = hasActionPermission(user, "applications", "download");
  const isOwner = user?.role === "owner";
  const isTechnicalEmployee = user?.role === "employee" && /technical|technician|installation engineer/i.test(`${user?.designation || ""} ${user?.department || ""}`);
  const availableStatusOptions = getApplicationUpdateStatusOptions(user);
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [documentPresence, setDocumentPresence] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [govtRef, setGovtRef] = useState("");
  const [govtNote, setGovtNote] = useState("");
  const [govtError, setGovtError] = useState("");
  const [showGovtModal, setShowGovtModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [technicalEmployees, setTechnicalEmployees] = useState([]);
  const [technicalAssignee, setTechnicalAssignee] = useState("");
  const [technicalInstructions, setTechnicalInstructions] = useState("");
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [backOfficeEmployees, setBackOfficeEmployees] = useState([]);
  const [forwardEmployeeId, setForwardEmployeeId] = useState("");
  const [forwarding, setForwarding] = useState(false);
  const [loadingForwardOptions, setLoadingForwardOptions] = useState(false);
  const [forwardError, setForwardError] = useState("");

  const load = async () => {
    try {
      const [a, h] = await Promise.all([
        getApplication(id),
        getApplicationTimeline(id),
      ]);
      setApp(a.data.application);
      setTechnicalAssignee(a.data.application.technical_assignee_id ? String(a.data.application.technical_assignee_id) : "");
      setTechnicalInstructions(a.data.application.technical_instructions || "");
      setDocumentPresence(a.data.documentPresence || {});
      setHistory(h.data.items || []);
      setNewStatus(a.data.application.status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (!isOwner) return;
    listUsers({ role: "employee", status: "active" })
      .then((response) => setTechnicalEmployees((response.data.items || []).filter((employee) => /technical|technician|installation engineer/i.test(`${employee.designation || ""} ${employee.department || ""}`) && employee.permissions?.includes("applications") && employee.actionPermissions?.applications?.view && employee.actionPermissions?.applications?.edit)))
      .catch((err) => setError(err.message || "Could not load technical employees."));
  }, [isOwner]);

  const saveTechnicalAssignment = async () => {
    setSavingAssignment(true);
    try { await assignApplicationTechnicalWork(id, technicalAssignee, technicalInstructions); await load(); }
    catch (err) { alert(err.message || "Could not save assignment."); }
    finally { setSavingAssignment(false); }
  };

  const openForwardModal = async () => {
    setForwardError("");
    setBackOfficeEmployees([]);
    setForwardEmployeeId("");
    setShowForwardModal(true);
    setLoadingForwardOptions(true);
    try {
      const response = await getApplicationForwardOptions(id);
      const employees = response.data.items || [];
      setBackOfficeEmployees(employees);
      setForwardEmployeeId(employees[0] ? String(employees[0].id) : "");
    } catch (err) {
      setForwardError(err.message || "Could not load Back Office employees.");
    } finally {
      setLoadingForwardOptions(false);
    }
  };

  const handleForward = async () => {
    if (!forwardEmployeeId) return;
    setForwarding(true);
    setForwardError("");
    try {
      await forwardApplicationToEmployee(id, forwardEmployeeId);
      alert("Application forwarded to the selected Back Office employee.");
      navigate(-1);
    } catch (err) {
      setForwardError(err.message || "Could not forward this application.");
      setForwarding(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (newStatus === app.status) return;
    setUpdating(true);
    try {
      await updateApplicationStatus(id, newStatus, statusNote);
      setStatusNote("");
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleGovtSubmit = async () => {
    if (!govtRef.trim()) {
      setGovtError("Government portal reference is required");
      return;
    }
    setGovtError("");
    setUpdating(true);
    try {
      await submitToGovt(id, govtRef.trim(), govtNote);
      setShowGovtModal(false);
      setGovtRef("");
      setGovtNote("");
      await load();
    } catch (err) {
      setGovtError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-amber" />
      </div>
    );

  if (error)
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-navy/20 px-4 py-2 text-xs font-semibold text-navy hover:border-amber"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <p className="font-mono text-xs text-amber">
            {app.application_no}
          </p>
          <h2 className="mt-1 text-2xl font-extrabold text-navy">
            {app.full_name}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {app.phone_number} · {app.email || "No email"}
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && <button onClick={() => setShowEditForm(true)} className="rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy hover:border-amber">{isTechnicalEmployee ? "Upload Progress Photos" : "Edit Details"}</button>}
          {canDownload && <button onClick={() => downloadApplicationPdf(app.id)} className="flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy hover:bg-amber-hover"><Download size={16} />Download PDF</button>}
        </div>
      </div>

      {showEditForm && canEdit && <ApplicationEditForm app={app} technicalOnly={isTechnicalEmployee} onClose={() => setShowEditForm(false)} onSaved={async () => { setShowEditForm(false); await load(); }} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <InfoSection title="Application Details">
            <InfoGrid
              items={[
                [
                  "Location",
                  formatApplicationLocation(app.location),
                ],
                ["System Type", app.system_type],
                ["System Size", app.system_size],
                ["Super-vendor", app.super_vendor_name],
                ["Vendor", app.vendor_name],
                ["Sub Vendor", app.sub_vendor_name],
                ["Sales Executive", app.sales_executive_name],
                ["Income Source", app.income_source],
              ]}
            />
          </InfoSection>

          <InfoSection title="Personal Details">
            <InfoGrid
              items={[
                ["Full Name", app.full_name],
                ["Phone", app.phone_number],
                ["Gender", app.gender],
                ["Date of Birth", app.dob],
                ["Email", app.email],
              ]}
            />
          </InfoSection>

          <InfoSection title="Address">
            <InfoGrid
              items={[
                ["State", app.state],
                ["District", app.district],
                ["Block", app.block],
                ["Gram Panchayat", app.gram_panchayat],
                ["Building / Plot", app.building_plot],
                ["Village", app.village_name],
                ["City", app.city],
                ["Post Office", app.post_office],
                ["PIN Code", app.pin_code],
                ["Landmark", app.landmark],
                ["Municipality", app.municipality],
                ["Ward Number", app.ward_number],
                ["Street / Locality", app.street_locality],
              ]}
            />
          </InfoSection>

          <InfoSection title="Electricity Connection">
            <InfoGrid
              items={[
                ["Consumer Number", app.consumer_number],
                ["Sub Division", app.sub_division],
                ["Tariff", app.tariff],
              ]}
            />
          </InfoSection>

          <InfoSection title="Bank Details">
            <InfoGrid
              items={[
                ["Bank Name", app.bank_name],
                ["Account Number", app.account_number],
                ["IFSC Code", app.ifsc_code],
              ]}
            />
          </InfoSection>

          <InfoSection title="Uploaded Documents">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ["file_aadhaar_front", "Aadhaar Front"],
                ["file_aadhaar_back", "Aadhaar Back"],
                ["file_pan_card", "PAN Front"],
                ["file_pan_back", "PAN Back"],
                ["file_photo", "Photo"],
                ["file_signature", "Signature"],
                ["file_electricity_bill", "Electricity Bill"],
                ["file_cheque_passbook", "Cheque / Passbook"],
                ["file_site_photo", "Site Photo"],
              ].filter(([key]) => documentPresence[key] || app[key]).map(([key, label]) => canDownload && app[key] ? (
                <a key={key} href={fileUrl(app[key])} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-navy/10 bg-white p-3 hover:border-amber">
                  <FileText size={18} className="text-amber" />
                  <span className="text-sm font-semibold text-navy">{label}</span>
                  <Download size={15} className="ml-auto text-muted" />
                </a>
              ) : <div key={key} className="flex items-center gap-3 rounded-lg border border-navy/10 bg-slate-50 p-3"><FileText size={18} className="text-muted" /><span className="text-sm font-semibold text-muted">{label} · no download access</span></div>)}
              {!Object.values(documentPresence).some(Boolean) && ![
                app.file_aadhaar_front, app.file_aadhaar_back, app.file_pan_card, app.file_pan_back, app.file_photo, app.file_signature,
                app.file_electricity_bill, app.file_cheque_passbook, app.file_site_photo,
              ].some(Boolean) && (
                <p className="text-sm text-muted">No documents uploaded.</p>
              )}
            </div>
          </InfoSection>

          <InfoSection title="Site Documentation">
            {app.file_site_photo && <div className="mb-4 overflow-hidden rounded-xl border border-navy/10 bg-slate-50">
              <a href={fileUrl(app.file_site_photo)} target="_blank" rel="noopener noreferrer" aria-label="Open site photo">
                <img src={fileUrl(app.file_site_photo)} alt="Submitted site documentation" loading="lazy" className="max-h-80 w-full object-contain" />
              </a>
              <div className="flex items-center justify-between gap-3 border-t border-navy/10 bg-white px-3 py-2">
                <span className="text-sm font-semibold text-navy">GPS Site Photo</span>
                {canDownload && <a href={fileUrl(app.file_site_photo)} download className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline"><Download size={14} /> Download</a>}
              </div>
            </div>}
            {app.site_latitude != null && app.site_longitude != null ? <>
              <div className="grid gap-3 sm:grid-cols-3">
                <GpsValue label="Latitude" value={`${Number(app.site_latitude).toFixed(7)}°`} />
                <GpsValue label="Longitude" value={`${Number(app.site_longitude).toFixed(7)}°`} />
                <GpsValue label="GPS accuracy" value={app.site_accuracy_m != null ? `±${app.site_accuracy_m} m` : "Not recorded"} />
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border border-navy/10">
                <iframe title="Application site map" src={`https://www.google.com/maps?q=${encodeURIComponent(`${app.site_latitude},${app.site_longitude}`)}&z=16&output=embed`} className="h-64 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <a className="mt-3 inline-flex text-sm font-semibold text-blue-700 underline" href={`https://maps.google.com/?q=${app.site_latitude},${app.site_longitude}`} target="_blank" rel="noreferrer">Open site in Google Maps</a>
            </> : <p className="text-sm text-muted">GPS coordinates were not captured for this application.</p>}
            {!app.file_site_photo && <p className="text-sm text-muted">No GPS site photo was uploaded.</p>}
          </InfoSection>

          {app.remarks && (
            <InfoSection title="Customer Remarks">
              <p className="text-sm text-navy">{app.remarks}</p>
            </InfoSection>
          )}
        </div>

        <div className="space-y-6">
          {(app.technical_assignee_name || app.technical_instructions) && <div className="rounded-2xl border border-amber/20 bg-amber/5 p-5">
            <h3 className="text-sm font-bold text-navy">Technical assignment</h3>
            {app.technical_assignee_name && <p className="mt-2 text-sm text-navy">Assigned to: <strong>{app.technical_assignee_name}</strong></p>}
            {app.technical_instructions && <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{app.technical_instructions}</p>}
          </div>}
          {app.forwarded_to_employee_name && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <h3 className="text-sm font-bold text-navy">Back Office handoff</h3>
            <p className="mt-2 text-sm text-navy">Forwarded to: <strong>{app.forwarded_to_employee_name}</strong></p>
            {app.forwarded_by_employee_name && <p className="mt-1 text-xs text-muted">Forwarded by {app.forwarded_by_employee_name}{app.forwarded_at ? ` · ${new Date(app.forwarded_at).toLocaleString("en-IN")}` : ""}</p>}
          </div>}
          {isOwner && <div className="rounded-2xl border border-amber/30 bg-white p-5">
            <h3 className="text-sm font-bold text-navy">Technical work assignment</h3>
            <p className="mt-1 text-xs text-muted">Assign the application to a technical employee with access to its state.</p>
            <div className="mt-4 space-y-3"><select value={technicalAssignee} onChange={(event) => setTechnicalAssignee(event.target.value)} className="w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm"><option value="">Unassigned</option>{technicalEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {employee.location || "Any location"}</option>)}</select><textarea value={technicalInstructions} onChange={(event) => setTechnicalInstructions(event.target.value)} rows={3} maxLength={4000} placeholder="Work instructions (optional)" className="w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm" /><button onClick={saveTechnicalAssignment} disabled={savingAssignment} className="w-full rounded-full bg-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{savingAssignment ? "Saving..." : "Save Assignment"}</button></div>
          </div>}
          {canEdit && <div className="rounded-2xl border border-navy/10 bg-white p-5">
            <h3 className="text-sm font-bold text-navy">Update Status</h3>
            <div className="mt-4 space-y-3">
              <StatusDropdown
                value={newStatus}
                options={[...availableStatusOptions, ...(!availableStatusOptions.some((status) => status.value === app.status) ? [{ value: app.status, label: `${applicationStatusLabel(app.status)} (current)` }] : [])]}
                open={statusMenuOpen}
                onOpenChange={setStatusMenuOpen}
                onChange={setNewStatus}
                  />
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder={newStatus === "other" ? "Describe the other status (required)" : "Note (optional)"}
                rows={3}
                required={newStatus === "other"}
                className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm focus:border-amber focus:outline-none"
              />
              <button
                onClick={handleUpdateStatus}
                disabled={updating || newStatus === app.status || (newStatus === "other" && !statusNote.trim())}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy hover:bg-amber-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                Save Status
              </button>

              {app.status === "verified" && (
                <>
                  <button
                    onClick={() => setShowGovtModal(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white hover:bg-navy-light"
                  >
                    <Send size={16} />
                    Submit to Govt Portal
                  </button>
                  {user?.role === "employee" && <button
                    onClick={openForwardModal}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-amber bg-white px-5 py-2.5 text-sm font-bold text-navy hover:bg-amber-soft"
                  >
                    <Send size={16} />
                    Forward to Back Office
                  </button>}
                </>
              )}
            </div>
          </div>}

          <div className="rounded-2xl border border-navy/10 bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-navy">
              <Clock size={16} className="text-amber" />
              Status Timeline
            </h3>
            <div className="mt-4 space-y-3">
              {history.length === 0 && (
                <p className="text-xs text-muted">No history yet.</p>
              )}
              {history.map((h) => (
                <div key={h.id} className="border-l-2 border-amber/40 pl-3">
                  <p className="text-xs font-bold capitalize text-navy">
                    {applicationStatusLabel(h.new_status)}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(h.created_at).toLocaleString("en-IN")}
                  </p>
                  {h.changed_by_name && (
                    <p className="text-xs text-muted">
                      by {h.changed_by_name}
                    </p>
                  )}
                  {h.note && (
                    <p className="mt-1 text-xs italic text-muted">{h.note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showForwardModal && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/60 p-4" onClick={() => setShowForwardModal(false)}>
        <section className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
          <div><h3 className="text-lg font-bold text-navy">Forward verified application</h3><p className="mt-1 text-sm text-muted">Choose an active Back Office employee with access to this application.</p></div>
          {forwardError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{forwardError}</p>}
          {backOfficeEmployees.length ? <label className="block text-sm font-semibold text-navy">Back Office employee<select value={forwardEmployeeId} onChange={(event) => setForwardEmployeeId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm">{backOfficeEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}{employee.designation ? ` · ${employee.designation}` : ""}</option>)}</select></label> : loadingForwardOptions ? <p className="rounded-lg bg-slate-50 p-3 text-sm text-muted">Loading employees…</p> : !forwardError && <p className="text-xs text-muted">No eligible Back Office employees were found.</p>}
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowForwardModal(false)} className="rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold">Cancel</button><button type="button" onClick={handleForward} disabled={forwarding || !forwardEmployeeId} className="rounded-full bg-amber px-5 py-2 text-sm font-bold text-navy disabled:opacity-50">{forwarding ? "Forwarding…" : "Forward"}</button></div>
        </section>
      </div>}

      {showGovtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-white p-6"
          >
            <h3 className="text-lg font-bold text-navy">
              Submit to Government Portal
            </h3>
            <p className="mt-2 text-sm text-muted">
              Enter the reference number from the government portal after
              submitting this application.
            </p>
            {govtError && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3">
                <AlertCircle
                  size={16}
                  className="mt-0.5 shrink-0 text-red-600"
                />
                <p className="text-xs text-red-700">{govtError}</p>
              </div>
            )}
            <div className="mt-4 space-y-3">
              <input
                value={govtRef}
                onChange={(e) => setGovtRef(e.target.value)}
                placeholder="Government portal reference"
                className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm focus:border-amber focus:outline-none"
              />
              <textarea
                value={govtNote}
                onChange={(e) => setGovtNote(e.target.value)}
                placeholder="Note (optional)"
                rows={3}
                className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm focus:border-amber focus:outline-none"
              />
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  setShowGovtModal(false);
                  setGovtError("");
                }}
                className="flex-1 rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy hover:bg-navy/5"
              >
                Cancel
              </button>
              <button
                onClick={handleGovtSubmit}
                disabled={updating}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy hover:bg-amber-hover disabled:opacity-60"
              >
                {updating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Submit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

function ApplicationEditForm({ app, technicalOnly = false, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    location: String(app.location || "").includes(",") ? "both" : app.location, systemType: app.system_type, systemSize: app.system_size,
    superVendorName: app.super_vendor_name || "", vendorName: app.vendor_name || "", subVendorName: app.sub_vendor_name || "", salesExecutiveName: app.sales_executive_name || "", incomeSource: app.income_source || "",
    fullName: app.full_name || "", phoneNumber: app.phone_number || "", gender: app.gender || "", dob: app.dob || "", email: app.email || "",
    state: app.state || "", district: app.district || "", block: app.block || "", gramPanchayat: app.gram_panchayat || "", buildingPlot: app.building_plot || "", villageName: app.village_name || "", city: app.city || "", postOffice: app.post_office || "", pinCode: app.pin_code || "", landmark: app.landmark || "", municipality: app.municipality || "", wardNumber: app.ward_number || "", streetLocality: app.street_locality || "",
    consumerNumber: app.consumer_number || "", subDivision: app.sub_division || "", tariff: app.tariff || "", bankName: app.bank_name || "", accountNumber: app.account_number || "", ifscCode: app.ifsc_code || "", remarks: app.remarks || "",
  }));
  const [files, setFiles] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const change = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const uploaded = await uploadFilesToS3("applications", files);
      await updateApplication(app.id, { ...form, files: uploaded });
      onSaved();
    } catch (err) { setError(err.message || "Could not update application."); }
    finally { setSaving(false); }
  };
  const fields = [
    ["incomeSource", "Income Source"],
    ["fullName", "Full Name"], ["phoneNumber", "Phone Number"], ["gender", "Gender"], ["dob", "Date of Birth", "date"], ["email", "Email", "email"],
    ["state", "State"], ["district", "District"], ["block", "Block"], ["gramPanchayat", "Gram Panchayat"], ["buildingPlot", "Building / Plot"], ["villageName", "Village"], ["city", "City"], ["postOffice", "Post Office"], ["pinCode", "PIN Code"], ["landmark", "Landmark"], ["municipality", "Municipality"], ["wardNumber", "Ward Number"], ["streetLocality", "Street / Locality"],
    ["consumerNumber", "Consumer Number"], ["subDivision", "Sub Division"], ["tariff", "Tariff"], ["bankName", "Bank Name"], ["accountNumber", "Account Number"], ["ifscCode", "IFSC Code"],
  ];
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-navy/60 p-4"><form onSubmit={save} className="mx-auto my-6 max-w-4xl rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between gap-4"><div><h3 className="text-xl font-extrabold text-navy">{technicalOnly ? "Upload Installation Progress" : "Edit Application"}</h3><p className="text-xs text-muted">{technicalOnly ? "Upload progress photos/documents. Application details stay unchanged." : "All details can be updated. Upload a document only to replace its existing file."}</p></div><button type="button" onClick={onClose} className="text-sm font-bold text-muted">Close</button></div>{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className={technicalOnly ? "hidden" : "mt-5"}><PartnerNetworkFields location={form.location} form={form} onChange={change} /></div><div className={technicalOnly ? "hidden" : "mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"}>{fields.map(([name, label, type]) => <label key={name} className="text-xs font-semibold text-navy/70">{label}<input name={name} type={type || "text"} value={form[name]} onChange={change} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy" /></label>)}</div><div className={technicalOnly ? "hidden" : "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"}><label className="text-xs font-semibold text-navy/70">Location<select name="location" value={form.location} onChange={change} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm"><option value="odisha">Odisha</option><option value="kolkata">West Bengal</option><option value="both">Both regions</option></select></label><label className="text-xs font-semibold text-navy/70">System Type<select name="systemType" value={form.systemType} onChange={change} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm"><option value="on-grid">On-Grid</option><option value="hybrid">Hybrid</option></select></label><label className="text-xs font-semibold text-navy/70">System Size<select name="systemSize" value={form.systemSize} onChange={change} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm"><option value="1kw">1 kW</option><option value="2kw">2 kW</option><option value="3kw">3 kW</option></select></label></div><label className={technicalOnly ? "hidden" : "mt-4 block text-xs font-semibold text-navy/70"}>Remarks<textarea name="remarks" value={form.remarks} onChange={change} rows={3} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm" /></label><div className="mt-5">
  <p className="text-sm font-bold text-navy">Replace Documents (optional)</p>
  <p className="mt-1 text-xs text-muted">Only choose a file for documents you want to replace — others stay unchanged.</p>
  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
    {[
      ["aadhaarFront", "Aadhaar", app.file_aadhaar_front],
      ["aadhaarBack", "Aadhaar Back", app.file_aadhaar_back],
      ["panCard", "PAN Front", app.file_pan_card],
      ["panBack", "PAN Back", app.file_pan_back],
      ["photo", "Photo", app.file_photo],
      ["signature", "Signature", app.file_signature],
      ["electricityBill", "Electricity Bill", app.file_electricity_bill],
      ["chequePassbook", "Cheque / Passbook", app.file_cheque_passbook],
      ["sitePhoto", "Site Photo", app.file_site_photo],
    ].filter(([name]) => !technicalOnly || name === "sitePhoto").map(([name, label, existing]) => (
      <DocReplaceField
        key={name}
        name={name}
        label={label}
        existingUrl={existing ? fileUrl(existing) : null}
        onSelect={(f) => setFiles((p) => ({ ...p, [name]: f }))}
      />
    ))}
  </div>
</div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy">Cancel</button><button disabled={saving} className="rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy disabled:opacity-60">{saving ? "Saving..." : technicalOnly ? "Upload Progress" : "Save All Changes"}</button></div></form></div>;
}

function InfoSection({ title, children }) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5">
      <h3 className="text-sm font-bold text-navy">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function StatusDropdown({ value, options, open, onOpenChange, onChange }) {
  const [query, setQuery] = useState("");
  const menuRef = useRef(null);
  const selected = options.find((option) => option.value === value);
  const filtered = options.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) onOpenChange(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-navy/15 bg-white px-3.5 py-2.5 text-left text-sm text-navy hover:border-amber focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
      >
        <span className="line-clamp-2">{selected?.label || "Select status"}</span>
        <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-navy/15 bg-white shadow-xl">
          <div className="sticky top-0 border-b border-navy/10 bg-white p-2">
            <div className="flex items-center gap-2 rounded-lg border border-navy/15 px-3">
              <Search size={15} className="shrink-0 text-muted" />
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search statuses..."
                aria-label="Search statuses"
                className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </div>
          </div>
          <div role="listbox" aria-label="Application status" className="max-h-64 overflow-y-auto p-1">
            {filtered.length ? filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  onOpenChange(false);
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm leading-5 hover:bg-amber/10 ${option.value === value ? "bg-amber/15 font-semibold text-navy" : "text-navy/85"}`}
              >
                {option.label}
              </button>
            )) : (
              <p className="px-3 py-5 text-center text-sm text-muted">No matching statuses.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoGrid({ items }) {
  const filtered = items.filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (filtered.length === 0) {
    return <p className="text-sm text-muted">No data.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {filtered.map(([label, value]) => (
        <div key={label}>
          <p className="text-xs font-semibold text-muted">{label}</p>
          <p className="mt-0.5 text-sm font-medium text-navy">{value}</p>
        </div>
      ))}
    </div>
  );
}

function GpsValue({ label, value }) {
  return <div className="rounded-lg bg-slate-50 px-3 py-2.5">
    <p className="text-xs font-semibold text-muted">{label}</p>
    <p className="mt-1 break-all text-sm font-semibold text-navy">{value}</p>
  </div>;
}

function DocReplaceField({ name, label, existingUrl, onSelect }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-navy/70">
        <span>{label}</span>
        {existingUrl && <a href={existingUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold text-amber hover:underline">View current</a>}
      </div>
      <CameraFileInput label={`Replace ${label}`} name={name} accept="image/jpeg,image/png,image/webp,application/pdf" onFile={(file) => onSelect(file)} />
    </div>
  );
}
