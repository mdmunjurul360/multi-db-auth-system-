import { useEffect, useState } from "react";

interface BookLoaderProps {
  /** Show a progress bar underneath the book. */
  progress?: boolean;
  /** Optional label shown beneath the loader. */
  label?: string;
  /** Scale of the book illustration. Defaults to 0.6 (matches design). */
  scale?: number;
  /** Use full-viewport background. Defaults to false (inline mode). */
  fullscreen?: boolean;
}

/**
 * Animated 3D flipping-book loader.
 * Pure CSS — no JS frame loop, GPU-friendly.
 */
export function BookLoader({
  progress = false,
  label,
  scale = 0.6,
  fullscreen = false,
}: BookLoaderProps) {
  const [pct, setPct] = useState(8);

  useEffect(() => {
    if (!progress) return;
    const start = Date.now();
    // setInterval keeps ticking when the tab is backgrounded; rAF does not.
    const id = window.setInterval(() => {
      const elapsed = Date.now() - start;
      // Ease toward 92% over ~2.5s; final 8% completes when caller unmounts.
      const next = Math.min(92, 8 + (1 - Math.exp(-elapsed / 900)) * 90);
      setPct(next);
    }, 90);
    return () => window.clearInterval(id);
  }, [progress]);


  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[9999] flex items-center justify-center bg-[#E2F1F8]"
          : "flex items-center justify-center"
      }
      role="status"
      aria-label={label ?? "Loading"}
    >
      <div className="book-loader-wrapper">
        <div className="book-loader" style={{ ["--book-scale" as string]: scale }}>
          <div className="bl-cover" />
          <div className="bl-pages">
            <div className="bl-page bl-static bl-left">
              <div className="bl-text">
                <div className="bl-line" />
                <div className="bl-line bl-medium" />
                <div className="bl-line bl-short-left" />
                <div className="bl-line" />
                <div className="bl-line bl-indent" />
              </div>
            </div>
            <div className="bl-page bl-static bl-right">
              <div className="bl-text">
                <div className="bl-line" />
                <div className="bl-line bl-medium" />
                <div className="bl-line bl-short-right" />
                <div className="bl-line" />
                <div className="bl-line bl-indent-right" />
              </div>
            </div>
            <div className="bl-page bl-turning">
              <div className="bl-front" />
              <div className="bl-back" />
            </div>
            <div className="bl-page bl-turning">
              <div className="bl-front" />
              <div className="bl-back" />
            </div>
            <div className="bl-page bl-turning">
              <div className="bl-front" />
              <div className="bl-back" />
            </div>
            <div className="bl-spine-crease" />
          </div>
        </div>

        {progress && (
          <div className="bl-progress-track" aria-hidden>
            <div className="bl-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        )}
        {label && <p className="bl-label">{label}</p>}
      </div>
    </div>
  );
}

export default BookLoader;
