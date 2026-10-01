import { useRef, useState } from "react";
import { Camera, Upload } from "lucide-react";

/** File picker with mobile camera capture. Camera files are copied into the
 * named picker input so existing form upload handlers keep working. */
export default function CameraFileInput({ label, name, accept, required = false, onFile }) {
  const pickerRef = useRef(null);
  const [filename, setFilename] = useState("");

  const selectFile = (file) => {
    if (!file) return;
    setFilename(file.name || "Captured photo");
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
        <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-navy/15 bg-white px-3 py-2 text-xs font-semibold text-navy hover:border-amber">
          <Camera size={15} /> Take photo
          <input type="file" accept="image/*" capture="environment" onChange={capturePhoto} className="sr-only" />
        </label>
      </div>
      <p className="mt-1 text-[11px] text-muted">Use your phone camera for a clear document photo.</p>
    </div>
  );
}
