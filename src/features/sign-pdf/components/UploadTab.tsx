import { useRef, useState } from 'react'
import { removeWhiteBackground } from '../utils/imageProcessing'

export function UploadTab({ onSave }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [removeWhite, setRemoveWhite] = useState(true)

  async function handleFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!preview) return
    const result = removeWhite ? await removeWhiteBackground(preview) : preview
    onSave(result)
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="border-2 border-dashed rounded flex flex-col items-center justify-center py-8 cursor-pointer"
        style={{ borderColor: 'var(--color-border)' }}
        onClick={() => inputRef.current.click()}
      >
        {preview ? (
          <img src={preview} alt="preview" className="max-h-32 object-contain" />
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Click to upload PNG or JPG
          </p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
        <input
          type="checkbox"
          checked={removeWhite}
          onChange={(e) => setRemoveWhite(e.target.checked)}
          className="rounded"
        />
        Remove white background
      </label>
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!preview}
          className="px-4 py-2 rounded text-sm font-medium disabled:opacity-40"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          Save
        </button>
      </div>
    </div>
  )
}
