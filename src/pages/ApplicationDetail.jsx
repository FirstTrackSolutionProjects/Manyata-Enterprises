import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  Camera,
  Check,
  Copy,
  Download,
  ExternalLink,
  Hash,
  Landmark,
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Send,
  AlertCircle,
  ChevronDown,
  Search,
  User,
  Wrench,
  Zap,
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
import { applicationStatusLabel, getApplicationUpdateStatusOptions } from "../constants/applicationStatuses";
import { useAuth } from "../contexts/AuthContext";
import { hasActionPermission } from "../utils/permissions";
import PartnerNetworkFields from "../components/PartnerNetworkFields";
import CameraFileInput from "../components/CameraFileInput";
import { formatApplicationLocation } from "../utils/applicationLocation";

/* ── UI-only helpers (styles, icons) ───────────────── */

const statusStyle = (status) => {
  const value = String(status || "");
  if (value === "pending") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (value === "rejected") return "bg-red-50 text-red-700 ring-red-200";
  if (value === "verified" || value === "approved" || value === "installed") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (value === "submitted_to_govt") return "bg-indigo-50 text-indigo-700 ring-indigo-200";
  return "bg-blue-50 text-blue-700 ring-blue-200";
};
const SECTION_ICONS = {
  "Application Details": FileText,
  "Personal Details": User,
  "Address": MapPin,
  "Electricity Connection": Zap,
  "Bank Details": Landmark,
  "Uploaded Documents": FileText,
  "Site Documentation": Camera,
  "Customer Remarks": MessageSquare,
};
const FIELD_ICONS = {
  "Location": MapPin, "System Type": Zap, "System Size": Zap,
  "Super-vendor": Briefcase, "Vendor": Briefcase, "Sub Vendor": Briefcase, "Sales Executive": User, "Income Source": Briefcase,
  "Full Name": User, "Phone": Phone, "Gender": User, "Date of Birth": CalendarDays, "Email": Mail,
  "State": MapPin, "District": MapPin, "Block": MapPin, "Gram Panchayat": MapPin, "Building / Plot": Building2, "Village": MapPin,
  "City": MapPin, "Post Office": Mail, "PIN Code": Hash, "Landmark": MapPin, "Municipality": Building2, "Ward Number": Hash, "Street / Locality": MapPin,
  "Consumer Number": Hash, "Sub Division": Building2, "Tariff": Zap,
  "Bank Name": Landmark, "Account Number": Hash, "IFSC Code": Hash,
  "Latitude": MapPin, "Longitude": MapPin, "GPS accuracy": Zap,
};
const COPYABLE = new Set(["Phone", "Email", "Consumer Number", "Account Number", "IFSC Code", "Latitude", "Longitude"]);
const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "A";
const isImageUrl = (value) => /\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(String(value || ""));
const formatDT = (value) => value ? new Date(value).toLocaleString("en-IN") : "—";

const BTN_PRIMARY = "inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber px-5 py-3 text-sm font-bold text-navy shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-hover hover:shadow-md active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";
const BTN_NAVY = "inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-navy-light hover:shadow-md active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";
const FIELD_INPUT = "mt-1.5 w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm font-normal text-navy transition focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30";
const HERO_BASE = "group inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-5 text-sm font-bold transition hover:-translate-y-0.5 active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";
const HERO_NAVY = `${HERO_BASE} bg-navy text-white shadow-sm hover:bg-navy-light hover:shadow-lg`;
const HERO_PRIMARY = `${HERO_BASE} bg-gradient-to-r from-amber to-amber-hover text-navy shadow-md shadow-amber/30 hover:shadow-lg hover:shadow-amber/40`;
const BUBBLE_ON_NAVY = "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber text-navy transition group-hover:scale-110";
const BUBBLE_ON_AMBER = "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-amber transition group-hover:scale-110";

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
    if (user?.role !== "employee" || !app?.id) return;
    let active = true;
    setForwardError("");
    setLoadingForwardOptions(true);
    getApplicationForwardOptions(id)
      .then((response) => {
        if (!active) return;
        const employees = response.data.items || [];
        setBackOfficeEmployees(employees);
        setForwardEmployeeId((current) => employees.some((employee) => String(employee.id) === current)
          ? current
          : (employees[0] ? String(employees[0].id) : ""));
      })
      .catch((err) => {
        if (active) setForwardError(err.message || "Could not load Back Office employees.");
      })
      .finally(() => { if (active) setLoadingForwardOptions(false); });
    return () => { active = false; };
  }, [id, user?.role, app?.id]);

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

  const documentList = [
    ["file_aadhaar_front", "Aadhaar Front"],
    ["file_aadhaar_back", "Aadhaar Back"],
    ["file_pan_card", "PAN Front"],
    ["file_pan_back", "PAN Back"],
    ["file_photo", "Photo"],
    ["file_signature", "Signature"],
    ["file_electricity_bill", "Electricity Bill"],
    ["file_cheque_passbook", "Cheque / Passbook"],
    ["file_site_photo", "Site Photo"],
  ].filter(([key]) => documentPresence[key] || app[key]);
  const systemLabel = [app.system_size, app.system_type].filter(Boolean).join(" · ") || "—";
  const hasGps = app.site_latitude != null && app.site_longitude != null;

  return (
    <>
      <div className="mb-6 overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
        <div className="relative h-36 overflow-hidden bg-gradient-to-r from-navy via-navy to-navy-light sm:h-40">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-amber/20" />
          <div className="pointer-events-none absolute right-40 top-14 h-28 w-28 rounded-full bg-amber/10" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber via-amber/60 to-transparent" />
          <div className="absolute inset-x-5 top-5 flex flex-wrap items-center justify-between gap-2 sm:inset-x-6">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/20"><ArrowLeft size={14} />Back</button>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber px-3 py-1 font-mono text-[11px] font-bold text-navy">{app.application_no}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ring-1 ring-inset ${statusStyle(app.status)}`}><BadgeCheck size={12} />{applicationStatusLabel(app.status)}</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 sm:px-6">
          <div className="flex flex-wrap items-start gap-4 sm:gap-6">
            <div className="relative z-10 -mt-14 grid h-28 w-28 shrink-0 place-items-center rounded-full bg-amber-soft text-3xl font-extrabold text-navy shadow-lg ring-4 ring-white sm:-mt-16 sm:h-32 sm:w-32">{initials(app.full_name)}</div>

            <div className="min-w-[260px] flex-1 pt-1 sm:pt-3">
              <h2 className="break-words text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{app.full_name}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {app.phone_number && <span className="inline-flex items-center gap-1.5 rounded-full bg-offwhite px-3 py-1.5 text-xs font-semibold text-navy"><Phone size={13} className="text-amber" />{app.phone_number}</span>}
                <span className="inline-flex items-center gap-1.5 break-all rounded-full bg-offwhite px-3 py-1.5 text-xs font-semibold text-navy"><Mail size={13} className="text-amber" />{app.email || "No email"}</span>
              </div>
              {(app.created_at || app.last_updated_by_name) && <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><Clock size={12} className="text-amber" />{app.created_at ? `Created ${formatDT(app.created_at)}` : ""}{app.last_updated_by_name ? ` · Updated by ${app.last_updated_by_name}: ${formatDT(app.last_updated_by_at)}` : ""}</p>}
            </div>

            {(canEdit || canDownload) && <div className="flex w-full flex-wrap gap-2 border-t border-navy/10 pt-5">
              {canEdit && <button onClick={() => setShowEditForm(true)} className={HERO_NAVY}><span className={BUBBLE_ON_NAVY}>{isTechnicalEmployee ? <Camera size={15} /> : <Pencil size={15} />}</span>{isTechnicalEmployee ? "Upload Progress Photos" : "Edit Details"}</button>}
              {canDownload && <button onClick={() => downloadApplicationPdf(app.id)} className={HERO_PRIMARY}><span className={BUBBLE_ON_AMBER}><Download size={15} /></span>Download PDF</button>}
            </div>}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <HeroStat icon={MapPin} label="Location">{formatApplicationLocation(app.location) || "—"}</HeroStat>
            <HeroStat icon={Zap} label="System">{systemLabel}</HeroStat>
            <HeroStat icon={User} label="Sales Executive">{app.sales_executive_name || "—"}</HeroStat>
            <HeroStat icon={FileText} label="Documents">{documentList.length ? `${documentList.length} uploaded` : "None uploaded"}</HeroStat>
          </div>
        </div>
      </div>

      {showEditForm && canEdit && <ApplicationEditForm app={app} technicalOnly={isTechnicalEmployee} onClose={() => setShowEditForm(false)} onSaved={async () => { setShowEditForm(false); await load(); }} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <InfoSection
            title="Application Details"
            items={[
              ["Location", formatApplicationLocation(app.location)],
              ["System Type", app.system_type],
              ["System Size", app.system_size],
              ["Super-vendor", app.super_vendor_name],
              ["Vendor", app.vendor_name],
              ["Sub Vendor", app.sub_vendor_name],
              ["Sales Executive", app.sales_executive_name],
              ["Income Source", app.income_source],
            ]}
          />

          <InfoSection
            title="Personal Details"
            items={[
              ["Full Name", app.full_name],
              ["Phone", app.phone_number],
              ["Gender", app.gender],
              ["Date of Birth", app.dob],
              ["Email", app.email],
            ]}
          />

          <InfoSection
            title="Address"
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

          <InfoSection
            title="Electricity Connection"
            items={[
              ["Consumer Number", app.consumer_number],
              ["Sub Division", app.sub_division],
              ["Tariff", app.tariff],
            ]}
          />

          <InfoSection
            title="Bank Details"
            items={[
              ["Bank Name", app.bank_name],
              ["Account Number", app.account_number],
              ["IFSC Code", app.ifsc_code],
            ]}
          />

          <InfoSection title="Uploaded Documents" badge={documentList.length ? `${documentList.length} ${documentList.length === 1 ? "file" : "files"}` : ""} empty={!documentList.length}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {documentList.map(([key, label]) => canDownload && app[key] ? (
                <a key={key} href={fileUrl(app[key])} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 rounded-xl border border-navy/10 bg-white p-3 transition hover:border-amber hover:shadow-sm">
                  {isImageUrl(app[key]) || isImageUrl(fileUrl(app[key]))
                    ? <img src={fileUrl(app[key])} alt={label} loading="lazy" className="h-11 w-11 shrink-0 rounded-lg border border-navy/10 object-cover" />
                    : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-amber-soft text-amber"><FileText size={18} /></span>}
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-navy">{label}</span><span className="block text-xs text-muted">Click to view</span></span>
                  <Download size={15} className="shrink-0 text-muted transition group-hover:text-amber" />
                </a>
              ) : <div key={key} className="flex items-center gap-3 rounded-xl border border-navy/10 bg-slate-50 p-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-muted"><FileText size={18} /></span><span className="text-sm font-semibold text-muted">{label} · no download access</span></div>)}
            </div>
          </InfoSection>

          <InfoSection title="Site Documentation" badge={hasGps ? "GPS captured" : ""} empty={false}>
            {app.file_site_photo && <div className="mb-4 overflow-hidden rounded-xl border border-navy/10 bg-offwhite">
              <a href={fileUrl(app.file_site_photo)} target="_blank" rel="noopener noreferrer" aria-label="Open site photo">
                <img src={fileUrl(app.file_site_photo)} alt="Submitted site documentation" loading="lazy" className="max-h-80 w-full object-contain" />
              </a>
              <div className="flex items-center justify-between gap-3 border-t border-navy/10 bg-white px-4 py-3">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-navy"><Camera size={15} className="text-amber" />GPS Site Photo</span>
                {canDownload && <a href={fileUrl(app.file_site_photo)} download className="inline-flex items-center gap-1.5 rounded-full border border-navy/20 px-3.5 py-1.5 text-xs font-bold text-navy transition hover:border-amber"><Download size={13} /> Download</a>}
              </div>
            </div>}
            {hasGps ? <>
              <div className="grid gap-3 sm:grid-cols-3">
                <GpsValue label="Latitude" value={`${Number(app.site_latitude).toFixed(7)}°`} />
                <GpsValue label="Longitude" value={`${Number(app.site_longitude).toFixed(7)}°`} />
                <GpsValue label="GPS accuracy" value={app.site_accuracy_m != null ? `±${app.site_accuracy_m} m` : "Not recorded"} />
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border border-navy/10 shadow-sm">
                <iframe title="Application site map" src={`https://www.google.com/maps?q=${encodeURIComponent(`${app.site_latitude},${app.site_longitude}`)}&z=16&output=embed`} className="h-64 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              <a className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-navy/20 px-4 py-2 text-xs font-bold text-navy transition hover:border-amber" href={`https://maps.google.com/?q=${app.site_latitude},${app.site_longitude}`} target="_blank" rel="noreferrer"><ExternalLink size={13} />Open site in Google Maps</a>
            </> : <p className="rounded-xl border border-dashed border-navy/15 px-4 py-5 text-center text-sm text-muted">GPS coordinates were not captured for this application.</p>}
            {!app.file_site_photo && <p className="mt-3 rounded-xl border border-dashed border-navy/15 px-4 py-5 text-center text-sm text-muted">No GPS site photo was uploaded.</p>}
          </InfoSection>

          {app.remarks && (
            <InfoSection title="Customer Remarks">
              <p className="whitespace-pre-wrap rounded-xl bg-offwhite px-4 py-3 text-sm font-medium italic text-navy">{app.remarks}</p>
            </InfoSection>
          )}
        </div>

        <div className="space-y-6">
          {(app.technical_assignee_name || app.technical_instructions) && <SideCard icon={Wrench} title="Technical assignment" subtitle="Work assigned for this installation.">
            {app.technical_assignee_name && <p className="flex items-center justify-between gap-3 rounded-xl bg-offwhite px-4 py-3 text-sm text-navy"><span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Assigned to</span><strong>{app.technical_assignee_name}</strong></p>}
            {app.technical_instructions && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-offwhite px-4 py-3 text-sm text-muted">{app.technical_instructions}</p>}
          </SideCard>}
          {app.forwarded_to_employee_name && <SideCard icon={Send} title="Back Office handoff" subtitle="This application was forwarded.">
            <p className="flex items-center justify-between gap-3 rounded-xl bg-offwhite px-4 py-3 text-sm text-navy"><span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Forwarded to</span><strong>{app.forwarded_to_employee_name}</strong></p>
            {app.forwarded_by_employee_name && <p className="mt-3 text-xs text-muted">Forwarded by {app.forwarded_by_employee_name}{app.forwarded_at ? ` · ${new Date(app.forwarded_at).toLocaleString("en-IN")}` : ""}</p>}
          </SideCard>}
          {isOwner && <SideCard icon={Wrench} title="Technical work assignment" subtitle="Assign the application to a technical employee with access to its state.">
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-muted">Technical employee
                <select value={technicalAssignee} onChange={(event) => setTechnicalAssignee(event.target.value)} className={`${FIELD_INPUT} font-semibold`}>
                  <option value="">Unassigned</option>
                  {technicalEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {employee.location || "Any location"}</option>)}
                </select>
              </label>
              <label className="block text-xs font-semibold text-muted">Work instructions
                <textarea value={technicalInstructions} onChange={(event) => setTechnicalInstructions(event.target.value)} rows={3} maxLength={4000} placeholder="Work instructions (optional)" className={FIELD_INPUT} />
              </label>
              <button onClick={saveTechnicalAssignment} disabled={savingAssignment} className={BTN_NAVY}>{savingAssignment ? "Saving..." : "Save Assignment"}</button>
            </div>
          </SideCard>}
          {canEdit && <SideCard icon={BadgeCheck} title="Update Status" subtitle="Change the application's current status and leave a note.">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-offwhite px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Current status</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-right text-[11px] font-bold ring-1 ring-inset ${statusStyle(app.status)}`}><BadgeCheck size={12} className="shrink-0" />{applicationStatusLabel(app.status)}</span>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-muted">Change status to</p>
                <StatusDropdown
                  value={newStatus}
                  options={[...availableStatusOptions, ...(!availableStatusOptions.some((status) => status.value === app.status) ? [{ value: app.status, label: `${applicationStatusLabel(app.status)} (current)` }] : [])]}
                  open={statusMenuOpen}
                  onOpenChange={setStatusMenuOpen}
                  onChange={setNewStatus}
                />
              </div>
              <label className="block text-xs font-semibold text-muted">Note
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder={newStatus === "other" ? "Describe the other status (required)" : "Note (optional)"}
                  rows={3}
                  required={newStatus === "other"}
                  className={FIELD_INPUT}
                />
              </label>
              <div className="space-y-2.5 pt-1">
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating || newStatus === app.status || (newStatus === "other" && !statusNote.trim())}
                  className={BTN_PRIMARY}
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
                      className={BTN_NAVY}
                    >
                      <Send size={16} />
                      Submit to Govt Portal
                    </button>
                  </>
                )}
              </div>
            </div>
          </SideCard>}

          {user?.role === "employee" && <SideCard icon={Send} title="Forward to Back Office" subtitle="Select the active Back Office employee who should receive this application.">
            <div className="space-y-3">
              {forwardError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{forwardError}</p>}
              {loadingForwardOptions ? <p className="rounded-xl bg-offwhite px-4 py-3 text-xs text-muted">Loading Back Office employees…</p>
                : backOfficeEmployees.length ? <label className="block text-xs font-semibold text-muted">Back Office employee<select value={forwardEmployeeId} onChange={(event) => setForwardEmployeeId(event.target.value)} className={`${FIELD_INPUT} font-semibold`}>{backOfficeEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}{employee.designation ? ` · ${employee.designation}` : ""}</option>)}</select></label>
                  : !forwardError && <p className="rounded-xl bg-offwhite px-4 py-3 text-xs text-muted">No eligible Back Office employees were found.</p>}
              <button type="button" onClick={handleForward} disabled={forwarding || !forwardEmployeeId} className={BTN_PRIMARY}>{forwarding ? "Forwarding…" : "Forward application"}</button>
            </div>
          </SideCard>}

          <SideCard icon={Clock} title="Status & Forwarding History" subtitle="Status changes and every Back Office handoff, newest first." badge={<span className="shrink-0 rounded-full bg-amber-soft px-3 py-1 text-xs font-bold text-navy">{history.length} {history.length === 1 ? "update" : "updates"}</span>}>
            {history.length === 0 && (
              <p className="rounded-xl border border-dashed border-navy/15 px-4 py-6 text-center text-xs text-muted">No history yet.</p>
            )}
            {history.length > 0 && <div className="ml-2 space-y-6 border-l-2 border-amber/30 pl-6">
              {history.map((h, index) => (
                <div key={h.id} className="relative">
                  <span className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white ring-2 ${index === 0 ? "bg-amber ring-amber/40" : "bg-amber/40 ring-amber/15"}`} />
                  <div className="flex flex-wrap items-center gap-2">
                    {h.event_type === "forwarded"
                      ? <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 ring-1 ring-inset ring-indigo-200">Forwarded to Back Office</span>
                      : <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${statusStyle(h.new_status)}`}>{applicationStatusLabel(h.new_status)}</span>}
                    {index === 0 && <span className="rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Latest</span>}
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-navy">{new Date(h.created_at).toLocaleString("en-IN")}</p>
                  {h.changed_by_name && (
                    <p className="text-xs text-muted">{h.event_type === "forwarded" ? "Forwarded by" : "by"} {h.changed_by_name}</p>
                  )}
                  {h.event_type === "forwarded" && <div className="mt-2 rounded-lg bg-offwhite px-3 py-2 text-xs text-muted">
                    <p><strong className="text-navy">Application:</strong> {h.application_no}{h.customer_name ? ` · ${h.customer_name}` : ""}</p>
                    <p className="mt-1"><strong className="text-navy">Forwarded to:</strong> {h.forwarded_to_employee_name}</p>
                    <p className="mt-1"><strong className="text-navy">Status then:</strong> {applicationStatusLabel(h.application_status)}</p>
                  </div>}
                  {h.note && (
                    <p className="mt-2 rounded-lg bg-offwhite px-3 py-2 text-xs italic text-muted">{h.note}</p>
                  )}
                </div>
              ))}
            </div>}
          </SideCard>
        </div>
      </div>

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

function HeroStat({ icon: Icon, label, children }) {
  return <div className="flex items-start gap-3 rounded-xl border border-navy/10 border-l-4 border-l-amber bg-offwhite px-4 py-3 transition hover:shadow-sm">
    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-soft text-amber"><Icon size={16} /></span>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 break-words text-sm font-semibold text-navy">{children}</p>
    </div>
  </div>;
}

function SideCard({ icon: Icon, title, subtitle, badge, children }) {
  return <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
    <div className="flex items-start gap-3 border-b border-navy/10 bg-gradient-to-r from-amber-soft/60 to-white px-5 py-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber text-navy shadow-sm"><Icon size={18} /></span>
      <div className="min-w-0 flex-1"><h3 className="text-base font-bold text-navy">{title}</h3>{subtitle && <p className="mt-0.5 text-xs leading-relaxed text-muted">{subtitle}</p>}</div>
      {badge}
    </div>
    <div className="p-5">{children}</div>
  </section>;
}

function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  return <button type="button" aria-label="Copy value" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard blocked */ } }} className="shrink-0 rounded-md p-1.5 text-muted transition hover:bg-white hover:text-amber focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
    {done ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
  </button>;
}

function FieldTile({ label, value }) {
  const Icon = FIELD_ICONS[label];
  const wide = String(value).length > 48;
  return <div className={`group flex items-start gap-3 rounded-xl border border-transparent bg-offwhite px-4 py-3 transition hover:border-amber/40 ${wide ? "sm:col-span-2 xl:col-span-3" : ""}`}>
    {Icon && <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-navy/10 bg-white text-amber"><Icon size={15} /></span>}
    <div className="min-w-0 flex-1">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-navy">{value}</dd>
    </div>
    {COPYABLE.has(label) && <CopyButton text={String(value)} />}
  </div>;
}

function InfoSection({ title, items, children, badge, empty }) {
  const Icon = SECTION_ICONS[title] || FileText;
  const visibleItems = (items || []).filter(([, v]) => v !== undefined && v !== null && v !== "");
  const hasContent = children ? !empty : visibleItems.length > 0;
  return (
    <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
      <div className={`flex items-center gap-3 px-5 py-4 ${hasContent ? "border-b border-navy/10" : ""}`}>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-soft text-amber"><Icon size={18} /></span>
        <h3 className="flex-1 text-base font-bold text-navy">{title}</h3>
        {badge && <span className="rounded-full bg-amber-soft px-3 py-1 text-xs font-bold text-navy">{badge}</span>}
        {!hasContent && <span className="rounded-full bg-navy/5 px-3 py-1 text-xs font-semibold text-muted">Not provided</span>}
      </div>
      {hasContent && <div className="p-5">
        {children || <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{visibleItems.map(([label, value]) => <FieldTile key={label} label={label} value={value} />)}</dl>}
      </div>}
    </section>
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
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-navy/15 bg-white px-4 py-3 text-left text-sm font-semibold text-navy transition hover:border-amber focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
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

function GpsValue({ label, value }) {
  const Icon = FIELD_ICONS[label];
  return <div className="group flex items-start gap-3 rounded-xl border border-transparent bg-offwhite px-4 py-3 transition hover:border-amber/40">
    {Icon && <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-navy/10 bg-white text-amber"><Icon size={15} /></span>}
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-all text-sm font-semibold text-navy">{value}</p>
    </div>
    {COPYABLE.has(label) && <CopyButton text={String(value)} />}
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
