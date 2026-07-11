import { useState } from 'react'
import { Download } from 'lucide-react'
import { exportSignedPdf } from '../utils/pdfExport'
import { PaymentModal } from './PaymentModal'

export function ExportButton({ pdfBytes, signatures, onHighlightEmpty, fileName }) {
  const [showPayment, setShowPayment] = useState(false)
  const [processing, setProcessing] = useState(false)

  function handleClick() {
    const empty = signatures.filter(s => s.type !== 'shape' && !s.content)
    if (empty.length > 0) {
      onHighlightEmpty(empty.map(s => s.id))
      return
    }
    setShowPayment(true)
  }

  async function handleConfirmPayment() {
    setProcessing(true)
    try {
      const bytes = await exportSignedPdf(pdfBytes, signatures)
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `signed-${fileName || 'document.pdf'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setProcessing(false)
      setShowPayment(false)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={signatures.length === 0}
        className="flex items-center gap-2 px-5 py-2 rounded font-medium text-sm disabled:opacity-40 transition-opacity"
        style={{ background: 'var(--color-accent)', color: '#fff' }}
      >
        <Download size={16} />
        Download Signed PDF
      </button>

      {showPayment && (
        <PaymentModal
          processing={processing}
          onConfirm={handleConfirmPayment}
          onClose={() => setShowPayment(false)}
        />
      )}
    </>
  )
}
