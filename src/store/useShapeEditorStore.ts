import { create } from 'zustand'

interface ShapeEditorState {
  editingShapeId: string | null
  isSheetOpen: boolean
  openShapeEditor: (id: string) => void
  closeShapeEditor: () => void
}

export const useShapeEditorStore = create<ShapeEditorState>((set) => ({
  editingShapeId: null,
  isSheetOpen: false,
  openShapeEditor: (id) => set({ editingShapeId: id, isSheetOpen: true }),
  closeShapeEditor: () => set({ editingShapeId: null, isSheetOpen: false }),
}))
