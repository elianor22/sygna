import { BuilderTopBar } from "../components/BuilderTopBar";
import { PreviewCanvas } from "../components/PreviewCanvas";
import { ComponentPalette } from "../components/ComponentPalette";

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
