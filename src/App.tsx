import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SignPdfPage from "./pages/SignPdfPage";
import ImageToPdfPage from "./pages/ImageToPdfPage";
import EmailGeneratorPage from "./pages/EmailGeneratorPage";
import MdViewerPage from "./pages/MdViewerPage";
import FlowchartPage from "./pages/FlowchartPage";

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
