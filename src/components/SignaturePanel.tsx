import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { DrawTab } from './DrawTab'
import { UploadTab } from './UploadTab'
import { TypeTab } from './TypeTab'

const TABS = ['Draw', 'Upload', 'Type']
const TYPE_LABEL = { Draw: 'draw', Upload: 'image', Type: 'typed' }

export function SignaturePanel({ sigId, onSave, onClose, savedSignatures }) {
  const [activeTab, setActiveTab] = useState('Draw')
  const [showCreate, setShowCreate] = useState(false)

  const savedForTab = savedSignatures
    ? savedSignatures.items.filter((s) => s.type === TYPE_LABEL[activeTab])
    : []

  function handleUseSaved(sig) {
    onSave(sigId, sig.content)
    savedSignatures?.selectSignature(sig.id)
    onClose()
  }

  function handleSave(dataUrl) {
    savedSignatures?.addSignature(TYPE_LABEL[activeTab], dataUrl)
    onSave(sigId, dataUrl)
    onClose()
  }

  function handleTabChange(tab) {
    setActiveTab(tab)
    setShowCreate(false)
  }

  const hasSaved = savedForTab.length > 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />
      {/* Panel — bottom sheet on mobile, centered modal on desktop */}
      <div
        className="fixed z-50 shadow-2xl
          bottom-0 left-0 right-0 rounded-t-xl
          md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:w-[480px]"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-medium text-base" style={{ color: 'var(--color-text-primary)', margin: 0 }}>
            Add Signature
          </h2>
          <button onClick={onClose} style={{ color: 'var(--color-text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className="flex-1 py-3 text-sm font-medium border-b-2 transition-colors"
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

        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {hasSaved && !showCreate && (
            <div className="grid grid-cols-3 gap-3">
              {savedForTab.map((sig) => (
                <button
                  key={sig.id}
                  onClick={() => handleUseSaved(sig)}
                  className="rounded border p-1 flex items-center justify-center"
                  style={{ borderColor: 'var(--color-border)', background: '#fff', height: 72 }}
                >
                  <img src={sig.content} alt={`${sig.type} signature`} className="max-w-full max-h-full object-contain" />
                </button>
              ))}
              <button
                onClick={() => setShowCreate(true)}
                className="rounded border-2 border-dashed flex items-center justify-center"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', height: 72 }}
              >
                <Plus size={20} />
              </button>
            </div>
          )}

          {(!hasSaved || showCreate) && (
            <>
              {hasSaved && (
                <button
                  onClick={() => setShowCreate(false)}
                  className="text-xs mb-3"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  ← Back to saved signatures
                </button>
              )}
              {activeTab === 'Draw' && <DrawTab onSave={handleSave} />}
              {activeTab === 'Upload' && <UploadTab onSave={handleSave} />}
              {activeTab === 'Type' && <TypeTab onSave={handleSave} />}
            </>
          )}
        </div>
      </div>
    </>
  )
}
