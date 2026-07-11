import { X } from 'lucide-react'
import { useShapeEditorStore } from '../store/useShapeEditorStore'
import { PRESET_COLORS, hexToRgba } from '../utils/color'

function ColorField({ label, value, alpha, onColorChange, onAlphaChange }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-center justify-between text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <span>{label}</span>
        <div
          className="rounded border"
          style={{
            width: 28,
            height: 28,
            borderColor: 'var(--color-border)',
            backgroundImage:
              'conic-gradient(#ccc 25%, #fff 0 50%, #ccc 0 75%, #fff 0)',
            backgroundSize: '8px 8px',
          }}
        >
          <div
            className="w-full h-full rounded"
            style={{ backgroundColor: hexToRgba(value, alpha) }}
          />
        </div>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            className="rounded-full"
            style={{
              width: 28,
              height: 28,
              background: c,
              border:
                value === c
                  ? '2px solid var(--color-accent)'
                  : '1px solid var(--color-border)',
            }}
            aria-label={c}
          />
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        Transparency
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={alpha}
          onChange={(e) => onAlphaChange(Number(e.target.value))}
          className="flex-1"
        />
        <span style={{ minWidth: 32, textAlign: 'right' }}>{Math.round(alpha * 100)}%</span>
      </label>
    </div>
  )
}

export function ShapeColorSheet({ signatures, onUpdate }) {
  const editingShapeId = useShapeEditorStore((s) => s.editingShapeId)
  const isSheetOpen = useShapeEditorStore((s) => s.isSheetOpen)
  const closeShapeEditor = useShapeEditorStore((s) => s.closeShapeEditor)

  const sig = signatures.find((s) => s.id === editingShapeId)
  if (!isSheetOpen || !sig) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={closeShapeEditor}
      />
      <div
        className="fixed z-50 left-0 right-0 bottom-0 rounded-t-xl shadow-2xl
          md:left-1/2 md:right-auto md:bottom-auto md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:w-90"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2
            className="font-medium text-base"
            style={{ color: 'var(--color-text-primary)', margin: 0 }}
          >
            Shape Color
          </h2>
          <button onClick={closeShapeEditor} style={{ color: 'var(--color-text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
          <ColorField
            label="Border Color"
            value={sig.borderColor || '#4A5AAD'}
            alpha={sig.borderAlpha ?? 1}
            onColorChange={(c) => onUpdate(sig.id, { borderColor: c })}
            onAlphaChange={(a) => onUpdate(sig.id, { borderAlpha: a })}
          />
          <ColorField
            label="Background Color"
            value={sig.bgColor && sig.bgColor !== 'transparent' ? sig.bgColor : '#ffffff'}
            alpha={sig.bgColor && sig.bgColor !== 'transparent' ? (sig.bgAlpha ?? 1) : 0}
            onColorChange={(c) => onUpdate(sig.id, { bgColor: c, bgAlpha: sig.bgAlpha ?? 1 })}
            onAlphaChange={(a) => onUpdate(sig.id, { bgAlpha: a })}
          />
        </div>
      </div>
    </>
  )
}
