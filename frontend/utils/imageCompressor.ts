/**
 * Smart two-pass image compressor.
 *
 * Pass 1 : resize to max 1400 px + 85 % quality  → good quality, ~200-600 KB
 * Pass 2 : if blob is still > 500 KB, re-encode at 72 % → stays safe for Vercel
 * Skip   : files already under 300 KB are returned untouched
 */

const SKIP_THRESHOLD   = 300 * 1024;   // 300 KB  – skip compression entirely
const PASS2_THRESHOLD  = 500 * 1024;   // 500 KB  – trigger second pass
const MAX_DIMENSION    = 1400;          // px
const PASS1_QUALITY    = 0.85;
const PASS2_QUALITY    = 0.72;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      type,
      quality,
    );
  });
}

function drawResized(img: HTMLImageElement): HTMLCanvasElement {
  let { naturalWidth: w, naturalHeight: h } = img;
  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    if (w >= h) { h = Math.round((h / w) * MAX_DIMENSION); w = MAX_DIMENSION; }
    else        { w = Math.round((w / h) * MAX_DIMENSION); h = MAX_DIMENSION; }
  }
  const canvas = document.createElement('canvas');
  canvas.width  = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
  return canvas;
}

export async function compressImage(file: File): Promise<File> {
  // Skip non-image files
  if (!file.type.startsWith('image/')) return file;

  // Skip: already small enough
  if (file.size <= SKIP_THRESHOLD) return file;

  // Use jpeg for compression; preserve png only if tiny (already skipped above)
  const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

  const objectUrl = URL.createObjectURL(file);
  try {
    const img    = await loadImage(objectUrl);
    const canvas = drawResized(img);

    // Pass 1
    let blob = await canvasToBlob(canvas, outputType, PASS1_QUALITY);

    // Pass 2 – re-encode the already-resized canvas at lower quality
    if (blob.size > PASS2_THRESHOLD) {
      blob = await canvasToBlob(canvas, outputType, PASS2_QUALITY);
    }

    // Derive a clean filename (swap extension for compressed output)
    const ext      = outputType === 'image/jpeg' ? 'jpg' : 'png';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.${ext}`, { type: outputType, lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Convenience wrapper for compressing an array of files in parallel. */
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImage));
}
