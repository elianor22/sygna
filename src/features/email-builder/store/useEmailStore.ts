import { create } from "zustand";
import heroImg from "@/assets/hero.png";

export type ComponentType =
  | "section"
  | "grid"
  | "text"
  | "image"
  | "button"
  | "divider"
  | "spacer"
  | "social";

export interface EmailComponent {
  id: string;
  type: ComponentType;
  content?: string;
  src?: string;
  children?: EmailComponent[];
  style?: Record<string, string>;
}

interface EmailState {
  emailStructure: EmailComponent[];
  activeId: string | null;
  past: EmailComponent[][];
  future: EmailComponent[][];
  setActiveId: (id: string | null) => void;
  addComponent: (type: ComponentType, overrides?: Partial<EmailComponent>) => void;
  removeComponent: (id: string) => void;
  updateComponentContent: (id: string, content: string) => void;
  updateComponentStyle: (id: string, style: Record<string, string>) => void;
  undo: () => void;
  redo: () => void;
  loadStructure: (structure: EmailComponent[]) => void;
}

function isContainer(type: ComponentType) {
  return type === "section" || type === "grid";
}

function generateId(type: ComponentType) {
  return `${type}-${Math.random().toString(36).substring(2, 9)}`;
}

const INITIAL_STRUCTURE: EmailComponent[] = [
  {
    id: "text-welcome",
    type: "text",
    content: "Welcome to our Newsletter",
    style: { fontSize: "28px", fontWeight: "700" },
  },
  {
    id: "image-banner",
    type: "image",
    src: heroImg,
    content: "Banner",
  },
  {
    id: "section-8a2f1b",
    type: "section",
    style: { layout: "split", label: "Featured Section" },
    children: [
      {
        id: "text-4c9d2e",
        type: "text",
        content: "Unlock Exclusive Offers",
        style: { fontSize: "22px", fontWeight: "700" },
      },
      {
        id: "text-desc",
        type: "text",
        content: "Lorem ipsum dolor sit amet, description, adipiscing elit and your favorite emiation.",
      },
      { id: "image-placeholder", type: "image", src: "" },
    ],
  },
  {
    id: "button-3f1a7c",
    type: "button",
    content: "Click Here!",
  },
];

function insertRecursively(
  nodes: EmailComponent[],
  activeId: string,
  newComponent: EmailComponent,
  ref: { inserted: boolean }
): EmailComponent[] {
  return nodes.map((node) => {
    if (node.id === activeId && isContainer(node.type)) {
      ref.inserted = true;
      return { ...node, children: [...(node.children || []), newComponent] };
    }
    if (node.children) {
      return { ...node, children: insertRecursively(node.children, activeId, newComponent, ref) };
    }
    return node;
  });
}

function filterRecursively(nodes: EmailComponent[], id: string): EmailComponent[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => (node.children ? { ...node, children: filterRecursively(node.children, id) } : node));
}

function updateRecursively(
  nodes: EmailComponent[],
  id: string,
  patch: Partial<EmailComponent>
): EmailComponent[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, ...patch };
    }
    if (node.children) {
      return { ...node, children: updateRecursively(node.children, id, patch) };
    }
    return node;
  });
}

const HISTORY_LIMIT = 50;

export const useEmailStore = create<EmailState>((set) => ({
  emailStructure: INITIAL_STRUCTURE,
  activeId: "section-8a2f1b",
  past: [],
  future: [],

  setActiveId: (id) => set({ activeId: id }),

  addComponent: (type, overrides) =>
    set((state) => {
      const newComponent: EmailComponent = {
        id: generateId(type),
        type,
        ...(isContainer(type) ? { children: [] } : {}),
        ...(type === "text" ? { content: "Teks Baru..." } : {}),
        ...(type === "button" ? { content: "Click Me" } : {}),
        ...(type === "spacer" ? { style: { height: "24px" } } : {}),
        ...overrides,
      };

      let updatedStructure = state.emailStructure;
      if (state.activeId) {
        const ref = { inserted: false };
        const result = insertRecursively(state.emailStructure, state.activeId, newComponent, ref);
        updatedStructure = ref.inserted ? result : [...state.emailStructure, newComponent];
      } else {
        updatedStructure = [...state.emailStructure, newComponent];
      }

      return {
        emailStructure: updatedStructure,
        past: [...state.past, state.emailStructure].slice(-HISTORY_LIMIT),
        future: [],
      };
    }),

  removeComponent: (id) =>
    set((state) => ({
      emailStructure: filterRecursively(state.emailStructure, id),
      activeId: state.activeId === id ? null : state.activeId,
      past: [...state.past, state.emailStructure].slice(-HISTORY_LIMIT),
      future: [],
    })),

  updateComponentContent: (id, content) =>
    set((state) => ({
      emailStructure: updateRecursively(state.emailStructure, id, { content }),
      past: [...state.past, state.emailStructure].slice(-HISTORY_LIMIT),
      future: [],
    })),

  updateComponentStyle: (id, style) =>
    set((state) => {
      const applyStyle = (nodes: EmailComponent[]): EmailComponent[] =>
        nodes.map((node) => {
          if (node.id === id) {
            return { ...node, style: { ...node.style, ...style } };
          }
          if (node.children) {
            return { ...node, children: applyStyle(node.children) };
          }
          return node;
        });
      return {
        emailStructure: applyStyle(state.emailStructure),
        past: [...state.past, state.emailStructure].slice(-HISTORY_LIMIT),
        future: [],
      };
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        emailStructure: previous,
        past: state.past.slice(0, -1),
        future: [state.emailStructure, ...state.future],
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        emailStructure: next,
        past: [...state.past, state.emailStructure],
        future: state.future.slice(1),
      };
    }),

  loadStructure: (structure) => set({ emailStructure: structure, activeId: null, past: [], future: [] }),
}));
