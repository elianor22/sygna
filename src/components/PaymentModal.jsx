import { useState } from 'react'
import { X, CreditCard, Wallet, Landmark, Lock, Loader2 } from 'lucide-react'

const METHODS = [
  { id: 'card', label: 'Credit Card', icon: CreditCard },
  { id: 'paypal', label: 'PayPal', icon: Wallet },
  { id: 'bank', label: 'Bank Transfer', icon: Landmark },
]

export function PaymentModal({ onConfirm, onClose, processing }) {
  const [method, setMethod] = useState('card')

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={processing ? undefined : onClose} />
      <div
        className="fixed z-50 shadow-2xl
          bottom-0 left-0 right-0 rounded-t-xl
          md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:w-[420px]"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-medium text-base" style={{ color: 'var(--color-text-primary)', margin: 0 }}>
            Unlock PDF Export
          </h2>
          {!processing && (
            <button onClick={onClose} style={{ color: 'var(--color-text-secondary)' }}>
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div
            className="flex items-center justify-between rounded p-3"
            style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
          >
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Signed PDF Export (Pro)
            </span>
            <span className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              $11.99
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
              Payment method
            </span>
            <div className="flex gap-2">
              {METHODS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMethod(id)}
                  disabled={processing}
                  className="flex-1 flex flex-col items-center gap-1 py-2 rounded border text-xs transition-colors disabled:opacity-50"
                  style={{
                    borderColor: method === id ? 'var(--color-accent)' : 'var(--color-border)',
                    color: method === id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    background: 'transparent',
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {method === 'card' && (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Card number"
                disabled={processing}
                className="w-full px-3 py-2 rounded border text-sm outline-none"
                style={{ background: '#fff', border: '1px solid #DDE1E6', color: '#1B2A4A' }}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="MM/YY"
                  disabled={processing}
                  className="w-1/2 px-3 py-2 rounded border text-sm outline-none"
                  style={{ background: '#fff', border: '1px solid #DDE1E6', color: '#1B2A4A' }}
                />
                <input
                  type="text"
                  placeholder="CVC"
                  disabled={processing}
                  className="w-1/2 px-3 py-2 rounded border text-sm outline-none"
                  style={{ background: '#fff', border: '1px solid #DDE1E6', color: '#1B2A4A' }}
                />
              </div>
            </div>
          )}

          {method === 'paypal' && (
            <input
              type="email"
              placeholder="PayPal email"
              disabled={processing}
              className="w-full px-3 py-2 rounded border text-sm outline-none"
              style={{ background: '#fff', border: '1px solid #DDE1E6', color: '#1B2A4A' }}
            />
          )}

          {method === 'bank' && (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Transfer to VA number 8801 2345 6789 0000, then confirm below.
            </p>
          )}

          <button
            onClick={onConfirm}
            disabled={processing}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded text-sm font-medium disabled:opacity-70"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            {processing ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Verifying payment…
              </>
            ) : (
              <>
                <Lock size={14} /> Download Now
              </>
            )}
          </button>

          <p className="text-[11px] text-center" style={{ color: 'var(--color-text-secondary)' }}>
            🔒 Secured checkout — totally not a prank.
          </p>
        </div>
      </div>
    </>
  )
}
