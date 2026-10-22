import type { ImgHTMLAttributes } from "react";

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "loading"> {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Mark as LCP: eager load + high fetch priority. Use above the fold only. */
  priority?: boolean;
  /** Optional AVIF/WebP sources for a <picture> chain. */
  avifSrc?: string;
  webpSrc?: string;
  srcSet?: string;
  sizes?: string;
}

/**
 * Consistent image pattern: reserved dimensions (no CLS), async decoding,
 * lazy by default, optional modern-format sources, priority flag for LCP.
 */
export function LazyImage({
  src,
  alt,
  width,
  height,
  priority = false,
  avifSrc,
  webpSrc,
  srcSet,
  sizes,
  ...rest
}: LazyImageProps) {
  const img = (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      {...rest}
    />
  );

  if (avifSrc || webpSrc) {
    return (
      <picture>
        {avifSrc && <source type="image/avif" srcSet={avifSrc} sizes={sizes} />}
        {webpSrc && <source type="image/webp" srcSet={webpSrc} sizes={sizes} />}
        {img}
      </picture>
    );
  }

  return img;
}
