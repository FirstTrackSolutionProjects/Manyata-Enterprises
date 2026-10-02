import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Download, Loader2, RotateCcw, Upload, X } from "lucide-react";

const placeCache = new Map();
const uniqueParts = (parts) => parts.filter(Boolean).filter((part, index, list) => list.findIndex((value) => value.toLowerCase() === part.toLowerCase()) === index);
const OSM_TILE_TEMPLATE = import.meta.env.VITE_OSM_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const loadMapTile = ({ latitude, longitude }) => new Promise((resolve) => {
  const zoom = 15;
  const count = 2 ** zoom;
  const x = ((longitude + 180) / 360) * count;
  const latitudeRadians = (latitude * Math.PI) / 180;
  const y = ((1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2) * count;
  const tileX = Math.floor(x);
  const tileY = Math.floor(y);
  const image = new Image();
  const timeout = window.setTimeout(() => resolve(null), 3500);
  image.crossOrigin = "anonymous";
  image.onload = () => {
    window.clearTimeout(timeout);
    resolve({ image, markerX: (x - tileX) * 256, markerY: (y - tileY) * 256 });
  };
  image.onerror = () => {
    window.clearTimeout(timeout);
    resolve(null);
  };
  image.src = OSM_TILE_TEMPLATE.replace("{z}", zoom).replace("{x}", tileX).replace("{y}", tileY);
});

const drawWrappedText = (context, text, x, y, maxWidth, lineHeight, maxLines = 2) => {
  const words = String(text || "").split(/\s+/);
  let line = "";
  let lineIndex = 0;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && context.measureText(next).width > maxWidth) {
      context.fillText(line, x, y + lineIndex * lineHeight, maxWidth);
      line = word;
      lineIndex += 1;
      if (lineIndex >= maxLines) break;
    } else line = next;
  }
  if (lineIndex < maxLines && line) context.fillText(line, x, y + lineIndex * lineHeight, maxWidth);
};

const lookupWithPhoton = async ({ latitude, longitude }) => {
  const params = new URLSearchParams({ lat: latitude, lon: longitude, lang: "en" });
  const response = await fetch(`https://photon.komoot.io/reverse?${params}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(5000) });
  if (!response.ok) return "";
  const feature = (await response.json()).features?.[0]?.properties;
  if (!feature) return "";
  return uniqueParts([feature.name, feature.street, feature.district, feature.city || feature.locality, feature.state, feature.country]).join(", ").slice(0, 150);
};

const reverseGeocode = async ({ latitude, longitude }) => {
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  if (placeCache.has(cacheKey)) return placeCache.get(cacheKey);
  try {
    const params = new URLSearchParams({ format: "jsonv2", lat: latitude, lon: longitude, zoom: "18", addressdetails: "1" });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { headers: { Accept: "application/json", "Accept-Language": "en" }, signal: AbortSignal.timeout(4000) });
    const data = response.ok ? await response.json() : null;
    const address = data?.address || {};
    const parts = uniqueParts([address.house_number, address.road, address.neighbourhood, address.suburb, address.village || address.town || address.city || address.county, address.state_district, address.state]);
    const place = (parts.join(", ") || data?.display_name || await lookupWithPhoton({ latitude, longitude })).slice(0, 150);
    if (place) placeCache.set(cacheKey, place);
    return place;
  } catch {
    try {
      const place = await lookupWithPhoton({ latitude, longitude });
      if (place) placeCache.set(cacheKey, place);
      return place;
    } catch {
      return "";
    }
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
    const mapTile = gps ? await loadMapTile(gps) : null;
    const footerHeight = Math.max(220, Math.round(canvas.height * 0.29));
    const scale = Math.min(canvas.width / 900, canvas.height / 1100);
    const padding = Math.max(8, Math.round(22 * scale));
    const mapSize = gps ? Math.max(72, Math.min(footerHeight - padding * 2, Math.round(canvas.width * 0.29))) : 0;
    const detailX = gps ? padding + mapSize + padding : padding;
    const detailWidth = Math.max(80, canvas.width - detailX - padding);
    const fontSize = Math.max(12, Math.round(22 * scale));
    const dateText = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(capturedAt);
    const timeText = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(capturedAt);
    const locationLine = place || (gps ? "GPS location captured" : "GPS location unavailable");
    const latitudeLine = gps ? `LAT  ${Math.abs(gps.latitude).toFixed(6)}°  ${gps.latitude < 0 ? "S" : "N"}` : "LAT  unavailable";
    const longitudeLine = gps ? `LON  ${Math.abs(gps.longitude).toFixed(6)}°  ${gps.longitude < 0 ? "W" : "E"}` : "LON  unavailable";
    const innerHeight = footerHeight - padding * 2;
    const textLineHeight = Math.max(15, Math.round(fontSize * 1.42));
    const locationY = canvas.height - footerHeight + padding + Math.round(innerHeight * 0.08);
    context.fillStyle = "rgba(5, 18, 35, 0.9)";
    context.fillRect(0, canvas.height - footerHeight, canvas.width, footerHeight);
    context.fillStyle = "#f7a51b";
    context.fillRect(0, canvas.height - footerHeight, canvas.width, Math.max(3, Math.round(4 * Math.max(scale, 0.7))));
    const mapX = padding;
    const mapY = canvas.height - footerHeight + padding;
    if (gps) {
      context.fillStyle = "#e2e8f0";
      context.fillRect(mapX, mapY, mapSize, mapSize);
    }
    if (mapTile && gps) {
      context.save();
      context.beginPath();
      context.rect(mapX, mapY, mapSize, mapSize);
      context.clip();
      context.drawImage(mapTile.image, mapX, mapY, mapSize, mapSize);
      const markerX = mapX + (mapTile.markerX / 256) * mapSize;
      const markerY = mapY + (mapTile.markerY / 256) * mapSize;
      context.beginPath();
      context.fillStyle = "#ef4444";
      context.arc(markerX, markerY, Math.max(5, Math.round(8 * scale)), 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.fillStyle = "#ffffff";
      context.arc(markerX, markerY, Math.max(2, Math.round(3 * scale)), 0, Math.PI * 2);
      context.fill();
      const accuracyLabel = `±${gps.accuracy} m`;
      const accuracyFontSize = Math.max(9, Math.round(fontSize * 0.58));
      context.font = `600 ${accuracyFontSize}px Arial, sans-serif`;
      const accuracyWidth = context.measureText(accuracyLabel).width + padding;
      const accuracyHeight = accuracyFontSize + Math.max(4, Math.round(4 * scale));
      context.fillStyle = "rgba(5, 18, 35, 0.78)";
      context.fillRect(mapX, mapY + mapSize - accuracyHeight, accuracyWidth, accuracyHeight);
      context.fillStyle = "#5fe0d1";
      context.textBaseline = "middle";
      context.fillText(accuracyLabel, mapX + padding / 2, mapY + mapSize - accuracyHeight / 2, accuracyWidth - padding / 2);
      context.textBaseline = "top";
      context.restore();
    } else if (gps) {
      context.fillStyle = "#475569";
      context.font = `500 ${Math.max(9, Math.round(fontSize * 0.62))}px Arial, sans-serif`;
      context.textAlign = "center";
      context.fillText("Map unavailable", mapX + mapSize / 2, mapY + mapSize / 2, mapSize - padding);
      context.textAlign = "start";
    }
    if (gps) {
      context.strokeStyle = "#55c7bd";
      context.lineWidth = Math.max(2, Math.round(3 * Math.max(scale, 0.7)));
      context.strokeRect(mapX, mapY, mapSize, mapSize);
    }
    context.textBaseline = "top";
    context.fillStyle = "#ffffff";
    context.font = `600 ${fontSize}px Arial, sans-serif`;
    drawWrappedText(context, locationLine, detailX, locationY, detailWidth, textLineHeight, 2);
    const coordinateFont = Math.max(11, Math.round(fontSize * 0.8));
    context.font = `600 ${coordinateFont}px Arial, sans-serif`;
    context.fillStyle = "#5fe0d1";
    context.fillText(latitudeLine, detailX, locationY + textLineHeight * 2.25, detailWidth);
    context.fillText(longitudeLine, detailX, locationY + textLineHeight * 3.15, detailWidth);
    context.fillStyle = "#cbd5e1";
    context.font = `500 ${Math.max(10, Math.round(fontSize * 0.73))}px Arial, sans-serif`;
    context.fillText(dateText, detailX, locationY + textLineHeight * 4.15, detailWidth);
    context.fillStyle = "#ffd44f";
    context.font = `700 ${Math.max(13, Math.round(fontSize * 1.18))}px Arial, sans-serif`;
    context.fillText(timeText, detailX, locationY + textLineHeight * 5.05, detailWidth);
    if (gps) {
      context.fillStyle = "#cbd5e1";
      context.font = `400 ${Math.max(8, Math.round(fontSize * 0.45))}px Arial, sans-serif`;
      context.fillText("© OpenStreetMap contributors", mapX, mapY + mapSize + Math.max(3, Math.round(4 * scale)), mapSize);
    }
    canvas.toBlob((blob) => {
      if (!blob) {
        setCapturing(false);
        setCameraError("Could not capture this photo. Please try again.");
        return;
      }
      const file = new File([blob], `${name || "photo"}-${Date.now()}.jpg`, { type: "image/jpeg" });
      setCapturedFile(file);
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
      <p className="mt-1 text-[11px] text-muted">Photo stamp shows the map, location, coordinates, accuracy and capture time when GPS is enabled.</p>

      {cameraOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/80 p-2 sm:p-6" role="dialog" aria-modal="true" aria-label="Camera photo capture">
        <div className="my-auto flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-navy/10 px-4 py-3"><div><h3 className="font-bold text-navy">{capturedFile ? "Review photo" : `${facing === "user" ? "Front" : "Rear"} camera`}</h3><p className="text-xs text-muted">{capturedFile ? "Check the image before attaching it to the form." : "Position the subject in the frame, then take the photo."}</p></div><button type="button" onClick={stopCamera} className="rounded-lg p-2 text-muted hover:bg-slate-100" aria-label="Close camera"><X size={20} /></button></div>
          {cameraError && <p role="alert" className="mx-4 mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{cameraError}</p>}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-black">
            {capturedFile ? <img src={reviewUrl} alt="Captured photo with map, location, coordinates and timestamp" className="max-h-[68vh] w-full object-contain" /> : <video ref={videoRef} autoPlay muted playsInline className="max-h-[68vh] min-h-64 w-full object-contain" />}
          </div>
          <div className="flex shrink-0 flex-wrap justify-center gap-3 border-t border-navy/10 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {capturedFile ? <><button type="button" onClick={() => setCapturedFile(null)} className="inline-flex items-center gap-2 rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy"><RotateCcw size={16} />Retake</button><button type="button" onClick={useCapturedPhoto} className="inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy"><Check size={16} />Use photo</button></> : <button type="button" disabled={capturing} onClick={capturePhoto} className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-bold text-navy disabled:opacity-70">{capturing ? <Loader2 size={17} className="animate-spin" /> : <Camera size={17} />}{capturing ? "Adding map and time..." : "Take photo"}</button>}
          </div>
        </div>
      </div>}
    </div>
  );
}
