import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Download, FileText, Loader2 } from "lucide-react";
import PartnerDetailsModal from "../components/PartnerDetailsModal";
import { useAuth } from "../contexts/AuthContext";
import { downloadPartnerAgreement, downloadPartnerAgreementPdf, downloadSubmissionPdf, fileUrl, getPartnerDetail, resetPartnerPassword, sendPartnerAgreement, updatePartnerStatus } from "../services/api";

const STATUS_OPTIONS = [
  ["new", "Submitted"], ["reviewed", "Under Review"], ["approved", "Approved"], ["rewarded", "Rewarded"], ["rejected", "Rejected"],
];
const SEND_AGREEMENT_ACTION = "__send_agreement_mail__";
const partnerStatusLabel = (status) => ({ new: "Submitted", reviewed: "Under Review" }[status] || titleCase(status));

const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-IN") : "—";
const titleCase = (value = "") => value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function PartnerDetail() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
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

  const load = async () => {
    try {
      const response = await getPartnerDetail(id);
      setPartner(response.data.partner);
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
    ["GST Certificate", "GST"], ["PAN Card", "PAN"], ["Aadhaar", "Aadhaar"],
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

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-2 rounded-full border border-navy/20 px-4 py-2 text-xs font-semibold text-navy hover:border-amber"><ArrowLeft size={14} />Back</button>
          <p className="font-mono text-xs text-amber">Partner #{partner.id}</p>
          <h2 className="mt-1 text-2xl font-extrabold text-navy">{partner.company_name}</h2>
          <p className="mt-1 text-sm text-muted">{partner.contact_name} · {partner.phone} · {partner.email}</p>
          <p className="mt-1 text-xs text-muted">Created: {formatDateTime(partner.created_at)} · Updated by {partner.updated_by_name || "—"}: {formatDateTime(partner.updated_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">{isOwner && <button onClick={() => setEditOpen(true)} className="rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy hover:border-amber">Edit Details</button>}<button onClick={() => downloadSubmissionPdf("partners", partner.id)} className="flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy hover:bg-amber-hover"><Download size={16}/>Download PDF</button>{isOwner && <><button onClick={downloadAgreement} disabled={downloadingAgreement} className="flex items-center gap-2 rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy hover:border-amber disabled:opacity-60"><Download size={16}/>{downloadingAgreement ? "Downloading..." : "Download Agreement (Word)"}</button><button onClick={downloadAgreementPdf} disabled={downloadingAgreementPdf} className="flex items-center gap-2 rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy hover:border-amber disabled:opacity-60"><Download size={16}/>{downloadingAgreementPdf ? "Downloading..." : "Download Agreement PDF"}</button></>}</div>
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      {editOpen && <PartnerDetailsModal partner={partner} editing onClose={() => setEditOpen(false)} onEdit={() => {}} onSaved={async () => { setEditOpen(false); await load(); }} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <InfoSection title="Partner Details" items={[
            ["Partner Type", ["sub_vendor", "sub_vendor_commission"].includes(partner.partner_type) ? "Sub-vendor" : titleCase(partner.partner_type)],
            ...(isOwner && partner.partner_login_id ? [["Partner Login ID", partner.partner_login_id], ["Partner Login Status", titleCase(partner.partner_account_status || "active")]] : []),
            ["Commission", partner.commission_model === "per_completed_installation" || partner.partner_type === "sub_vendor_commission" ? "Per completed installation" : "—"], ["Company Name", partner.company_name],
            ["Contact Name", partner.contact_name], ["Phone", partner.phone], ["Email", partner.email],
            ["Aadhaar Number", partner.aadhaar_number], ["Gender", ({ male: "Male", female: "Female", other: "Other" }[partner.gender] || partner.gender)], ["Date of Birth", partner.dob ? String(partner.dob).slice(0, 10) : ""],
            ["System Types", (Array.isArray(partner.system_types) ? partner.system_types : []).map((system) => system === "on_grid" ? "On-Grid System" : system === "hybrid" ? "Hybrid System" : system).join(", ")],
            ["Commission Chart", partner.commission_model === "per_completed_installation" || partner.partner_type === "sub_vendor_commission" ? `On-Grid: ₹${Number(partner.commission_rates?.on_grid ?? 20000).toLocaleString("en-IN")} per completed installation · Hybrid: ₹${Number(partner.commission_rates?.hybrid ?? 30000).toLocaleString("en-IN")} per completed installation` : "—"],
            ["Experience", partner.experience_years], ["Business Description", partner.description],
          ]} />
          <InfoSection title="Registration Details" items={[
            ["GST Number", partner.gst_number], ["PAN Number", partner.pan_number], ["MSME Number", partner.msme_number],
          ]} />
          <InfoSection title="Address" items={[
            ["Address", partner.address], ["City", partner.city], ["State", partner.state], ["PIN Code", partner.pincode],
          ]} />
          <InfoSection title="Bank Details" items={[
            ["Bank Name", partner.bank_name], ["Account Number", partner.account_number], ["IFSC Code", partner.ifsc_code],
          ]} />
          <InfoSection title="Uploaded Documents">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {documents.map(([label, key]) => <a key={key} href={fileUrl(partner.documentUrls[key])} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-navy/10 bg-white p-3 hover:border-amber"><FileText size={18} className="text-amber" /><span className="text-sm font-semibold text-navy">{label}</span></a>)}
              {!documents.length && <p className="text-sm text-muted">No documents uploaded.</p>}
            </div>
          </InfoSection>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-navy/10 bg-white p-5">
            <h3 className="text-sm font-bold text-navy">Update Status</h3>
            <div className="mt-4 space-y-3">
              <select value={newStatus} onChange={(event) => setNewStatus(event.target.value)} disabled={!isOwner} className="w-full rounded-lg border border-navy/15 bg-white px-3.5 py-2.5 text-sm disabled:bg-slate-100">
                {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                {isOwner && <option value={SEND_AGREEMENT_ACTION}>Send Agreement Mail</option>}
              </select>
              {isOwner && newStatus === SEND_AGREEMENT_ACTION && <p className="text-xs text-muted">{partner.status !== "approved" ? "Approve and save this partner first, then send the agreement." : !partner.email ? "Add the partner email before sending." : "Save this action to email the agreement PDF. Partner status will remain Approved."}</p>}
              <textarea value={statusNote} onChange={(event) => setStatusNote(event.target.value)} disabled={!isOwner} placeholder="Note (optional)" rows={3} className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm focus:border-amber focus:outline-none disabled:bg-slate-100" />
              <button onClick={saveStatus} disabled={!isOwner || updating || sendingAgreement || (newStatus === partner.status)} className="flex w-full items-center justify-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy hover:bg-amber-hover disabled:cursor-not-allowed disabled:opacity-60">{(updating || sendingAgreement) && <Loader2 size={16} className="animate-spin" />}{newStatus === SEND_AGREEMENT_ACTION ? "Send Agreement Mail" : "Save Status"}</button>
              {isOwner && <button onClick={sendAgreement} disabled={sendingAgreement || partner.status !== "approved" || !partner.email} className="flex w-full items-center justify-center gap-2 rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy hover:border-amber disabled:cursor-not-allowed disabled:opacity-60"><FileText size={16} />{sendingAgreement ? "Sending Agreement..." : "Send Agreement Mail"}</button>}
              {isOwner && ["sub_vendor", "dealer"].includes(partner.partner_type) && partner.status === "approved" && !partner.partner_login_id && <button onClick={createPartnerLogin} disabled={creatingLogin} className="w-full rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy hover:border-amber disabled:opacity-60">{creatingLogin ? "Creating Login..." : "Create Partner Login"}</button>}
              {isOwner && ["sub_vendor", "dealer"].includes(partner.partner_type) && partner.status === "approved" && partner.partner_login_id && <button onClick={resetPartnerLogin} disabled={resettingLogin} className="w-full rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy hover:border-amber disabled:opacity-60">{resettingLogin ? "Resetting Password..." : "Reset Partner Password"}</button>}
            </div>
          </div>
          <div className="rounded-2xl border border-navy/10 bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-navy"><Clock size={16} className="text-amber" />Status Timeline</h3>
            <div className="mt-4 space-y-3">
              {timeline.map((entry) => <div key={entry.id} className="border-l-2 border-amber/40 pl-3">
                <p className="text-xs font-bold capitalize text-navy">{partnerStatusLabel(entry.new_status)}</p>
                <p className="text-xs text-muted">{formatDateTime(entry.created_at)}</p>
                <p className="text-xs text-muted">by {entry.changed_by_name || "Partner"}</p>
                {entry.note && <p className="mt-1 text-xs italic text-muted">{entry.note}</p>}
              </div>)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function InfoSection({ title, items, children }) {
  const visibleItems = (items || []).filter(([, value]) => value !== null && value !== undefined && value !== "");
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5">
      <h3 className="text-sm font-bold text-navy">{title}</h3>
      {children || (visibleItems.length ? <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{visibleItems.map(([label, value]) => <div key={label}><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-0.5 whitespace-pre-wrap text-sm font-medium text-navy">{value}</p></div>)}</div> : <p className="mt-4 text-sm text-muted">No data.</p>)}
    </div>
  );
}
