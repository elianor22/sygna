import { PDFDocument } from "pdf-lib";

async function getImageDimensions(arrayBuffer, mimeType) {
  const blob = new Blob([arrayBuffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    return { width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function imageFileToPdf(file) {
  return imageFilesToPdf([file]);
}

export async function imageFilesToPdf(files) {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const isPng = file.type === "image/png";
    const isJpg = file.type === "image/jpeg" || file.type === "image/jpg";
    if (!isPng && !isJpg) {
      throw new Error(`Unsupported image type: ${file.name}. Use PNG or JPEG.`);
    }

    const { width, height } = await getImageDimensions(arrayBuffer, file.type);
    const image = isPng
      ? await pdfDoc.embedPng(arrayBuffer)
      : await pdfDoc.embedJpg(arrayBuffer);

    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
  }

  return pdfDoc.save();
}
