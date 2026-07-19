import { BrowserRouter, Routes, Route } from "react-router-dom";
import PdfEditorPage from "./pages/PdfEditorPage";
import EmailGeneratorPage from "./pages/EmailGeneratorPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PdfEditorPage />} />
        <Route path="/email-generator" element={<EmailGeneratorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
