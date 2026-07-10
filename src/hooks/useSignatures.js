import { useReducer } from 'react'

function sigReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [...state, action.payload]
    case 'UPDATE':
      return state.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s)
    case 'REMOVE':
      return state.filter(s => s.id !== action.id)
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export function useSignatures() {
  const [signatures, dispatch] = useReducer(sigReducer, [])

  function addSignature(page) {
    const id = `sig-${Date.now()}`
    dispatch({
      type: 'ADD',
      payload: {
        id,
        page,
        xPct: 0.35,
        yPct: 0.45,
        widthPct: 0.25,
        heightPct: 0.07,
        type: 'placeholder',
        content: null,
      },
    })
    return id
  }

  function updateSignature(id, changes) {
    dispatch({ type: 'UPDATE', payload: { id, ...changes } })
  }

  function removeSignature(id) {
    dispatch({ type: 'REMOVE', id })
  }

  function clearSignatures() {
    dispatch({ type: 'CLEAR' })
  }

  return { signatures, addSignature, updateSignature, removeSignature, clearSignatures }
}
