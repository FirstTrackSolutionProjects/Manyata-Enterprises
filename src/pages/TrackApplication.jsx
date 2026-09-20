import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Loader2,
  AlertCircle,
  Download,
  Clock,
} from "lucide-react";
import { trackApplication, downloadApplicationPdf } from "../services/api";

const STATUS_LABELS = {
  draft: "Draft",
  pending: "Pending Review",
  under_review: "Under Review",
  verified: "Verified",
  submitted_to_govt: "Submitted to Govt",
  approved: "Approved",
  installed: "Installed",
  rejected: "Rejected",
};

const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-700",
  pending: "bg-amber-50 text-amber-700",
  under_review: "bg-blue-50 text-blue-700",
  verified: "bg-green-50 text-green-700",
  submitted_to_govt: "bg-indigo-50 text-indigo-700",
  approved: "bg-emerald-50 text-emerald-700",
  installed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-50 text-red-700",
};

export default function TrackApplication() {
  const [applicationNo, setApplicationNo] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await trackApplication(applicationNo.trim(), phone.trim());
      setResult(res.data);
    } catch (err) {
      setError(err.message || "Application not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-offwhite">
      <section className="bg-navy py-14 text-white lg:py-16">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-sm font-semibold text-amber">
              Application Tracking
            </span>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Track Your Solar Application
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
              Enter your application number and registered phone number to
              view your application status and download a PDF copy.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-[800px] px-5 py-12 lg:px-8">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-navy/10 bg-white p-6 sm:p-8"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-navy/70">
                Application Number
              </span>
              <input
                type="text"
                required
                value={applicationNo}
                onChange={(e) => setApplicationNo(e.target.value)}
                placeholder="MNY-2026-00001"
                className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm text-navy placeholder:text-muted focus:border-amber focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-navy/70">
                Registered Phone Number
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98XXXXXXXX"
                className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm text-navy placeholder:text-muted focus:border-amber focus:outline-none"
              />
            </label>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-bold text-navy transition-colors hover:bg-amber-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Searching…
              </>
            ) : (
              <>
                <Search size={16} />
                Track Application
              </>
            )}
          </button>
        </form>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-8"
          >
            <div className="rounded-2xl border border-navy/10 bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted">
                    Application Number
                  </p>
                  <p className="mt-1 text-xl font-extrabold text-navy">
                    {result.application.application_no}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    Applicant:{" "}
                    <span className="font-semibold text-navy">
                      {result.application.full_name}
                    </span>
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    STATUS_STYLES[result.application.status] ||
                    "bg-slate-100 text-slate-700"
                  }`}
                >
                  {STATUS_LABELS[result.application.status] ||
                    result.application.status}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow
                  label="Location"
                  value={
                    result.application.location === "odisha"
                      ? "Odisha"
                      : "Kolkata / West Bengal"
                  }
                />
                <InfoRow
                  label="System Type"
                  value={result.application.system_type}
                />
                <InfoRow
                  label="System Size"
                  value={result.application.system_size}
                />
                <InfoRow label="City" value={result.application.city} />
                <InfoRow
                  label="Submitted On"
                  value={new Date(
                    result.application.created_at
                  ).toLocaleDateString("en-IN")}
                />
                {result.application.govt_portal_ref && (
                  <InfoRow
                    label="Govt. Portal Ref"
                    value={result.application.govt_portal_ref}
                  />
                )}
              </div>

              <button
                type="button"
                onClick={() => downloadApplicationPdf(result.application.id)}
                className="mt-6 flex items-center justify-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-navy-light"
              >
                <Download size={16} />
                Download PDF Application
              </button>
            </div>

            {result.history && result.history.length > 0 && (
              <div className="mt-8 rounded-2xl border border-navy/10 bg-white p-6 sm:p-8">
                <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
                  <Clock size={16} className="text-amber" />
                  Status Timeline
                </h2>
                <div className="mt-5 space-y-4">
                  {result.history.map((h, i) => (
                    <div
                      key={h.id || i}
                      className="flex items-start gap-3 border-l-2 border-amber/40 pl-4"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-navy">
                          {STATUS_LABELS[h.new_status] || h.new_status}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {new Date(h.created_at).toLocaleString("en-IN")}
                          {h.changed_by_name && ` · ${h.changed_by_name}`}
                        </p>
                        {h.note && (
                          <p className="mt-1 text-xs italic text-muted">
                            {h.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </section>
    </main>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-navy">{value || "-"}</p>
    </div>
  );
}