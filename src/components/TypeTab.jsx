import { useState } from 'react'
import { textToSignatureImage } from '../utils/imageProcessing'

const FONTS = ['Caveat', 'Dancing Script', 'Pacifico']

export function TypeTab({ onSave }) {
  const [text, setText] = useState('')
  const [font, setFont] = useState('Caveat')

  function handleSave() {
    if (!text.trim()) return
    const dataUrl = textToSignatureImage(text, font)
    onSave(dataUrl)
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Type your name"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full px-3 py-2 rounded border text-sm outline-none focus:ring-2"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
        }}
      />
      <div className="flex gap-2 flex-wrap">
        {FONTS.map(f => (
          <button
            key={f}
            onClick={() => setFont(f)}
            className="px-3 py-1 rounded border text-sm"
            style={{
              fontFamily: `"${f}", cursive`,
              fontSize: 18,
              borderColor: font === f ? 'var(--color-accent)' : 'var(--color-border)',
              color: font === f ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              background: 'transparent',
            }}
          >
            {text || 'Preview'}
          </button>
        ))}
      </div>
      {text && (
        <div
          className="rounded p-3 text-center"
          style={{ background: '#fff', border: '1px solid var(--color-border)' }}
        >
          <span style={{ fontFamily: `"${font}", cursive`, fontSize: 32, color: '#1B2A4A' }}>
            {text}
          </span>
        </div>
      )}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!text.trim()}
          className="px-4 py-2 rounded text-sm font-medium disabled:opacity-40"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          Save
        </button>
      </div>
    </div>
  )
}
