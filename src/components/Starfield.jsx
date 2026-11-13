import { useEffect, useRef } from "react";
import { chapterColors } from "../palette.js";
import { DIM_MIN, MAX_ALPHA, makeStars, project, starCount, travelAt, twinkle } from "../stars.js";
import { useReducedMotion } from "../hooks.js";

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/**
 * The page background: a field of stars and dust in three depth layers that streams out of the dive's vanishing point as
 * you scroll (and back when you scroll up), tinted by the colours of the chapter you are in. It stays on behind Contact and
 * the footer, dimmed there so text never sits on a bright star. Reduced motion gets one still frame.
 */
export default function Starfield() {
  const cv = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = cv.current, ctx = el.getContext("2d"), root = document.documentElement;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let W = 0, H = 0, stars = [], raf = 0, running = true, ink = "#e6eaf7", accent = "#8ea2ff", amber = "#ffb454", light = false;

    const readTheme = () => {
      const css = (v) => getComputedStyle(root).getPropertyValue(v).trim();
      light = root.dataset.theme === "light";
      ink = css("--text") || ink; accent = css("--accent") || accent; amber = css("--amber") || amber;
    };
    const size = () => {
      W = innerWidth; H = innerHeight;
      el.width = Math.round(W * dpr); el.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = makeStars(starCount(W, H));
    };

    // 1 inside the pinned dive, falling to 0 as Contact scrolls over it
    const insideDive = () => {
      const d = document.getElementById("home");
      return d ? clamp(d.getBoundingClientRect().bottom / H, 0, 1) : 0;
    };

    const draw = (ms) => {
      ctx.clearRect(0, 0, W, H);
      const inside = reduce ? 0.5 : insideDive();
      const cap = (light ? MAX_ALPHA.light : MAX_ALPHA.dark) * (DIM_MIN + (1 - DIM_MIN) * inside);
      const travel = reduce ? 0.3 : travelAt(window.scrollY, ms);
      // a horizon glow at the vanishing point in the current chapter's colour, so the page has light and not only dots
      if (chapterColors.c1) {
        ctx.globalAlpha = (light ? 0.05 : 0.08) * (0.4 + 0.6 * inside);
        ctx.fillStyle = chapterColors.c1;
        for (let i = 4; i >= 1; i--) { ctx.beginPath(); ctx.ellipse(W / 2, H * 0.46, (W * 0.5 * i) / 4, (H * 0.55 * i) / 4, 0, 0, 6.2832); ctx.fill(); }
      }
      for (const s of stars) {
        const p = project(s, travel, W, H);
        if (!p) continue;
        ctx.globalAlpha = Math.min(cap, p.alpha * (reduce ? 1 : twinkle(s, ms)));
        ctx.fillStyle = s.kind === 0 ? ink : s.kind === 1 ? (chapterColors.c1 || accent) : (chapterColors.pop || amber);
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.size / 2), 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const frame = (ms) => {
      raf = requestAnimationFrame(frame);
      if (!running || document.hidden) return;
      draw(ms);
    };
    const redraw = () => { size(); draw(performance.now()); };

    readTheme(); size();
    const mo = new MutationObserver(() => { readTheme(); if (reduce) draw(0); });
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("resize", redraw);
    if (reduce) draw(0); else raf = requestAnimationFrame(frame);
    return () => { running = false; cancelAnimationFrame(raf); mo.disconnect(); window.removeEventListener("resize", redraw); };
  }, [reduce]);

  return <canvas className="starfield" ref={cv} aria-hidden="true" />;
}
