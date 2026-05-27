import { useEffect, useRef, useState } from "react";
import { BookLoader } from "./BookLoader";

const SESSION_KEY = "bb_site_loader_shown";
const MIN_DISPLAY_MS = 400;
const MAX_DISPLAY_MS = 1500;

/**
 * Full-screen splash shown once per browser session, on the very first
 * page the user lands on. Uses setInterval (not rAF) so it keeps ticking
 * even when the tab is briefly backgrounded, and a hard MAX cap so it
 * never gets stuck waiting on slow image loads.
 */
export function SiteLoader() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(SESSION_KEY) !== "1";
  });
  const [fading, setFading] = useState(false);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!visible) return;
    startRef.current = performance.now();
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      const elapsed = performance.now() - startRef.current;
      const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
      window.setTimeout(() => {
        setFading(true);
        window.setTimeout(() => {
          sessionStorage.setItem(SESSION_KEY, "1");
          setVisible(false);
        }, 500);
      }, wait);
    };

    // Hard cap: never block the page longer than MAX_DISPLAY_MS.
    const cap = window.setTimeout(finish, MAX_DISPLAY_MS);

    // Also try to finish on window 'load' if it arrives earlier.
    if (document.readyState === "complete") {
      window.setTimeout(finish, MIN_DISPLAY_MS);
    } else {
      window.addEventListener("load", finish, { once: true });
    }

    return () => {
      window.clearTimeout(cap);
      window.removeEventListener("load", finish);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#E2F1F8]"
      style={{
        opacity: fading ? 0 : 1,
        transition: "opacity 0.45s ease-out",
        pointerEvents: fading ? "none" : "auto",
      }}
      aria-hidden={fading}
    >
      <BookLoader progress />
    </div>
  );
}

export default SiteLoader;
