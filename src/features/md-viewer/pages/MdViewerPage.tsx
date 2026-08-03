import { useState, useCallback, useRef, useEffect } from 'react'
import { LayoutPanelLeft, Columns2, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import ViewerPane, { type PanelData } from '../components/ViewerPane'

export default function MdViewerPage() {
  const [left, setLeft] = useState<PanelData | null>(null)
  const [right, setRight] = useState<PanelData | null>(null)
  const [split, setSplit] = useState(false)
  const [splitPos, setSplitPos] = useState(50)
  const [dragging, setDragging] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  const readFile = useCallback((file: File, cb: (d: PanelData) => void) => {
    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) return
    const reader = new FileReader()
    reader.onload = (e) =>
      cb({ content: e.target?.result as string, fileName: file.name })
    reader.readAsText(file)
  }, [])

  const handleLeftFile = useCallback(
    (file: File) => readFile(file, setLeft),
    [readFile]
  )
  const handleRightFile = useCallback(
    (file: File) => readFile(file, setRight),
    [readFile]
  )

  const toggleSplit = useCallback(() => {
    setSplit((v) => {
      if (v) setRight(null)
      return !v
    })
    setSplitPos(50)
  }, [])

  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  useEffect(() => {
    if (!dragging) return

    const onMouseMove = (e: MouseEvent) => {
      if (!mainRef.current) return
      const rect = mainRef.current.getBoundingClientRect()
      const raw = ((e.clientX - rect.left) / rect.width) * 100
      setSplitPos(Math.min(80, Math.max(20, raw)))
    }

    const onMouseUp = () => setDragging(false)

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [dragging])

  const anyFile = left !== null || right !== null

  return (
    <div
      className={`flex flex-col h-screen${dragging ? ' select-none cursor-col-resize' : ''}`}
      style={{ background: 'var(--color-bg)' }}
    >
      <header
        className="h-14 shrink-0 border-b flex items-center justify-between px-5 sticky top-0 z-10"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-lg">📄</span>
            <h1 className="text-base font-bold tracking-wide" style={{ color: 'var(--color-text-primary)' }}>
              MD Viewer
            </h1>
          </div>
        </div>

        {anyFile && (
          <button
            onClick={toggleSplit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors"
            style={
              split
                ? {
                    background: 'var(--color-accent)',
                    borderColor: 'var(--color-accent)',
                    color: '#fff',
                  }
                : {
                    background: 'transparent',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-secondary)',
                  }
            }
          >
            {split ? (
              <><LayoutPanelLeft className="size-3.5" /> Single</>
            ) : (
              <><Columns2 className="size-3.5" /> Split</>
            )}
          </button>
        )}
      </header>

      <main
        ref={mainRef}
        className={`flex-1 overflow-hidden flex${!split ? ' overflow-y-auto justify-center px-4 py-8' : ''}`}
      >
        {split ? (
          <>
            <div
              className="flex flex-col min-w-0 overflow-hidden"
              style={{ width: `${splitPos}%` }}
            >
              <ViewerPane
                data={left}
                onFile={handleLeftFile}
                onClose={left ? () => setLeft(null) : undefined}
                compact
              />
            </div>

            <div
              className={`w-5 shrink-0 relative flex items-center justify-center z-10 cursor-col-resize group transition-colors${dragging ? ' bg-black/5' : ' hover:bg-black/[0.03]'}`}
              onMouseDown={onDividerMouseDown}
            >
              <div
                className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors"
                style={{ background: dragging ? 'var(--color-accent)' : 'var(--color-border)' }}
              />
              <div className={`relative z-10 flex flex-col items-center gap-[3px] transition-opacity${dragging ? ' opacity-100' : ' opacity-60 group-hover:opacity-100'}`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="size-[3px] rounded-full transition-colors"
                    style={{ background: dragging ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
                  />
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <ViewerPane
                data={right}
                onFile={handleRightFile}
                onClose={right ? () => setRight(null) : undefined}
                compact
              />
            </div>
          </>
        ) : (
          <ViewerPane
            data={left}
            onFile={handleLeftFile}
            onClose={left ? () => setLeft(null) : undefined}
            compact={false}
          />
        )}
      </main>
    </div>
  )
}
