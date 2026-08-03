import { useCallback, useRef, useState } from 'react'
import { Upload } from 'lucide-react'

interface Props {
  onFile: (file: File) => void
}

export default function DropZone({ onFile }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
        setError(`"${file.name}" bukan file .md`)
        return
      }
      setError('')
      onFile(file)
    },
    [onFile]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback(() => setDragOver(false), [])

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  return (
    <div className="flex flex-col items-center w-full max-w-lg mt-16">
      <div
        className="w-full rounded-xl border-2 border-dashed flex flex-col items-center gap-4 px-10 py-16 cursor-pointer transition-all duration-200 outline-none select-none"
        style={{
          borderColor: dragOver ? 'var(--color-accent)' : 'var(--color-border)',
          background: dragOver ? 'rgba(var(--color-accent), 0.05)' : 'var(--color-surface)',
          transform: dragOver ? 'scale(1.01)' : 'scale(1)',
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="Drop zone for markdown files"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".md,.markdown"
          onChange={onInputChange}
          className="hidden"
          aria-hidden="true"
        />

        <div
          className="size-16 rounded-2xl flex items-center justify-center transition-transform"
          style={{
            background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
            transform: dragOver ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          <Upload
            className="size-7"
            style={{ color: 'var(--color-accent)' }}
          />
        </div>

        <div className="text-center space-y-1.5">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {dragOver ? 'Lepas file di sini' : 'Drag & Drop file Markdown'}
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            atau klik untuk memilih file
          </p>
        </div>

        <div className="flex gap-2">
          {['.md', '.markdown'].map((ext) => (
            <span
              key={ext}
              className="px-2 py-0.5 rounded border font-mono text-xs"
              style={{
                color: 'var(--color-accent)',
                borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
                background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
              }}
            >
              {ext}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div
          className="mt-4 w-full rounded-lg px-4 py-2.5 text-sm text-center"
          style={{
            borderColor: 'color-mix(in srgb, var(--color-warning) 40%, transparent)',
            background: 'color-mix(in srgb, var(--color-warning) 12%, transparent)',
            color: 'var(--color-warning)',
            border: '1px solid',
          }}
        >
          ⚠ {error}
        </div>
      )}
    </div>
  )
}
