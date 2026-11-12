import { useEffect, useRef, useState } from "react";
import { PROJECTS } from "../data.js";
import { useCanHover, useReducedMotion } from "../hooks.js";
import { Rule, Title } from "./Reveal.jsx";

/** Preview card that eases toward the cursor, tilts with horizontal speed and scales in and out. */
function Peek({ project, pointer }) {
  const el = useRef(null);
  const state = useRef({ x: 0, y: 0, s: 0.6, tx: 0, ty: 0, ts: 0.6, first: true });

  useEffect(() => {
    const s = state.current;
    let raf;
    const frame = () => {
      const vx = s.tx - s.x;
      s.x += vx * 0.16; s.y += (s.ty - s.y) * 0.16; s.s += (s.ts - s.s) * 0.16;
      const tilt = Math.max(-12, Math.min(12, vx * 0.06));
      if (el.current) el.current.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${tilt}deg) scale(${s.s})`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const s = state.current;
    if (project) {
      s.tx = pointer.current.x + 28; s.ty = pointer.current.y - 100; s.ts = 1;
      if (s.first || s.ts === 0.6) { s.x = s.tx; s.y = s.ty; }
      s.first = false;
    } else { s.ts = 0.6; s.first = true; }
  }, [project, pointer]);

  // follow the pointer while a project is active
  useEffect(() => {
    if (!project) return;
    const s = state.current;
    const move = (e) => { s.tx = e.clientX + 28; s.ty = e.clientY - 100; };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [project]);

  return (
    <div className={"peek" + (project ? " show" : "")} ref={el} aria-hidden="true">
      <div className={"peek-art " + (project?.art ?? "")} />
      <span className="peek-label">{project?.title}</span>
    </div>
  );
}

export default function Work() {
  const reduce = useReducedMotion();
  const canHover = useCanHover();
  const [active, setActive] = useState(null);
  const pointer = useRef({ x: 0, y: 0 });
  const peekEnabled = !reduce && canHover;

  useEffect(() => {
    if (!active) return;
    const off = () => setActive(null);
    // scrolling away from the hovered row, or leaving the window, hides the preview
    window.addEventListener("blur", off);
    document.addEventListener("pointerleave", off);
    return () => { window.removeEventListener("blur", off); document.removeEventListener("pointerleave", off); };
  }, [active]);

  return (
    <section className="section" id="work">
      <Title>Selected work</Title>
      <ul className="work">
        {PROJECTS.map((p, i) => (
          <Rule as="li" key={p.title} index={i}>
            <a
              className="row"
              href={p.href}
              target="_blank"
              rel="noopener"
              onPointerEnter={peekEnabled ? (e) => { pointer.current = { x: e.clientX, y: e.clientY }; setActive(p); } : undefined}
              onPointerLeave={peekEnabled ? () => setActive(null) : undefined}
            >
              <span className="row-title">{p.title}</span>
              <span className="row-desc">{p.desc}</span>
              <span className="row-meta">{p.meta[0]}<br />{p.meta[1]}</span>
            </a>
          </Rule>
        ))}
      </ul>
      {peekEnabled && <Peek project={active} pointer={pointer} />}
    </section>
  );
}
