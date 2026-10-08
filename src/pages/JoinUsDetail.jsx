import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Briefcase, Building2, CalendarDays, Check, Clock, Copy, Download, ExternalLink, FileText, GraduationCap, Hash, Landmark, Loader2, Mail, MapPin, Pencil, Phone, ShieldCheck, User, Wallet } from "lucide-react";
import JoinUsDetailsModal from "../components/JoinUsDetailsModal";
import { downloadJoinUsLOA, downloadSubmissionPdf, fileUrl, getJoinUsDetail, updateJoinUsStatus } from "../services/api";

const STATUSES = [["hold","Hold"],["approved","Approved"],["review","Review"],["document_verification","Document Verification"],["rehired","Re-Hired"],["reviewed","Reviewed"],["shortlisted","Shortlisted"],["onboarded","Onboarded"],["terminated","Terminated"],["resigned","Resigned"],["on_leave","On Leave"],["salary_success","Salary Success"],["rejected","Rejected"]];
const dateTime = (value) => value ? new Date(value).toLocaleString("en-IN") : "—";
const titleCase = (value = "") => value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/* ── UI-only helpers (styles, icons) ───────────────── */

const STATUS_STYLES = {
  new: "bg-amber-50 text-amber-700 ring-amber-200",
  hold: "bg-orange-50 text-orange-700 ring-orange-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  review: "bg-blue-50 text-blue-700 ring-blue-200",
  document_verification: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  reviewed: "bg-blue-50 text-blue-700 ring-blue-200",
  shortlisted: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  onboarded: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rehired: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  salary_success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  terminated: "bg-red-50 text-red-700 ring-red-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  resigned: "bg-orange-50 text-orange-700 ring-orange-200",
  on_leave: "bg-amber-50 text-amber-700 ring-amber-200",
};
const statusStyle = (status) => STATUS_STYLES[status] || "bg-slate-100 text-slate-700 ring-slate-200";
const SECTION_ICONS = {
  "Personal Details": User,
  "Current Address": MapPin,
  "Permanent Address": Building2,
  "Identity Details": ShieldCheck,
  "Education & Experience": GraduationCap,
  "Appointment Details": Briefcase,
  "Bank Details": Landmark,
  "About": FileText,
  "Uploaded Documents": FileText,
};
const FIELD_ICONS = {
  "First Name": User, "Last Name": User, "Email": Mail, "Phone": Phone, "Date of Birth": CalendarDays, "Gender": User,
  "Father's Name": User, "Mother's Name": User, "Guardian Name": User, "Guardian Mobile Number": Phone,
  "Street Address": MapPin, "City": MapPin, "District": MapPin, "State": MapPin, "Location / Posting Preference": MapPin, "Postal Code": Hash, "Country": MapPin,
  "Address": MapPin,
  "Aadhaar Number": Hash, "PAN Number": Hash,
  "Qualification": GraduationCap, "Institution": Building2, "Year of Passing": CalendarDays, "Experience": Briefcase, "Company": Building2, "Current / Last Designation": Briefcase,
  "Appointment Designation": Briefcase, "Date of Joining": CalendarDays, "Place of Posting": MapPin,
  "Monthly Gross Salary": Wallet, "Monthly Net Salary": Wallet, "Allowance": Wallet, "Annual CTC": Wallet, "LOA Reference Number": Hash,
  "Bank Name": Landmark, "Account Number": Hash, "IFSC Code": Hash,
};
const COPYABLE = new Set(["Email", "Phone", "Guardian Mobile Number", "Aadhaar Number", "PAN Number", "Account Number", "IFSC Code", "LOA Reference Number"]);
const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "J";
const isImageUrl = (value) => /\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(String(value || ""));

const BTN_PRIMARY = "inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber px-5 py-3 text-sm font-bold text-navy shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-hover hover:shadow-md active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none";
const HERO_BASE = "group inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-5 text-sm font-bold transition hover:-translate-y-0.5 active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";
const HERO_NAVY = `${HERO_BASE} bg-navy text-white shadow-sm hover:bg-navy-light hover:shadow-lg`;
const HERO_PRIMARY = `${HERO_BASE} bg-gradient-to-r from-amber to-amber-hover text-navy shadow-md shadow-amber/30 hover:shadow-lg hover:shadow-amber/40`;
const HERO_OUTLINE = `${HERO_BASE} border border-navy/20 bg-white text-navy shadow-sm hover:border-amber hover:shadow-md`;
const BUBBLE_ON_NAVY = "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber text-navy transition group-hover:scale-110";
const BUBBLE_ON_AMBER = "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-amber transition group-hover:scale-110";
const BUBBLE_ON_WHITE = "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-soft text-amber transition group-hover:bg-amber group-hover:text-navy";

export default function JoinUsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editRequested = searchParams.get("edit") === "1";
  const [submission, setSubmission] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [loaNotice, setLoaNotice] = useState("");

  const load = async () => {
    try {
      const res = await getJoinUsDetail(id);
      setSubmission(res.data.submission);
      setHistory(res.data.history || []);
      setStatus(res.data.submission.status);
      setError("");
    } catch (err) {
      setError(err.message || "Could not load Join Us details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */ }, [id]);

  const saveStatus = async () => {
    if (!submission || status === submission.status) return;
    setSaving(true);
    setError("");
    try {
      await updateJoinUsStatus(id, status, note.trim());
      setNote("");
      await load();
    } catch (err) {
      setError(err.message || "Could not update status.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadLOA = async () => {
    const required = ["appointment_designation", "joining_date", "gross_salary", "net_salary", "annual_ctc"];
    if (required.some((key) => !String(submission?.[key] || "").trim())) {
      setLoaNotice("Fill Appointment Designation, Date of Joining, Monthly Gross Salary, Monthly Net Salary and Annual CTC, then save the details to create the LOA.");
      setEditing(true);
      return;
    }
    setError("");
    try {
      await downloadJoinUsLOA(id);
    } catch (err) {
      setError(err.message || "Could not download the appointment letter.");
    }
  };

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="animate-spin text-amber" /></div>;
  if (!submission) return <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-6 text-sm text-red-700">{error || "Join Us submission not found."}</div>;

  const fullName = `${submission.first_name || ""} ${submission.last_name || ""}`.trim();
  const docs = Object.entries(submission.documentUrls || {});
  const timeline = history.length ? history : [{ id: "current", new_status: submission.status, created_at: submission.updated_at || submission.created_at, changed_by_name: submission.updated_by_name, note: "Older status changes were not recorded." }];
  const section = (heading, items) => <InfoSection key={heading} title={heading} items={items} />;

  return <>
    <div className="mb-6 overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
      <div className="relative h-36 overflow-hidden bg-gradient-to-r from-navy via-navy to-navy-light sm:h-40">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-amber/20" />
        <div className="pointer-events-none absolute right-40 top-14 h-28 w-28 rounded-full bg-amber/10" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber via-amber/60 to-transparent" />
        <div className="absolute inset-x-5 top-5 flex flex-wrap items-center justify-between gap-2 sm:inset-x-6">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/20"><ArrowLeft size={14} />Back</button>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber px-3 py-1 font-mono text-[11px] font-bold text-navy">Join Us #{submission.id}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ring-1 ring-inset ${statusStyle(submission.status)}`}><BadgeCheck size={12} />{titleCase(submission.status)}</span>
          </div>
        </div>
      </div>

      <div className="px-5 pb-6 sm:px-6">
        <div className="flex flex-wrap items-start gap-4 sm:gap-6">
          <div className="relative z-10 -mt-14 grid h-28 w-28 shrink-0 place-items-center rounded-full bg-amber-soft text-3xl font-extrabold text-navy shadow-lg ring-4 ring-white sm:-mt-16 sm:h-32 sm:w-32">{initials(fullName)}</div>

          <div className="min-w-[260px] flex-1 pt-1 sm:pt-3">
            <h2 className="break-words text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{fullName}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {submission.phone && <span className="inline-flex items-center gap-1.5 rounded-full bg-offwhite px-3 py-1.5 text-xs font-semibold text-navy"><Phone size={13} className="text-amber" />{submission.phone}</span>}
              {submission.email && <span className="inline-flex items-center gap-1.5 break-all rounded-full bg-offwhite px-3 py-1.5 text-xs font-semibold text-navy"><Mail size={13} className="text-amber" />{submission.email}</span>}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><Clock size={12} className="text-amber" />Created {dateTime(submission.created_at)} · Updated by {submission.updated_by_name || "—"}: {dateTime(submission.updated_at)}</p>
          </div>

          <div className="flex w-full flex-wrap gap-2 border-t border-navy/10 pt-5">
            <button onClick={() => setEditing(true)} className={HERO_NAVY}><span className={BUBBLE_ON_NAVY}><Pencil size={15} /></span>Edit Details</button>
            <button onClick={() => downloadSubmissionPdf("join-us", submission.id)} className={HERO_PRIMARY}><span className={BUBBLE_ON_AMBER}><Download size={15} /></span>Download Details PDF</button>
            <button onClick={handleDownloadLOA} className={HERO_OUTLINE}><span className={BUBBLE_ON_WHITE}><FileText size={15} /></span>Download LOA</button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <HeroStat icon={MapPin} label="Location">{submission.location || "—"}</HeroStat>
          <HeroStat icon={Briefcase} label="Designation">{submission.appointment_designation || submission.designation || "—"}</HeroStat>
          <HeroStat icon={GraduationCap} label="Experience">{titleCase(submission.experience) || "—"}</HeroStat>
          <HeroStat icon={FileText} label="Documents">{docs.length ? `${docs.length} uploaded` : "None uploaded"}</HeroStat>
        </div>
      </div>
    </div>

    {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">{error}</p>}
    {(editing || editRequested) && <JoinUsDetailsModal submission={submission} loaNotice={loaNotice} onClose={() => { setEditing(false); setLoaNotice(""); if (editRequested) navigate(`/admin/join-us/${id}`, { replace: true }); }} onSaved={async () => { setEditing(false); setLoaNotice(""); if (editRequested) navigate(`/admin/join-us/${id}`, { replace: true }); await load(); }} />}

    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {section("Personal Details", [["First Name", submission.first_name], ["Last Name", submission.last_name], ["Email", submission.email], ["Phone", submission.phone], ["Date of Birth", submission.dob], ["Gender", submission.gender], ["Father's Name", submission.father_name], ["Mother's Name", submission.mother_name], ["Blood Group", submission.blood_group], ["Guardian Name", submission.guardian_name], ["Guardian Mobile Number", submission.guardian_mobile], ["Marital Status", submission.marital_status]])}
        {section("Current Address", [["Street Address", submission.street_address], ["City", submission.city], ["District", submission.district], ["State", submission.state], ["Location / Posting Preference", submission.location], ["Postal Code", submission.postal_code], ["Country", submission.country]])}
        {submission.site_latitude != null && submission.site_longitude != null && <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy/10 bg-white px-5 py-4">
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-soft text-amber"><MapPin size={18} /></span><div><h3 className="text-base font-bold text-navy">Submission GPS</h3><p className="text-xs text-muted">Accuracy: {submission.site_accuracy_m ?? "Not recorded"} m</p></div></div>
          <a className="inline-flex items-center gap-1.5 rounded-full border border-navy/20 px-4 py-2 text-xs font-bold text-navy transition hover:border-amber" href={`https://maps.google.com/?q=${submission.site_latitude},${submission.site_longitude}`} target="_blank" rel="noreferrer"><ExternalLink size={13} />Open location on map</a>
        </section>}
        {section("Permanent Address", [["Same as Current", submission.same_as_above ? "Yes" : "No"], ["Address", submission.permanent_address], ["City", submission.permanent_city], ["State", submission.permanent_state], ["Postal Code", submission.permanent_postal_code]])}
        {section("Identity Details", [["Aadhaar Number", submission.aadhaar_number], ["PAN Number", submission.pan_number]])}
        {section("Education & Experience", [["Qualification", titleCase(submission.qualification)], ["Institution", submission.institution_name], ["Year of Passing", submission.year_of_passing], ["Experience", titleCase(submission.experience)], ["Company", submission.company_name], ["Current / Last Designation", submission.designation]])}
        {section("Appointment Details", [["Appointment Designation", submission.appointment_designation], ["Date of Joining", submission.joining_date], ["Place of Posting", submission.office_location], ["Monthly Gross Salary", submission.gross_salary], ["Monthly Net Salary", submission.net_salary], ["Allowance", submission.allowance], ["Annual CTC", submission.annual_ctc], ["Probation Period", submission.probation_period], ["Notice Period", submission.notice_period], ["LOA Reference Number", submission.reference_number]])}
        {section("Bank Details", [["Bank Name", submission.bank_name], ["Account Number", submission.account_number], ["IFSC Code", submission.ifsc_code]])}
        {section("About", [["Description", submission.description]])}
        <InfoSection title="Uploaded Documents" badge={docs.length ? `${docs.length} ${docs.length === 1 ? "file" : "files"}` : ""} empty={!docs.length}>
          <div className="grid gap-3 sm:grid-cols-2">
            {docs.map(([label, url]) => <a key={label} href={fileUrl(url)} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-xl border border-navy/10 bg-white p-3 transition hover:border-amber hover:shadow-sm">
              {isImageUrl(url) || isImageUrl(fileUrl(url))
                ? <img src={fileUrl(url)} alt={label} loading="lazy" className="h-11 w-11 shrink-0 rounded-lg border border-navy/10 object-cover" />
                : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-amber-soft text-amber"><FileText size={18} /></span>}
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-navy">{label}</span><span className="block text-xs text-muted">Click to view</span></span>
              <ExternalLink size={15} className="shrink-0 text-muted transition group-hover:text-amber" />
            </a>)}
          </div>
        </InfoSection>
      </div>

      <div className="space-y-6">
        <SideCard icon={BadgeCheck} title="Update Status" subtitle="Change the submission's status and leave a note.">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-offwhite px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Current status</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${statusStyle(submission.status)}`}><BadgeCheck size={12} />{titleCase(submission.status)}</span>
            </div>
            <label className="block text-xs font-semibold text-muted">Change status to
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1.5 w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm font-semibold text-navy transition focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30">
                {status === "new" && <option value="new">New (current)</option>}
                {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-muted">Note
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" rows={3} className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-sm font-normal text-navy transition focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30" />
            </label>
            <div className="pt-1">
              <button onClick={saveStatus} disabled={saving || status === submission.status} className={BTN_PRIMARY}>{saving ? "Saving..." : "Save Status"}</button>
            </div>
          </div>
        </SideCard>

        <SideCard icon={Clock} title="Status Timeline" subtitle="Every status change, newest first." badge={<span className="shrink-0 rounded-full bg-amber-soft px-3 py-1 text-xs font-bold text-navy">{timeline.length} {timeline.length === 1 ? "update" : "updates"}</span>}>
          <div className="ml-2 space-y-6 border-l-2 border-amber/30 pl-6">
            {timeline.map((entry, index) => <div key={entry.id} className="relative">
              <span className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white ring-2 ${index === 0 ? "bg-amber ring-amber/40" : "bg-amber/40 ring-amber/15"}`} />
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${statusStyle(entry.new_status)}`}>{titleCase(entry.new_status)}</span>
                {index === 0 && <span className="rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Latest</span>}
              </div>
              <p className="mt-1.5 text-xs font-semibold text-navy">{dateTime(entry.created_at)}</p>
              <p className="text-xs text-muted">by {entry.changed_by_name || "Applicant"}</p>
              {entry.note && <p className="mt-2 rounded-lg bg-offwhite px-3 py-2 text-xs italic text-muted">{entry.note}</p>}
            </div>)}
          </div>
        </SideCard>
      </div>
    </div>
  </>;
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
  const text = String(value);
  const wide = text.length > 48 || label === "Description";
  return <div className={`group flex items-start gap-3 rounded-xl border border-transparent bg-offwhite px-4 py-3 transition hover:border-amber/40 ${wide ? "sm:col-span-2 xl:col-span-3" : ""}`}>
    {Icon && <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-navy/10 bg-white text-amber"><Icon size={15} /></span>}
    <div className="min-w-0 flex-1">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-navy">{text}</dd>
    </div>
    {COPYABLE.has(label) && <CopyButton text={text} />}
  </div>;
}

function InfoSection({ title, items, children, badge, empty }) {
  const Icon = SECTION_ICONS[title] || FileText;
  const visible = (items || []).filter(([, v]) => v !== null && v !== undefined && v !== "");
  const hasContent = children ? !empty : visible.length > 0;
  return <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
    <div className={`flex items-center gap-3 px-5 py-4 ${hasContent ? "border-b border-navy/10" : ""}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-soft text-amber"><Icon size={18} /></span>
      <h3 className="flex-1 text-base font-bold text-navy">{title}</h3>
      {badge && <span className="rounded-full bg-amber-soft px-3 py-1 text-xs font-bold text-navy">{badge}</span>}
      {!hasContent && <span className="rounded-full bg-navy/5 px-3 py-1 text-xs font-semibold text-muted">Not provided</span>}
    </div>
    {hasContent && <div className="p-5">
      {children || <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{visible.map(([label, value]) => <FieldTile key={label} label={label} value={value} />)}</dl>}
    </div>}
  </section>;
}
