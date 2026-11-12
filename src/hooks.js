// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

function useMedia(query, serverValue) {
  const subscribe = useCallback((cb) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => serverValue);
}

export const useReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)", false);
export const useCanHover = () => useMedia("(hover: hover)", false);

/** Run `cb` on scroll and resize, throttled to one call per frame; also once on mount. */
export function useScroll(cb) {
  const latest = useRef(cb);
  useEffect(() => { latest.current = cb; });
  useEffect(() => {
    let queued = false;
    const run = () => { queued = false; latest.current(); };
    const on = () => { if (!queued) { queued = true; requestAnimationFrame(run); } };
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    latest.current();
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);
}

/** True once the element has entered the viewport (never goes back to false). */
export function useInView(options = { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, options);
    io.observe(el);
    return () => io.disconnect();
    // options is a stable literal per call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen]);
  return [ref, seen];
}

/** Live visibility flag, for pausing offscreen animation loops. */
export function useOnScreen() {
  const ref = useRef(null);
  const visible = useRef(true);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

/** Pointer-pull effect for 1-2 focal buttons. Returns handlers to spread on the element. */
export function useMagnetic() {
  const reduce = useReducedMotion();
  const canHover = useCanHover();
  if (reduce || !canHover) return {};
  return {
    onPointerMove(e) {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.transform =
        `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    },
    onPointerLeave(e) { e.currentTarget.style.transform = ""; },
  };
}

export function useTheme() {
  const reduce = useReducedMotion();
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "dark");
  const apply = useCallback((t) => {
    document.documentElement.dataset.theme = t;
    localStorage.setItem("theme", t);
    setTheme(t);
  }, []);
  const toggle = useCallback((e) => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    if (!document.startViewTransition || reduce) { apply(next); return; }
    const x = e.clientX, y = e.clientY;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = document.startViewTransition(() => apply(next));
    t.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 750, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    });
  }, [apply, reduce]);
  return [theme, toggle];
}
