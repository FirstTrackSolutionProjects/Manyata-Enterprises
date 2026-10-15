import { useState } from "react";
import { BadgeCheck, Briefcase, Building2, CalendarDays, Check, Copy, Droplet, FileText, GraduationCap, Hash, Heart, Landmark, Mail, MapPin, Pencil, Phone, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { updateMyEmployeeProfile } from "../services/api";
import JoinUsDetailsModal from "./JoinUsDetailsModal";

/* ── UI-only helpers (styles, icons) ───────────────── */

const SECTION_ICONS = {
  "Personal Details": User,
  "Address": MapPin,
  "Education & Experience": GraduationCap,
  "Bank Details": Landmark,
  "About": FileText,
};
const FIELD_ICONS = {
  "Full Name": User, "Email": Mail, "Phone": Phone, "Date of Birth": CalendarDays, "Gender": User,
  "Father's Name": User, "Mother's Name": User, "Blood Group": Droplet, "Marital Status": Heart,
  "Street Address": MapPin, "City": MapPin, "District": MapPin, "State": MapPin, "Postal Code": Hash, "Country": MapPin, "Location / Posting Preference": MapPin,
  "Qualification": GraduationCap, "Institution": Building2, "Year of Passing": CalendarDays, "Experience": Briefcase, "Company": Building2, "Designation": Briefcase,
  "Bank Name": Landmark, "Account Number": Hash, "IFSC Code": Hash,
};
const COPYABLE = new Set(["Email", "Phone", "Account Number", "IFSC Code"]);
const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "E";

const HERO_BASE = "group inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-5 text-sm font-bold transition hover:-translate-y-0.5 active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";
const HERO_NAVY = `${HERO_BASE} bg-navy text-white shadow-sm hover:bg-navy-light hover:shadow-lg`;
const BUBBLE_ON_NAVY = "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber text-navy transition group-hover:scale-110";

export default function EmployeeProfile() {
  const { user, refresh } = useAuth();
  const [editing, setEditing] = useState(false);
  const profile = user?.profileDetails || {};
  const nameParts = String(user?.name || "").trim().split(/\s+/).filter(Boolean);
  const submission = {
    ...profile,
    id: user?.id,
    created_at: user?.createdAt || new Date().toISOString(),
    firstName: profile.firstName || nameParts.shift() || "",
    lastName: profile.lastName || nameParts.join(" "),
    email: user?.email || "",
    phone: user?.phone || "",
    streetAddress: user?.address || profile.streetAddress || "",
    city: user?.city || profile.city || "",
    state: user?.state || profile.state || "",
    postalCode: user?.pincode || profile.postalCode || "",
    profileDetails: profile,
    documentUrls: {},
  };
  const groups = [
    { title: "Personal Details", fields: [["Full Name", user?.name], ["Email", user?.email], ["Phone", user?.phone], ["Date of Birth", profile.dob], ["Gender", profile.gender], ["Father's Name", profile.fatherName], ["Mother's Name", profile.motherName], ["Blood Group", profile.bloodGroup], ["Marital Status", profile.maritalStatus]] },
    { title: "Address", fields: [["Street Address", user?.address || profile.streetAddress], ["City", user?.city || profile.city], ["District", profile.district], ["State", user?.state || profile.state], ["Postal Code", user?.pincode || profile.postalCode], ["Country", profile.country], ["Location / Posting Preference", profile.location]] },
    { title: "Education & Experience", fields: [["Qualification", profile.qualification], ["Institution", profile.institutionName], ["Year of Passing", profile.yearOfPassing], ["Experience", profile.experience], ["Company", profile.companyName], ["Designation", profile.designation || user?.designation]] },
    { title: "Bank Details", fields: [["Bank Name", profile.bankName], ["Account Number", profile.accountNumber], ["IFSC Code", profile.ifscCode]] },
  ];
  const displayProfileValue = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "object") {
      try { return JSON.stringify(value); } catch { return "—"; }
    }
    return String(value);
  };
  const employeeId = user?.userId || user?.user_id || "";
  const employeeName = user?.name || "Employee";
  return <div className="space-y-6">
    <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
      <div className="relative h-32 overflow-hidden bg-gradient-to-r from-navy via-navy to-navy-light sm:h-36">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-amber/20" />
        <div className="pointer-events-none absolute right-40 top-14 h-28 w-28 rounded-full bg-amber/10" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber via-amber/60 to-transparent" />
        <div className="absolute inset-x-5 top-5 flex flex-wrap items-center justify-between gap-2 sm:inset-x-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur"><User size={14} />Employee Profile</span>
          {employeeId && <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber px-3 py-1 font-mono text-[11px] font-bold text-navy">{employeeId}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white ring-1 ring-white/25"><BadgeCheck size={12} />{user?.department || "Employee"}</span>
          </div>}
        </div>
      </div>

      <div className="px-5 pb-6 sm:px-6">
        <div className="flex flex-wrap items-start gap-4 sm:gap-6">
          {user?.profilePhoto
            ? <img src={user.profilePhoto} alt={`${employeeName} profile`} className="relative z-10 -mt-14 h-28 w-28 shrink-0 rounded-full border border-navy/10 object-cover shadow-lg ring-4 ring-white sm:-mt-16 sm:h-32 sm:w-32" />
            : <div className="relative z-10 -mt-14 grid h-28 w-28 shrink-0 place-items-center rounded-full bg-amber-soft text-3xl font-extrabold text-navy shadow-lg ring-4 ring-white sm:-mt-16 sm:h-32 sm:w-32">{initials(user?.name || "")}</div>}

          <div className="min-w-[260px] flex-1 pt-1 sm:pt-3">
            <h2 className="break-words text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{employeeName}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {user?.phone && <span className="inline-flex items-center gap-1.5 rounded-full bg-offwhite px-3 py-1.5 text-xs font-semibold text-navy"><Phone size={13} className="text-amber" />{user.phone}</span>}
              {user?.email && <span className="inline-flex items-center gap-1.5 break-all rounded-full bg-offwhite px-3 py-1.5 text-xs font-semibold text-navy"><Mail size={13} className="text-amber" />{user.email}</span>}
            </div>
            <p className="mt-3 text-xs text-muted">View your saved profile information.</p>
          </div>

          <div className="flex w-full flex-wrap gap-2 border-t border-navy/10 pt-5">
            <button onClick={() => setEditing(true)} className={HERO_NAVY}><span className={BUBBLE_ON_NAVY}><Pencil size={15} /></span>Edit Profile</button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <HeroStat icon={Hash} label="Employee ID">{employeeId || "—"}</HeroStat>
          <HeroStat icon={Building2} label="Department">{user?.department || "Employee"}</HeroStat>
          <HeroStat icon={Briefcase} label="Designation">{profile.designation || user?.designation || "—"}</HeroStat>
          <HeroStat icon={MapPin} label="Posting Location">{displayProfileValue(profile.location)}</HeroStat>
        </div>
      </div>
    </div>

    {groups.map((group) => <Section key={group.title} title={group.title}>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {group.fields.map(([label, value]) => <FieldTile key={label} label={label} value={displayProfileValue(value)} />)}
      </dl>
    </Section>)}
    {profile.description && <Section title="About">
      <dl className="grid grid-cols-1 gap-3"><FieldTile label="Description" value={displayProfileValue(profile.description)} /></dl>
    </Section>}
    {editing && <JoinUsDetailsModal submission={submission} employeeProfile onClose={() => setEditing(false)} onSaveProfile={async (payload) => { const result = await updateMyEmployeeProfile(payload); await refresh(); return result; }} onSaved={() => setEditing(false)} />}
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

function Section({ title, children }) {
  const Icon = SECTION_ICONS[title] || FileText;
  return <section className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
    <div className="flex items-center gap-3 border-b border-navy/10 px-5 py-4">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-soft text-amber"><Icon size={18} /></span>
      <h3 className="flex-1 text-base font-bold text-navy">{title}</h3>
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
  const empty = value === "—";
  const wide = String(value).length > 48 || label === "Description";
  return <div className={`group flex items-start gap-3 rounded-xl border border-transparent bg-offwhite px-4 py-3 transition hover:border-amber/40 ${wide ? "sm:col-span-2 xl:col-span-3" : ""}`}>
    {Icon && <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-navy/10 bg-white text-amber"><Icon size={15} /></span>}
    <div className="min-w-0 flex-1">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`mt-1 whitespace-pre-wrap break-words text-sm font-semibold ${empty ? "text-muted" : "text-navy"}`}>{value}</dd>
    </div>
    {COPYABLE.has(label) && !empty && <CopyButton text={String(value)} />}
  </div>;
}