import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Briefcase, Building2, CalendarDays, Check, Clock, Copy, ExternalLink, Download, FileText, Hash, KeyRound, Landmark, Loader2, Mail, MapPin, Pencil, Phone, Send, ShieldCheck, User, Wallet, Zap } from "lucide-react";
import PartnerDetailsModal from "../components/PartnerDetailsModal";
import { useAuth } from "../contexts/AuthContext";
import { isHrEmployee } from "../utils/employeeRoles";
import { downloadPartnerAgreement, downloadPartnerAgreementPdf, fileUrl, getPartnerDetail, resetPartnerPassword, sendPartnerAgreement, setOwnerPartnerCommission, updatePartnerDashboardAccess, updatePartnerStatus } from "../services/api";

const STATUS_OPTIONS = [
  ["new", "Submitted"], ["reviewed", "Under Review"], ["approved", "Approved"], ["active", "Active"], ["inactive", "Inactive"], ["rewarded", "Rewarded"], ["rejected", "Rejected"],
];
const SEND_AGREEMENT_ACTION = "__send_agreement_mail__";
const partnerStatusLabel = (status) => ({ new: "Submitted", reviewed: "Under Review" }[status] || titleCase(status));

const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-IN") : "—";
const titleCase = (value = "") => value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
const readPermissions = (value) => {
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value || "[]"); } catch { return []; }
};
const STATUS_STYLES = {
  new: "bg-amber-50 text-amber-700 ring-amber-200",
  reviewed: "bg-blue-50 text-blue-700 ring-blue-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  inactive: "bg-slate-100 text-slate-700 ring-slate-200",
  rewarded: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};
const SECTION_ICONS = {
  "Partner Details": User,
  "Referral Commission Offered to This Partner": Wallet,
  "Registration Details": ShieldCheck,
  "Address": MapPin,
  "Bank Details": Landmark,
  "Uploaded Documents": FileText,
};
const FIELD_ICONS = {
  "Partner Type": Briefcase,
  "Partner Login ID": KeyRound,
  "Partner Login Status": ShieldCheck,
  "Commission": Wallet,
  "Commission Chart": Wallet,
  "Company Name": Building2,
  "Contact Name": User,
  "Phone": Phone,
  "Email": Mail,
  "Aadhaar Number": Hash,
  "Date of Birth": CalendarDays,
  "Experience": Briefcase,
  "Assigned Locations": MapPin,
  "System Types": Zap,
  "On-Grid": Zap,
  "Hybrid": Zap,
  "Paid by": Wallet,
  "GST Number": Hash,
  "PAN Number": Hash,
  "MSME Number": Hash,
  "Address": MapPin,
  "City": MapPin,
  "State": MapPin,
  "PIN Code": Hash,
  "Bank Name": Landmark,
  "Account Number": Hash,
  "IFSC Code": Hash,
};
const COPYABLE = new Set(["Partner Login ID", "Phone", "Email", "Aadhaar Number", "GST Number", "PAN Number", "MSME Number", "Account Number", "IFSC Code"]);
const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "P";
const isImageUrl = (value) => /\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(String(value || ""));
const BTN_PRIMARY = "inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber px-5 py-3 text-sm font-bold text-navy shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-hover hover:shadow-md active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none";
const BTN_OUTLINE = "inline-flex w-full items-center justify-center gap-2 rounded-full border border-navy/20 bg-white px-5 py-2.5 text-sm font-bold text-navy transition hover:-translate-y-0.5 hover:border-amber hover:bg-amber-soft/40 hover:shadow-sm active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";
const HERO_BASE = "group inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-5 text-sm font-bold transition hover:-translate-y-0.5 active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";
const HERO_NAVY = `${HERO_BASE} bg-navy text-white shadow-sm hover:bg-navy-light hover:shadow-lg`;

const HERO_OUTLINE = `${HERO_BASE} border border-navy/20 bg-white text-navy shadow-sm hover:border-amber hover:shadow-md`;
const BUBBLE_ON_NAVY = "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber text-navy transition group-hover:scale-110";

const BUBBLE_ON_WHITE = "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-soft text-amber transition group-hover:bg-amber group-hover:text-navy";
const hasValue = (value) => Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== "";

export default function PartnerDetail() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const canEditPartner = isOwner || isHrEmployee(user);
  const { id } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [history, setHistory] = useState([]);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [downloadingAgreement, setDownloadingAgreement] = useState(false);
  const [downloadingAgreementPdf, setDownloadingAgreementPdf] = useState(false);
  const [sendingAgreement, setSendingAgreement] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [creatingLogin, setCreatingLogin] = useState(false);
  const [resettingLogin, setResettingLogin] = useState(false);
  const [savingDashboardAccess, setSavingDashboardAccess] = useState(false);
  const [applicationsAccess, setApplicationsAccess] = useState(false);

  const load = async () => {
    try {
      const response = await getPartnerDetail(id);
      setPartner(response.data.partner);
      setApplicationsAccess(readPermissions(response.data.partner.partner_permissions).includes("applications"));
      setHistory(response.data.history || []);
      setNewStatus(response.data.partner.status);
      setError("");
    } catch (err) {
      setError(err.message || "Could not load partner details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */ }, [id]);

  const saveStatus = async () => {
    if (!partner) return;
    const shouldSendAgreement = newStatus === SEND_AGREEMENT_ACTION;
    if (!shouldSendAgreement && newStatus === partner.status) return;
    if (shouldSendAgreement && partner.status !== "approved") {
      setError("Approve and save this partner before sending the agreement.");
      return;
    }
    if (shouldSendAgreement && !partner.email) {
      setError("Add the partner email address before sending the agreement.");
      return;
    }
    setUpdating(true);
    setError("");
    setNotice("");
    try {
      if (shouldSendAgreement) {
        const sent = await sendAgreement();
        if (sent) setNewStatus(partner.status);
        return;
      }
      const response = await updatePartnerStatus(id, newStatus, statusNote.trim());
      setStatusNote("");
      const credentials = response.data?.accountCredentials;
      setNotice(credentials
        ? `Partner approved. Login ID: ${credentials.loginId} · Temporary password: ${credentials.password}. Share these credentials with the partner; they must change the password after signing in.`
        : response.message || "Status updated.");
      await load();
    } catch (err) {
      setError(err.message || "Could not update partner status.");
    } finally {
      setUpdating(false);
    }
  };

  const createPartnerLogin = async () => {
    if (!partner || creatingLogin) return;
    setCreatingLogin(true);
    setError("");
    setNotice("");
    try {
      const response = await updatePartnerStatus(id, "approved");
      const credentials = response.data?.accountCredentials;
      setNotice(credentials
        ? `Partner login created. Login ID: ${credentials.loginId} · Temporary password: ${credentials.password}. Share these with the partner; they must change the password after signing in.`
        : "This partner already has a login account.");
      await load();
    } catch (err) {
      setError(err.message || "Could not create the partner login.");
    } finally {
      setCreatingLogin(false);
    }
  };

  const resetPartnerLogin = async () => {
    if (!partner || resettingLogin) return;
    setResettingLogin(true);
    setError("");
    setNotice("");
    try {
      const response = await resetPartnerPassword(id);
      setNotice(`Partner password reset. Login ID: ${response.data.loginId} · Temporary password: ${response.data.password}. Share these with the partner; they must change the password after signing in.`);
    } catch (err) {
      setError(err.message || "Could not reset the partner password.");
    } finally {
      setResettingLogin(false);
    }
  };

  const saveDashboardAccess = async () => {
    if (!partner || savingDashboardAccess) return;
    setSavingDashboardAccess(true);
    setError("");
    setNotice("");
    try {
      await updatePartnerDashboardAccess(id, applicationsAccess);
      setNotice(applicationsAccess ? "Applications access granted. The partner can see applications assigned to them." : "Applications access removed.");
      await load();
    } catch (err) {
      setError(err.message || "Could not update partner dashboard access.");
    } finally {
      setSavingDashboardAccess(false);
    }
  };

  const downloadAgreement = async () => {
    setDownloadingAgreement(true);
    setError("");
    setNotice("");
    try {
      await downloadPartnerAgreement(id);
      setNotice("Sales commission agreement downloaded.");
    } catch (err) {
      setError(err.message || "Could not download the agreement.");
    } finally {
      setDownloadingAgreement(false);
    }
  };

  const downloadAgreementPdf = async () => {
    setDownloadingAgreementPdf(true);
    setError("");
    setNotice("");
    try {
      await downloadPartnerAgreementPdf(id);
      setNotice("Sales commission agreement PDF downloaded.");
    } catch (err) {
      setError(err.message || "Could not download the agreement PDF.");
    } finally {
      setDownloadingAgreementPdf(false);
    }
  };

  const sendAgreement = async () => {
    if (!partner) return false;
    if (partner.status !== "approved") {
      setError("Approve the partner before sending the agreement.");
      return false;
    }
    if (!partner.email) {
      setError("Add the partner email address before sending the agreement.");
      return false;
    }
    setSendingAgreement(true);
    setError("");
    setNotice("");
    try {
      const response = await sendPartnerAgreement(id);
      setNotice(response.message || "Agreement PDF sent to the partner's email.");
      return true;
    } catch (err) {
      setError(err.message || "Could not send the agreement.");
      return false;
    } finally {
      setSendingAgreement(false);
    }
  };

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="animate-spin text-amber" /></div>;
  if (error && !partner) return <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  if (!partner) return null;

  const documents = [
    ["GST Certificate", "GST"], ["PAN Card (Front)", "PAN"], ["PAN Card (Back)", "PAN Back"],
    ["Aadhaar (Front)", "Aadhaar"], ["Aadhaar (Back)", "Aadhaar Back"],
    ["Partner Photo", "Photo"],
    ["MSME Certificate", "MSME"], ["Business Document", "Business Document"],
    ["Cheque / Passbook", "Cheque / Passbook"],
  ].filter(([, key]) => partner.documentUrls?.[key]);
  const timeline = history.length ? history : [{
    id: "current-status",
    new_status: partner.status,
    created_at: partner.updated_at || partner.created_at,
    changed_by_name: partner.updated_by_name,
    note: "Older status changes were not recorded.",
  }];
  const partnerTypeLabel = ["sub_vendor", "sub_vendor_commission"].includes(partner.partner_type) ? "Sub-vendor" : titleCase(partner.partner_type);
  const locationLabels = (Array.isArray(partner.assigned_locations) ? partner.assigned_locations : []).map((location) => ({ odisha: "Odisha", west_bengal: "West Bengal" })[location]).filter(Boolean);
  const systemLabels = (Array.isArray(partner.system_types) ? partner.system_types : []).map((system) => system === "on_grid" ? "On-Grid System" : system === "hybrid" ? "Hybrid System" : system);
  const isPerInstallation = partner.commission_model === "per_completed_installation" || partner.partner_type === "sub_vendor_commission";

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
              <span className="rounded-full bg-amber px-3 py-1 font-mono text-[11px] font-bold text-navy">Partner #{partner.id}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ring-1 ring-inset ${STATUS_STYLES[partner.status] || "bg-slate-100 text-slate-700 ring-slate-200"}`}><BadgeCheck size={12} />{partnerStatusLabel(partner.status)}</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white ring-1 ring-white/25">{partnerTypeLabel}</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 sm:px-6">
          <div className="flex flex-wrap items-start gap-4 sm:gap-6">
            {partner.documentUrls?.Photo
              ? <a href={fileUrl(partner.documentUrls.Photo)} target="_blank" rel="noreferrer" aria-label="Open partner profile image" className="relative z-10 -mt-14 shrink-0 rounded-full sm:-mt-16"><img src={fileUrl(partner.documentUrls.Photo)} alt="Partner profile" className="h-28 w-28 rounded-full border border-navy/10 object-cover shadow-lg ring-4 ring-white sm:h-32 sm:w-32" /></a>
              : <div className="relative z-10 -mt-14 grid h-28 w-28 shrink-0 place-items-center rounded-full bg-amber-soft text-3xl font-extrabold text-navy shadow-lg ring-4 ring-white sm:-mt-16 sm:h-32 sm:w-32">{initials(partner.company_name || partner.contact_name)}</div>}

            <div className="min-w-[260px] flex-1 pt-1 sm:pt-3">
              <h2 className="break-words text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{partner.company_name}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {partner.contact_name && <span className="inline-flex items-center gap-1.5 rounded-full bg-offwhite px-3 py-1.5 text-xs font-semibold text-navy"><User size={13} className="text-amber" />{partner.contact_name}</span>}
                {partner.phone && <span className="inline-flex items-center gap-1.5 rounded-full bg-offwhite px-3 py-1.5 text-xs font-semibold text-navy"><Phone size={13} className="text-amber" />{partner.phone}</span>}
                {partner.email && <span className="inline-flex items-center gap-1.5 break-all rounded-full bg-offwhite px-3 py-1.5 text-xs font-semibold text-navy"><Mail size={13} className="text-amber" />{partner.email}</span>}
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><Clock size={12} className="text-amber" />Created {formatDateTime(partner.created_at)} · Updated by {partner.updated_by_name || "—"}: {formatDateTime(partner.updated_at)}</p>
            </div>

            <div className="flex w-full flex-wrap gap-2 border-t border-navy/10 pt-5">
              {canEditPartner && <button onClick={() => setEditOpen(true)} className={HERO_NAVY}><span className={BUBBLE_ON_NAVY}><Pencil size={15} /></span>Edit Details</button>}
              
              {isOwner && <>
                <button onClick={downloadAgreement} disabled={downloadingAgreement} className={HERO_OUTLINE}><span className={BUBBLE_ON_WHITE}>{downloadingAgreement ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}</span>{downloadingAgreement ? "Downloading..." : "Download Agreement (Word)"}</button>
                <button onClick={downloadAgreementPdf} disabled={downloadingAgreementPdf} className={HERO_OUTLINE}><span className={BUBBLE_ON_WHITE}>{downloadingAgreementPdf ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}</span>{downloadingAgreementPdf ? "Downloading..." : "Download Agreement PDF"}</button>
              </>}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <HeroStat icon={MapPin} label="Assigned Locations">{locationLabels.length ? locationLabels.join(", ") : "Not assigned"}</HeroStat>
            <HeroStat icon={Zap} label="System Types">{systemLabels.length ? systemLabels.map((label) => label.replace(" System", "")).join(", ") : "—"}</HeroStat>
            <HeroStat icon={FileText} label="Documents">{documents.length ? `${documents.length} uploaded` : "None uploaded"}</HeroStat>
            {isOwner && <HeroStat icon={KeyRound} label="Partner Login">{partner.partner_login_id ? `${partner.partner_login_id} · ${titleCase(partner.partner_account_status || "active")}` : "Not created"}</HeroStat>}
          </div>
        </div>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3.5 text-sm text-green-800">{notice}</p>}
      {editOpen && <PartnerDetailsModal partner={partner} editing isOwner={canEditPartner} onClose={() => setEditOpen(false)} onEdit={() => {}} onSaved={async () => { setEditOpen(false); await load(); }} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <InfoSection title="Partner Details" groups={[
            ["Account & Role", [
              ["Partner Type", partnerTypeLabel],
              ...(isOwner && partner.partner_login_id ? [["Partner Login ID", partner.partner_login_id], ["Partner Login Status", titleCase(partner.partner_account_status || "active")]] : []),
              ["Commission", isPerInstallation ? "Per completed installation" : "—"],
            ]],
            ["Identity", [
              ["Company Name", partner.company_name], ["Contact Name", partner.contact_name],
              ["Aadhaar Number", partner.aadhaar_number], ["Gender", ({ male: "Male", female: "Female", other: "Other" }[partner.gender] || partner.gender)],
              ["Date of Birth", partner.dob ? String(partner.dob).slice(0, 10) : ""], ["Experience", partner.experience_years],
            ]],
            ["Contact", [["Phone", partner.phone], ["Email", partner.email]]],
            ["Coverage & Commission", [
              ["Assigned Locations", locationLabels.length ? locationLabels : "No locations assigned"],
              ["System Types", systemLabels],
              ["Commission Chart", isPerInstallation ? `On-Grid: ₹${Number(partner.commission_rates?.on_grid ?? 20000).toLocaleString("en-IN")} per completed installation · Hybrid: ₹${Number(partner.commission_rates?.hybrid ?? 30000).toLocaleString("en-IN")} per completed installation` : "—"],
            ]],
            ["About the Business", [["Business Description", partner.description]]],
          ]} />
          {canEditPartner && <InfoSection title="Referral Commission Offered to This Partner" items={[
            ["On-Grid", partner.referral_commission?.commission_rates?.on_grid === undefined ? "Not set" : `₹${Number(partner.referral_commission.commission_rates.on_grid).toLocaleString("en-IN")} per completed installation`],
            ["Hybrid", partner.referral_commission?.commission_rates?.hybrid === undefined ? "Not set" : `₹${Number(partner.referral_commission.commission_rates.hybrid).toLocaleString("en-IN")} per completed installation`],
            ["Paid by", partner.referral_commission?.payer_partner_id ? partner.referrer_company_name || partner.referrer_contact_name || "Direct referrer" : "Owner"],
          ]} />}
          <InfoSection title="Registration Details" items={[
            ["GST Number", partner.gst_number], ["PAN Number", partner.pan_number], ["MSME Number", partner.msme_number],
          ]} />
          <InfoSection title="Address" items={[
            ["Address", partner.address], ["City", partner.city], ["State", partner.state], ["PIN Code", partner.pincode],
          ]} />
          {partner.site_latitude != null && partner.site_longitude != null && <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy/10 bg-white px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-soft text-amber"><MapPin size={18} /></span><div><h3 className="text-base font-bold text-navy">Submission GPS</h3><p className="text-xs text-muted">Accuracy: {partner.site_accuracy_m ?? "Not recorded"} m</p></div></div><a className="inline-flex items-center gap-1.5 rounded-full border border-navy/20 px-4 py-2 text-xs font-bold text-navy transition hover:border-amber" href={`https://maps.google.com/?q=${partner.site_latitude},${partner.site_longitude}`} target="_blank" rel="noreferrer"><ExternalLink size={13} />Open location on map</a></section>}
          <InfoSection title="Bank Details" items={[
            ["Bank Name", partner.bank_name], ["Account Number", partner.account_number], ["IFSC Code", partner.ifsc_code],
          ]} />
          <InfoSection title="Uploaded Documents" badge={documents.length ? `${documents.length} ${documents.length === 1 ? "file" : "files"}` : ""} empty={!documents.length}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {documents.map(([label, key]) => {
                const raw = partner.documentUrls[key];
                const url = fileUrl(raw);
                return <a key={key} href={url} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-xl border border-navy/10 bg-white p-3 transition hover:border-amber hover:shadow-sm">
                  {isImageUrl(raw) || isImageUrl(url)
                    ? <img src={url} alt={label} loading="lazy" className="h-11 w-11 shrink-0 rounded-lg border border-navy/10 object-cover" />
                    : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-amber-soft text-amber"><FileText size={18} /></span>}
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-navy">{label}</span><span className="block text-xs text-muted">Click to view</span></span>
                  <ExternalLink size={15} className="shrink-0 text-muted transition group-hover:text-amber" />
                </a>;
              })}
            </div>
          </InfoSection>
        </div>

        <div className="space-y-6">
          <SideCard icon={BadgeCheck} title="Update Status" subtitle="Change the review status or email the agreement to the partner.">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-offwhite px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Current status</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${STATUS_STYLES[partner.status] || "bg-slate-100 text-slate-700 ring-slate-200"}`}><BadgeCheck size={12} />{partnerStatusLabel(partner.status)}</span>
              </div>
              <label className="block text-xs font-semibold text-muted">Change status to
                <select value={newStatus} onChange={(event) => setNewStatus(event.target.value)} disabled={!canEditPartner} className="mt-1.5 w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm font-semibold text-navy transition focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30 disabled:bg-slate-100">
                  {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  {isOwner && <option value={SEND_AGREEMENT_ACTION}>Send Agreement Mail</option>}
                </select>
              </label>
              {isOwner && newStatus === SEND_AGREEMENT_ACTION && <p className="rounded-xl bg-amber-soft/50 px-4 py-3 text-xs leading-relaxed text-navy">{partner.status !== "approved" ? "Approve and save this partner first, then send the agreement." : !partner.email ? "Add the partner email before sending." : "Save this action to email the agreement PDF. Partner status will remain Approved."}</p>}
              <label className="block text-xs font-semibold text-muted">Note
                <textarea value={statusNote} onChange={(event) => setStatusNote(event.target.value)} disabled={!canEditPartner} placeholder="Note (optional)" rows={3} className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-sm font-normal text-navy transition focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30 disabled:bg-slate-100" />
              </label>
              <div className="space-y-2.5 pt-1">
                <button onClick={saveStatus} disabled={!canEditPartner || updating || sendingAgreement || (newStatus === partner.status)} className={BTN_PRIMARY}>{(updating || sendingAgreement) && <Loader2 size={16} className="animate-spin" />}{newStatus === SEND_AGREEMENT_ACTION ? "Send Agreement Mail" : "Save Status"}</button>
                {isOwner && <button onClick={sendAgreement} disabled={sendingAgreement || partner.status !== "approved" || !partner.email} className={BTN_OUTLINE}><Send size={15} />{sendingAgreement ? "Sending Agreement..." : "Send Agreement Mail"}</button>}
                {isOwner && ["super_vendor", "vendor", "sub_vendor", "dealer"].includes(partner.partner_type) && (partner.partner_type === "super_vendor" || partner.referred_by_partner_id) && partner.status === "approved" && !partner.partner_login_id && <button onClick={createPartnerLogin} disabled={creatingLogin} className={BTN_OUTLINE}><KeyRound size={15} />{creatingLogin ? "Creating Login..." : "Create Partner Login"}</button>}
                {isOwner && ["super_vendor", "vendor", "sub_vendor", "dealer"].includes(partner.partner_type) && ["approved", "active"].includes(partner.status) && partner.partner_login_id && <button onClick={resetPartnerLogin} disabled={resettingLogin} className={BTN_OUTLINE}><KeyRound size={15} />{resettingLogin ? "Resetting Password..." : "Reset Partner Password"}</button>}
              </div>
            </div>
          </SideCard>
          {isOwner && ["super_vendor", "vendor", "sub_vendor", "dealer"].includes(partner.partner_type) && <SideCard icon={KeyRound} title="Partner Dashboard Access" subtitle="Granted partners can only see applications assigned to their own partner name.">
            {partner.partner_login_id ? <>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-navy/10 bg-offwhite px-4 py-3 transition hover:border-amber/60">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-navy/10 bg-white text-amber"><FileText size={16} /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-navy">Applications</span><span className="block text-xs text-muted">View applications assigned to them</span></span>
                <input type="checkbox" checked={applicationsAccess} onChange={(event) => setApplicationsAccess(event.target.checked)} className="h-5 w-5 shrink-0 cursor-pointer accent-amber" />
              </label>
              <button onClick={saveDashboardAccess} disabled={savingDashboardAccess || !["approved", "active"].includes(partner.status)} className={`${BTN_PRIMARY} mt-4`}>{savingDashboardAccess ? "Saving..." : "Save Access"}</button>
            </> : <div className="rounded-xl border border-dashed border-navy/15 px-4 py-6 text-center"><span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-amber-soft text-amber"><KeyRound size={18} /></span><p className="mt-2 text-xs text-muted">Create the partner login first to manage dashboard access.</p></div>}
          </SideCard>}
          {canEditPartner && !partner.referred_by_partner_id && <OwnerReferralCommissionCard partner={partner} onSaved={load} />}
          <SideCard icon={Clock} title="Status Timeline" subtitle="Every status change, newest first." badge={<span className="shrink-0 rounded-full bg-amber-soft px-3 py-1 text-xs font-bold text-navy">{timeline.length} {timeline.length === 1 ? "update" : "updates"}</span>}>
            <div className="ml-2 space-y-6 border-l-2 border-amber/30 pl-6">
              {timeline.map((entry, index) => <div key={entry.id} className="relative">
                <span className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white ring-2 ${index === 0 ? "bg-amber ring-amber/40" : "bg-amber/40 ring-amber/15"}`} />
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${STATUS_STYLES[entry.new_status] || "bg-slate-100 text-slate-700 ring-slate-200"}`}>{partnerStatusLabel(entry.new_status)}</span>
                  {index === 0 && <span className="rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Latest</span>}
                </div>
                <p className="mt-1.5 text-xs font-semibold text-navy">{formatDateTime(entry.created_at)}</p>
                <p className="text-xs text-muted">by {entry.changed_by_name || "Partner"}</p>
                {entry.note && <p className="mt-2 rounded-lg bg-offwhite px-3 py-2 text-xs italic text-muted">{entry.note}</p>}
              </div>)}
            </div>
          </SideCard>
        </div>
      </div>
    </>
  );
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

function OwnerReferralCommissionCard({ partner, onSaved }) {
  const initial = partner.referral_commission?.commission_rates || {};
  const [rates, setRates] = useState({ on_grid: initial.on_grid ?? "", hybrid: initial.hybrid ?? "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      await setOwnerPartnerCommission(partner.id, rates);
      setMessage("Owner commission offer saved. Only this partner can see it.");
      await onSaved();
    } catch (error) {
      setMessage(error.message || "Could not save the commission offer.");
    } finally {
      setSaving(false);
    }
  };
  return <SideCard icon={Wallet} title="Owner offer to this partner" subtitle="This is the amount this partner receives from Owner, separate from any amount they may offer to their referrals.">
    <div className="grid grid-cols-1 gap-4">
      {[["on_grid", "On-Grid"], ["hybrid", "Hybrid"]].map(([key, label]) => <label key={key} className="block rounded-xl bg-offwhite p-3">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted"><Zap size={13} className="text-amber" />{label} · per installation</span>
        <span className="relative mt-2 block"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-amber">₹</span><input type="number" min="0" step="1" value={rates[key]} onChange={(event) => setRates((current) => ({ ...current, [key]: event.target.value }))} className="w-full rounded-xl border border-navy/15 bg-white py-3 pl-9 pr-3 text-base font-bold text-navy transition focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30" /></span>
      </label>)}
    </div>
    {message && <p role="status" className="mt-4 rounded-xl bg-amber-soft/50 px-4 py-3 text-xs leading-relaxed text-navy">{message}</p>}
    <button onClick={save} disabled={saving} className={`${BTN_PRIMARY} mt-4`}>{saving ? "Saving..." : "Save Owner Offer"}</button>
  </SideCard>;
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

function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  return <button type="button" aria-label="Copy value" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard blocked */ } }} className="shrink-0 rounded-md p-1.5 text-muted transition hover:bg-white hover:text-amber focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
    {done ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
  </button>;
}

function FieldTile({ label, value }) {
  const Icon = FIELD_ICONS[label];
  const isList = Array.isArray(value);
  const wide = !isList && (String(value).length > 48 || label === "Business Description");
  return <div className={`group flex items-start gap-3 rounded-xl border border-transparent bg-offwhite px-4 py-3 transition hover:border-amber/40 ${wide ? "sm:col-span-2 xl:col-span-3" : ""}`}>
    {Icon && <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-navy/10 bg-white text-amber"><Icon size={15} /></span>}
    <div className="min-w-0 flex-1">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      {isList
        ? <dd className="mt-1.5 flex flex-wrap gap-1.5">{value.map((item) => <span key={item} className="rounded-full bg-amber-soft px-2.5 py-0.5 text-xs font-bold text-navy">{item}</span>)}</dd>
        : <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-navy">{value}</dd>}
    </div>
    {COPYABLE.has(label) && !isList && <CopyButton text={String(value)} />}
  </div>;
}

function InfoSection({ title, items, groups, children, badge, empty }) {
  const Icon = SECTION_ICONS[title] || FileText;
  const visibleItems = (items || []).filter(([, value]) => hasValue(value));
  const visibleGroups = (groups || []).map(([groupTitle, groupItems]) => [groupTitle, groupItems.filter(([, value]) => hasValue(value))]).filter(([, groupItems]) => groupItems.length);
  const hasContent = children ? !empty : groups ? visibleGroups.length > 0 : visibleItems.length > 0;
  const header = <div className={`flex items-center gap-3 px-5 py-4 ${hasContent ? "border-b border-navy/10" : ""}`}>
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-soft text-amber"><Icon size={18} /></span>
    <h3 className="flex-1 text-base font-bold text-navy">{title}</h3>
    {badge && <span className="rounded-full bg-amber-soft px-3 py-1 text-xs font-bold text-navy">{badge}</span>}
    {!hasContent && <span className="rounded-full bg-navy/5 px-3 py-1 text-xs font-semibold text-muted">Not provided</span>}
  </div>;
  return (
    <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
      {header}
      {hasContent && <div className="space-y-5 p-5">
        {children || (groups
          ? visibleGroups.map(([groupTitle, groupItems]) => <div key={groupTitle}>
              <div className="mb-3 flex items-center gap-3"><p className="text-[11px] font-bold uppercase tracking-widest text-amber">{groupTitle}</p><span className="h-px flex-1 bg-navy/10" /></div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{groupItems.map(([label, value]) => <FieldTile key={label} label={label} value={value} />)}</dl>
            </div>)
          : <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{visibleItems.map(([label, value]) => <FieldTile key={label} label={label} value={value} />)}</dl>)}
      </div>}
    </section>
  );
}
