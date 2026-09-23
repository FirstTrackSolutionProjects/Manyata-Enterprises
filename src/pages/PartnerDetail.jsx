import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Download, FileText, Loader2 } from "lucide-react";
import PartnerDetailsModal from "../components/PartnerDetailsModal";
import { downloadSubmissionPdf, fileUrl, getPartnerDetail, updatePartnerStatus } from "../services/api";

const STATUS_OPTIONS = [
  ["new", "New"], ["reviewed", "Reviewed"], ["approved", "Approved"], ["rejected", "Rejected"],
];

const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-IN") : "—";
const titleCase = (value = "") => value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function PartnerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [history, setHistory] = useState([]);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);

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
    if (!partner || newStatus === partner.status) return;
    setUpdating(true);
    setError("");
    try {
      await updatePartnerStatus(id, newStatus, statusNote.trim());
      setStatusNote("");
      await load();
    } catch (err) {
      setError(err.message || "Could not update partner status.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="animate-spin text-amber" /></div>;
  if (error && !partner) return <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  if (!partner) return null;

  const documents = [
    ["GST Certificate", "GST"], ["PAN Card", "PAN"], ["Aadhaar", "Aadhaar"],
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
        <div className="flex gap-2"><button onClick={() => setEditOpen(true)} className="rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy hover:border-amber">Edit Details</button><button onClick={() => downloadSubmissionPdf("partners", partner.id)} className="flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy hover:bg-amber-hover"><Download size={16}/>Download PDF</button></div>
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {editOpen && <PartnerDetailsModal partner={partner} editing onClose={() => setEditOpen(false)} onEdit={() => {}} onSaved={async () => { setEditOpen(false); await load(); }} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <InfoSection title="Partner Details" items={[
            ["Partner Type", titleCase(partner.partner_type)], ["Company Name", partner.company_name],
            ["Contact Name", partner.contact_name], ["Phone", partner.phone], ["Email", partner.email],
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
              <select value={newStatus} onChange={(event) => setNewStatus(event.target.value)} className="w-full rounded-lg border border-navy/15 bg-white px-3.5 py-2.5 text-sm">
                {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <textarea value={statusNote} onChange={(event) => setStatusNote(event.target.value)} placeholder="Note (optional)" rows={3} className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm focus:border-amber focus:outline-none" />
              <button onClick={saveStatus} disabled={updating || newStatus === partner.status} className="flex w-full items-center justify-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy hover:bg-amber-hover disabled:cursor-not-allowed disabled:opacity-60">{updating && <Loader2 size={16} className="animate-spin" />}Save Status</button>
            </div>
          </div>
          <div className="rounded-2xl border border-navy/10 bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-navy"><Clock size={16} className="text-amber" />Status Timeline</h3>
            <div className="mt-4 space-y-3">
              {timeline.map((entry) => <div key={entry.id} className="border-l-2 border-amber/40 pl-3">
                <p className="text-xs font-bold capitalize text-navy">{titleCase(entry.new_status)}</p>
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
