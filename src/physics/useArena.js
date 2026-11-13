// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useEffect, useRef, useState } from "react";

/**
 * Progressive enhancement: the element renders as plain, static layout. When `enabled`, the physics chunk
 * is loaded, `prepare(root)` measures the laid-out children and returns { opts, items, after }, the
 * children are lifted to absolute positioning and driven by matter-js. Rebuilds when the width changes.
 * status: "off" (static layout) | "pending" (loading) | "live".
 */
export function useArena(rootRef, prepare, { enabled, whenVisible = false } = {}) {
  const [status, setStatus] = useState(enabled ? "pending" : "off");
  const arenaRef = useRef(null);
  const prep = useRef(prepare);
  useEffect(() => { prep.current = prepare; });

  useEffect(() => {
    if (!enabled) { setStatus("off"); return; }
    const root = rootRef.current;
    if (!root) return;
    let cleanup = null, dead = false, arena = null, items = [], seq = 0, built = false, timer = 0, width = root.clientWidth;

    const teardown = () => {
      cleanup?.(); cleanup = null;
      arena?.destroy(); arena = null; arenaRef.current = null;
      items.forEach((el) => { el.style.width = ""; el.style.height = ""; });
      items = [];
      root.classList.remove("live");
      root.style.height = "";
    };

    const build = async () => {
      const mine = ++seq;
      try { await document.fonts?.ready; } catch { /* ignore */ }
      if (dead || mine !== seq) return;
      teardown();
      const plan = prep.current(root);
      if (!plan) return;
      const baseH = root.getBoundingClientRect().height;
      root.style.height = baseH + "px";
      let mods;
      try {
        mods = await Promise.all([import("./arena.js"), import("matter-js")]);
      } catch {
        if (!dead) { root.style.height = ""; setStatus("off"); }
        return;
      }
      if (dead || mine !== seq) return;
      root.style.height = baseH + (plan.extra || 0) + "px";
      root.style.height = (plan.height ?? baseH) + "px";
      root.classList.add("live");
      plan.items.forEach((i) => { i.el.style.width = i.w + "px"; i.el.style.height = i.h + "px"; });
      items = plan.items.map((i) => i.el);
      arena = mods[0].createArena(root, plan.opts, mods[1].default);
      arenaRef.current = arena;
      plan.items.forEach((i) => arena.add(i.el, i));
      cleanup = plan.after?.(arena) || null;
      built = true;
      setStatus("live");
    };

    let io;
    if (whenVisible) {
      io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); build(); } }, { threshold: 0.25 });
      io.observe(root);
    } else build();

    const ro = new ResizeObserver(() => {
      if (!built || root.clientWidth === width) return;
      width = root.clientWidth;
      clearTimeout(timer);
      timer = setTimeout(build, 200);
    });
    ro.observe(root);

    return () => {
      dead = true;
      clearTimeout(timer);
      io?.disconnect();
      ro.disconnect();
      teardown();
    };
  }, [enabled, rootRef, whenVisible]);

  return [status, arenaRef];
}
