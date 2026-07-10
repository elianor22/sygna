import { useMemo } from 'react'
import { Document, Page } from 'react-pdf'

export function PageSidebar({ pdfBytes, totalPages, activePage, onJump, variant = 'vertical' }) {
  const thumbBytes = useMemo(() => (pdfBytes ? pdfBytes.slice(0) : null), [pdfBytes])

  function handleJump(pageNumber) {
    onJump(pageNumber)
    document.getElementById(`pdf-page-${pageNumber}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (!thumbBytes || totalPages === 0) return null

  const isHorizontal = variant === 'horizontal'
  const thumbWidth = isHorizontal ? 42 : 120

  return (
    <aside
      className={
        isHorizontal
          ? 'flex md:hidden w-full shrink-0 border-t overflow-x-auto'
          : 'hidden md:flex flex-col w-36 shrink-0 border-r overflow-y-auto'
      }
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <Document file={thumbBytes} loading={null}>
        <div className={isHorizontal ? 'flex flex-row gap-2 p-2' : 'flex flex-col gap-3 p-3'}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => handleJump(n)}
              className="flex flex-col gap-1 rounded overflow-hidden border-2 transition-colors shrink-0"
              style={{
                borderColor: activePage === n ? 'var(--color-accent)' : 'var(--color-border)',
              }}
            >
              <Page pageNumber={n} width={thumbWidth} renderAnnotationLayer={false} renderTextLayer={false} loading={null} />
              <span
                className="text-xs text-center"
                style={{ color: activePage === n ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
              >
                {n}
              </span>
            </button>
          ))}
        </div>
      </Document>
    </aside>
  )
}
