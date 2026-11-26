"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Thin bar at the top of the screen from the moment an internal link is tapped until the
// new route renders. Completion is derived from the pathname changing.
export default function NavProgress() {
  const pathname = usePathname();
  const [nav, setNav] = useState<{ from: string; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      // Capture phase: runs before next/link calls preventDefault
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      setNav({ from: location.pathname, id: Date.now() });
      // Never leave the bar hanging if a navigation is abandoned
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setNav(null), 15000);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!nav) return null;
  const running = nav.from === pathname;
  return (
    <div
      key={nav.id}
      aria-hidden
      className={`fixed left-0 top-0 z-[100] h-[3px] bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.6)] pointer-events-none ${
        running ? "nav-progress-run" : "nav-progress-done"
      }`}
    />
  );
}
