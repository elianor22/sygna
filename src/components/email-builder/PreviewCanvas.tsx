import { ArrowLeft, ArrowRight, RefreshCw, MoreVertical, X, Plus } from "lucide-react";
import { useEmailStore } from "@/store/useEmailStore";
import { ComponentRenderer } from "./ComponentRenderer";

export function PreviewCanvas() {
  const emailStructure = useEmailStore((s) => s.emailStructure);
  const setActiveId = useEmailStore((s) => s.setActiveId);

  return (
    <div className="flex-1 overflow-auto p-6" style={{ background: "#EEF1F5" }}>
      <div className="max-w-3xl mx-auto rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white">
        <div className="flex items-center gap-2 px-3 pt-3 pb-2 bg-gray-100 border-b border-gray-200">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
          <div className="ml-3 flex items-center gap-2 px-3 py-1.5 rounded-t-md bg-white border border-b-0 border-gray-200 text-xs text-gray-600">
            Email preview
            <X size={12} className="text-gray-400" />
          </div>
          <Plus size={14} className="text-gray-400" />
        </div>
        <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200 text-gray-400">
          <ArrowLeft size={15} />
          <ArrowRight size={15} />
          <RefreshCw size={13} />
          <div className="flex-1 rounded-full bg-white border border-gray-200 h-6" />
          <MoreVertical size={15} />
        </div>

        <div className="bg-white p-6 min-h-[500px]" onClick={() => setActiveId(null)}>
          {emailStructure.map((component) => (
            <ComponentRenderer key={component.id} component={component} />
          ))}
        </div>
      </div>
    </div>
  );
}
