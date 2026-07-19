import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  ChevronDown,
  Undo,
  Redo,
  Eye,
  Send,
  Save,
  FileCode,
  X,
} from "lucide-react";
import { useEmailStore } from "@/store/useEmailStore";
import { renderEmailStructureToHtml } from "@/utils/renderEmailDocument";
import { downloadFile } from "@/utils/downloadFile";

const STORAGE_KEY = "sygna-email-builder-project";

export function BuilderTopBar() {
  const emailStructure = useEmailStore((s) => s.emailStructure);
  const past = useEmailStore((s) => s.past);
  const future = useEmailStore((s) => s.future);
  const undo = useEmailStore((s) => s.undo);
  const redo = useEmailStore((s) => s.redo);

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handlePreview() {
    const html = await renderEmailStructureToHtml(emailStructure);
    setPreviewHtml(html);
  }

  function handleSendTest() {
    const email = window.prompt("Send a test email to:");
    if (email) window.alert(`Demo mode: test email queued for ${email}.`);
  }

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emailStructure));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleExportHtml() {
    const html = await renderEmailStructureToHtml(emailStructure);
    downloadFile(html, "email-template.html", "text/html");
  }

  return (
    <>
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 bg-white">
        <Link to="/" className="p-1.5 rounded text-gray-500 hover:bg-gray-100" title="Back to PDF editor">
          <ArrowLeft size={16} />
        </Link>
        <span className="flex items-center justify-center w-7 h-7 rounded bg-blue-600 text-white shrink-0">
          <Mail size={14} />
        </span>
        <button className="flex items-center gap-1 text-sm font-medium text-gray-700">
          Project: Summer Campaign v1
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        <div className="flex-1" />

        <button
          onClick={undo}
          disabled={past.length === 0}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Undo size={15} />
          Undo
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Redo size={15} />
          Redo
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button
          onClick={handlePreview}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Eye size={14} />
          Preview
        </button>
        <button
          onClick={handleSendTest}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Send size={14} />
          Send Test
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-white bg-slate-700 hover:bg-slate-800"
        >
          <Save size={14} />
          {saved ? "Saved" : "Save"}
        </button>
        <button
          onClick={handleExportHtml}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <FileCode size={14} />
          Export HTML
        </button>
      </header>

      {previewHtml !== null && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setPreviewHtml(null)} />
          <div className="fixed z-50 inset-6 md:inset-16 rounded-lg overflow-hidden bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">Preview</span>
              <button onClick={() => setPreviewHtml(null)} className="p-1 rounded text-gray-500 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <iframe title="Email preview" srcDoc={previewHtml} className="flex-1 w-full" />
          </div>
        </>
      )}
    </>
  );
}
