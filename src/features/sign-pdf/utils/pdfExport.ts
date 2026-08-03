import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '')
  if (!m) return rgb(0.29, 0.35, 0.68)
  return rgb(parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255)
}

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
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  for (const sig of signatures) {
    if (!sig.content && sig.type !== 'shape') continue

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

    if (sig.type === 'shape') {
      const borderColor = hexToRgb(sig.borderColor || '#4A5AAD')
      const hasFill = sig.bgColor && sig.bgColor !== 'transparent'
      const shapeOpts = {
        borderColor,
        borderWidth: 2,
        borderOpacity: sig.borderAlpha ?? 1,
        ...(hasFill ? { color: hexToRgb(sig.bgColor), opacity: sig.bgAlpha ?? 1 } : {}),
      }
      if (sig.shape === 'circle') {
        page.drawEllipse({
          x: x + w / 2,
          y: y + h / 2,
          xScale: w / 2,
          yScale: h / 2,
          ...shapeOpts,
        })
      } else {
        page.drawRectangle({ x, y, width: w, height: h, ...shapeOpts })
      }
      continue
    }

    if (sig.type === 'text') {
      const fontSize = 14
      const lines = sig.content.split('\n')
      const lineHeight = fontSize * 1.2
      let lineY = y + h - fontSize
      for (const line of lines) {
        if (lineY < y) break
        page.drawText(line, {
          x: x + 4,
          y: lineY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
          maxWidth: w - 8,
        })
        lineY -= lineHeight
      }
      continue
    }

    const pngImage = await pdfDoc.embedPng(sig.content)
    page.drawImage(pngImage, { x, y, width: w, height: h })
  }

  return pdfDoc.save()
}
