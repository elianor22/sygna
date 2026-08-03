import { RefreshCw, X } from 'lucide-react'
import DropZone from './DropZone'
import MarkdownViewer from './MarkdownViewer'

export type PanelData = { content: string; fileName: string }

interface Props {
  data: PanelData | null
  onFile: (file: File) => void
  onClose?: () => void
  compact?: boolean
}

export default function ViewerPane({ data, onFile, onClose, compact }: Props) {
  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      {data ? (
        <>
          <div
            className="flex items-center justify-between px-4 py-1.5 border-b shrink-0 gap-3"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <span
              className="text-xs truncate flex-1 font-mono"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {data.fileName}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <label
                className="flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
              >
                <input
                  type="file"
                  accept=".md,.markdown"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) onFile(f)
                    e.target.value = ''
                  }}
                />
                <RefreshCw className="size-3" />
                Change
              </label>
              {onClose && (
                <button
                  className="p-1 rounded transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onClick={onClose}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 flex justify-center">
            <MarkdownViewer content={data.content} compact={compact} />
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto flex items-start justify-center">
          <DropZone onFile={onFile} />
        </div>
      )}
    </div>
  )
}
