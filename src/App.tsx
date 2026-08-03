import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import { SignPdfPage } from "@/features/sign-pdf";
import { ImageToPdfPage } from "@/features/image-to-pdf";
import { EmailGeneratorPage } from "@/features/email-builder";
import { MdViewerPage } from "@/features/md-viewer";
import { FlowchartPage } from "@/features/flowchart";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sign-pdf" element={<SignPdfPage />} />
        <Route path="/image-to-pdf" element={<ImageToPdfPage />} />
        <Route path="/email-generator" element={<EmailGeneratorPage />} />
        <Route path="/md-viewer" element={<MdViewerPage />} />
        <Route path="/flowchart" element={<FlowchartPage />} />
      </Routes>
    </BrowserRouter>
  );
}
