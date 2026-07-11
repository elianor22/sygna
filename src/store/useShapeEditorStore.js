import { create } from 'zustand'

export const useShapeEditorStore = create((set) => ({
  editingShapeId: null,
  isSheetOpen: false,
  openShapeEditor: (id) => set({ editingShapeId: id, isSheetOpen: true }),
  closeShapeEditor: () => set({ editingShapeId: null, isSheetOpen: false }),
}))
