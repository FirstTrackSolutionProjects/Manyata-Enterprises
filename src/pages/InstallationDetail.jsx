import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Briefcase, Building2, CalendarDays, Check, Clock, Copy, Download, ExternalLink, FileText, Hash, Loader2, Mail, MapPin, MessageSquare, Pencil, Phone, Save, User, Wrench, Zap } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { assignInstallationTechnicalWork, downloadInstallationPdf, getInstallation, listTechnicalInstallationEmployees, updateInstallation, updateInstallationStatus, uploadFilesToS3 } from "../services/api";
import { INSTALLATION_STATUSES, installationStatusLabel } from "../constants/installationStatuses";
import { hasActionPermission } from "../utils/permissions";
import PartnerNetworkFields from "../components/PartnerNetworkFields";

const FIELDS = [
  ["customer_name", "Customer Name", "customerName"], ["phone", "Phone", "phone"], ["gender", "Gender", "gender"],
  ["email", "Email", "email"], ["company_name", "Company", "companyName"],
  ["contact_person", "Contact Person", "contactPerson"], ["location", "Location", "location"],
  ["super_vendor_name", "Super-vendor", "superVendorName"], ["vendor_name", "Vendor", "vendorName"],
  ["sub_vendor_name", "Sub-vendor", "subVendorName"], ["sales_executive_name", "Sales Executive", "salesExecutiveName"],
  ["installation_type", "Installation Type", "installationType"], ["installation_date", "Installation Date", "installationDate", "date"],
  ["electrician_name", "Electrician", "electricianName"], ["technician_name", "Technician", "technicianName"],
  ["solar_panel_type", "Solar Panel Type", "solarPanelType"], ["connection_type", "Connection Type", "connectionType"],
  ["state", "State", "state"], ["address", "Address", "address"], ["city", "City", "city"],
  ["pincode", "PIN Code", "pincode"], ["notes", "Notes", "notes"],
];

const EDIT_FILES = ["aadhaarPhoto", "fullSetupPhoto", "panelSerialPhoto1", "panelSerialPhoto2", "panelSerialPhoto3", "panelSerialPhoto4", "panelSerialPhoto5", "panelSerialPhoto6", "inverterSerialPhoto", "earthingPhoto1", "earthingPhoto2", "earthingPhoto3", "laCableConnectorPhoto", "earthingArresterSpikePhoto", "inverterAcdbDcdbPhoto", "batteryPhoto1", "batteryPhoto2", "otherDocument"];
const display = (value) => value || "—";
const dateTime = (value) => value ? new Date(value).toLocaleString("en-IN") : "—";
const CUSTOMER_FIELDS = [["customer_name", "Customer Name"], ["phone", "Phone"], ["email", "Email"], ["gender", "Gender"], ["company_name", "Company"], ["contact_person", "Contact Person"]];
const INSTALLATION_FIELDS = [["installation_type", "Installation Type"], ["installation_date", "Installation Date"], ["electrician_name", "Electrician"], ["technician_name", "Technician"], ["solar_panel_type", "Solar Panel Type"], ["connection_type", "Connection Type"]];
const PARTNER_FIELDS = [["super_vendor_name", "Super-vendor"], ["vendor_name", "Vendor"], ["sub_vendor_name", "Sub-vendor"], ["sales_executive_name", "Sales Executive"]];
const ADDRESS_FIELDS = [["location", "Location"], ["state", "State"], ["address", "Address"], ["city", "City"], ["pincode", "PIN Code"]];

// Spelling fixes for document labels (backend keys me typos hain; asli fix source me karna better hai)
const DOCUMENT_LABEL_FIXES = [
  [/\bPenal\b/g, "Panel"],
  [/\bAdhar\b/g, "Aadhaar"],
  [/\bSetof\b/g, "Set of"],
  [/\bIntalation\b/g, "Installation"],
  [/\bCemera\b/g, "Camera"],
  [/\bGps\b/g, "GPS"],
];
const humanizeDocumentName = (name) => DOCUMENT_LABEL_FIXES.reduce(
  (label, [pattern, replacement]) => label.replace(pattern, replacement),
  name.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
);

/* ── UI-only helpers (styles, icons) ───────────────── */

const statusStyle = (status) => {
  const value = String(status || "");
  if (/reject|cancel/.test(value)) return "bg-red-50 text-red-700 ring-red-200";
  if (/complete/.test(value)) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (/pending/.test(value)) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-blue-50 text-blue-700 ring-blue-200";
};
const FIELD_ICONS = {
  "Customer Name": User, "Phone": Phone, "Email": Mail, "Gender": User, "Company": Building2, "Contact Person": User,
  "Super-vendor": Briefcase, "Vendor": Briefcase, "Sub-vendor": Briefcase, "Sales Executive": User,
  "Installation Type": Zap, "Installation Date": CalendarDays, "Electrician": Wrench, "Technician": Wrench, "Solar Panel Type": Zap, "Connection Type": Zap,
  "Location": MapPin, "State": MapPin, "Address": MapPin, "City": MapPin, "PIN Code": Hash,
};
const COPYABLE = new Set(["Phone", "Email"]);
const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "I";
const locationLabel = (value) => value === "kolkata" ? "West Bengal" : value === "odisha" ? "Odisha" : value || "—";

const BTN_PRIMARY = "inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber px-5 py-3 text-sm font-bold text-navy shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-hover hover:shadow-md active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none";
const BTN_NAVY = "inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-navy-light hover:shadow-md active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";
const FIELD_INPUT = "mt-1.5 w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm font-normal text-navy transition focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30";
const HERO_BASE = "group inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-5 text-sm font-bold transition hover:-translate-y-0.5 active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";
const HERO_NAVY = `${HERO_BASE} bg-navy text-white shadow-sm hover:bg-navy-light hover:shadow-lg`;
const HERO_PRIMARY = `${HERO_BASE} bg-gradient-to-r from-amber to-amber-hover text-navy shadow-md shadow-amber/30 hover:shadow-lg hover:shadow-amber/40`;
const HERO_OUTLINE_PLAIN = "inline-flex items-center gap-2 rounded-full border border-navy/20 bg-white px-6 py-3 text-sm font-bold text-navy shadow-sm transition hover:-translate-y-0.5 hover:border-amber hover:shadow-md active:translate-y-0";
const BUBBLE_ON_NAVY = "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber text-navy transition group-hover:scale-110";
const BUBBLE_ON_AMBER = "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-amber transition group-hover:scale-110";

export default function InstallationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = hasActionPermission(user, "installations", "edit");
  const canDownload = hasActionPermission(user, "installations", "download");
  const isOwner = user?.role === "owner";
  const isHrManager = user?.role === "employee" && /\bhr\b|human resources/i.test(`${user?.designation || ""} ${user?.department || ""}`) && canEdit;
  const canAssignTechnicalWork = isOwner || isHrManager;
  const isTechnicalEmployee = user?.role === "employee" && /technical|technician|installation engineer/i.test(`${user?.designation || ""} ${user?.department || ""}`);
  const technicalStatusValues = ["technical_installation_pending", "technical_installation_half_work_done", "technical_installation_completed"];
  const grantedStatusUpdates = user?.actionPermissions?.installations?.statusUpdates;
  const availableStatusOptions = INSTALLATION_STATUSES.filter((status) =>
    (!isTechnicalEmployee || technicalStatusValues.includes(status.value)) &&
    (user?.role === "owner" || !Array.isArray(grantedStatusUpdates) || grantedStatusUpdates.includes(status.value))
  );
  const installationsPath = user?.role === "employee" ? "/employee?section=installations" : "/admin?section=installations";
  const [item, setItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(null);
  const [files, setFiles] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newStatus, setNewStatus] = useState("pending");
  const [statusNote, setStatusNote] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [technicalEmployees, setTechnicalEmployees] = useState([]);
  const [technicalAssignee, setTechnicalAssignee] = useState("");
  const [technicalInstructions, setTechnicalInstructions] = useState("");
  const [savingAssignment, setSavingAssignment] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getInstallation(id);
      const record = response.data.installation;
      setItem(record);
      setHistory(response.data.history || []);
      setNewStatus(record.status);
      setTechnicalAssignee(record.technical_assignee_id ? String(record.technical_assignee_id) : "");
      setTechnicalInstructions(record.technical_instructions || "");
      setForm(Object.fromEntries(FIELDS.map(([key, , formKey]) => [formKey, record[key] || ""])));
    } catch (err) {
      setError(err.message || "Could not load installation details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [id]);

  useEffect(() => {
    if (!canAssignTechnicalWork || !item?.location) return;
    listTechnicalInstallationEmployees(item.location)
      .then((response) => setTechnicalEmployees(response.data.items || []))
      .catch((err) => setError(err.message || "Could not load technical employees."));
  }, [canAssignTechnicalWork, item?.location]);

  const save = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const uploadedFiles = Object.keys(files).length ? await uploadFilesToS3("installations", files) : {};
      await updateInstallation(id, { ...form, files: uploadedFiles });
      setFiles({});
      setEditing(false);
      setNotice("Installation details saved.");
      await load();
    } catch (err) {
      setError(err.message || "Could not save installation details.");
    } finally {
      setSaving(false);
    }
  };

  const saveStatus = async () => {
    setSavingStatus(true);
    setError("");
    setNotice("");
    try {
      await updateInstallationStatus(id, newStatus, statusNote.trim());
      setStatusNote("");
      setNotice("Installation status updated.");
      await load();
    } catch (err) {
      setError(err.message || "Could not update installation status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const saveAssignment = async () => {
    setSavingAssignment(true);
    setError("");
    setNotice("");
    try {
      await assignInstallationTechnicalWork(id, technicalAssignee, technicalInstructions);
      setNotice("Technical work assignment saved.");
      await load();
    } catch (err) {
      setError(err.message || "Could not assign installation work.");
    } finally {
      setSavingAssignment(false);
    }
  };

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="animate-spin text-amber" /></div>;
  if (error && !item) return <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-6"><p className="text-sm text-red-700">{error}</p><div className="flex gap-3"><button onClick={() => navigate(installationsPath)} className="rounded-full border border-navy/20 px-4 py-2 text-sm font-semibold text-navy">Back to Installations</button><button onClick={load} className="rounded-full bg-amber px-4 py-2 text-sm font-bold text-navy">Try again</button></div></div>;
  if (!item || !form) return null;

  const documentEntries = Object.entries(item.documents || {}).filter(([, url]) => Boolean(url));
  const canEditDetails = editing && !isTechnicalEmployee;

  return <div className="space-y-6">
    <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
      <div className="relative h-36 overflow-hidden bg-gradient-to-r from-navy via-navy to-navy-light sm:h-40">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-amber/20" />
        <div className="pointer-events-none absolute right-40 top-14 h-28 w-28 rounded-full bg-amber/10" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber via-amber/60 to-transparent" />
        <div className="absolute inset-x-5 top-5 flex flex-wrap items-center justify-between gap-2 sm:inset-x-6">
          <Link to={installationsPath} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/20"><ArrowLeft size={14} />Back</Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber px-3 py-1 font-mono text-[11px] font-bold text-navy">Installation #{item.id}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ring-1 ring-inset ${statusStyle(item.status)}`}><BadgeCheck size={12} />{installationStatusLabel(item.status)}</span>
          </div>
        </div>
      </div>

      <div className="px-5 pb-6 sm:px-6">
        <div className="flex flex-wrap items-start gap-4 sm:gap-6">
          <div className="relative z-10 -mt-14 grid h-28 w-28 shrink-0 place-items-center rounded-full bg-amber-soft text-3xl font-extrabold text-navy shadow-lg ring-4 ring-white sm:-mt-16 sm:h-32 sm:w-32">{initials(item.customer_name)}</div>

          <div className="min-w-[260px] flex-1 pt-1 sm:pt-3">
            <h2 className="break-words text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{item.customer_name}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.phone && <span className="inline-flex items-center gap-1.5 rounded-full bg-offwhite px-3 py-1.5 text-xs font-semibold text-navy"><Phone size={13} className="text-amber" />{item.phone}</span>}
              {item.email && <span className="inline-flex items-center gap-1.5 break-all rounded-full bg-offwhite px-3 py-1.5 text-xs font-semibold text-navy"><Mail size={13} className="text-amber" />{item.email}</span>}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><Clock size={12} className="text-amber" />Created {dateTime(item.created_at)} · Updated {dateTime(item.updated_at)}</p>
          </div>

          {(canDownload || canEdit) && <div className="flex w-full flex-wrap gap-2 border-t border-navy/10 pt-5">
            {canDownload && <button onClick={() => downloadInstallationPdf(id)} className={HERO_PRIMARY}><span className={BUBBLE_ON_AMBER}><Download size={15} /></span>Download PDF</button>}
            {canEdit && (editing
              ? <>
                <button onClick={() => { setEditing(false); setFiles({}); setForm(Object.fromEntries(FIELDS.map(([key, , formKey]) => [formKey, item[key] || ""]))); }} className={HERO_OUTLINE_PLAIN}>Cancel</button>
                <button onClick={save} disabled={saving} className={HERO_NAVY}><span className={BUBBLE_ON_NAVY}>{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}</span>{saving ? "Saving..." : isTechnicalEmployee ? "Upload Photos" : "Save Changes"}</button>
              </>
              : <button onClick={() => setEditing(true)} className={HERO_NAVY}><span className={BUBBLE_ON_NAVY}><Pencil size={15} /></span>{isTechnicalEmployee ? "Upload Progress Photos" : "Edit Details"}</button>)}
          </div>}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <HeroStat icon={MapPin} label="Location">{locationLabel(item.location)}</HeroStat>
          <HeroStat icon={Zap} label="Installation Type">{item.installation_type || "—"}</HeroStat>
          <HeroStat icon={Wrench} label="Technician">{item.technician_name || "—"}</HeroStat>
          <HeroStat icon={FileText} label="Documents">{documentEntries.length ? `${documentEntries.length} uploaded` : "None uploaded"}</HeroStat>
        </div>
      </div>
    </div>

    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700">{notice}</p>}

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <DetailSection title="Customer Details" icon={User} fields={CUSTOMER_FIELDS} item={item} editing={canEditDetails} form={form} setForm={setForm} />
        {canEditDetails && <PartnerNetworkFields location={form?.location} form={form || {}} onChange={(event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))} />}
        <DetailSection title="Partner & Sales Details" icon={Briefcase} fields={PARTNER_FIELDS} item={item} editing={canEditDetails} form={form} setForm={setForm} />
        <DetailSection title="Installation Details" icon={Zap} fields={INSTALLATION_FIELDS} item={item} editing={canEditDetails} form={form} setForm={setForm} />
        {item.site_latitude != null && item.site_longitude != null && <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy/10 bg-white px-5 py-4">
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-soft text-amber"><MapPin size={18} /></span><div><h3 className="text-base font-bold text-navy">Site GPS location</h3><p className="text-xs text-muted">Accuracy: ±{item.site_accuracy_m ?? "—"} m</p></div></div>
          <a className="inline-flex items-center gap-1.5 rounded-full border border-navy/20 px-4 py-2 text-xs font-bold text-navy transition hover:border-amber" href={`https://maps.google.com/?q=${item.site_latitude},${item.site_longitude}`} target="_blank" rel="noreferrer"><ExternalLink size={13} />Open site on map</a>
        </section>}
        <DetailSection title="Site Address" icon={MapPin} fields={ADDRESS_FIELDS} item={item} editing={canEditDetails} form={form} setForm={setForm} />
        {item.technical_instructions && <Section icon={Wrench} title="Owner work instructions">
          <p className="whitespace-pre-wrap rounded-xl bg-offwhite px-4 py-3 text-sm font-medium text-navy">{item.technical_instructions}</p>
        </Section>}
        <Section icon={FileText} title="Uploaded Documents" badge={documentEntries.length ? `${documentEntries.length} ${documentEntries.length === 1 ? "file" : "files"}` : ""}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {canDownload && documentEntries.map(([name, url]) => <div key={name} className="flex min-w-0 flex-col gap-3 rounded-xl border border-navy/10 bg-white p-3.5 transition hover:border-amber hover:shadow-sm">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-soft text-amber"><FileTextIcon /></span>
                <span className="min-w-0 flex-1 break-words text-sm font-semibold leading-5 text-navy">{humanizeDocumentName(name)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-full border border-navy/15 px-3 py-2 text-xs font-bold text-navy transition hover:border-amber hover:bg-amber-soft/40"><ExternalLink size={13} />View</a>
                <a href={url} download className="inline-flex items-center justify-center gap-1.5 rounded-full bg-amber px-3 py-2 text-xs font-bold text-navy transition hover:bg-amber-hover"><Download size={13} />Download</a>
              </div>
            </div>)}
            {(!canDownload || !documentEntries.length) && <p className="rounded-xl border border-dashed border-navy/15 px-4 py-6 text-center text-sm text-muted sm:col-span-2">{canDownload ? "No documents uploaded." : "You do not have permission to view or download documents."}</p>}
          </div>
          {editing && <div className="mt-5 border-t border-navy/10 pt-5">
            <p className="text-sm font-bold text-navy">Replace documents</p>
            <p className="mt-1 text-xs text-muted">Choose a file only for the document you want to replace.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">{EDIT_FILES.map((name) => <label key={name} className="rounded-xl bg-offwhite px-4 py-3 text-xs font-semibold text-muted">{name.replace(/([A-Z])/g, " $1")}<input type="file" accept="image/*,.pdf" className="mt-2 block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-amber-soft file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-navy" onChange={(event) => setFiles((current) => ({ ...current, [name]: event.target.files?.[0] }))} />{files[name] && <span className="mt-1 block truncate font-medium text-emerald-700">Selected replacement: {files[name].name}</span>}</label>)}</div>
          </div>}
        </Section>
        {item.notes && <Section icon={MessageSquare} title="Customer Remarks">
          <p className="whitespace-pre-wrap rounded-xl bg-offwhite px-4 py-3 text-sm font-medium italic text-navy">{item.notes}</p>
        </Section>}
      </div>

      <div className="space-y-6">
        {canAssignTechnicalWork && <SideCard icon={Wrench} title="Technical work assignment" subtitle={`Assign this installation to a technician authorized for ${item.location === "kolkata" ? "West Bengal" : "Odisha"}.`}>
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-muted">Technician
              <select value={technicalAssignee} onChange={(event) => setTechnicalAssignee(event.target.value)} className={`${FIELD_INPUT} font-semibold`}>
                <option value="">Unassigned</option>
                {technicalEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {employee.designation || employee.department || "Technician"}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-muted">Work instructions
              <textarea value={technicalInstructions} onChange={(event) => setTechnicalInstructions(event.target.value)} rows={3} maxLength={4000} placeholder="Work instructions (optional)" className={FIELD_INPUT} />
            </label>
            <button onClick={saveAssignment} disabled={savingAssignment} className={BTN_NAVY}>{savingAssignment ? "Saving..." : "Save Assignment"}</button>
          </div>
        </SideCard>}

        <SideCard icon={BadgeCheck} title="Update Status" subtitle="Change the installation's current status and leave a note.">
          {canEdit ? <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-offwhite px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Current status</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-right text-[11px] font-bold ring-1 ring-inset ${statusStyle(item.status)}`}><BadgeCheck size={12} className="shrink-0" />{installationStatusLabel(item.status)}</span>
            </div>
            <label className="block text-xs font-semibold text-muted">Change status to
              <select value={newStatus} onChange={(event) => setNewStatus(event.target.value)} className={`${FIELD_INPUT} font-semibold`}>
                {!availableStatusOptions.some((status) => status.value === newStatus) && <option value={newStatus}>{installationStatusLabel(newStatus)} (current)</option>}
                {availableStatusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-muted">Note
              <textarea value={statusNote} onChange={(event) => setStatusNote(event.target.value)} placeholder="Note (optional)" rows={3} className={FIELD_INPUT} />
            </label>
            <div className="pt-1">
              <button onClick={saveStatus} disabled={savingStatus || newStatus === item.status} className={BTN_PRIMARY}>{savingStatus ? "Saving..." : "Save Status"}</button>
            </div>
          </div> : <p className="rounded-xl border border-dashed border-navy/15 px-4 py-6 text-center text-sm text-muted">Status changes are not available for your account.</p>}
        </SideCard>

        <SideCard icon={Clock} title="Status Timeline" subtitle="Every status change, newest first." badge={<span className="shrink-0 rounded-full bg-amber-soft px-3 py-1 text-xs font-bold text-navy">{history.length} {history.length === 1 ? "update" : "updates"}</span>}>
          {history.length === 0 && <p className="rounded-xl border border-dashed border-navy/15 px-4 py-6 text-center text-xs text-muted">No history yet.</p>}
          {history.length > 0 && <div className="ml-2 space-y-6 border-l-2 border-amber/30 pl-6">
            {history.map((entry, index) => <div key={entry.id} className="relative">
              <span className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white ring-2 ${index === 0 ? "bg-amber ring-amber/40" : "bg-amber/40 ring-amber/15"}`} />
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${statusStyle(entry.new_status)}`}>{installationStatusLabel(entry.new_status)}</span>
                {index === 0 && <span className="rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Latest</span>}
              </div>
              <p className="mt-1.5 text-xs font-semibold text-navy">{dateTime(entry.created_at)}</p>
              <p className="text-xs text-muted">by {entry.changed_by_name || "Customer"}</p>
              {entry.note && <p className="mt-2 rounded-lg bg-offwhite px-3 py-2 text-xs italic text-muted">{entry.note}</p>}
            </div>)}
          </div>}
        </SideCard>
      </div>
    </div>
  </div>;
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

function Section({ icon: Icon, title, badge, children }) {
  return <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
    <div className="flex items-center gap-3 border-b border-navy/10 px-5 py-4">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-soft text-amber"><Icon size={18} /></span>
      <h3 className="flex-1 text-base font-bold text-navy">{title}</h3>
      {badge && <span className="rounded-full bg-amber-soft px-3 py-1 text-xs font-bold text-navy">{badge}</span>}
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

function DetailSection({ title, icon, fields, item, editing, form, setForm }) {
  return <Section icon={icon} title={title}>
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {fields.map(([key, label]) => {
        const [, , formKey, type] = FIELDS.find(([fieldKey]) => fieldKey === key) || [];
        const Icon = FIELD_ICONS[label];
        const value = display(item[key]);
        const wide = !editing && String(value).length > 48;
        return <div key={key} className={`group flex min-w-0 items-start gap-3 rounded-xl border px-4 py-3 transition ${editing ? "border-amber/30 bg-white" : "border-transparent bg-offwhite hover:border-amber/40"} ${wide ? "sm:col-span-2" : ""}`}>
          {Icon && <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-navy/10 bg-white text-amber"><Icon size={15} /></span>}
          <div className="min-w-0 flex-1">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
            {editing
              ? <input type={type || "text"} value={form[formKey] || ""} onChange={(event) => setForm((current) => ({ ...current, [formKey]: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm font-semibold text-navy focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30" />
              : <dd className="mt-1 break-words text-sm font-semibold text-navy">{value}</dd>}
          </div>
          {!editing && COPYABLE.has(label) && item[key] && <CopyButton text={String(item[key])} />}
        </div>;
      })}
    </dl>
  </Section>;
}

function FileTextIcon() { return <FileText size={18} className="shrink-0 text-amber" aria-hidden="true" />; }