/**
 * Optimized image component with WebP support.
 * Falls back to original JPEG/PNG if WebP not supported.
 */
export default function OptImage({
  src,
  alt,
  className,
  loading = "lazy",
  ...props
}) {
  if (!src) return null;

  const webpSrc = src.replace(/\.(jpeg|jpg|png)$/i, ".webp");
  const isAlreadyWebp = src.endsWith(".webp");

  if (isAlreadyWebp) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        {...props}
      />
    );
  }

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        {...props}
      />
    </picture>
  );
}
