import { BuilderTopBar } from "@/components/email-builder/BuilderTopBar";
import { PreviewCanvas } from "@/components/email-builder/PreviewCanvas";
import { ComponentPalette } from "@/components/email-builder/ComponentPalette";

export default function EmailGeneratorPage() {
  return (
    <div className="flex flex-col h-screen">
      <BuilderTopBar />
      <div className="flex-1 flex overflow-hidden">
        <PreviewCanvas />
        <ComponentPalette />
      </div>
    </div>
  );
}
