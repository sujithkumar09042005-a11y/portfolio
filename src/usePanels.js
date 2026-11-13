// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useEffect } from "react";

/**
 * Stacked sticky panels. Each panel sticks when its bottom reaches the viewport bottom (or its top, if it
 * fits), the next one slides over it. Sets --cover (0..1) on a panel as it is covered, data-covered when it
 * is fully hidden (physics pauses), and a velocity-based --tilt (deg) on the container.
 */
export function usePanels(rootRef, enabled) {
  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root) return;
    const panels = [...root.querySelectorAll(":scope > .panel")];
    let vel = 0, lastY = window.scrollY, raf = 0, queued = false;

    const layout = () => {
      panels.forEach((p) => { p.style.top = Math.min(0, innerHeight - p.offsetHeight) + "px"; });
      update();
    };
    const update = () => {
      panels.forEach((p, i) => {
        const n = panels[i + 1];
        let c = 0;
        if (n) c = Math.min(1, Math.max(0, (innerHeight - n.getBoundingClientRect().top) / innerHeight));
        p.style.setProperty("--cover", c.toFixed(3));
        p.dataset.covered = c >= 0.999 ? "1" : "0";
      });
    };
    const loop = () => {
      const y = window.scrollY;
      vel += (y - lastY - vel) * 0.25;
      lastY = y;
      vel *= 0.9;
      const tilt = Math.max(-2, Math.min(2, vel * 0.07));
      root.style.setProperty("--tilt", tilt.toFixed(3) + "deg");
      if (Math.abs(vel) > 0.03) raf = requestAnimationFrame(loop);
      else { raf = 0; root.style.setProperty("--tilt", "0deg"); }
    };
    const onScroll = () => {
      if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; update(); }); }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const ro = new ResizeObserver(layout);
    panels.forEach((p) => ro.observe(p));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", layout);
    layout();
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", layout);
      panels.forEach((p) => { p.style.top = ""; p.style.removeProperty("--cover"); delete p.dataset.covered; });
      root.style.removeProperty("--tilt");
    };
  }, [rootRef, enabled]);
}
