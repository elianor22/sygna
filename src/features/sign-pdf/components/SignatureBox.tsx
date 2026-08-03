import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { X, GripHorizontal, Pencil } from "lucide-react";
import { useShapeEditorStore } from "../store/useShapeEditorStore";
import { hexToRgba } from "../utils/color";

const DRAG_THRESHOLD = 5;
const LONG_PRESS_MS = 500;

export function SignatureBox({
  sig,
  containerWidth,
  containerHeight,
  onUpdate,
  onRemove,
  onOpen,
}) {
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedRef = useRef(false);
  const longPressTimerRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const longPressFiredRef = useRef(false);
  const [showRemove, setShowRemove] = useState(false);
  const [showPencil, setShowPencil] = useState(false);
  const pencilAreaRef = useRef(null);
  const openShapeEditor = useShapeEditorStore((s) => s.openShapeEditor);

  function toggleShapeControls() {
    setShowPencil((v) => !v);
  }

  useEffect(() => {
    if (!showPencil) return;
    function handleOutside(e) {
      if (pencilAreaRef.current && !pencilAreaRef.current.contains(e.target)) {
        setShowPencil(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [showPencil]);

  if (containerWidth === 0 || containerHeight === 0) return null;

  const x = sig.xPct * containerWidth;
  const y = sig.yPct * containerHeight;
  const w = sig.widthPct * containerWidth;
  const h = sig.heightPct * containerHeight;

  function handleDragStart(_, d) {
    draggedRef.current = false;
    dragStartRef.current = { x: d.x, y: d.y };
  }

  function handleDrag(_, d) {
    const dx = d.x - dragStartRef.current.x;
    const dy = d.y - dragStartRef.current.y;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      draggedRef.current = true;
    }
  }

  function handleDragStop(_, d) {
    onUpdate(sig.id, {
      xPct: Math.max(0, Math.min(d.x / containerWidth, 1 - sig.widthPct)),
      yPct: Math.max(0, Math.min(d.y / containerHeight, 1 - sig.heightPct)),
    });
  }

  function handleClick() {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    if (sig.type === "shape") {
      toggleShapeControls();
      return;
    }
    if (sig.type === "text") return;
    onOpen(sig.id);
  }

  function handleResizeStop(_, __, ref, ___, position) {
    const newW = ref.offsetWidth;
    const newH = ref.offsetHeight;
    onUpdate(sig.id, {
      xPct: Math.max(0, position.x / containerWidth),
      yPct: Math.max(0, position.y / containerHeight),
      widthPct: Math.min(newW / containerWidth, 1),
      heightPct: Math.min(newH / containerHeight, 1),
    });
  }

  function handleTouchStart(e) {
    const t = e.touches[0];
    touchStartPosRef.current = { x: t.clientX, y: t.clientY };
    longPressFiredRef.current = false;
    clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      setShowRemove(true);
    }, LONG_PRESS_MS);
  }

  function handleTouchMove(e) {
    const t = e.touches[0];
    const dx = t.clientX - touchStartPosRef.current.x;
    const dy = t.clientY - touchStartPosRef.current.y;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      clearTimeout(longPressTimerRef.current);
    }
  }

  function handleTouchEnd() {
    clearTimeout(longPressTimerRef.current);
    if (!longPressFiredRef.current && !draggedRef.current) {
      if (sig.type === "shape") toggleShapeControls();
      else if (sig.type !== "text") onOpen(sig.id);
    }
    draggedRef.current = false;
  }

  const isText = sig.type === "text";
  const isShape = sig.type === "shape";
  const isPlaceholder = !isText && !isShape && !sig.content;

  return (
    <Rnd
      position={{ x, y }}
      size={{ width: w, height: h }}
      minWidth={isShape ? 24 : 80}
      minHeight={isShape ? 24 : 32}
      bounds="parent"
      enableUserSelectHack={false}
      dragHandleClassName={isText ? "text-drag-handle" : undefined}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      style={{
        touchAction: "none",
        zIndex: 10,
      }}
    >
      <div
        className={`relative w-full h-full group ${isText || isShape ? "" : "cursor-pointer"} ${isShape ? "" : "rounded"}`}
        style={{
          background: isShape
            ? sig.bgColor && sig.bgColor !== "transparent"
              ? hexToRgba(sig.bgColor, sig.bgAlpha ?? 1)
              : "transparent"
            : isPlaceholder
              ? "var(--color-placeholder-fill)"
              : "transparent",
          borderWidth: 2,
          borderColor: isShape
            ? hexToRgba(sig.borderColor || "#4A5AAD", sig.borderAlpha ?? 1)
            : "var(--color-placeholder-border)",
          borderStyle: isShape
            ? "solid"
            : isPlaceholder || isText
              ? "dashed"
              : "solid",
          borderRadius: isShape
            ? sig.shape === "circle"
              ? "50%"
              : 4
            : undefined,
        }}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isPlaceholder && (
          <span
            className="absolute inset-0 flex items-center justify-center text-xs select-none font-flourish"
            style={{
              color: "var(--color-placeholder-border)",
              fontSize: "14px",
            }}
          >
            sign here
          </span>
        )}
        {isText && (
          <div className="flex flex-col w-full h-full">
            <div
              className="text-drag-handle flex items-center justify-center shrink-0"
              style={{
                height: 14,
                cursor: "move",
                color: "var(--color-placeholder-border)",
              }}
            >
              <GripHorizontal size={12} />
            </div>
            <textarea
              value={sig.content ?? ""}
              onChange={(e) => onUpdate(sig.id, { content: e.target.value })}
              placeholder="Type text..."
              className="flex-1 w-full px-2 text-black pb-1 text-sm outline-none resize-none bg-transparent"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            />
          </div>
        )}
        {!isText && sig.content && (
          <img
            src={sig.content}
            alt="signature"
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        )}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => {
            e.stopPropagation();
            setShowRemove(false);
            onRemove(sig.id);
          }}
          onClick={(e) => {
            e.stopPropagation();
            setShowRemove(false);
            onRemove(sig.id);
          }}
          className={`absolute -top-2 -right-2 rounded-full w-5 h-5 flex items-center justify-center transition-opacity group-hover:opacity-100 ${showRemove || isText ? "opacity-100" : "opacity-0"}`}
          style={{
            background: "var(--color-accent)",
            color: "#fff",
            zIndex: 20,
            cursor: "pointer",
          }}
        >
          <X size={12} />
        </button>
        {isShape && showPencil && (
          <div
            ref={pencilAreaRef}
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 40 }}
          >
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => {
                e.stopPropagation();
                openShapeEditor(sig.id);
              }}
              onClick={(e) => {
                e.stopPropagation();
                openShapeEditor(sig.id);
              }}
              className="flex items-center justify-center rounded-full shadow-lg"
              style={{
                width: 32,
                height: 32,
                background: "var(--color-accent)",
                color: "#fff",
                cursor: "pointer",
              }}
              title="Edit color"
            >
              <Pencil size={15} />
            </button>
          </div>
        )}
      </div>
    </Rnd>
  );
}
