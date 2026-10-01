import { useState } from "react";
import { MapPin } from "lucide-react";

export default function GeoLocationCapture({ value, onChange, title = "Capture site GPS" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const capture = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("This browser does not support GPS location.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onChange({ latitude: Number(coords.latitude.toFixed(7)), longitude: Number(coords.longitude.toFixed(7)), accuracy: Math.round(coords.accuracy) });
        setLoading(false);
      },
      (reason) => {
        setError(reason.code === 1 ? "Location permission was denied. Allow location access in your browser and try again." : reason.code === 3 ? "Could not get an accurate location in time. Please try again outdoors." : "Could not read your location. Check GPS settings and try again.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  return (
    <div className="rounded-xl border border-navy/10 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-navy"><MapPin size={16} className="text-amber" />{title}</p>
          <p className="mt-1 text-xs text-muted">Share your current location with this submission. Coordinates are visible to authorized staff.</p>
        </div>
        <button type="button" onClick={capture} disabled={loading} className="shrink-0 rounded-full border border-navy/15 px-4 py-2 text-xs font-bold text-navy disabled:opacity-60">
          {loading ? "Getting location…" : value ? "Refresh GPS" : "Capture GPS"}
        </button>
      </div>
      {value && <p className="mt-3 break-all text-xs text-emerald-700">Location captured · ±{value.accuracy} m accuracy · {value.latitude}, {value.longitude}</p>}
      {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
    </div>
  );
}
