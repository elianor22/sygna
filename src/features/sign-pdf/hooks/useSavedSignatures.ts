import { useState, useEffect } from 'react'

const STORAGE_KEY = 'sygna-saved-signatures'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { items: [], selectedId: null }
    const parsed = JSON.parse(raw)
    return { items: parsed.items ?? [], selectedId: parsed.selectedId ?? null }
  } catch {
    return { items: [], selectedId: null }
  }
}

export function useSavedSignatures() {
  const [state, setState] = useState(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  function addSignature(type, content) {
    const id = `saved-${Date.now()}`
    setState((prev) => ({
      items: [...prev.items, { id, type, content }],
      selectedId: id,
    }))
    return id
  }

  function replaceSignature(id, content) {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((s) => (s.id === id ? { ...s, content } : s)),
    }))
  }

  function removeSignature(id) {
    setState((prev) => ({
      items: prev.items.filter((s) => s.id !== id),
      selectedId: prev.selectedId === id ? null : prev.selectedId,
    }))
  }

  function selectSignature(id) {
    setState((prev) => ({ ...prev, selectedId: id }))
  }

  const selected = state.items.find((s) => s.id === state.selectedId) ?? null

  return {
    items: state.items,
    selectedId: state.selectedId,
    selected,
    addSignature,
    replaceSignature,
    removeSignature,
    selectSignature,
  }
}
