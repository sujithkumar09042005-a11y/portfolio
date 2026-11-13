import { useEffect, useRef } from "react";
import { burst, idle, reaction, spring } from "../liveName.js";
import { useReducedMotion } from "../hooks.js";
import { pointer } from "../pointer.js";

/**
 * The name, alive. Each letter is a small spring: the pointer pushes and tilts the letters near it, they swell a little, and
 * they ease back when it leaves. A click kicks the letters beside it. When nothing is touching it the name breathes in a slow
 * wave. Screen readers get the plain name; the letters are decorative. Touch devices get the breathing and tap kicks.
 */
export default function LiveName({ lines }) {
  const root = useRef(null);
  const reduce = useReducedMotion();
  const letters = useRef([]);
  let n = 0;

  useEffect(() => {
    if (reduce) return;
    const els = letters.current.filter(Boolean);
    const st = els.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0, s: 1, vs: 0, cx: 0, cy: 0 }));
    let raf = 0, last = performance.now(), visible = true, rect = null, lastClick = 0;

    const measure = () => {
      // resting centres, measured with the springs at rest, so the pointer's distance is to where the letter sits
      els.forEach((el, i) => { const r = el.getBoundingClientRect(); st[i].cx = r.left + r.width / 2 - st[i].x; st[i].cy = r.top + r.height / 2 - st[i].y; });
    };
    measure();
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) measure(); });
    io.observe(root.current);
    window.addEventListener("resize", measure);

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
      if (!visible || document.hidden) return;
      // the dive fades the name out as you scroll away from the start, so there is no point moving letters nobody can see
      if (parseFloat(root.current.parentElement.style.opacity || "1") < 0.03) return;
      if (pointer.clickAt > lastClick) {
        lastClick = pointer.clickAt;
        st.forEach((q, i) => { const k = burst(q.cx + q.x - pointer.x, q.cy + q.y - pointer.y); q.vx += k.vx; q.vy += k.vy; q.vr += k.vx * 0.05; });
      }
      els.forEach((el, i) => {
        const q = st[i], id = idle(i, now);
        const want = pointer.on ? reaction(q.cx - pointer.x, q.cy - pointer.y) : { x: 0, y: 0, rot: 0, s: 1, f: 0 };
        const calm = 1 - Math.min(1, want.f * 3);               // the idle breathing fades out while the pointer is on a letter
        [q.x, q.vx] = spring(q.x, q.vx, want.x, dt);
        [q.y, q.vy] = spring(q.y, q.vy, want.y + id.y * calm, dt);
        [q.r, q.vr] = spring(q.r, q.vr, want.rot + id.rot * calm, dt);
        [q.s, q.vs] = spring(q.s, q.vs, want.s, dt);
        const still = Math.abs(q.x) < 0.01 && Math.abs(q.y) < 0.01 && Math.abs(q.r) < 0.01 && Math.abs(q.s - 1) < 0.0005;
        el.classList.toggle("is-moving", !still);          // a letter is only promoted to its own layer while it moves, so it is crisp at rest
        el.style.transform = still ? "" : `translate3d(${q.x.toFixed(2)}px, ${q.y.toFixed(2)}px, 0) rotate(${q.r.toFixed(2)}deg) scale(${q.s.toFixed(4)})`;
        // weight swells where the pointer is, the same trick as the first version of this site
        el.style.fontVariationSettings = `"wght" ${Math.round(500 + want.f * 230)}, "wdth" 100`;
      });
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", measure); };
  }, [reduce]);

  return (
    <span ref={root} className="live-name" role="text" aria-label={lines.join(" ")}>
      {lines.map((line, li) => (
        <span key={line} className="ln-line" aria-hidden="true">
          {line.split("").map((ch) => { const i = n++; return <span key={i} className="ln-ch" ref={(el) => { letters.current[i] = el; }}>{ch}</span>; })}
          {li < lines.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
