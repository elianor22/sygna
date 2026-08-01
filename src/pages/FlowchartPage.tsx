import React, { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, Download, Trash2, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, Minus, Plus, Sparkles, Save, FolderOpen, Magnet } from "lucide-react";
import { AiFlowchartPanel } from "../components/flowchart/AiFlowchartPanel";
import type { AiFlowchartResult } from "../utils/flowchartAI";

// ── Types ──────────────────────────────────────────────────────────────────

type ShapeKind =
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

type Anchor = "top" | "right" | "bottom" | "left";

interface FShape {
  id: string;
  kind: ShapeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  fill: string;
  stroke: string;
}

interface FConn {
  id: string;
  from: string;
  fromAnchor: Anchor;
  to: string;
  toAnchor: Anchor;
  label: string;
}

// ── Palette Config ─────────────────────────────────────────────────────────

const PALETTE: { kind: ShapeKind; name: string }[] = [
  { kind: "start",     name: "Start / End"        },
  { kind: "process",   name: "Process"             },
  { kind: "decision",  name: "Decision"            },
  { kind: "io",        name: "Input / Output"      },
  { kind: "document",  name: "Document"            },
  { kind: "connector", name: "On-Page Connector"   },
  { kind: "database",  name: "Database"            },
  { kind: "predef",    name: "Predefined Process"  },
  { kind: "manual",    name: "Manual Input"        },
  { kind: "delay",     name: "Delay"               },
];

const DEFAULTS: Record<ShapeKind, { w: number; h: number; label: string }> = {
  start:     { w: 120, h: 50,  label: "Start"          },
  process:   { w: 140, h: 60,  label: "Process"        },
  decision:  { w: 140, h: 80,  label: "Decision?"      },
  io:        { w: 140, h: 60,  label: "Input / Output" },
  document:  { w: 140, h: 70,  label: "Document"       },
  connector: { w: 44,  h: 44,  label: ""               },
  database:  { w: 100, h: 80,  label: "Database"       },
  predef:    { w: 140, h: 60,  label: "Predefined"     },
  manual:    { w: 140, h: 60,  label: "Manual Input"   },
  delay:     { w: 140, h: 60,  label: "Delay"          },
};

const DEFAULT_FILL   = "#ffffff";
const DEFAULT_STROKE = "#1B2A4A";
const GRID_SIZE = 20;
const FLOW_MAGIC   = "SYGNA_FLOWCHART";
const FLOW_VERSION = 1;
const FLOW_EXT     = ".sygnaflow";

interface FlowFile {
  magic: typeof FLOW_MAGIC;
  version: number;
  shapes: FShape[];
  conns: FConn[];
}
const ANCHOR_R = 5;

// ── Helpers ────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

function anchorPt(s: FShape, a: Anchor) {
  switch (a) {
    case "top":    return { x: s.x + s.w / 2, y: s.y           };
    case "bottom": return { x: s.x + s.w / 2, y: s.y + s.h     };
    case "left":   return { x: s.x,            y: s.y + s.h / 2 };
    case "right":  return { x: s.x + s.w,      y: s.y + s.h / 2 };
  }
}

const ANCHOR_DIR: Record<Anchor, [number, number]> = {
  top:    [0, -1],
  bottom: [0,  1],
  left:   [-1, 0],
  right:  [1,  0],
};

// Builds an orthogonal (horizontal/vertical only) path with rounded corners,
// routed via a stub out of each anchor in its facing direction.
function connPath(from: { x: number; y: number }, fa: Anchor, to: { x: number; y: number }, ta: Anchor) {
  const STUB = 24;
  const R = 10;
  const [fdx, fdy] = ANCHOR_DIR[fa];
  const [tdx, tdy] = ANCHOR_DIR[ta];

  const p0 = from;
  const p1 = { x: from.x + fdx * STUB, y: from.y + fdy * STUB };
  const p3 = { x: to.x + tdx * STUB, y: to.y + tdy * STUB };
  const p4 = to;

  const isFromHorizontal = fdx !== 0;
  const isToHorizontal = tdx !== 0;

  let mids: { x: number; y: number }[];
  if (isFromHorizontal && !isToHorizontal) {
    // stub travels horizontally then must turn to meet a vertical stub — single bend
    mids = [{ x: p3.x, y: p1.y }];
  } else if (!isFromHorizontal && isToHorizontal) {
    mids = [{ x: p1.x, y: p3.y }];
  } else if (isFromHorizontal && isToHorizontal) {
    // both stubs horizontal — go out, across at the shared midpoint x, then in
    const midX = (p1.x + p3.x) / 2;
    mids = [{ x: midX, y: p1.y }, { x: midX, y: p3.y }];
  } else {
    // both stubs vertical — go out, across at the shared midpoint y, then in
    const midY = (p1.y + p3.y) / 2;
    mids = [{ x: p1.x, y: midY }, { x: p3.x, y: midY }];
  }

  const pts = dedupePoints([p0, p1, ...mids, p3, p4]);
  return roundedPolylinePath(pts, R);
}

function dedupePoints(pts: { x: number; y: number }[]) {
  const out: { x: number; y: number }[] = [];
  for (const p of pts) {
    const prev = out[out.length - 1];
    if (!prev || Math.hypot(p.x - prev.x, p.y - prev.y) > 0.5) out.push(p);
  }
  return out;
}

// Draws straight segments between points with small rounded arcs at each
// interior corner, instead of a free-form bezier curve.
function roundedPolylinePath(pts: { x: number; y: number }[], radius: number) {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`;

  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const next = pts[i + 1];

    const d1 = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    const d2 = Math.hypot(next.x - cur.x, next.y - cur.y);
    const r = Math.min(radius, d1 / 2, d2 / 2);

    const inX = cur.x - ((cur.x - prev.x) / (d1 || 1)) * r;
    const inY = cur.y - ((cur.y - prev.y) / (d1 || 1)) * r;
    const outX = cur.x + ((next.x - cur.x) / (d2 || 1)) * r;
    const outY = cur.y + ((next.y - cur.y) / (d2 || 1)) * r;

    d += ` L${inX},${inY} Q${cur.x},${cur.y} ${outX},${outY}`;
  }
  const last = pts[pts.length - 1];
  d += ` L${last.x},${last.y}`;
  return d;
}

function clientToCanvas(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
  panX: number,
  panY: number,
  zoom: number
) {
  const rect = svg.getBoundingClientRect();
  return {
    x: (clientX - rect.left - panX) / zoom,
    y: (clientY - rect.top  - panY) / zoom,
  };
}

// ── Shape SVG Bodies ───────────────────────────────────────────────────────

function ShapeBody({
  kind, w, h, fill, stroke, sw = 1.5,
}: {
  kind: ShapeKind; w: number; h: number; fill: string; stroke: string; sw?: number;
}) {
  const p = { fill, stroke, strokeWidth: sw };
  switch (kind) {
    case "start": {
      const r = h / 2;
      return <path d={`M${r},0 L${w - r},0 A${r},${r} 0 0 1 ${w - r},${h} L${r},${h} A${r},${r} 0 0 1 ${r},0Z`} {...p} />;
    }
    case "process":
      return <rect x={0} y={0} width={w} height={h} {...p} />;
    case "decision":
      return <polygon points={`${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`} {...p} />;
    case "io": {
      const off = w * 0.18;
      return <polygon points={`${off},0 ${w},0 ${w - off},${h} 0,${h}`} {...p} />;
    }
    case "document": {
      const wh = h * 0.22;
      const bh = h - wh;
      return (
        <path
          d={`M0,0 L${w},0 L${w},${bh} Q${w * 0.75},${bh - wh} ${w * 0.5},${bh} Q${w * 0.25},${bh + wh} 0,${bh} Z`}
          {...p}
        />
      );
    }
    case "connector":
      return <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} {...p} />;
    case "database": {
      const ry = h * 0.14;
      return (
        <g>
          <path
            d={`M0,${ry} Q0,0 ${w / 2},0 Q${w},0 ${w},${ry} L${w},${h - ry} Q${w},${h} ${w / 2},${h} Q0,${h} 0,${h - ry} Z`}
            {...p}
          />
          <path
            d={`M0,${ry} Q0,${ry * 2} ${w / 2},${ry * 2} Q${w},${ry * 2} ${w},${ry}`}
            fill="none" stroke={stroke} strokeWidth={sw}
          />
        </g>
      );
    }
    case "predef":
      return (
        <g>
          <rect x={0} y={0} width={w} height={h} {...p} />
          <line x1={10} y1={0} x2={10} y2={h} stroke={stroke} strokeWidth={sw} />
          <line x1={w - 10} y1={0} x2={w - 10} y2={h} stroke={stroke} strokeWidth={sw} />
        </g>
      );
    case "manual": {
      const slant = h * 0.28;
      return <polygon points={`0,${slant} ${w},0 ${w},${h} 0,${h}`} {...p} />;
    }
    case "delay": {
      const r = h / 2;
      return <path d={`M0,0 L${w - r},0 A${r},${r} 0 0 1 ${w - r},${h} L0,${h} Z`} {...p} />;
    }
  }
}

// ── Palette Icon (small preview) ──────────────────────────────────────────

function PaletteIcon({ kind }: { kind: ShapeKind }) {
  const PW = 44, PH = 28;
  const def = DEFAULTS[kind];
  const scale = Math.min((PW / def.w) * 0.82, (PH / def.h) * 0.82);
  const sw = def.w * scale;
  const sh = def.h * scale;
  return (
    <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`} style={{ display: "block" }}>
      <g transform={`translate(${(PW - sw) / 2},${(PH - sh) / 2})`}>
        <ShapeBody kind={kind} w={sw} h={sh} fill="var(--color-surface)" stroke="var(--color-text-secondary)" sw={1} />
      </g>
    </svg>
  );
}

// ── Theme Toggle ──────────────────────────────────────────────────────────

function ThemeToggle() {
  const [dark, setDark] = useState(
    () => document.documentElement.getAttribute("data-theme") === "dark"
  );
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
      title="Toggle theme"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function FlowchartPage() {
  const [shapes, setShapes] = useState<FShape[]>([]);
  const [conns, setConns]   = useState<FConn[]>([]);

  const [selShapeId, setSelShapeId] = useState<string | null>(null);
  const [selConnId,  setSelConnId]  = useState<string | null>(null);

  const [snapEnabled, setSnapEnabled] = useState(false);

  // marquee (rubber-band) multi-select, separate from single click-select above
  const [marqueeShapeIds, setMarqueeShapeIds] = useState<Set<string>>(new Set());
  const [marqueeConnIds,  setMarqueeConnIds]  = useState<Set<string>>(new Set());
  const [marqueeBox, setMarqueeBox] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const [connecting, setConnecting] = useState<{ id: string; anchor: Anchor } | null>(null);
  const [mouseCanvas, setMouseCanvas] = useState({ x: 0, y: 0 });

  const [pan,  setPan]  = useState({ x: 100, y: 60 });
  const [zoom, setZoom] = useState(1);

  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // fill/stroke for selected shape or next shape
  const [fillColor,   setFillColor]   = useState(DEFAULT_FILL);
  const [strokeColor, setStrokeColor] = useState(DEFAULT_STROKE);

  const [hoveredId,  setHoveredId]  = useState<string | null>(null);
  const [hovAnchor,  setHovAnchor]  = useState<Anchor | null>(null);

  const svgRef      = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const draggingRef = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const resizingRef = useRef<{ id: string; startX: number; startY: number; startW: number; startH: number } | null>(null);
  const panningRef  = useRef<{ sx: number; sy: number; spx: number; spy: number } | null>(null);
  const spaceDown   = useRef(false);

  const zoomRef = useRef(zoom);
  const panRef  = useRef(pan);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current  = pan;  }, [pan]);

  // sync colors when selection changes
  const selShape = shapes.find(s => s.id === selShapeId);
  useEffect(() => {
    if (selShape) {
      setFillColor(selShape.fill);
      setStrokeColor(selShape.stroke);
    }
  }, [selShape, selShapeId]);

  // focus input when editing starts
  useEffect(() => {
    if (editingId && inputRef.current) inputRef.current.focus();
  }, [editingId]);

  // keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (editingId) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (e.key === " " || e.code === "Space") {
        spaceDown.current = true;
        e.preventDefault();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (marqueeShapeIds.size || marqueeConnIds.size) {
          setShapes(prev => prev.filter(s => !marqueeShapeIds.has(s.id)));
          setConns(prev => prev.filter(c => !marqueeConnIds.has(c.id) && !marqueeShapeIds.has(c.from) && !marqueeShapeIds.has(c.to)));
          setMarqueeShapeIds(new Set());
          setMarqueeConnIds(new Set());
        } else if (selShapeId) {
          deleteShape(selShapeId);
        } else if (selConnId) {
          deleteConn(selConnId);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        // basic undo not implemented; could add history later
      }
      if (e.key === "Escape") {
        setConnecting(null);
        setSelShapeId(null);
        setSelConnId(null);
        setMarqueeShapeIds(new Set());
        setMarqueeConnIds(new Set());
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === " " || e.code === "Space") spaceDown.current = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, [editingId, selShapeId, selConnId, marqueeShapeIds, marqueeConnIds]);

  // ── Actions ──────────────────────────────────────────────────────────────

  function addShape(kind: ShapeKind) {
    const def = DEFAULTS[kind];
    const viewportW = containerRef.current ? containerRef.current.clientWidth  : 800;
    const viewportH = containerRef.current ? containerRef.current.clientHeight : 600;
    const centerX = (viewportW / 2 - pan.x) / zoom;
    const centerY = (viewportH / 2 - pan.y) / zoom;
    const shape: FShape = {
      id: uid(),
      kind,
      x: snap(centerX - def.w / 2),
      y: snap(centerY - def.h / 2),
      w: def.w,
      h: def.h,
      label: def.label,
      fill: fillColor,
      stroke: strokeColor,
    };
    setShapes(prev => [...prev, shape]);
    setSelShapeId(shape.id);
    setSelConnId(null);
  }

  function deleteShape(id: string) {
    setShapes(prev => prev.filter(s => s.id !== id));
    setConns(prev => prev.filter(c => c.from !== id && c.to !== id));
    setSelShapeId(null);
  }

  function deleteConn(id: string) {
    setConns(prev => prev.filter(c => c.id !== id));
    setSelConnId(null);
  }

  function updateShapeColor(id: string, fill: string, stroke: string) {
    setShapes(prev => prev.map(s => s.id === id ? { ...s, fill, stroke } : s));
  }

  // Places AI-generated shapes below the current bounding box (or centered
  // in viewport if canvas is empty), laid out top-to-bottom like a normal
  // flowchart. Nodes with more than one outgoing edge (branches/decisions)
  // spread their children horizontally on the same row instead of stacking
  // straight down, so branches don't overlap. Remaps AI-issued ids to fresh
  // uids so they never collide with existing shapes.
  function handleGenerated(result: AiFlowchartResult) {
    const idMap = new Map<string, string>();
    for (const s of shapes) idMap.set(s.id, s.id);

    const startX = shapes.length
      ? shapes.reduce((sum, s) => sum + (s.x + s.w / 2), 0) / shapes.length
      : (containerRef.current ? containerRef.current.clientWidth / 2 / zoom - (pan.x / zoom) : 400);
    const startY = shapes.length
      ? Math.max(...shapes.map(s => s.y + s.h)) + 100
      : (containerRef.current ? containerRef.current.clientHeight / 2 / zoom - (pan.y / zoom) : 300);

    // fresh-id-keyed lookup of the AI's own shape list, to walk the graph
    const aiShapesById = new Map(result.shapes.map(s => [s.id, s]));
    const outgoing = new Map<string, string[]>();
    for (const e of result.edges) {
      if (!outgoing.has(e.from)) outgoing.set(e.from, []);
      outgoing.get(e.from)!.push(e.to);
    }
    const hasIncoming = new Set(result.edges.map(e => e.to));
    const roots = result.shapes.filter(s => !hasIncoming.has(s.id));
    const rootIds = roots.length ? roots.map(r => r.id) : (result.shapes[0] ? [result.shapes[0].id] : []);

    const GAP_Y = 130;
    const GAP_X = 180;
    const positions = new Map<string, { x: number; y: number }>();
    const visited = new Set<string>();

    // BFS by depth level; siblings sharing a parent spread horizontally
    let frontier = rootIds.map(id => ({ id, x: startX }));
    let depth = 0;
    while (frontier.length > 0) {
      const nextFrontier: { id: string; x: number }[] = [];
      // center this level's nodes around their average requested x
      const levelCount = frontier.length;
      frontier.forEach((node, i) => {
        if (visited.has(node.id)) return;
        visited.add(node.id);
        const offset = (i - (levelCount - 1) / 2) * GAP_X;
        positions.set(node.id, { x: node.x + offset, y: startY + depth * GAP_Y });

        const children = outgoing.get(node.id) ?? [];
        children.forEach((childId, ci) => {
          if (visited.has(childId)) return;
          const childOffset = (ci - (children.length - 1) / 2) * GAP_X;
          nextFrontier.push({ id: childId, x: node.x + offset + childOffset });
        });
      });
      frontier = nextFrontier;
      depth++;
    }

    // any shape never reached via edges (disconnected) still needs a slot
    let strayIndex = 0;
    for (const s of result.shapes) {
      if (!positions.has(s.id)) {
        positions.set(s.id, { x: startX + strayIndex * GAP_X, y: startY + depth * GAP_Y });
        strayIndex++;
      }
    }

    const newShapes: FShape[] = result.shapes.map((s) => {
      const freshId = uid();
      idMap.set(s.id, freshId);
      const def = DEFAULTS[s.kind] ?? DEFAULTS.process;
      const pos = positions.get(s.id)!;
      return {
        id: freshId,
        kind: s.kind in DEFAULTS ? s.kind : "process",
        x: pos.x - def.w / 2,
        y: pos.y,
        w: def.w,
        h: def.h,
        label: s.label || def.label,
        fill: fillColor,
        stroke: strokeColor,
      };
    });

    const newConns: FConn[] = result.edges
      .map((e): FConn | null => {
        const from = idMap.get(e.from);
        const to = idMap.get(e.to);
        if (!from || !to) return null;
        const siblings = outgoing.get(e.from) ?? [];
        const isBranch = siblings.length > 1;
        const fromPos = positions.get(e.from);
        const toPos = positions.get(e.to);
        // branches fan out sideways from a decision; single-path edges run
        // straight down from bottom to top like a normal flowchart
        const fromAnchor: Anchor = isBranch && fromPos && toPos
          ? (toPos.x < fromPos.x ? "left" : toPos.x > fromPos.x ? "right" : "bottom")
          : "bottom";
        return {
          id: uid(),
          from,
          fromAnchor,
          to,
          toAnchor: "top",
          label: e.label || "",
        };
      })
      .filter((c): c is FConn => c !== null);

    setShapes(prev => [...prev, ...newShapes]);
    setConns(prev => [...prev, ...newConns]);
  }

  function commitLabel() {
    if (editingId) {
      setShapes(prev => prev.map(s => s.id === editingId ? { ...s, label: editLabel } : s));
      setEditingId(null);
    }
  }

  // ── Mouse handlers on SVG ────────────────────────────────────────────────

  function getSvgCoords(e: React.MouseEvent) {
    if (!svgRef.current) return { x: 0, y: 0 };
    return clientToCanvas(svgRef.current, e.clientX, e.clientY, pan.x, pan.y, zoom);
  }

  function snap(v: number) {
    return snapEnabled ? Math.round(v / GRID_SIZE) * GRID_SIZE : v;
  }

  function onSvgMouseDown(e: React.MouseEvent) {
    if (e.button === 1 || spaceDown.current || (e.button === 0 && e.ctrlKey)) {
      // start panning
      panningRef.current = { sx: e.clientX, sy: e.clientY, spx: pan.x, spy: pan.y };
      e.preventDefault();
      return;
    }
    if (e.target === svgRef.current || (e.target as SVGElement).dataset.canvas) {
      // click on empty canvas — clear selection and start a marquee drag
      setSelShapeId(null);
      setSelConnId(null);
      setConnecting(null);
      const coords = getSvgCoords(e);
      marqueeStartRef.current = coords;
      setMarqueeBox({ x0: coords.x, y0: coords.y, x1: coords.x, y1: coords.y });
      setMarqueeShapeIds(new Set());
      setMarqueeConnIds(new Set());
    }
  }

  function onSvgMouseMove(e: React.MouseEvent) {
    const coords = getSvgCoords(e);
    setMouseCanvas(coords);

    if (panningRef.current) {
      const dx = e.clientX - panningRef.current.sx;
      const dy = e.clientY - panningRef.current.sy;
      setPan({ x: panningRef.current.spx + dx, y: panningRef.current.spy + dy });
      return;
    }

    if (draggingRef.current) {
      const { id, ox, oy } = draggingRef.current;
      setShapes(prev =>
        prev.map(s =>
          s.id === id ? { ...s, x: snap(coords.x - ox), y: snap(coords.y - oy) } : s
        )
      );
      return;
    }

    if (resizingRef.current) {
      const { id, startX, startY, startW, startH } = resizingRef.current;
      const MIN = 24;
      const w = Math.max(MIN, snap(startW + (coords.x - startX)));
      const h = Math.max(MIN, snap(startH + (coords.y - startY)));
      setShapes(prev => prev.map(s => (s.id === id ? { ...s, w, h } : s)));
      return;
    }

    if (marqueeStartRef.current) {
      const start = marqueeStartRef.current;
      const box = {
        x0: Math.min(start.x, coords.x), y0: Math.min(start.y, coords.y),
        x1: Math.max(start.x, coords.x), y1: Math.max(start.y, coords.y),
      };
      setMarqueeBox(box);

      const hitShapeIds = new Set(
        shapes.filter(s =>
          s.x < box.x1 && s.x + s.w > box.x0 && s.y < box.y1 && s.y + s.h > box.y0
        ).map(s => s.id)
      );
      const hitConnIds = new Set(
        conns.filter(c => {
          const fs = shapes.find(s => s.id === c.from);
          const ts = shapes.find(s => s.id === c.to);
          if (!fs || !ts) return false;
          const fp = anchorPt(fs, c.fromAnchor);
          const tp = anchorPt(ts, c.toAnchor);
          const inBox = (p: { x: number; y: number }) =>
            p.x >= box.x0 && p.x <= box.x1 && p.y >= box.y0 && p.y <= box.y1;
          return inBox(fp) && inBox(tp);
        }).map(c => c.id)
      );
      setMarqueeShapeIds(hitShapeIds);
      setMarqueeConnIds(hitConnIds);
    }
  }

  function onSvgMouseUp(e: React.MouseEvent) {
    panningRef.current  = null;
    draggingRef.current = null;
    resizingRef.current = null;
    marqueeStartRef.current = null;
    setMarqueeBox(null);
    if (e.button === 1) e.preventDefault();
  }

  function onResizeHandleMouseDown(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const coords = getSvgCoords(e);
    const s = shapes.find(sh => sh.id === id);
    if (!s) return;
    resizingRef.current = { id, startX: coords.x, startY: coords.y, startW: s.w, startH: s.h };
  }

  // native (non-passive) wheel listener — needed so preventDefault actually
  // stops trackpad pinch-zoom / ctrl+wheel from zooming the whole page
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const curZoom = zoomRef.current;
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(3, Math.max(0.2, curZoom * factor));
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const p = panRef.current;
      setPan({
        x: mx - (mx - p.x) * (newZoom / curZoom),
        y: my - (my - p.y) * (newZoom / curZoom),
      });
      setZoom(newZoom);
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Safari fires gesturestart/change/end for pinch instead of wheel — block
  // those too so the browser doesn't zoom the whole page.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function blockGesture(e: Event) {
      e.preventDefault();
    }
    el.addEventListener("gesturestart", blockGesture);
    el.addEventListener("gesturechange", blockGesture);
    el.addEventListener("gestureend", blockGesture);
    return () => {
      el.removeEventListener("gesturestart", blockGesture);
      el.removeEventListener("gesturechange", blockGesture);
      el.removeEventListener("gestureend", blockGesture);
    };
  }, []);

  // ── Shape interaction ────────────────────────────────────────────────────

  function onShapeMouseDown(e: React.MouseEvent, id: string) {
    if (spaceDown.current || e.ctrlKey) {
      // let it bubble to onSvgMouseDown so ctrl/space+drag pans instead of moving the shape
      panningRef.current = { sx: e.clientX, sy: e.clientY, spx: pan.x, spy: pan.y };
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    if (editingId) return;

    setSelShapeId(id);
    setSelConnId(null);

    const coords = getSvgCoords(e);
    const s = shapes.find(sh => sh.id === id)!;
    draggingRef.current = { id, ox: coords.x - s.x, oy: coords.y - s.y };
  }

  function onShapeDoubleClick(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const s = shapes.find(sh => sh.id === id);
    if (!s) return;
    setEditingId(id);
    setEditLabel(s.label);
  }

  // ── Anchor interaction ───────────────────────────────────────────────────

  function onAnchorClick(e: React.MouseEvent, shapeId: string, anchor: Anchor) {
    e.stopPropagation();
    if (!connecting) {
      setConnecting({ id: shapeId, anchor });
    } else {
      if (connecting.id === shapeId) {
        setConnecting(null);
        return;
      }
      const conn: FConn = {
        id: uid(),
        from: connecting.id,
        fromAnchor: connecting.anchor,
        to: shapeId,
        toAnchor: anchor,
        label: "",
      };
      setConns(prev => [...prev, conn]);
      setConnecting(null);
    }
  }

  // ── Export ───────────────────────────────────────────────────────────────

  function exportPng() {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();

    // compute bounding box of all shapes
    if (shapes.length === 0) return;
    const minX = Math.min(...shapes.map(s => s.x)) - 30;
    const minY = Math.min(...shapes.map(s => s.y)) - 30;
    const maxX = Math.max(...shapes.map(s => s.x + s.w)) + 30;
    const maxY = Math.max(...shapes.map(s => s.y + s.h)) + 30;
    const bw = maxX - minX;
    const bh = maxY - minY;

    // clone SVG with the group repositioned to (0,0)
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width",  String(bw));
    clone.setAttribute("height", String(bh));
    clone.setAttribute("viewBox", `0 0 ${bw} ${bh}`);
    const g = clone.querySelector("[data-main-group]");
    if (g) g.setAttribute("transform", `translate(${-minX},${-minY})`);
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = "text { font-family: Inter, sans-serif; }";
    clone.insertBefore(style, clone.firstChild);

    const svgStr  = serializer.serializeToString(clone);
    const blob    = new Blob([svgStr], { type: "image/svg+xml" });
    const url     = URL.createObjectURL(blob);
    const img     = new Image();
    img.onload = () => {
      const canvas  = document.createElement("canvas");
      const scale   = 2;
      canvas.width  = bw  * scale;
      canvas.height = bh  * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, bw, bh);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = "flowchart.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  }

  // ── Save / Import (.sygnaflow) ──────────────────────────────────────────

  function saveFlow() {
    const payload: FlowFile = { magic: FLOW_MAGIC, version: FLOW_VERSION, shapes, conns };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flowchart${FLOW_EXT}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importFlow(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(e.target?.result));
      } catch {
        window.alert(`Invalid file — not a valid ${FLOW_EXT} file.`);
        return;
      }
      const data = parsed as Partial<FlowFile>;
      if (data.magic !== FLOW_MAGIC || !Array.isArray(data.shapes) || !Array.isArray(data.conns)) {
        window.alert(`This file isn't a valid ${FLOW_EXT} flowchart file.`);
        return;
      }
      setShapes(data.shapes as FShape[]);
      setConns(data.conns as FConn[]);
      setSelShapeId(null);
      setSelConnId(null);
    };
    reader.readAsText(file);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const ANCHORS: Anchor[] = ["top", "right", "bottom", "left"];

  // position of label input in container px coords
  const editShape = shapes.find(s => s.id === editingId);
  let inputLeft = 0, inputTop = 0, inputW = 0;
  if (editShape) {
    inputLeft = (editShape.x + editShape.w / 2) * zoom + pan.x;
    inputTop  = (editShape.y + editShape.h / 2) * zoom + pan.y;
    inputW    = editShape.w * zoom;
  }

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ background: "var(--color-bg)", height: "100vh" }}
    >
      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1 text-sm transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <ChevronLeft size={16} />
            <span className="font-flourish text-xl" style={{ color: "var(--color-text-primary)" }}>Sygna</span>
          </Link>
          <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            / Flowchart
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* zoom controls */}
          <button
            onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}
            className="p-1.5 rounded hover:bg-black/10"
            style={{ color: "var(--color-text-secondary)" }}
            title="Zoom out"
          >
            <Minus size={14} />
          </button>
          <span className="text-xs tabular-nums w-10 text-center" style={{ color: "var(--color-text-secondary)" }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(3, z + 0.1))}
            className="p-1.5 rounded hover:bg-black/10"
            style={{ color: "var(--color-text-secondary)" }}
            title="Zoom in"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 100, y: 60 }); }}
            className="p-1.5 rounded hover:bg-black/10"
            style={{ color: "var(--color-text-secondary)" }}
            title="Reset view"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={() => setSnapEnabled(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm font-medium transition-colors border"
            style={{
              borderColor: snapEnabled ? "var(--color-accent)" : "var(--color-border)",
              color: snapEnabled ? "var(--color-accent)" : "var(--color-text-secondary)",
              background: "var(--color-surface)",
            }}
            title={snapEnabled ? "Snap to grid: on" : "Snap to grid: off"}
          >
            <Magnet size={14} />
          </button>
          <div className="w-px h-5" style={{ background: "var(--color-border)" }} />
          <button
            onClick={saveFlow}
            disabled={shapes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors border disabled:opacity-40"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)", background: "var(--color-surface)" }}
            title={`Save as ${FLOW_EXT}`}
          >
            <Save size={14} />
            Save
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors border"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)", background: "var(--color-surface)" }}
            title={`Import ${FLOW_EXT}`}
          >
            <FolderOpen size={14} />
            Import
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept={FLOW_EXT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importFlow(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={exportPng}
            disabled={shapes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: "var(--color-accent)", color: "#fff" }}
            title="Export PNG"
          >
            <Download size={14} />
            Export PNG
          </button>
          <button
            onClick={() => setAiPanelOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors border"
            style={{
              borderColor: aiPanelOpen ? "var(--color-accent)" : "var(--color-border)",
              color: aiPanelOpen ? "var(--color-accent)" : "var(--color-text-primary)",
              background: "var(--color-surface)",
            }}
            title="AI Generate"
          >
            <Sparkles size={14} />
            AI Generate
          </button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Palette ── */}
        <aside
          className="flex flex-col flex-shrink-0 overflow-y-auto py-3 px-2 gap-1 border-r"
          style={{
            width: 176,
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider px-2 mb-1" style={{ color: "var(--color-text-secondary)" }}>
            Shapes
          </p>
          {PALETTE.map(({ kind, name }) => (
            <button
              key={kind}
              onClick={() => addShape(kind)}
              className="flex items-center gap-2 px-2 py-1.5 rounded text-left w-full transition-colors hover:bg-black/5"
              style={{ color: "var(--color-text-primary)" }}
              title={`Add ${name}`}
            >
              <PaletteIcon kind={kind} />
              <span className="text-xs leading-tight">{name}</span>
            </button>
          ))}

          {/* ── Color pickers ── */}
          <div className="mt-3 px-2 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-secondary)" }}>
              Colors
            </p>
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Fill
                <input
                  type="color"
                  value={fillColor}
                  onChange={e => {
                    setFillColor(e.target.value);
                    if (selShapeId) updateShapeColor(selShapeId, e.target.value, strokeColor);
                  }}
                  className="rounded cursor-pointer"
                  style={{ width: 32, height: 22, padding: 1, border: "1px solid var(--color-border)" }}
                />
              </label>
              <label className="flex items-center justify-between text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Stroke
                <input
                  type="color"
                  value={strokeColor}
                  onChange={e => {
                    setStrokeColor(e.target.value);
                    if (selShapeId) updateShapeColor(selShapeId, fillColor, e.target.value);
                  }}
                  className="rounded cursor-pointer"
                  style={{ width: 32, height: 22, padding: 1, border: "1px solid var(--color-border)" }}
                />
              </label>
            </div>
          </div>

          {/* ── Delete selected ── */}
          {(selShapeId || selConnId) && (
            <button
              onClick={() => {
                if (selShapeId) deleteShape(selShapeId);
                else if (selConnId) deleteConn(selConnId);
              }}
              className="mt-3 mx-2 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium"
              style={{ background: "var(--color-accent)", color: "#fff" }}
            >
              <Trash2 size={12} />
              Delete Selected
            </button>
          )}

          {/* ── Tips ── */}
          <div className="mt-auto px-2 pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              <b>Click</b> shape to select<br />
              <b>Drag</b> to move<br />
              <b>Double-click</b> to edit label<br />
              <b>Hover</b> shape → click ● to connect<br />
              <b>Scroll</b> to zoom<br />
              <b>Space+drag</b> to pan<br />
              <b>Del</b> to delete selected
            </p>
          </div>
        </aside>

        {/* ── Canvas ── */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
          style={{
            cursor: spaceDown.current ? "grab" : connecting ? "crosshair" : "default",
            touchAction: "none",
          }}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            onMouseDown={onSvgMouseDown}
            onMouseMove={onSvgMouseMove}
            onMouseUp={onSvgMouseUp}
            style={{ display: "block", userSelect: "none", touchAction: "none" }}
          >
            <defs>
              {/* arrowhead markers */}
              <marker
                id="arrow-normal"
                markerWidth="10" markerHeight="10"
                refX="9" refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L9,3 z" fill={DEFAULT_STROKE} />
              </marker>
              <marker
                id="arrow-selected"
                markerWidth="10" markerHeight="10"
                refX="9" refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L9,3 z" fill="#A6342A" />
              </marker>
              <marker
                id="arrow-preview"
                markerWidth="10" markerHeight="10"
                refX="9" refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L9,3 z" fill="#A6342A" />
              </marker>
            </defs>

            {/* dotted grid background */}
            <defs>
              <pattern id="grid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse"
                x={pan.x % (20 * zoom)} y={pan.y % (20 * zoom)}>
                <circle cx={0} cy={0} r={0.8} fill="var(--color-border)" />
              </pattern>
            </defs>
            <rect data-canvas="1" width="100%" height="100%" fill="url(#grid)" />

            <g data-main-group="" transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              {/* connections */}
              {conns.map(conn => {
                const fs = shapes.find(s => s.id === conn.from);
                const ts = shapes.find(s => s.id === conn.to);
                if (!fs || !ts) return null;
                const fp = anchorPt(fs, conn.fromAnchor);
                const tp = anchorPt(ts, conn.toAnchor);
                const d  = connPath(fp, conn.fromAnchor, tp, conn.toAnchor);
                const isSel = selConnId === conn.id || marqueeConnIds.has(conn.id);
                const mx = (fp.x + tp.x) / 2;
                const my = (fp.y + tp.y) / 2;
                return (
                  <g key={conn.id} onClick={e => { e.stopPropagation(); setSelConnId(conn.id); setSelShapeId(null); }}>
                    {/* wider invisible hit area */}
                    <path d={d} fill="none" stroke="transparent" strokeWidth={10} style={{ cursor: "pointer" }} />
                    <path
                      d={d}
                      fill="none"
                      stroke={isSel ? "#A6342A" : DEFAULT_STROKE}
                      strokeWidth={1.5}
                      markerEnd={isSel ? "url(#arrow-selected)" : "url(#arrow-normal)"}
                    />
                    {conn.label && (
                      <text
                        x={mx} y={my - 6}
                        textAnchor="middle"
                        fontSize={11}
                        fill={DEFAULT_STROKE}
                        style={{ pointerEvents: "none" }}
                      >
                        {conn.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* connection preview line */}
              {connecting && (() => {
                const fs = shapes.find(s => s.id === connecting.id);
                if (!fs) return null;
                const fp = anchorPt(fs, connecting.anchor);
                const tp = mouseCanvas;
                const [dx, dy] = ANCHOR_DIR[connecting.anchor];
                const STUB = 24;
                const stub = { x: fp.x + dx * STUB, y: fp.y + dy * STUB };
                const d = roundedPolylinePath(dedupePoints([fp, stub, tp]), 10);
                return (
                  <path
                    d={d}
                    fill="none"
                    stroke="#A6342A"
                    strokeWidth={1.5}
                    strokeDasharray="5 3"
                    markerEnd="url(#arrow-preview)"
                    style={{ pointerEvents: "none" }}
                  />
                );
              })()}

              {/* shapes */}
              {shapes.map(s => {
                const isSel  = selShapeId === s.id || marqueeShapeIds.has(s.id);
                const isHov  = hoveredId  === s.id;
                const showAnchors = isSel || isHov || !!connecting;
                const cx = s.x + s.w / 2;
                const cy = s.y + s.h / 2;
                const isConnecting = connecting?.id === s.id;

                return (
                  <g
                    key={s.id}
                    transform={`translate(${s.x},${s.y})`}
                    style={{ cursor: connecting ? "crosshair" : "move" }}
                    onMouseDown={e => onShapeMouseDown(e, s.id)}
                    onDoubleClick={e => onShapeDoubleClick(e, s.id)}
                    onMouseEnter={() => setHoveredId(s.id)}
                    onMouseLeave={() => { setHoveredId(null); setHovAnchor(null); }}
                  >
                    {/* selection ring */}
                    {isSel && (
                      <rect
                        x={-4} y={-4}
                        width={s.w + 8} height={s.h + 8}
                        rx={4}
                        fill="none"
                        stroke="#A6342A"
                        strokeWidth={1.5}
                        strokeDasharray="5 3"
                        style={{ pointerEvents: "none" }}
                      />
                    )}

                    {/* resize handle (bottom-right corner) */}
                    {isSel && (
                      <rect
                        x={s.w - 6} y={s.h - 6}
                        width={12} height={12}
                        rx={2}
                        fill="var(--color-surface)"
                        stroke="#A6342A"
                        strokeWidth={1.5}
                        style={{ cursor: "nwse-resize" }}
                        onMouseDown={e => onResizeHandleMouseDown(e, s.id)}
                      />
                    )}

                    {/* connecting ring */}
                    {isConnecting && (
                      <rect
                        x={-4} y={-4}
                        width={s.w + 8} height={s.h + 8}
                        rx={4}
                        fill="rgba(166,52,42,0.08)"
                        stroke="#A6342A"
                        strokeWidth={2}
                        style={{ pointerEvents: "none" }}
                      />
                    )}

                    <ShapeBody kind={s.kind} w={s.w} h={s.h} fill={s.fill} stroke={s.stroke} />

                    {/* label */}
                    {s.id !== editingId && (
                      <text
                        x={s.w / 2}
                        y={s.h / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={12}
                        fill={s.stroke}
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {s.label}
                      </text>
                    )}

                    {/* anchor points */}
                    {showAnchors && ANCHORS.map(a => {
                      const ap = anchorPt({ ...s, x: 0, y: 0 }, a);
                      const isHovAnchor = isHov && hovAnchor === a;
                      return (
                        <circle
                          key={a}
                          cx={ap.x} cy={ap.y}
                          r={isHovAnchor ? ANCHOR_R + 1 : ANCHOR_R}
                          fill={isHovAnchor ? "#A6342A" : "var(--color-surface)"}
                          stroke="#A6342A"
                          strokeWidth={1.5}
                          style={{ cursor: "crosshair" }}
                          onClick={e => onAnchorClick(e, s.id, a)}
                          onMouseEnter={() => setHovAnchor(a)}
                          onMouseLeave={() => setHovAnchor(null)}
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* marquee (rubber-band) select box */}
              {marqueeBox && (
                <rect
                  x={Math.min(marqueeBox.x0, marqueeBox.x1)}
                  y={Math.min(marqueeBox.y0, marqueeBox.y1)}
                  width={Math.abs(marqueeBox.x1 - marqueeBox.x0)}
                  height={Math.abs(marqueeBox.y1 - marqueeBox.y0)}
                  fill="rgba(166,52,42,0.08)"
                  stroke="#A6342A"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                  style={{ pointerEvents: "none" }}
                />
              )}
            </g>
          </svg>

          {/* ── Inline label editor ── */}
          {editingId && editShape && (
            <input
              ref={inputRef}
              value={editLabel}
              onChange={e => setEditLabel(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === "Escape") commitLabel();
                e.stopPropagation();
              }}
              onBlur={commitLabel}
              style={{
                position: "absolute",
                left: inputLeft,
                top:  inputTop,
                transform: "translate(-50%, -50%)",
                width: Math.max(inputW, 80),
                textAlign: "center",
                fontSize: 12,
                padding: "2px 6px",
                border: "1.5px solid #A6342A",
                borderRadius: 4,
                outline: "none",
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
                zIndex: 10,
              }}
            />
          )}

          {/* ── Empty state hint ── */}
          {shapes.length === 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="text-center" style={{ color: "var(--color-text-secondary)" }}>
                <svg width={64} height={64} viewBox="0 0 64 64" className="mx-auto mb-3 opacity-30">
                  <rect x={8} y={20} width={48} height={24} rx={4} fill="none" stroke="currentColor" strokeWidth={2} />
                  <polygon points="32,8 56,20 32,32 8,20" fill="none" stroke="currentColor" strokeWidth={2} />
                </svg>
                <p className="text-sm font-medium">Click a shape in the palette to start</p>
                <p className="text-xs mt-1 opacity-70">Drag to move · Double-click to edit label · Click ● to connect</p>
              </div>
            </div>
          )}

          {/* ── Connecting mode banner ── */}
          {connecting && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-medium shadow"
              style={{ background: "#A6342A", color: "#fff" }}
            >
              Click an anchor point (●) on another shape to connect · ESC to cancel
            </div>
          )}
        </div>

        {/* ── AI Generate Panel ── */}
        <AiFlowchartPanel
          open={aiPanelOpen}
          onClose={() => setAiPanelOpen(false)}
          existingShapes={shapes}
          existingEdges={conns}
          onGenerated={handleGenerated}
        />
      </div>
    </div>
  );
}
