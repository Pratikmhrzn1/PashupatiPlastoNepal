const MAX_DIMENSION = 1600
const WEBP_QUALITY = 0.85

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Could not read the image."))
    reader.readAsDataURL(blob)
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/**
 * Resizes an image from the device and re-encodes it as WebP so uploads stay
 * small and only raster formats reach the server.
 */
export async function prepareImageForUpload(file: File): Promise<string> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    throw new Error("Choose a PNG, JPEG or WebP image.")
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error("Could not read this image. Try a JPEG, PNG or WebP photo instead.")
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")
  if (!context) {
    bitmap.close()
    throw new Error("Could not process this image.")
  }

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob =
    (await canvasToBlob(canvas, "image/webp", WEBP_QUALITY)) ??
    (await canvasToBlob(canvas, "image/jpeg", 0.9))

  if (!blob) {
    throw new Error("Could not process this image.")
  }

  return blobToDataUrl(blob)
}
