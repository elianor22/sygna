import { type MouseEvent } from "react";
import { clsx } from "clsx";
import { ImageIcon, Share2, Trash2 } from "lucide-react";
import { useEmailStore, type EmailComponent } from "@/store/useEmailStore";

const TYPE_LABEL: Record<EmailComponent["type"], string> = {
  section: "Section",
  grid: "Grid",
  text: "Text",
  image: "Image",
  button: "Button",
  divider: "Divider",
  spacer: "Spacer",
  social: "Social Icons",
};

interface ComponentRendererProps {
  component: EmailComponent;
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div
      className="flex items-center justify-center rounded border border-dashed text-xs h-20"
      style={{ borderColor: "#93C5FD", color: "#64748B", background: "rgba(59,130,246,0.04)" }}
    >
      {label}
    </div>
  );
}

export function ComponentRenderer({ component }: ComponentRendererProps) {
  const activeId = useEmailStore((s) => s.activeId);
  const setActiveId = useEmailStore((s) => s.setActiveId);
  const removeComponent = useEmailStore((s) => s.removeComponent);
  const updateComponentContent = useEmailStore((s) => s.updateComponentContent);

  const isActive = component.id === activeId;

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    setActiveId(component.id);
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    removeComponent(component.id);
  }

  const wrapperClassName = clsx(
    "relative transition-all duration-150 cursor-pointer rounded-md",
    component.type === "divider" ? "my-1 p-1" : "p-4 my-2",
    isActive
      ? "border-2 border-dashed border-blue-500 bg-blue-50/40 ring-4 ring-blue-500/10 shadow-sm"
      : "border border-dashed border-transparent hover:border-gray-300"
  );

  return (
    <div className={wrapperClassName} onClick={handleClick}>
      {isActive && (
        <>
          <span className="absolute -top-2.5 left-2 px-2 py-0.5 rounded text-[11px] font-medium text-white bg-blue-500 z-10">
            {component.style?.label || TYPE_LABEL[component.type]}
          </span>
          <button
            onClick={handleDelete}
            className="absolute -top-2.5 right-2 p-1 rounded bg-red-500 text-white z-10 hover:bg-red-600"
            title="Remove component"
          >
            <Trash2 size={12} />
          </button>
        </>
      )}

      {component.type === "section" && (
        <SectionBody component={component} />
      )}

      {component.type === "grid" && <GridBody component={component} />}

      {component.type === "text" && (
        <p
          suppressContentEditableWarning
          contentEditable
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => updateComponentContent(component.id, e.currentTarget.textContent || "")}
          className="outline-none"
          style={{
            fontSize: component.style?.fontSize || "14px",
            fontWeight: component.style?.fontWeight || "400",
            textAlign: (component.style?.textAlign as React.CSSProperties["textAlign"]) || "left",
            color: component.style?.color || "#1B2A4A",
            margin: 0,
          }}
        >
          {component.content}
        </p>
      )}

      {component.type === "image" &&
        (component.src ? (
          <img src={component.src} alt={component.content || "Email image"} className="w-full rounded-md block" />
        ) : (
          <div className="w-full h-40 rounded-md flex items-center justify-center bg-gray-100 border border-gray-200">
            <ImageIcon size={28} className="text-gray-400" />
          </div>
        ))}

      {component.type === "button" && (
        <span
          suppressContentEditableWarning
          contentEditable
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => updateComponentContent(component.id, e.currentTarget.textContent || "")}
          className="inline-block px-5 py-2.5 rounded-md text-sm font-medium text-white outline-none"
          style={{ background: "#2563EB" }}
        >
          {component.content}
        </span>
      )}

      {component.type === "divider" && <hr className="border-gray-200" />}

      {component.type === "spacer" && (
        <div
          className="w-full flex items-center justify-center rounded border border-dashed border-gray-200 text-[11px] text-gray-400"
          style={{ height: component.style?.height || "24px" }}
        >
          Spacer
        </div>
      )}

      {component.type === "social" && (
        <div className="flex items-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 border border-gray-200">
              <Share2 size={14} className="text-gray-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionBody({ component }: { component: EmailComponent }) {
  const children = component.children || [];

  if (children.length === 0) {
    return <EmptySlot label="Section is empty — select it, then add a component" />;
  }

  if (component.style?.layout === "split") {
    const images = children.filter((c) => c.type === "image");
    const rest = children.filter((c) => c.type !== "image");
    if (images.length > 0 && rest.length > 0) {
      return (
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1 min-w-0">
            {rest.map((child) => (
              <ComponentRenderer key={child.id} component={child} />
            ))}
          </div>
          <div className="w-full sm:w-40 shrink-0">
            {images.map((child) => (
              <ComponentRenderer key={child.id} component={child} />
            ))}
          </div>
        </div>
      );
    }
  }

  return (
    <div>
      {children.map((child) => (
        <ComponentRenderer key={child.id} component={child} />
      ))}
    </div>
  );
}

function GridBody({ component }: { component: EmailComponent }) {
  const columns = Number(component.style?.columns || 2);
  const children = component.children || [];

  if (children.length === 0) {
    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <EmptySlot key={i} label="Empty column" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {children.map((child) => (
        <ComponentRenderer key={child.id} component={child} />
      ))}
    </div>
  );
}
