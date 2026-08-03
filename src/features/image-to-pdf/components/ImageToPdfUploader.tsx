import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { imageFilesToPdf } from "../utils/imageToPdf";

export function ImageToPdfUploader({ onConverted }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFiles(fileList: FileList | File[] | null) {
    const files: File[] = Array.from(fileList || []);
    if (files.length === 0) return;
    const invalid = files.find(
      (f) => !["image/png", "image/jpeg", "image/jpg"].includes(f.type)
    );
    if (invalid) {
      setError("Supports PNG or JPEG images only.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const pdfBytes = await imageFilesToPdf(files);
      const name =
        files.length === 1
          ? files[0].name.replace(/\.(png|jpe?g)$/i, "") + ".pdf"
          : `images-${files.length}.pdf`;
      onConverted(pdfBytes.buffer, name);
    } catch {
      setError("Could not convert image. Try another file.");
    } finally {
      setBusy(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
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
          Convert Image to PDF
        </h1>
        <p
          className="mt-2 text-sm sm:text-base"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Page size matches each image exactly. Select multiple images for a
          multi-page PDF.
        </p>
      </div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !busy && inputRef.current.click()}
        aria-busy={busy}
        className="cursor-pointer border-2 border-dashed rounded-md p-16 flex flex-col items-center gap-4 transition-colors hover:border-accent"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-surface)",
          opacity: busy ? 0.6 : 1,
        }}
      >
        <ImagePlus size={40} style={{ color: "var(--color-text-secondary)" }} />
        <div className="text-center">
          <p
            className="text-lg font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            {busy ? "Converting..." : "Drop images here or click to upload"}
          </p>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Supports PNG and JPEG, multiple files allowed
          </p>
        </div>
        <div
          className="mt-2 px-6 py-2 rounded text-sm font-medium"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          Choose Images
        </div>
      </div>
      {error && (
        <p className="mt-3 text-sm" style={{ color: "var(--color-warning)" }}>
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
