export function removeWhiteBackground(imageDataUrl, threshold = 240) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2]
        if (r > threshold && g > threshold && b > threshold) {
          data[i + 3] = 0
        }
      }
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = imageDataUrl
  })
}

export function textToSignatureImage(text, font = 'Caveat') {
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 120
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = `60px "${font}"`
  ctx.fillStyle = '#1B2A4A'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 20, canvas.height / 2)
  return canvas.toDataURL('image/png')
}
