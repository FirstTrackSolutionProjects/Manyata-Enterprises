import { useEffect, useState } from "react";
import { Camera, Download, MapPin, RotateCcw } from "lucide-react";

export default function SiteCapture() {
  const [photo, setPhoto] = useState(null);
  const [gps, setGps] = useState(null);
  const [facing, setFacing] = useState("environment");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!photo) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const captureLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("This browser does not support location capture.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setGps({ latitude: Number(coords.latitude.toFixed(7)), longitude: Number(coords.longitude.toFixed(7)), accuracy: Math.round(coords.accuracy) }),
      (reason) => setError(reason.code === 1 ? "Location permission was denied. Allow access in your browser and try again." : "Could not get your location. Check device GPS and try again."),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  const reset = () => {
    setPhoto(null);
    setGps(null);
    setError("");
  };

  return <main className="min-h-[70vh] bg-slate-50 px-4 py-10 sm:px-6">
    <div className="mx-auto max-w-3xl space-y-6">
      <header><p className="text-sm font-bold text-amber">Manyata Enterprises</p><h1 className="mt-1 text-3xl font-extrabold text-navy">GPS &amp; Camera</h1><p className="mt-2 text-sm text-muted">Capture a photo with your device camera and optionally read your current GPS coordinates.</p></header>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <section className="space-y-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-6">
        <div><h2 className="flex items-center gap-2 font-bold text-navy"><Camera size={18} className="text-amber" />Take a photo</h2><p className="mt-1 text-xs text-muted">On mobile, choose the front or rear camera. The photo stays on this device unless you attach it to a form.</p></div>
        <div className="flex flex-wrap gap-2">
          {[{ value: "user", label: "Open front camera" }, { value: "environment", label: "Open rear camera" }].map((option) => <button key={option.value} type="button" onClick={() => setFacing(option.value)} className={`rounded-lg border px-4 py-2.5 text-sm font-semibold ${facing === option.value ? "border-amber bg-amber-soft text-navy" : "border-navy/15 text-navy"}`}>{option.label}</button>)}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-amber px-4 py-2.5 text-sm font-bold text-navy hover:bg-amber-hover"><Camera size={16} />{photo ? "Retake photo" : "Start camera"}<input type="file" accept="image/*" capture={facing} onChange={(event) => { const file = event.target.files?.[0]; if (file) setPhoto(file); event.target.value = ""; }} className="sr-only" /></label>
        </div>
        {previewUrl && <div className="max-w-md overflow-hidden rounded-xl border border-navy/10"><img src={previewUrl} alt="Captured site" className="max-h-[420px] w-full object-contain" /><div className="flex flex-wrap items-center justify-between gap-2 border-t border-navy/10 px-3 py-2"><p className="break-all text-xs text-muted">{photo?.name || "Captured photo"}</p><a href={previewUrl} download={photo?.name || "site-photo.jpg"} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"><Download size={14} />Download photo</a></div></div>}
      </section>
      <section className="space-y-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm sm:p-6">
        <div><h2 className="flex items-center gap-2 font-bold text-navy"><MapPin size={18} className="text-amber" />Capture GPS location</h2><p className="mt-1 text-xs text-muted">Your browser will ask for permission. Coordinates are shown only on this page.</p></div>
        <button type="button" onClick={captureLocation} className="rounded-lg border border-navy/15 px-4 py-2.5 text-sm font-semibold text-navy hover:border-amber">{gps ? "Refresh GPS" : "Capture GPS"}</button>
        {gps && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Location captured · ±{gps.accuracy} m accuracy<br /><span className="break-all font-mono text-xs">{gps.latitude}, {gps.longitude}</span><a href={`https://maps.google.com/?q=${gps.latitude},${gps.longitude}`} target="_blank" rel="noreferrer" className="ml-2 font-semibold underline">Open map</a></div>}
      </section>
      {(photo || gps) && <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-navy/15 px-4 py-2 text-sm font-semibold text-navy"><RotateCcw size={15} />Clear capture</button>}
    </div>
  </main>;
}
