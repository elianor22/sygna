import { useState, useRef } from "react";
import { Sun, Moon, PenLine, FilePlus2, Signature } from "lucide-react";
import { PdfUploader } from "./components/PdfUploader";
import { PdfViewer } from "./components/PdfViewer";
import { PageSidebar } from "./components/PageSidebar";
import { SignatureConfigPanel } from "./components/SignatureConfigPanel";
import { SignaturePanel } from "./components/SignaturePanel";
import { ExportButton } from "./components/ExportButton";
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
  const [totalPages, setTotalPages] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [panelSigId, setPanelSigId] = useState(null);
  const [emptyHighlight, setEmptyHighlight] = useState(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const mainRef = useRef(null);

  const {
    signatures,
    addSignature,
    updateSignature,
    removeSignature,
    clearSignatures,
  } = useSignatures();
  const savedSignatures = useSavedSignatures();

  function handleUpload(arrayBuffer, name) {
    setPdfBytes(arrayBuffer);
    setFileName(name);
    setActivePage(1);
    setTotalPages(0);
    setPdfReady(false);
    setPanelSigId(null);
    setEmptyHighlight(null);
    setConfigOpen(false);
    clearSignatures();
  }

  function handleCloseFile() {
    setPdfBytes(null);
    setFileName("");
    setActivePage(1);
    setTotalPages(0);
    setPdfReady(false);
    setPanelSigId(null);
    setEmptyHighlight(null);
    setConfigOpen(false);
    clearSignatures();
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
        <PdfUploader onUpload={handleUpload} />
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
          <ExportButton
            pdfBytes={pdfBytes}
            signatures={signatures}
            onHighlightEmpty={handleHighlightEmpty}
            fileName={fileName}
          />
          <button
            onClick={handleCloseFile}
            className="p-2 rounded border transition-colors"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
              background: "transparent",
            }}
            title="Open different file"
          >
            <FilePlus2 size={16} />
          </button>
          <ThemeToggle />
        </div>
      </header>

      {emptyHighlight && (
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
      </div>

      {panelSigId && (
        <SignaturePanel
          sigId={panelSigId}
          onSave={handleSaveSignature}
          onClose={() => setPanelSigId(null)}
          savedSignatures={savedSignatures}
        />
      )}
    </div>
  );
}
