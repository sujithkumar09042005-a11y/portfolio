// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useEffect, useRef } from "react";
import { live, onFrame } from "../live.js";

const HOT = "a, button, [role=button], input, textarea, [data-cursor]";

/** Soft ring that trails the pointer and grows over interactive elements. The native cursor stays. */
export default function Cursor() {
  const ring = useRef(null);
  useEffect(() => {
    let grow = 0, size = 0;
    const over = (e) => { grow = e.target.closest?.(HOT) ? 1 : 0; };
    addEventListener("pointerover", over, { passive: true });
    const off = onFrame((_, dt) => {
      const el = ring.current;
      if (!el || !live.seen) return;
      size += (grow - size) * (1 - Math.pow(0.0005, dt));
      const s = 1 + size * 1.5;
      el.style.opacity = live.active ? 1 : 0;
      el.style.transform = `translate3d(${live.sx}px, ${live.sy}px, 0) translate(-50%, -50%) scale(${s})`;
      el.style.setProperty("--fill", (size * 0.16).toFixed(3));
    });
    return () => { removeEventListener("pointerover", over); off(); };
  }, []);
  return <div ref={ring} className="cursor" aria-hidden="true" />;
}
