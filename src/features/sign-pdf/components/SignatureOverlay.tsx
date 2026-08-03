import { SignatureBox } from './SignatureBox'

export function SignatureOverlay({ signatures, page, containerWidth, containerHeight, onUpdate, onRemove, onOpen }) {
  const pageSigs = signatures.filter(s => s.page === page)

  return (
    <div
      className="absolute inset-0"
      style={{ pointerEvents: 'none' }}
    >
      <div className="relative w-full h-full" style={{ pointerEvents: 'all' }}>
        {pageSigs.map(sig => (
          <SignatureBox
            key={sig.id}
            sig={sig}
            containerWidth={containerWidth}
            containerHeight={containerHeight}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  )
}
