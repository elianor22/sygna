import { useRef, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'

function trimCanvas(canvas) {
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  const { data } = ctx.getImageData(0, 0, width, height)
  let top = 0, bottom = height, left = 0, right = width
  const rowHasInk = (y) => {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] !== 0) return true
    }
    return false
  }
  const colHasInk = (x) => {
    for (let y = top; y < bottom; y++) {
      if (data[(y * width + x) * 4 + 3] !== 0) return true
    }
    return false
  }
  while (top < bottom && !rowHasInk(top)) top++
  while (bottom > top && !rowHasInk(bottom - 1)) bottom--
  while (left < right && !colHasInk(left)) left++
  while (right > left && !colHasInk(right - 1)) right--

  const trimmedWidth = Math.max(right - left, 1)
  const trimmedHeight = Math.max(bottom - top, 1)
  const trimmed = document.createElement('canvas')
  trimmed.width = trimmedWidth
  trimmed.height = trimmedHeight
  trimmed.getContext('2d').putImageData(ctx.getImageData(left, top, trimmedWidth, trimmedHeight), 0, 0)
  return trimmed
}

export function DrawTab({ onSave }) {
  const canvasRef = useRef(null)

  function handleSave() {
    if (!canvasRef.current || canvasRef.current.isEmpty()) return
    const dataUrl = trimCanvas(canvasRef.current.getCanvas()).toDataURL('image/png')
    onSave(dataUrl)
  }

  function handleClear() {
    canvasRef.current?.clear()
  }

  useEffect(() => {
    // HiDPI fix applied by react-signature-canvas internally via ratio
    // but we re-scale the backing canvas here for retina clarity
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas) return
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    canvas.width = w * ratio
    canvas.height = h * ratio
    canvas.getContext('2d').scale(ratio, ratio)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded border overflow-hidden"
        style={{ border: '1px solid var(--color-border)', background: '#fff', height: 180 }}
      >
        <SignatureCanvas
          ref={canvasRef}
          canvasProps={{
            style: { width: '100%', height: '100%' },
          }}
          backgroundColor="transparent"
          penColor="#1B2A4A"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={handleClear}
          className="px-4 py-2 rounded text-sm border transition-colors"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-secondary)',
            background: 'transparent',
          }}
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded text-sm font-medium transition-colors"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          Save
        </button>
      </div>
    </div>
  )
}
