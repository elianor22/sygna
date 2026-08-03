import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { useResizeObserver } from '@/hooks/useResizeObserver'
import { SignatureOverlay } from './SignatureOverlay'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

function PdfPage({
  pageNumber,
  containerWidth,
  signatures,
  onUpdateSignature,
  onRemoveSignature,
  onOpenPanel,
  emptyHighlight,
  registerRef,
  onPageReady,
}) {
  const [pageHeight, setPageHeight] = useState(0)

  const onPageLoadSuccess = useCallback((page) => {
    if (containerWidth > 0) {
      const scale = containerWidth / page.originalWidth
      setPageHeight(page.originalHeight * scale)
      onPageReady(pageNumber)
    }
  }, [containerWidth, onPageReady, pageNumber])

  return (
    <div
      ref={(el) => registerRef(pageNumber, el)}
      id={`pdf-page-${pageNumber}`}
      data-page-number={pageNumber}
      className="relative mx-auto"
      style={{ width: containerWidth, height: pageHeight || 'auto', marginBottom: 24 }}
    >
      <Page
        pageNumber={pageNumber}
        width={containerWidth}
        onLoadSuccess={onPageLoadSuccess}
        renderAnnotationLayer={false}
        renderTextLayer={false}
      />
      {pageHeight > 0 && (
        <SignatureOverlay
          signatures={signatures}
          page={pageNumber}
          containerWidth={containerWidth}
          containerHeight={pageHeight}
          onUpdate={onUpdateSignature}
          onRemove={onRemoveSignature}
          onOpen={onOpenPanel}
        />
      )}
      {emptyHighlight && pageHeight > 0 && signatures
        .filter(s => s.page === pageNumber && emptyHighlight.includes(s.id))
        .map(s => (
          <div
            key={s.id}
            className="absolute pointer-events-none animate-pulse"
            style={{
              left: s.xPct * containerWidth,
              top: s.yPct * pageHeight,
              width: s.widthPct * containerWidth,
              height: s.heightPct * pageHeight,
              border: '2px solid var(--color-warning)',
              borderRadius: 6,
            }}
          />
        ))
      }
    </div>
  )
}

export function PdfViewer({
  pdfBytes,
  onTotalPages,
  signatures,
  onUpdateSignature,
  onRemoveSignature,
  onOpenPanel,
  emptyHighlight,
  onActivePageChange,
  scrollRootRef,
  onFullyLoaded,
}) {
  const [containerRef, { width: containerWidth }] = useResizeObserver()
  const [numPages, setNumPages] = useState(0)
  const viewerBytes = useMemo(() => (pdfBytes ? pdfBytes.slice(0) : null), [pdfBytes])
  const readyPagesRef = useRef(new Set())
  const pageElsRef = useRef(new Map())
  const ratiosRef = useRef(new Map())

  const handlePageReady = useCallback((pageNumber) => {
    readyPagesRef.current.add(pageNumber)
    if (numPages > 0 && readyPagesRef.current.size >= numPages) {
      onFullyLoaded?.()
    }
  }, [numPages, onFullyLoaded])

  const registerPageRef = useCallback((pageNumber, el) => {
    if (el) {
      pageElsRef.current.set(pageNumber, el)
    } else {
      pageElsRef.current.delete(pageNumber)
      ratiosRef.current.delete(pageNumber)
    }
  }, [])

  useEffect(() => {
    if (numPages === 0) return
    const elements = Array.from(pageElsRef.current.values())
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNumber = Number((entry.target as HTMLElement).dataset.pageNumber)
          ratiosRef.current.set(pageNumber, entry.intersectionRatio)
        })
        let bestPage = null
        let bestRatio = 0
        ratiosRef.current.forEach((ratio, pageNumber) => {
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestPage = pageNumber
          }
        })
        if (bestPage !== null && bestRatio > 0.1) {
          onActivePageChange(bestPage)
        }
      },
      { root: scrollRootRef?.current ?? null, threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [numPages, containerWidth, scrollRootRef, onActivePageChange])

  return (
    <div ref={containerRef} className="relative w-full" style={{ minHeight: 200 }}>
      {containerWidth > 0 && (
        <Document
          file={viewerBytes}
          onLoadSuccess={({ numPages }) => {
            readyPagesRef.current = new Set()
            pageElsRef.current = new Map()
            ratiosRef.current = new Map()
            setNumPages(numPages)
            onTotalPages(numPages)
          }}
          className="flex flex-col items-center"
        >
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => (
            <PdfPage
              key={pageNumber}
              pageNumber={pageNumber}
              containerWidth={containerWidth}
              signatures={signatures}
              onUpdateSignature={onUpdateSignature}
              onRemoveSignature={onRemoveSignature}
              onOpenPanel={onOpenPanel}
              emptyHighlight={emptyHighlight}
              registerRef={registerPageRef}
              onPageReady={handlePageReady}
            />
          ))}
        </Document>
      )}
    </div>
  )
}
