import { useState } from "react";
import { Sparkles, X, Loader2, KeyRound } from "lucide-react";
import { generateFlowchartFromPrompt, toFlowchartToon, type AiFlowchartResult } from "../utils/flowchartAI";

interface AiFlowchartPanelProps {
  open: boolean;
  onClose: () => void;
  existingShapes: { id: string; kind: string; label: string }[];
  existingEdges: { from: string; to: string; label?: string }[];
  onGenerated: (result: AiFlowchartResult) => void;
}

export function AiFlowchartPanel({
  open,
  onClose,
  existingShapes,
  existingEdges,
  onGenerated,
}: AiFlowchartPanelProps) {
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleGenerate() {
    if (!apiKey.trim() || !prompt.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const toon = toFlowchartToon(existingShapes, existingEdges);
      const result = await generateFlowchartFromPrompt(apiKey.trim(), prompt.trim(), toon);
      onGenerated(result);
      setPrompt("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate flowchart.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside
      className="flex flex-col flex-shrink-0 border-l overflow-y-auto"
      style={{
        width: 280,
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={15} style={{ color: "var(--color-accent)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            AI Generate
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-black/10"
          style={{ color: "var(--color-text-secondary)" }}
          title="Close"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex flex-col gap-3 p-3">
        <label className="flex flex-col gap-1.5">
          <span
            className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <KeyRound size={11} />
            Gemini API Key
          </span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste your API key"
            autoComplete="off"
            className="px-2.5 py-1.5 rounded border text-sm"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-bg)",
              color: "var(--color-text-primary)",
            }}
          />
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Not saved — cleared when you leave this page.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Prompt
          </span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Continue this flow: after 'Valid?' add a database save step, then end."
            rows={6}
            className="px-2.5 py-1.5 rounded border text-sm resize-none"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-bg)",
              color: "var(--color-text-primary)",
            }}
          />
        </label>

        <button
          onClick={handleGenerate}
          disabled={!apiKey.trim() || !prompt.trim() || busy}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium disabled:opacity-40"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {busy ? "Generating..." : "Generate into flow"}
        </button>

        {error && (
          <p className="text-xs" style={{ color: "var(--color-warning)" }}>
            {error}
          </p>
        )}

        <p className="text-xs leading-relaxed pt-2 border-t" style={{ color: "var(--color-text-secondary)", borderColor: "var(--color-border)" }}>
          New shapes are added to your existing flowchart — the AI sees your current
          shapes/connections and extends them, it never replaces what's already there.
        </p>
      </div>
    </aside>
  );
}
