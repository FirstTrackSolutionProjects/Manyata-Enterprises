import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Loader2, Save } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getInstallation, updateInstallation, updateInstallationStatus, uploadFilesToS3 } from "../services/api";
import { hasActionPermission } from "../utils/permissions";

const FIELDS = [
  ["customer_name", "Customer Name", "customerName"], ["phone", "Phone", "phone"],
  ["email", "Email", "email"], ["company_name", "Company", "companyName"],
  ["contact_person", "Contact Person", "contactPerson"], ["location", "Location", "location"],
  ["installation_type", "Installation Type", "installationType"], ["installation_date", "Installation Date", "installationDate", "date"],
  ["electrician_name", "Electrician", "electricianName"], ["technician_name", "Technician", "technicianName"],
  ["solar_panel_type", "Solar Panel Type", "solarPanelType"], ["connection_type", "Connection Type", "connectionType"],
  ["state", "State", "state"], ["address", "Address", "address"], ["city", "City", "city"],
  ["pincode", "PIN Code", "pincode"], ["notes", "Notes", "notes"],
];

const EDIT_FILES = ["aadhaarPhoto", "fullSetupPhoto", "panelSerialPhoto1", "panelSerialPhoto2", "panelSerialPhoto3", "panelSerialPhoto4", "panelSerialPhoto5", "panelSerialPhoto6", "inverterSerialPhoto", "earthingPhoto1", "earthingPhoto2", "earthingPhoto3", "laCableConnectorPhoto", "earthingArresterSpikePhoto", "inverterAcdbDcdbPhoto", "batteryPhoto1", "batteryPhoto2", "otherDocument"];
const display = (value) => value || "—";
const dateTime = (value) => value ? new Date(value).toLocaleString("en-IN") : "—";

export default function InstallationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = hasActionPermission(user, "installations", "edit");
  const canDownload = hasActionPermission(user, "installations", "download");
  const [item, setItem] = useState(null);
  const [form, setForm] = useState(null);
  const [files, setFiles] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getInstallation(id);
      const record = response.data.installation;
      setItem(record);
      setForm(Object.fromEntries(FIELDS.map(([key, , formKey]) => [formKey, record[key] || ""])));
    } catch (err) {
      setError(err.message || "Could not load installation details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [id]);

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

  const changeStatus = async (status) => {
    setError("");
    setNotice("");
    try {
      await updateInstallationStatus(id, status);
      setItem((current) => ({ ...current, status }));
      setNotice("Installation status updated.");
    } catch (err) {
      setError(err.message || "Could not update installation status.");
    }
  };

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="animate-spin text-amber" /></div>;
  if (error && !item) return <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-6"><p className="text-sm text-red-700">{error}</p><div className="flex gap-3"><button onClick={() => navigate("/admin?section=installations")} className="rounded-full border border-navy/20 px-4 py-2 text-sm font-semibold text-navy">Back to Installations</button><button onClick={load} className="rounded-full bg-amber px-4 py-2 text-sm font-bold text-navy">Try again</button></div></div>;
  if (!item || !form) return null;

  const documentEntries = Object.entries(item.documents || {}).filter(([, url]) => Boolean(url));
  const statusStyle = item.status === "completed" ? "bg-emerald-50 text-emerald-700" : item.status === "reviewed" ? "bg-blue-50 text-blue-700" : "bg-amber-soft text-amber-700";

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-navy/10 pb-5">
      <div><Link to="/admin?section=installations" className="inline-flex items-center gap-2 rounded-full border border-navy/20 px-4 py-2 text-sm font-semibold text-navy"><ArrowLeft size={15} /> Back</Link><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-amber">Installation #{item.id}</p><h2 className="mt-1 text-2xl font-extrabold text-navy">{item.customer_name}</h2><p className="mt-1 text-sm text-muted">Created {dateTime(item.created_at)} · Updated {dateTime(item.updated_at)}</p></div>
      {canEdit && <div className="flex flex-wrap gap-2">{editing ? <><button onClick={() => { setEditing(false); setFiles({}); setForm(Object.fromEntries(FIELDS.map(([key, , formKey]) => [formKey, item[key] || ""]))); }} className="rounded-full border border-navy/20 px-5 py-2.5 text-sm font-semibold text-navy">Cancel</button><button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy disabled:opacity-60"><Save size={15} />{saving ? "Saving..." : "Save Changes"}</button></> : <button onClick={() => setEditing(true)} className="rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy">Edit Details</button>}</div>}
    </div>

    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-navy/10 bg-white p-6">
          <div className="mb-5 flex items-center justify-between"><h3 className="font-bold text-navy">Installation Details</h3><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle}`}>{item.status}</span></div>
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {FIELDS.map(([key, label, formKey, type]) => <div key={key} className="min-w-0"><p className="text-xs text-muted">{label}</p>{editing ? <input type={type || "text"} value={form[formKey] || ""} onChange={(event) => setForm((current) => ({ ...current, [formKey]: event.target.value }))} className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy focus:border-amber focus:outline-none" /> : <p className="mt-1 break-words text-sm font-semibold text-navy">{display(item[key])}</p>}</div>)}
          </div>
        </section>
        <section className="rounded-2xl border border-navy/10 bg-white p-6">
          <h3 className="font-bold text-navy">Documents</h3>
          <div className="mt-4 flex flex-wrap gap-2">{canDownload && documentEntries.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-amber-soft px-3 py-2 text-xs font-semibold text-navy"><Download size={14} /> Download {name.replace(/([A-Z])/g, " $1")}</a>)}{(!canDownload || !documentEntries.length) && <p className="text-sm text-muted">{canDownload ? "No documents uploaded." : "You do not have permission to download documents."}</p>}</div>
          {editing && <div className="mt-5 grid gap-3 sm:grid-cols-2">{EDIT_FILES.map((name) => <label key={name} className="text-xs font-semibold text-muted">{name.replace(/([A-Z])/g, " $1")}<input type="file" className="mt-1 block w-full text-xs" onChange={(event) => setFiles((current) => ({ ...current, [name]: event.target.files?.[0] }))} /></label>)}</div>}
        </section>
      </div>
      <aside className="h-fit rounded-2xl border border-navy/10 bg-white p-6">
        <h3 className="font-bold text-navy">Update Status</h3>
        <p className="mt-1 text-sm text-muted">Current status: <span className="font-semibold capitalize text-navy">{item.status}</span></p>
        {canEdit ? <select value={item.status} onChange={(event) => changeStatus(event.target.value)} className="mt-4 w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm"><option value="pending">Pending</option><option value="reviewed">Reviewed</option><option value="completed">Completed</option></select> : <p className="mt-4 text-sm text-muted">Status changes are not available for your account.</p>}
      </aside>
    </div>
  </div>;
}
