import { PDFDocument } from 'pdf-lib'

export function logSignaturePlacement(sig, pageW, pageH, rotation) {
  console.log('[Sygna placement debug]', {
    id: sig.id,
    page: sig.page,
    xPct: sig.xPct,
    yPct: sig.yPct,
    widthPct: sig.widthPct,
    heightPct: sig.heightPct,
    pageW,
    pageH,
    rotation,
    computed: {
      x: sig.xPct * pageW,
      y: pageH - sig.yPct * pageH - sig.heightPct * pageH,
      w: sig.widthPct * pageW,
      h: sig.heightPct * pageH,
    },
  })
}

export async function exportSignedPdf(pdfBytes, signatures) {
  const pdfDoc = await PDFDocument.load(pdfBytes)

  for (const sig of signatures) {
    if (!sig.content) continue

    const page = pdfDoc.getPage(sig.page - 1)

    // Use CropBox if different from MediaBox
    const cropBox = page.getCropBox()
    const mediaBox = page.getMediaBox()
    const refBox = (
      cropBox.width !== mediaBox.width || cropBox.height !== mediaBox.height
    ) ? cropBox : page.getSize()

    const pageW = refBox.width
    const pageH = refBox.height
    const rotation = page.getRotation().angle

    logSignaturePlacement(sig, pageW, pageH, rotation)

    const pngImage = await pdfDoc.embedPng(sig.content)

    let x, y, w, h

    w = sig.widthPct * pageW
    h = sig.heightPct * pageH
    x = sig.xPct * pageW
    // Flip Y: screen top-left → pdf bottom-left
    y = pageH - sig.yPct * pageH - h

    // Adjust for page rotation
    if (rotation === 90) {
      ;[x, y] = [y, pageW - x - w]
      ;[w, h] = [h, w]
    } else if (rotation === 180) {
      x = pageW - x - w
      y = pageH - y - h
    } else if (rotation === 270) {
      ;[x, y] = [pageH - y - h, x]
      ;[w, h] = [h, w]
    }

    page.drawImage(pngImage, { x, y, width: w, height: h })
  }

  return pdfDoc.save()
}
