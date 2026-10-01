import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Download, Loader2, RotateCcw, Upload, X } from "lucide-react";

const placeCache = new Map();
const reverseGeocode = async ({ latitude, longitude }) => {
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  if (placeCache.has(cacheKey)) return placeCache.get(cacheKey);
  try {
    const params = new URLSearchParams({ format: "jsonv2", lat: latitude, lon: longitude, zoom: "18", addressdetails: "1" });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(4000) });
    if (!response.ok) return "";
    const data = await response.json();
    const address = data.address || {};
    const parts = [address.house_number, address.road, address.neighbourhood, address.suburb, address.village || address.town || address.city || address.county, address.state_district, address.state]
      .filter(Boolean).filter((part, index, list) => list.findIndex((value) => value.toLowerCase() === part.toLowerCase()) === index);
    const place = (parts.join(", ") || data.display_name || "").slice(0, 150);
    if (place) placeCache.set(cacheKey, place);
    return place;
  } catch {
    return "";
  }
};

/** File picker and live camera capture with a review step before attaching. */
export default function CameraFileInput({ label, name, accept, required = false, onFile }) {
  const pickerRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [filename, setFilename] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [facing, setFacing] = useState("environment");
  const [capturedFile, setCapturedFile] = useState(null);
  const [capturedMeta, setCapturedMeta] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [startingCamera, setStartingCamera] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const downloadUrl = useMemo(() => selectedFile ? URL.createObjectURL(selectedFile) : "", [selectedFile]);
  const reviewUrl = useMemo(() => capturedFile ? URL.createObjectURL(capturedFile) : "", [capturedFile]);

  useEffect(() => () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    if (reviewUrl) URL.revokeObjectURL(reviewUrl);
  }, [downloadUrl, reviewUrl]);

  useEffect(() => {
    if (cameraOpen && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOpen, startingCamera, capturedFile]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
    setCapturedFile(null);
    setCapturedMeta(null);
  };

  const selectFile = (file) => {
    if (!file) return;
    setFilename(file.name || "Selected photo");
    setSelectedFile(file);
    onFile?.(file);
  };

  const startCamera = async (nextFacing) => {
    setFacing(nextFacing);
    setCameraError("");
    setStartingCamera(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Live camera preview is not supported by this browser. Use Choose file to select a photo.");
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: nextFacing } }, audio: false });
      streamRef.current = stream;
      setCapturedFile(null);
      setCameraOpen(true);
    } catch (error) {
      setCameraError(error.name === "NotAllowedError" ? "Camera permission was denied. Allow camera access in your browser and try again." : error.message || "Could not open the camera. Check camera permissions and try again.");
    } finally {
      setStartingCamera(false);
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video?.videoHeight) {
      setCameraError("Camera is starting. Please wait a moment and try again.");
      return;
    }
    setCapturing(true);
    const capturedAt = new Date();
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (!context) {
      setCapturing(false);
      setCameraError("Could not process this photo. Please try again.");
      return;
    }
    const gps = await new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      const fallback = window.setTimeout(() => resolve(null), 8000);
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        window.clearTimeout(fallback);
        resolve({ latitude: Number(coords.latitude.toFixed(6)), longitude: Number(coords.longitude.toFixed(6)), accuracy: Math.round(coords.accuracy) });
      }, () => {
        window.clearTimeout(fallback);
        resolve(null);
      }, { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 });
    });
    const place = gps ? await reverseGeocode(gps) : "";
    const footerHeight = Math.max(150, Math.round(canvas.height * 0.22));
    const scale = canvas.width / 900;
    const fontSize = Math.max(15, Math.round(23 * scale));
    const dateTime = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(capturedAt);
    const locationLine = place || (gps ? "GPS location captured" : "GPS LOCATION NOT CAPTURED");
    const coordinatesLine = gps ? `LAT ${Math.abs(gps.latitude).toFixed(6)}° ${gps.latitude < 0 ? "S" : "N"}   LON ${Math.abs(gps.longitude).toFixed(6)}° ${gps.longitude < 0 ? "W" : "E"}   ±${gps.accuracy} m` : "Coordinates unavailable";
    context.fillStyle = "rgba(5, 18, 35, 0.84)";
    context.fillRect(0, canvas.height - footerHeight, canvas.width, footerHeight);
    context.fillStyle = "#f7a51b";
    context.fillRect(0, canvas.height - footerHeight, canvas.width, Math.max(3, Math.round(4 * scale)));
    context.textBaseline = "middle";
    context.fillStyle = "#ffffff";
    context.font = `600 ${fontSize}px Arial, sans-serif`;
    context.fillText(locationLine, Math.round(24 * scale), canvas.height - footerHeight + Math.round(footerHeight * 0.25), canvas.width - Math.round(48 * scale));
    context.fillStyle = "#ffffff";
    context.font = `600 ${Math.round(fontSize * 0.86)}px Arial, sans-serif`;
    context.fillText(coordinatesLine, Math.round(24 * scale), canvas.height - footerHeight + Math.round(footerHeight * 0.49), canvas.width - Math.round(48 * scale));
    context.fillStyle = "#ffd44f";
    context.font = `700 ${fontSize}px Arial, sans-serif`;
    context.fillText(`${dateTime} IST`, Math.round(24 * scale), canvas.height - footerHeight + Math.round(footerHeight * 0.73), canvas.width - Math.round(48 * scale));
    context.fillStyle = "#cbd5e1";
    context.font = `400 ${Math.max(10, Math.round(fontSize * 0.48))}px Arial, sans-serif`;
    context.fillText("© OpenStreetMap contributors", Math.round(24 * scale), canvas.height - footerHeight + Math.round(footerHeight * 0.91), canvas.width - Math.round(48 * scale));
    canvas.toBlob((blob) => {
      if (!blob) {
        setCapturing(false);
        setCameraError("Could not capture this photo. Please try again.");
        return;
      }
      const file = new File([blob], `${name || "photo"}-${Date.now()}.jpg`, { type: "image/jpeg" });
      setCapturedFile(file);
      setCapturedMeta({ gps, place, capturedAt });
      setCapturing(false);
      setCameraError("");
    }, "image/jpeg", 0.92);
  };

  const useCapturedPhoto = () => {
    if (!capturedFile || !pickerRef.current) return;
    const transfer = new DataTransfer();
    transfer.items.add(capturedFile);
    pickerRef.current.files = transfer.files;
    selectFile(capturedFile);
    stopCamera();
  };

  return (
    <div className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-navy/70">{label}{required && <span className="ml-1 text-red-500">*</span>}</span>
      <div className="flex flex-wrap items-stretch gap-2">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-navy/25 px-3 py-3 text-xs text-muted hover:border-amber hover:text-navy">
          <Upload size={15} /><span className="max-w-full truncate">{filename || "Choose file"}</span>
          <input ref={pickerRef} type="file" name={name} accept={accept} required={required} onChange={(event) => selectFile(event.target.files?.[0])} className="sr-only" />
        </label>
        {[{ facing: "user", label: "Front camera" }, { facing: "environment", label: "Rear camera" }].map((option) => <button key={option.facing} type="button" disabled={startingCamera} onClick={() => startCamera(option.facing)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-navy/15 bg-white px-3 py-2 text-xs font-semibold text-navy hover:border-amber disabled:opacity-60"><Camera size={15} />{option.label}</button>)}
        {selectedFile && downloadUrl && <a href={downloadUrl} download={selectedFile.name || `${name || "photo"}.jpg`} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"><Download size={14} />Download photo</a>}
      </div>
      {cameraError && !cameraOpen && <p role="alert" className="mt-2 text-xs text-red-700">{cameraError}</p>}
      <p className="mt-1 text-[11px] text-muted">Captured photos include the location name, latitude / longitude and date / time. Allow GPS access for accurate coordinates.</p>

      {cameraOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Camera photo capture">
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-navy/10 px-4 py-3"><div><h3 className="font-bold text-navy">{capturedFile ? "Review photo" : `${facing === "user" ? "Front" : "Rear"} camera`}</h3><p className="text-xs text-muted">{capturedFile ? "Check the image before attaching it to the form." : "Position the subject in the frame, then take the photo."}</p></div><button type="button" onClick={stopCamera} className="rounded-lg p-2 text-muted hover:bg-slate-100" aria-label="Close camera"><X size={20} /></button></div>
          {cameraError && <p role="alert" className="mx-4 mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{cameraError}</p>}
          <div className="bg-black">{capturedFile ? <><img src={reviewUrl} alt="Captured preview" className="max-h-[58vh] w-full object-contain" />{capturedMeta && <div className="space-y-1 bg-slate-50 px-4 py-3 text-xs text-navy"><p className="font-semibold">{capturedMeta.place || "Location name unavailable"}</p><p>{capturedMeta.gps ? `LAT ${Math.abs(capturedMeta.gps.latitude).toFixed(6)}° ${capturedMeta.gps.latitude < 0 ? "S" : "N"} · LON ${Math.abs(capturedMeta.gps.longitude).toFixed(6)}° ${capturedMeta.gps.longitude < 0 ? "W" : "E"} · ±${capturedMeta.gps.accuracy} m` : "GPS coordinates unavailable"}</p><p>{new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "medium" }).format(capturedMeta.capturedAt)} IST</p>{capturedMeta.gps && <a href={`https://www.openstreetmap.org/?mlat=${capturedMeta.gps.latitude}&mlon=${capturedMeta.gps.longitude}#map=18/${capturedMeta.gps.latitude}/${capturedMeta.gps.longitude}`} target="_blank" rel="noreferrer" className="inline-block font-semibold text-blue-700 underline">Open map · © OpenStreetMap contributors</a>}</div>}</> : <video ref={videoRef} autoPlay muted playsInline className="max-h-[68vh] min-h-64 w-full object-contain" />}</div>
          <div className="flex flex-wrap justify-center gap-3 p-4">{capturedFile ? <><button type="button" onClick={() => setCapturedFile(null)} className="inline-flex items-center gap-2 rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy"><RotateCcw size={16} />Retake</button><button type="button" onClick={useCapturedPhoto} className="inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy"><Check size={16} />Use photo</button></> : <button type="button" disabled={capturing} onClick={capturePhoto} className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-bold text-navy disabled:opacity-70">{capturing ? <Loader2 size={17} className="animate-spin" /> : <Camera size={17} />}{capturing ? "Adding date, time & GPS…" : "Take photo"}</button>}</div>
        </div>
      </div>}
    </div>
  );
}
