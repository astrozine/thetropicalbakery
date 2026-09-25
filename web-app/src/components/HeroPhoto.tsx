'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface Props {
  src: string;
  alt: string;
  /** What share of the screen this photo really fills, so the browser downloads the right size. */
  sizes: string;
  /** Above-the-fold photos: start downloading before the page is even drawn. */
  preload?: boolean;
  /** The box the photo lives in: size, radius, border, shadow, rotation. */
  style?: React.CSSProperties;
  /**
   * Fade in the whole box (frame, border and shadow included) instead of only the photo.
   * For photos with a visible frame, otherwise an empty white outline shows while they load.
   */
  fadeFrame?: boolean;
  /** Painted behind the photo until it arrives. Should be close to the photo's own tone. */
  placeholder?: string;
}

/**
 * A photo that never pops in half-drawn:
 *  - it is served resized and in a modern format (a 2.8 MB phone JPEG becomes ~60 KB),
 *  - the important ones are preloaded,
 *  - and it fades in once fully decoded, over a colour that matches it, rather than
 *    painting top-to-bottom or showing an empty frame.
 */
export default function HeroPhoto({ src, alt, sizes, preload, style, fadeFrame, placeholder = '#2a1d16' }: Props) {
  const [ready, setReady] = useState(false);

  // If a browser never reports the load (rare), show the box anyway rather than leave it blank.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const remote = /^https?:\/\//.test(src);

  return (
    <div
      role="img"
      aria-label={alt}
      style={{
        position: 'relative', overflow: 'hidden', background: fadeFrame ? undefined : placeholder, ...style,
        opacity: fadeFrame ? (ready ? 1 : 0) : undefined,
        transition: fadeFrame ? 'opacity .7s ease' : undefined,
      }}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        preload={preload}
        unoptimized={remote}
        onLoad={() => setReady(true)}
        style={{ objectFit: 'cover', objectPosition: 'center', opacity: ready ? 1 : 0, transition: 'opacity .7s ease' }}
      />
    </div>
  );
}
