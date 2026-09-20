import { useEffect, useState } from "react";
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
} from "lucide-react";
import {
  getApplication,
  getApplicationTimeline,
  updateApplicationStatus,
  submitToGovt,
  downloadApplicationPdf,
  fileUrl,
} from "../services/api";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "verified", label: "Verified" },
  { value: "submitted_to_govt", label: "Submitted to Govt" },
  { value: "approved", label: "Approved" },
  { value: "installed", label: "Installed" },
  { value: "rejected", label: "Rejected" },
];

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
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

  const load = async () => {
    try {
      const [a, h] = await Promise.all([
        getApplication(id),
        getApplicationTimeline(id),
      ]);
      setApp(a.data.application);
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
        <button
          onClick={() => downloadApplicationPdf(app.id)}
          className="flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy hover:bg-amber-hover"
        >
          <Download size={16} />
          Download PDF
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <InfoSection title="Application Details">
            <InfoGrid
              items={[
                [
                  "Location",
                  app.location === "odisha" ? "Odisha" : "Kolkata / West Bengal",
                ],
                ["System Type", app.system_type],
                ["System Size", app.system_size],
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
                ["Aadhaar Front", app.file_aadhaar_front],
                ["PAN Card", app.file_pan_card],
                ["Photo", app.file_photo],
                ["Signature", app.file_signature],
                ["Electricity Bill", app.file_electricity_bill],
                ["Cheque / Passbook", app.file_cheque_passbook],
                ["Site Photo", app.file_site_photo],
              ]
                .filter(([, v]) => v)
                .map(([label, path]) => (
                  <a
                    key={label}
                    href={fileUrl(path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-navy/10 bg-white p-3 hover:border-amber"
                  >
                    <FileText size={18} className="text-amber" />
                    <span className="text-sm font-semibold text-navy">
                      {label}
                    </span>
                  </a>
                ))}
              {![
                app.file_aadhaar_front,
                app.file_pan_card,
                app.file_photo,
                app.file_signature,
                app.file_electricity_bill,
                app.file_cheque_passbook,
                app.file_site_photo,
              ].some(Boolean) && (
                <p className="text-sm text-muted">No documents uploaded.</p>
              )}
            </div>
          </InfoSection>

          {app.remarks && (
            <InfoSection title="Customer Remarks">
              <p className="text-sm text-navy">{app.remarks}</p>
            </InfoSection>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-navy/10 bg-white p-5">
            <h3 className="text-sm font-bold text-navy">Update Status</h3>
            <div className="mt-4 space-y-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-lg border border-navy/15 bg-white px-3.5 py-2.5 text-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Note (optional)"
                rows={3}
                className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm focus:border-amber focus:outline-none"
              />
              <button
                onClick={handleUpdateStatus}
                disabled={updating || newStatus === app.status}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy hover:bg-amber-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                Save Status
              </button>

              {app.status === "verified" && (
                <button
                  onClick={() => setShowGovtModal(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white hover:bg-navy-light"
                >
                  <Send size={16} />
                  Submit to Govt Portal
                </button>
              )}
            </div>
          </div>

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
                    {h.new_status?.replace(/_/g, " ")}
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

function InfoSection({ title, children }) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5">
      <h3 className="text-sm font-bold text-navy">{title}</h3>
      <div className="mt-4">{children}</div>
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