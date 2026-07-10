import { useRef, useState } from 'react'
import { Rnd } from 'react-rnd'
import { X } from 'lucide-react'

const DRAG_THRESHOLD = 5
const LONG_PRESS_MS = 500

export function SignatureBox({ sig, containerWidth, containerHeight, onUpdate, onRemove, onOpen }) {
  const dragStartRef = useRef({ x: 0, y: 0 })
  const draggedRef = useRef(false)
  const longPressTimerRef = useRef(null)
  const touchStartPosRef = useRef({ x: 0, y: 0 })
  const longPressFiredRef = useRef(false)
  const [showRemove, setShowRemove] = useState(false)

  if (containerWidth === 0 || containerHeight === 0) return null

  const x = sig.xPct * containerWidth
  const y = sig.yPct * containerHeight
  const w = sig.widthPct * containerWidth
  const h = sig.heightPct * containerHeight

  function handleDragStart(_, d) {
    draggedRef.current = false
    dragStartRef.current = { x: d.x, y: d.y }
  }

  function handleDrag(_, d) {
    const dx = d.x - dragStartRef.current.x
    const dy = d.y - dragStartRef.current.y
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      draggedRef.current = true
    }
  }

  function handleDragStop(_, d) {
    onUpdate(sig.id, {
      xPct: Math.max(0, Math.min(d.x / containerWidth, 1 - sig.widthPct)),
      yPct: Math.max(0, Math.min(d.y / containerHeight, 1 - sig.heightPct)),
    })
  }

  function handleClick() {
    if (draggedRef.current) {
      draggedRef.current = false
      return
    }
    onOpen(sig.id)
  }

  function handleResizeStop(_, __, ref, ___, position) {
    const newW = ref.offsetWidth
    const newH = ref.offsetHeight
    onUpdate(sig.id, {
      xPct: Math.max(0, position.x / containerWidth),
      yPct: Math.max(0, position.y / containerHeight),
      widthPct: Math.min(newW / containerWidth, 1),
      heightPct: Math.min(newH / containerHeight, 1),
    })
  }

  function handleTouchStart(e) {
    const t = e.touches[0]
    touchStartPosRef.current = { x: t.clientX, y: t.clientY }
    longPressFiredRef.current = false
    clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true
      setShowRemove(true)
    }, LONG_PRESS_MS)
  }

  function handleTouchMove(e) {
    const t = e.touches[0]
    const dx = t.clientX - touchStartPosRef.current.x
    const dy = t.clientY - touchStartPosRef.current.y
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      clearTimeout(longPressTimerRef.current)
    }
  }

  function handleTouchEnd() {
    clearTimeout(longPressTimerRef.current)
    if (!longPressFiredRef.current && !draggedRef.current) {
      onOpen(sig.id)
    }
    draggedRef.current = false
  }

  const isPlaceholder = !sig.content

  return (
    <Rnd
      position={{ x, y }}
      size={{ width: w, height: h }}
      minWidth={80}
      minHeight={32}
      bounds="parent"
      enableUserSelectHack={false}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      style={{
        touchAction: 'none',
        zIndex: 10,
      }}
    >
      <div
        className="relative w-full h-full rounded group cursor-pointer"
        style={{
          background: isPlaceholder ? 'var(--color-placeholder-fill)' : 'transparent',
          border: `2px dashed var(--color-placeholder-border)`,
          borderStyle: isPlaceholder ? 'dashed' : 'solid',
        }}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isPlaceholder && (
          <span
            className="absolute inset-0 flex items-center justify-center text-xs select-none font-flourish"
            style={{ color: 'var(--color-placeholder-border)', fontSize: '14px' }}
          >
            sign here
          </span>
        )}
        {sig.content && (
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
          onTouchEnd={(e) => { e.stopPropagation(); setShowRemove(false); onRemove(sig.id) }}
          onClick={(e) => { e.stopPropagation(); setShowRemove(false); onRemove(sig.id) }}
          className={`absolute -top-2 -right-2 rounded-full w-5 h-5 flex items-center justify-center transition-opacity group-hover:opacity-100 ${showRemove ? 'opacity-100' : 'opacity-0'}`}
          style={{
            background: 'var(--color-accent)',
            color: '#fff',
            zIndex: 20,
            cursor: 'pointer',
          }}
        >
          <X size={12} />
        </button>
      </div>
    </Rnd>
  )
}
