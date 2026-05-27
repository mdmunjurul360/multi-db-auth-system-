import { memo } from "react";
import { cn } from "@/lib/utils";

type Props = {
  src: string | null | undefined;
  alt: string;
  /** "lg" = LCP candidate (eager, fetchpriority=high). "md" = grid card. "sm" = thumbnail. */
  size?: "sm" | "md" | "lg";
  priority?: boolean;
  className?: string;
};

/** Map size → rendered display width (CSS px) at desktop. */
const sizeMap = {
  sm: { w: 120, h: 160, sizes: "120px" },
  md: { w: 320, h: 427, sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" },
  lg: { w: 640, h: 853, sizes: "(max-width: 768px) 100vw, 50vw" },
} as const;

/** Append Supabase storage image transform params if applicable. */
function transform(url: string, width: number, quality = 75): string {
  // Convert object URL to render endpoint for on-the-fly transform
  // /storage/v1/object/public/... → /storage/v1/render/image/public/...
  if (url.includes("/storage/v1/object/public/")) {
    const rendered = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    return `${rendered}?width=${width}&quality=${quality}&resize=cover`;
  }
  return url;
}

function buildSrcSet(src: string, baseWidth: number): string {
  const widths = [baseWidth, baseWidth * 2].filter((w) => w <= 1600);
  return widths.map((w) => `${transform(src, w)} ${w}w`).join(", ");
}

function BookCoverInner({ src, alt, size = "md", priority = false, className }: Props) {
  const cfg = sizeMap[size];
  const fallback = "/placeholder.svg";
  const safeSrc = src && src.length > 0 ? src : fallback;

  return (
    <img
      src={transform(safeSrc, cfg.w)}
      srcSet={safeSrc !== fallback ? buildSrcSet(safeSrc, cfg.w) : undefined}
      sizes={cfg.sizes}
      alt={alt}
      width={cfg.w}
      height={cfg.h}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}

      className={cn("aspect-[3/4] w-full object-cover", className)}
    />
  );
}

export const BookCover = memo(BookCoverInner);
