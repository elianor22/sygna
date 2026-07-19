import { useState } from 'react'
import { Trash2, Plus, RefreshCw, Check, X } from 'lucide-react'
import { DrawTab } from './DrawTab'
import { UploadTab } from './UploadTab'
import { TypeTab } from './TypeTab'

const TABS = ['Draw', 'Upload', 'Type']
const TYPE_LABEL = { Draw: 'draw', Upload: 'image', Type: 'typed' }

export function SignatureConfigPanel({ items, selectedId, onAdd, onReplace, onRemove, onSelect, open, onClose }) {
  const [activeTab, setActiveTab] = useState('Draw')
  const [formOpen, setFormOpen] = useState(false)
  const [replaceId, setReplaceId] = useState(null)

  function openAddForm() {
    setReplaceId(null)
    setFormOpen(true)
  }

  function openReplaceForm(id) {
    setReplaceId(id)
    setFormOpen(true)
  }

  function handleSaved(dataUrl) {
    if (replaceId) {
      onReplace(replaceId, dataUrl)
    } else {
      onAdd(TYPE_LABEL[activeTab], dataUrl)
    }
    setFormOpen(false)
    setReplaceId(null)
  }

  const content = (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)', margin: 0 }}>
          Signatures
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={openAddForm}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            <Plus size={13} /> Add
          </button>
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-1" style={{ color: 'var(--color-text-secondary)' }}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {items.length === 0 && !formOpen && (
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          No saved signatures yet. Add one — it'll be reusable across placeholders.
        </p>
      )}

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((sig) => {
            const isSelected = sig.id === selectedId
            return (
              <div
                key={sig.id}
                className="rounded border p-2 flex flex-col gap-2"
                style={{
                  borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                  background: '#fff',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide" style={{ color: '#3D4451' }}>
                    {sig.type}
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-accent)' }}>
                      <Check size={12} /> default
                    </span>
                  )}
                </div>
                <img src={sig.content} alt={`${sig.type} signature`} className="w-full h-16 object-contain" />
                <div className="flex gap-1">
                  <button
                    onClick={() => onSelect(sig.id)}
                    disabled={isSelected}
                    className="flex-1 px-2 py-1 rounded text-xs border disabled:opacity-40"
                    style={{ borderColor: '#DDE1E6', color: '#1B2A4A', background: '#fff' }}
                  >
                    Use
                  </button>
                  <button
                    onClick={() => openReplaceForm(sig.id)}
                    className="p-1.5 rounded border"
                    style={{ borderColor: '#DDE1E6', color: '#3D4451', background: '#fff' }}
                    title="Replace"
                  >
                    <RefreshCw size={13} />
                  </button>
                  <button
                    onClick={() => onRemove(sig.id)}
                    className="p-1.5 rounded border"
                    style={{ borderColor: '#DDE1E6', color: '#3D4451', background: '#fff' }}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {formOpen && (
        <div className="flex flex-col gap-3 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {replaceId ? 'Replace signature' : 'New signature'}
          </span>
          <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 text-xs font-medium border-b-2 transition-colors"
                style={{
                  borderColor: activeTab === tab ? 'var(--color-accent)' : 'transparent',
                  color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  background: 'transparent',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeTab === 'Draw' && <DrawTab onSave={handleSaved} />}
          {activeTab === 'Upload' && <UploadTab onSave={handleSaved} />}
          {activeTab === 'Type' && <TypeTab onSave={handleSaved} />}
          <button
            onClick={() => { setFormOpen(false); setReplaceId(null) }}
            className="text-xs self-end"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Cancel
          </button>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Desktop static sidebar */}
      <aside
        className="hidden lg:flex flex-col w-72 shrink-0 border-l overflow-y-auto p-4 gap-4"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        {content}
      </aside>

      {/* Mobile bottom-sheet */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
          <div
            className="fixed z-50 lg:hidden bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-xl p-4 flex flex-col gap-4 shadow-2xl"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            {content}
          </div>
        </>
      )}
    </>
  )
}
