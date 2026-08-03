export type AiShapeKind =
  | "start"
  | "process"
  | "decision"
  | "io"
  | "document"
  | "connector"
  | "database"
  | "predef"
  | "manual"
  | "delay";

export interface AiShape {
  id: string;
  kind: AiShapeKind;
  label: string;
}

export interface AiEdge {
  from: string;
  to: string;
  label?: string;
}

export interface AiFlowchartResult {
  shapes: AiShape[];
  edges: AiEdge[];
}

const SHAPE_KINDS: AiShapeKind[] = [
  "start",
  "process",
  "decision",
  "io",
  "document",
  "connector",
  "database",
  "predef",
  "manual",
  "delay",
];

/** Serializes current flowchart into a compact TOON-style block so the model
 *  knows what already exists and extends it instead of ignoring context. */
export function toFlowchartToon(
  shapes: { id: string; kind: string; label: string }[],
  edges: { from: string; to: string; label?: string }[]
): string {
  const shapeLines = shapes.length
    ? shapes.map((s) => `  ${s.id} | ${s.kind} | "${s.label}"`).join("\n")
    : "  (empty)";
  const edgeLines = edges.length
    ? edges.map((e) => `  ${e.from} -> ${e.to}${e.label ? ` | "${e.label}"` : ""}`).join("\n")
    : "  (empty)";
  return `shapes:\n${shapeLines}\nedges:\n${edgeLines}`;
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    shapes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          kind: { type: "string", enum: SHAPE_KINDS },
          label: { type: "string" },
        },
        required: ["id", "kind", "label"],
      },
    },
    edges: {
      type: "array",
      items: {
        type: "object",
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          label: { type: "string" },
        },
        required: ["from", "to"],
      },
    },
  },
  required: ["shapes", "edges"],
};

/** Calls Gemini generateContent with the user's prompt plus the existing
 *  flowchart as TOON context, asking only for NEW shapes/edges to add. */
export async function generateFlowchartFromPrompt(
  apiKey: string,
  userPrompt: string,
  existingToon: string
): Promise<AiFlowchartResult> {
  const systemInstruction =
    "You are a flowchart generator. You are given the CURRENT flowchart state " +
    "(TOON-style shapes/edges) and a user instruction. Output ONLY new shapes " +
    "and edges to ADD to the existing flowchart — do not repeat existing shape " +
    "ids, and connect new shapes to existing ids when the instruction implies " +
    "continuing the current flow. Never invent a shape kind outside the allowed " +
    "enum. Keep labels short (under 40 chars).";

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              `Current flowchart:\n${existingToon}\n\n` +
              `Instruction: ${userPrompt}`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini.");

  let parsed: AiFlowchartResult;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Could not parse Gemini response as JSON.");
  }

  if (!Array.isArray(parsed.shapes) || !Array.isArray(parsed.edges)) {
    throw new Error("Gemini response missing shapes/edges arrays.");
  }

  return parsed;
}
