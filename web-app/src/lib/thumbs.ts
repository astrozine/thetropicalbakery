/**
 * Small (480px) copies of the /menu-items photos live in /menu-items/thumbs, always as .jpg.
 * Use them wherever a photo is shown small, such as the gallery strip at the bottom of every page,
 * so visitors don't download a full-size photo for a 280px tile.
 */
export const thumb = (src: string) =>
  src.startsWith('/menu-items/') && !src.startsWith('/menu-items/thumbs/')
    ? '/menu-items/thumbs/' + src.slice('/menu-items/'.length).replace(/\.[a-z]+$/i, '').replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') + '.jpg'
    : src;

/** next/image can only resize files we host or in our Supabase storage; anything else is shown as is. */
// A comma in a file name trips up the local production server and the resizer, so those stay as they are.
export const canOptimize = (src: string) =>
  !src.includes(',') && (src.startsWith('/') || /^https:\/\/[^/]+\.supabase\.co\//.test(src));

/** Widths the Next.js image resizer is allowed to produce (its default device + image sizes). */
export type OptimizedWidth = 256 | 384 | 640 | 750 | 828 | 1080 | 1200 | 1920;

/**
 * A resized, modern-format (WebP) copy of a photo, made on demand by Next.js and cached.
 * Use it for plain <img> tags: a 400px tile downloads ~40 KB instead of the original.
 * Anything Next can't resize (other sites, SVG, GIF) is returned untouched.
 */
export const optimizedSrc = (src: string, width: OptimizedWidth = 750) =>
  canOptimize(src) && !/\.(svg|gif)(\?|$)/i.test(src)
    ? `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`
    : src;
