import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

function useMedia(query, serverValue) {
  const subscribe = useCallback((cb) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => serverValue);
}

export const useReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)", false);
export const useNarrow = () => useMedia("(max-width: 899px)", false);

/** Theme with a circular view-transition reveal from the click point. */
export function useTheme() {
  const reduce = useReducedMotion();
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "dark");
  const apply = useCallback((t) => {
    document.documentElement.dataset.theme = t;
    localStorage.setItem("theme", t);
    setTheme(t);
  }, []);
  const set = useCallback((next, e) => {
    if (document.documentElement.dataset.theme === next) return;
    if (!document.startViewTransition || reduce) { apply(next); return; }
    const x = e?.clientX ?? innerWidth / 2, y = e?.clientY ?? innerHeight / 2;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = document.startViewTransition(() => apply(next));
    t.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 650, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    });
  }, [apply, reduce]);
  const toggle = useCallback((e) => set(document.documentElement.dataset.theme === "dark" ? "light" : "dark", e), [set]);
  return [theme, toggle, set];
}

/** Run `fn` on a key combo anywhere on the page. */
export function useHotkeys(handler) {
  useEffect(() => {
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handler]);
}
