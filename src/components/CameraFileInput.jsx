import { useEffect, useRef, useState } from "react";
import { Camera, Check, Download, RotateCcw, Upload, X } from "lucide-react";

/** File picker and live camera capture with a review step before attaching. */
export default function CameraFileInput({ label, name, accept, required = false, onFile }) {
  const pickerRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [filename, setFilename] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [facing, setFacing] = useState("environment");
  const [capturedFile, setCapturedFile] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [startingCamera, setStartingCamera] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setDownloadUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(selectedFile);
    setDownloadUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  useEffect(() => {
    if (!capturedFile) return undefined;
    const url = URL.createObjectURL(capturedFile);
    setReviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [capturedFile]);

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

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video?.videoHeight) {
      setCameraError("Camera is starting. Please wait a moment and try again.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError("Could not capture this photo. Please try again.");
        return;
      }
      const file = new File([blob], `${name || "photo"}-${Date.now()}.jpg`, { type: "image/jpeg" });
      setCapturedFile(file);
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
      <p className="mt-1 text-[11px] text-muted">Camera preview opens first. Review the photo and choose Use photo to attach it.</p>

      {cameraOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Camera photo capture">
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-navy/10 px-4 py-3"><div><h3 className="font-bold text-navy">{capturedFile ? "Review photo" : `${facing === "user" ? "Front" : "Rear"} camera`}</h3><p className="text-xs text-muted">{capturedFile ? "Check the image before attaching it to the form." : "Position the subject in the frame, then take the photo."}</p></div><button type="button" onClick={stopCamera} className="rounded-lg p-2 text-muted hover:bg-slate-100" aria-label="Close camera"><X size={20} /></button></div>
          {cameraError && <p role="alert" className="mx-4 mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{cameraError}</p>}
          <div className="bg-black">{capturedFile ? <img src={reviewUrl} alt="Captured preview" className="max-h-[68vh] w-full object-contain" /> : <video ref={videoRef} autoPlay muted playsInline className="max-h-[68vh] min-h-64 w-full object-contain" />}</div>
          <div className="flex flex-wrap justify-center gap-3 p-4">{capturedFile ? <><button type="button" onClick={() => setCapturedFile(null)} className="inline-flex items-center gap-2 rounded-full border border-navy/20 px-5 py-2.5 text-sm font-bold text-navy"><RotateCcw size={16} />Retake</button><button type="button" onClick={useCapturedPhoto} className="inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-sm font-bold text-navy"><Check size={16} />Use photo</button></> : <button type="button" onClick={capturePhoto} className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-bold text-navy"><Camera size={17} />Take photo</button>}</div>
        </div>
      </div>}
    </div>
  );
}
