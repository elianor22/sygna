import { useRef } from "react";
import { Upload } from "lucide-react";

export function PdfUploader({ onUpload }) {
  const inputRef = useRef(null);

  function handleFile(file) {
    if (!file || file.type !== "application/pdf") return;
    const reader = new FileReader();
    reader.onload = (e) => onUpload(e.target.result, file.name);
    reader.readAsArrayBuffer(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div
      className="flex flex-col items-center justify-center flex-1 px-6"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="text-center mb-10">
        <h1
          className="text-3xl sm:text-4xl font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Sign your PDFs in seconds
        </h1>
        <p
          className="mt-2 text-sm sm:text-base"
          style={{ color: "var(--color-text-secondary)" }}
        >
          No sign-up, no clutter — just drop your file and sign.
        </p>
      </div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current.click()}
        className="cursor-pointer border-2 border-dashed rounded-md p-16 flex flex-col items-center gap-4 transition-colors hover:border-accent"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-surface)",
        }}
      >
        <Upload size={40} style={{ color: "var(--color-text-secondary)" }} />
        <div className="text-center">
          <p
            className="text-lg font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Drop PDF here or click to upload
          </p>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Supports multi-page PDFs
          </p>
        </div>
        <div
          className="mt-2 px-6 py-2 rounded text-sm font-medium"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          Choose File
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}
