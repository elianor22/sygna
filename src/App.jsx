import { useState, useRef } from "react";
import { Sun, Moon, PenLine, FilePlus2, Signature, Type, Shapes, Square, Circle, Download } from "lucide-react";
import { PdfUploader } from "./components/PdfUploader";
import { ImageToPdfUploader } from "./components/ImageToPdfUploader";
import { PdfViewer } from "./components/PdfViewer";
import { PageSidebar } from "./components/PageSidebar";
import { SignatureConfigPanel } from "./components/SignatureConfigPanel";
import { SignaturePanel } from "./components/SignaturePanel";
import { ExportButton } from "./components/ExportButton";
import { ShapeColorSheet } from "./components/ShapeColorSheet";
import { useSignatures } from "./hooks/useSignatures";
import { useSavedSignatures } from "./hooks/useSavedSignatures";

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

export default function App() {
  const [pdfBytes, setPdfBytes] = useState(null);
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState("sign");
  const [totalPages, setTotalPages] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [panelSigId, setPanelSigId] = useState(null);
  const [emptyHighlight, setEmptyHighlight] = useState(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const mainRef = useRef(null);

  const {
    signatures,
    addSignature,
    updateSignature,
    removeSignature,
    clearSignatures,
  } = useSignatures();
  const savedSignatures = useSavedSignatures();

  function handleUpload(arrayBuffer, name, uploadMode = "sign") {
    setPdfBytes(arrayBuffer);
    setFileName(name);
    setMode(uploadMode);
    setActivePage(1);
    setTotalPages(0);
    setPdfReady(false);
    setPanelSigId(null);
    setEmptyHighlight(null);
    setConfigOpen(false);
    clearSignatures();
  }

  function handleConverted(arrayBuffer, name) {
    handleUpload(arrayBuffer, name, "convert");
  }

  function handleCloseFile() {
    setPdfBytes(null);
    setFileName("");
    setMode("sign");
    setActivePage(1);
    setTotalPages(0);
    setPdfReady(false);
    setPanelSigId(null);
    setEmptyHighlight(null);
    setConfigOpen(false);
    clearSignatures();
  }

  function handleDownloadConverted() {
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "converted.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleAddSignature() {
    if (!pdfReady) return;
    setEmptyHighlight(null);
    const id = addSignature(activePage);
    if (savedSignatures.selected) {
      updateSignature(id, {
        content: savedSignatures.selected.content,
        type: "draw",
      });
    }
  }

  function handleAddText() {
    if (!pdfReady) return;
    setEmptyHighlight(null);
    addSignature(activePage, "text");
  }

  function handleAddShape(shape) {
    if (!pdfReady) return;
    setEmptyHighlight(null);
    addSignature(activePage, "shape", { shape, widthPct: 0.15, heightPct: 0.1 });
    setShapeMenuOpen(false);
  }

  function handleSaveSignature(sigId, dataUrl) {
    updateSignature(sigId, { content: dataUrl, type: "draw" });
    setEmptyHighlight(null);
  }

  function handleHighlightEmpty(ids) {
    setEmptyHighlight(ids);
    setTimeout(() => setEmptyHighlight(null), 3000);
  }

  function handleOpenSignature(sigId) {
    const sig = signatures.find((s) => s.id === sigId);
    if (sig && !sig.content && savedSignatures.selected) {
      updateSignature(sigId, {
        content: savedSignatures.selected.content,
        type: "draw",
      });
      setEmptyHighlight(null);
      return;
    }
    setPanelSigId(sigId);
  }

  if (!pdfBytes) {
    return (
      <div
        className="flex flex-col"
        style={{ background: "var(--color-bg)", minHeight: "100vh" }}
      >
        <header
          className="flex items-center justify-between px-6 py-3 border-b "
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <span
            className="font-flourish text-2xl"
            style={{ color: "var(--color-text-primary)" }}
          >
            Sygna
          </span>
          <ThemeToggle />
        </header>
        <div className="flex flex-col md:flex-row flex-1">
          <PdfUploader onUpload={handleUpload} />
          <div
            className="w-px hidden md:block"
            style={{ background: "var(--color-border)" }}
          />
          <div
            className="h-px md:hidden"
            style={{ background: "var(--color-border)" }}
          />
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
          {mode === "sign" && (
            <>
              <button
                onClick={handleAddSignature}
                disabled={!pdfReady}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium border transition-colors disabled:opacity-40"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                  background: "var(--color-surface)",
                }}
                title={
                  pdfReady ? undefined : "Waiting for PDF to finish loading..."
                }
              >
                <PenLine size={15} />
                <span className="hidden sm:inline">Add Signature</span>
              </button>
              <button
                onClick={handleAddText}
                disabled={!pdfReady}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium border transition-colors disabled:opacity-40"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                  background: "var(--color-surface)",
                }}
                title={
                  pdfReady ? undefined : "Waiting for PDF to finish loading..."
                }
              >
                <Type size={15} />
                <span className="hidden sm:inline">Add Text</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShapeMenuOpen((v) => !v)}
                  disabled={!pdfReady}
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium border transition-colors disabled:opacity-40"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-primary)",
                    background: "var(--color-surface)",
                  }}
                  title={
                    pdfReady ? undefined : "Waiting for PDF to finish loading..."
                  }
                >
                  <Shapes size={15} />
                  <span className="hidden sm:inline">Shape</span>
                </button>
                {shapeMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShapeMenuOpen(false)}
                    />
                    <div
                      className="absolute right-0 mt-1 flex gap-1 p-1 rounded border shadow-lg z-50"
                      style={{
                        background: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                      }}
                    >
                      <button
                        onClick={() => handleAddShape("rect")}
                        className="p-2 rounded transition-colors hover:bg-black/10"
                        style={{ color: "var(--color-text-primary)" }}
                        title="Rectangle"
                      >
                        <Square size={18} />
                      </button>
                      <button
                        onClick={() => handleAddShape("circle")}
                        className="p-2 rounded transition-colors hover:bg-black/10"
                        style={{ color: "var(--color-text-primary)" }}
                        title="Circle"
                      >
                        <Circle size={18} />
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setConfigOpen(true)}
                className="lg:hidden p-2 rounded border transition-colors"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                  background: "var(--color-surface)",
                }}
                title="Manage signatures"
              >
                <Signature size={16} />
              </button>
            </>
          )}
          {mode === "sign" ? (
            <ExportButton
              pdfBytes={pdfBytes}
              signatures={signatures}
              onHighlightEmpty={handleHighlightEmpty}
              fileName={fileName}
            />
          ) : (
            <button
              onClick={handleDownloadConverted}
              className="flex items-center gap-2 px-5 py-2 rounded font-medium text-sm transition-opacity"
              style={{ background: "var(--color-accent)", color: "#fff" }}
            >
              <Download size={16} />
              Download PDF
            </button>
          )}
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

      {mode === "sign" && emptyHighlight && (
        <div
          className="text-sm px-4 py-2 text-center"
          style={{ background: "var(--color-warning)", color: "#fff" }}
        >
          Some signature boxes are empty — click them to fill in your signature.
        </div>
      )}

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <PageSidebar
          pdfBytes={pdfBytes}
          totalPages={totalPages}
          activePage={activePage}
          onJump={setActivePage}
          variant="vertical"
        />

        <main
          ref={mainRef}
          className="flex-1 overflow-auto p-4"
          style={{ background: "var(--color-bg)" }}
        >
          <div className="max-w-3xl mx-auto">
            <PdfViewer
              pdfBytes={pdfBytes}
              onTotalPages={setTotalPages}
              signatures={signatures}
              onUpdateSignature={updateSignature}
              onRemoveSignature={removeSignature}
              onOpenPanel={handleOpenSignature}
              emptyHighlight={emptyHighlight}
              onActivePageChange={setActivePage}
              scrollRootRef={mainRef}
              onFullyLoaded={() => setPdfReady(true)}
            />
          </div>
        </main>

        <PageSidebar
          pdfBytes={pdfBytes}
          totalPages={totalPages}
          activePage={activePage}
          onJump={setActivePage}
          variant="horizontal"
        />

        {mode === "sign" && (
          <SignatureConfigPanel
            items={savedSignatures.items}
            selectedId={savedSignatures.selectedId}
            onAdd={savedSignatures.addSignature}
            onReplace={savedSignatures.replaceSignature}
            onRemove={savedSignatures.removeSignature}
            onSelect={savedSignatures.selectSignature}
            open={configOpen}
            onClose={() => setConfigOpen(false)}
          />
        )}
      </div>

      {mode === "sign" && panelSigId && (
        <SignaturePanel
          sigId={panelSigId}
          onSave={handleSaveSignature}
          onClose={() => setPanelSigId(null)}
          savedSignatures={savedSignatures}
        />
      )}

      {mode === "sign" && (
        <ShapeColorSheet signatures={signatures} onUpdate={updateSignature} />
      )}
    </div>
  );
}
