import { supabase } from '@/lib/supabase';

/** Shrinks a phone photo (often 4–8 MB) to something a web page should load, keeping it sharp. */
export async function resizeImage(file: File, maxSide = 1400, quality = 0.86): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Não foi possível processar a imagem'))), 'image/jpeg', quality),
  );
}

/** Resizes, uploads to the public "uploads" bucket and returns the public URL. */
export async function uploadPublicImage(file: File, folder: string): Promise<string> {
  let body: Blob = file;
  let ext = file.name.split('.').pop() || 'jpg';
  try {
    body = await resizeImage(file);
    ext = 'jpg';
  } catch {
    // Fall back to the original file (e.g. a format the browser can't decode).
  }
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('uploads').upload(path, body, { contentType: ext === 'jpg' ? 'image/jpeg' : undefined });
  if (error) throw error;
  return supabase.storage.from('uploads').getPublicUrl(path).data.publicUrl;
}
