import { useEffect, useRef, useState } from "react";
import { Camera, Download, Upload } from "lucide-react";

/** File picker with mobile camera capture. Camera files are copied into the
 * named picker input so existing form upload handlers keep working. */
export default function CameraFileInput({ label, name, accept, required = false, onFile }) {
  const pickerRef = useRef(null);
  const [filename, setFilename] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState("");

  useEffect(() => {
    if (!selectedFile) {
      setDownloadUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(selectedFile);
    setDownloadUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const selectFile = (file) => {
    if (!file) return;
    setFilename(file.name || "Captured photo");
    setSelectedFile(file);
    onFile?.(file);
  };

  const capturePhoto = (event) => {
    const captured = event.target.files?.[0];
    if (!captured || !pickerRef.current) return;
    const transfer = new DataTransfer();
    transfer.items.add(captured);
    pickerRef.current.files = transfer.files;
    selectFile(captured);
    event.target.value = "";
  };

  return (
    <div className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-navy/70">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <div className="flex flex-wrap items-stretch gap-2">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-navy/25 px-3 py-3 text-xs text-muted hover:border-amber hover:text-navy">
          <Upload size={15} />
          <span className="max-w-full truncate">{filename || "Choose file"}</span>
          <input
            ref={pickerRef}
            type="file"
            name={name}
            accept={accept}
            required={required}
            onChange={(event) => selectFile(event.target.files?.[0])}
            className="sr-only"
          />
        </label>
        {[{ facing: "user", label: "Front camera" }, { facing: "environment", label: "Rear camera" }].map(({ facing, label }) => (
          <label key={facing} className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-navy/15 bg-white px-3 py-2 text-xs font-semibold text-navy hover:border-amber">
            <Camera size={15} /> {label}
            <input type="file" accept="image/*" capture={facing} onChange={capturePhoto} className="sr-only" />
          </label>
        ))}
        {selectedFile && <a href={downloadUrl} download={selectedFile.name || `${name || "photo"}.jpg`} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"><Download size={14} />Download photo</a>}
      </div>
      <p className="mt-1 text-[11px] text-muted">Use your phone camera for a clear document photo.</p>
    </div>
  );
}
