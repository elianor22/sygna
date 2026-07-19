import {
  LayoutTemplate,
  Columns2,
  Columns3,
  Type,
  Image as ImageIcon,
  MousePointerClick,
  Minus,
  MoveVertical,
  Share2,
  PanelTop,
  PanelBottom,
  type LucideIcon,
} from "lucide-react";
import { useEmailStore, type ComponentType, type EmailComponent } from "@/store/useEmailStore";

const TYPE_LABEL: Record<ComponentType, string> = {
  section: "Section",
  grid: "Grid",
  text: "Text",
  image: "Image",
  button: "Button",
  divider: "Divider",
  spacer: "Spacer",
  social: "Social Icons",
};

interface PaletteItem {
  key: string;
  label: string;
  icon: LucideIcon;
  type: ComponentType;
  overrides?: Partial<EmailComponent>;
}

const LAYOUT_ITEMS: PaletteItem[] = [
  { key: "section", label: "Section", icon: LayoutTemplate, type: "section" },
  { key: "grid2", label: "2-Column Grid", icon: Columns2, type: "grid", overrides: { style: { columns: "2" } } },
  { key: "grid3", label: "3-Column Grid", icon: Columns3, type: "grid", overrides: { style: { columns: "3" } } },
];

const CONTENT_ITEMS: PaletteItem[] = [
  { key: "text", label: "Text", icon: Type, type: "text" },
  { key: "image", label: "Image", icon: ImageIcon, type: "image" },
  { key: "button", label: "Button", icon: MousePointerClick, type: "button" },
  { key: "divider", label: "Divider", icon: Minus, type: "divider" },
  { key: "spacer", label: "Spacer", icon: MoveVertical, type: "spacer" },
  { key: "social", label: "Social Icons", icon: Share2, type: "social" },
];

const HEADER_FOOTER_ITEMS: PaletteItem[] = [
  {
    key: "header",
    label: "Header",
    icon: PanelTop,
    type: "text",
    overrides: {
      content: "Your Company Name",
      style: { fontSize: "20px", fontWeight: "700", textAlign: "center" },
    },
  },
  {
    key: "footer",
    label: "Footer",
    icon: PanelBottom,
    type: "text",
    overrides: {
      content: "© 2026 Your Company. Unsubscribe",
      style: { fontSize: "12px", color: "#94A3B8", textAlign: "center" },
    },
  },
];

function PaletteRow({ item }: { item: PaletteItem }) {
  const addComponent = useEmailStore((s) => s.addComponent);
  const Icon = item.icon;

  return (
    <button
      onClick={() => addComponent(item.type, item.overrides)}
      className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-md border border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50/60 transition-colors text-left"
    >
      <span className="flex items-center justify-center w-7 h-7 rounded bg-blue-500 text-white shrink-0">
        <Icon size={14} />
      </span>
      <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
      <span className="text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
        Click to Add
      </span>
    </button>
  );
}

function GroupHeading({ children }: { children: string }) {
  return <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mt-4 mb-2">{children}</h3>;
}

export function ComponentPalette() {
  const activeId = useEmailStore((s) => s.activeId);
  const emailStructure = useEmailStore((s) => s.emailStructure);

  const activeType = findType(emailStructure, activeId);

  return (
    <aside className="w-[340px] shrink-0 border-l border-gray-200 bg-white overflow-y-auto p-4">
      <div className="px-3 py-2.5 rounded-md border border-dashed border-blue-300 bg-blue-50/60 text-sm text-blue-700 font-medium">
        {activeId ? (
          <>
            Active Component: {activeType ? TYPE_LABEL[activeType] : "Unknown"} (id: {activeId})
          </>
        ) : (
          "No component selected — new components add to page root"
        )}
      </div>

      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mt-4">Add Components</h2>

      <GroupHeading>Layouts</GroupHeading>
      <div className="flex flex-col gap-2">
        {LAYOUT_ITEMS.map((item) => (
          <PaletteRow key={item.key} item={item} />
        ))}
      </div>

      <GroupHeading>Content</GroupHeading>
      <div className="flex flex-col gap-2">
        {CONTENT_ITEMS.map((item) => (
          <PaletteRow key={item.key} item={item} />
        ))}
      </div>

      <GroupHeading>Headers/Footers</GroupHeading>
      <div className="flex flex-col gap-2">
        {HEADER_FOOTER_ITEMS.map((item) => (
          <PaletteRow key={item.key} item={item} />
        ))}
      </div>
    </aside>
  );
}

function findType(nodes: EmailComponent[], id: string | null): ComponentType | null {
  if (!id) return null;
  for (const node of nodes) {
    if (node.id === id) return node.type;
    if (node.children) {
      const found = findType(node.children, id);
      if (found) return found;
    }
  }
  return null;
}
