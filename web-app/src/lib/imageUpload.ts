import { supabase } from '@/lib/supabase';

/** Longest side, in pixels, of what we keep. Enough for a full-width photo on a phone or a laptop. */
export const PHOTO_MAX_SIDE = 1400;
/** Logos, avatars and other small marks never show bigger than this. */
export const LOGO_MAX_SIDE = 600;

const WEB_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EXT: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));

/** Does this drawing have any see-through pixel? (a PNG logo on a transparent background) */
function hasTransparency(canvas: HTMLCanvasElement): boolean {
  const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
  return false;
}

/**
 * Shrinks a phone photo (often 4–8 MB) to something a web page should load, keeping it sharp.
 * WebP when the browser can write it (about a third smaller than JPEG, and it keeps transparency);
 * otherwise JPEG, or PNG when the image is see-through, so a logo never gets a black background.
 */
export async function resizeImage(file: File, maxSide = PHOTO_MAX_SIDE, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // A browser that cannot write WebP quietly hands back a PNG instead, so check what we got.
  const webp = await toBlob(canvas, 'image/webp', quality);
  if (webp?.type === 'image/webp') return webp;
  const fallback = await toBlob(canvas, hasTransparency(canvas) ? 'image/png' : 'image/jpeg', quality);
  if (!fallback) throw new Error('Não foi possível processar a imagem');
  return fallback;
}

/**
 * Resizes, uploads to the public "uploads" bucket and returns the public URL.
 * `maxSide` defaults to a full-width photo; pass LOGO_MAX_SIDE for logos and small marks.
 */
export async function uploadPublicImage(file: File, folder: string, maxSide = PHOTO_MAX_SIDE): Promise<string> {
  let body: Blob = file;
  try {
    const small = await resizeImage(file, maxSide);
    // An already-light web image can come out bigger after re-encoding: then keep the original.
    if (small.size < file.size || !WEB_TYPES.includes(file.type)) body = small;
  } catch {
    // Fall back to the original file (e.g. a format the browser can't decode).
  }
  const ext = EXT[body.type] || file.name.split('.').pop() || 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('uploads').upload(path, body, { contentType: body.type || undefined });
  if (error) throw error;
  return supabase.storage.from('uploads').getPublicUrl(path).data.publicUrl;
}
