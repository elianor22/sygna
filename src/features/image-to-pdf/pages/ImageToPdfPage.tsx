import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, FilePlus2, Download, ChevronLeft } from "lucide-react";
import { ImageToPdfUploader } from "../components/ImageToPdfUploader";
import { PdfViewer } from "@/features/sign-pdf";

function ThemeToggle() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const [dark, setDark] = useState(isDark);

  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("sygna-theme", next);
    setDark(!dark);
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded transition-colors hover:bg-black/10"
      style={{ color: "var(--color-text-secondary)" }}
      aria-label="Toggle theme"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export default function ImageToPdfPage() {
  const [pdfBytes, setPdfBytes] = useState(null);
  const [fileName, setFileName] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const mainRef = useRef(null);

  function handleConverted(arrayBuffer, name) {
    setPdfBytes(arrayBuffer);
    setFileName(name);
    setActivePage(1);
    setTotalPages(0);
  }

  function handleCloseFile() {
    setPdfBytes(null);
    setFileName("");
    setActivePage(1);
    setTotalPages(0);
  }

  function handleDownload() {
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "converted.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!pdfBytes) {
    return (
      <div
        className="flex flex-col"
        style={{ background: "var(--color-bg)", minHeight: "100vh" }}
      >
        <header
          className="flex items-center justify-between px-6 py-3 border-b"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <Link
            to="/"
            className="flex items-center gap-1 text-sm transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <ChevronLeft size={16} />
            <span className="font-flourish text-2xl" style={{ color: "var(--color-text-primary)" }}>
              Sygna
            </span>
          </Link>
          <ThemeToggle />
        </header>
        <div className="flex flex-1">
          <ImageToPdfUploader onConverted={handleConverted} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="app-shell flex flex-col overflow-hidden"
      style={{ background: "var(--color-bg)" }}
    >
      <header
        className="flex items-center justify-between px-4 py-3 border-b gap-3 flex-wrap"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="font-flourish text-xl"
            style={{ color: "var(--color-text-primary)" }}
          >
            Sygna
          </span>
          <span
            className="text-xs font-mono hidden sm:block"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {fileName}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-mono text-sm hidden sm:block"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {activePage} / {totalPages}
          </span>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2 rounded font-medium text-sm transition-opacity"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            <Download size={16} />
            Download PDF
          </button>
          <button
            onClick={handleCloseFile}
            className="flex items-center gap-2 px-3 py-2 rounded border text-sm font-medium transition-colors"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
              background: "transparent",
            }}
            title="Open different file"
          >
            <FilePlus2 size={16} />
            <span className="hidden sm:inline">File Baru</span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <main
          ref={mainRef}
          className="flex-1 overflow-auto p-4"
          style={{ background: "var(--color-bg)" }}
        >
          <div className="max-w-3xl mx-auto">
            <PdfViewer
              pdfBytes={pdfBytes}
              onTotalPages={setTotalPages}
              signatures={[]}
              onUpdateSignature={() => {}}
              onRemoveSignature={() => {}}
              onOpenPanel={() => {}}
              emptyHighlight={null}
              onActivePageChange={setActivePage}
              scrollRootRef={mainRef}
              onFullyLoaded={() => {}}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
