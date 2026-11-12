// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useEffect, useRef, useState } from "react";
import { HERO_LINES, PHRASES } from "../data.js";
import { useCanHover, useMagnetic, useReducedMotion } from "../hooks.js";

function Phrase() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [out, setOut] = useState(false);
  useEffect(() => {
    if (reduce) return;
    let swapTimer;
    const id = setInterval(() => {
      setOut(true);
      swapTimer = setTimeout(() => { setI((n) => (n + 1) % PHRASES.length); setOut(false); }, 450);
    }, 3200);
    return () => { clearInterval(id); clearTimeout(swapTimer); };
  }, [reduce]);
  return <span className={"swap" + (out ? " out" : "")}>{PHRASES[i]}</span>;
}

export default function Hero() {
  const reduce = useReducedMotion();
  const canHover = useCanHover();
  const hero = useRef(null);
  const chars = useRef([]);
  const magA = useMagnetic();
  const magB = useMagnetic();

  // Letter weight swells near the cursor; when the cursor is away, a slow wave breathes through the name.
  useEffect(() => {
    const set = (c, w) => { c.style.fontVariationSettings = `"wght" ${Math.round(w)}, "wdth" 100`; };
    const all = () => chars.current.filter(Boolean);
    if (reduce || !canHover) { all().forEach((c) => set(c, 500)); return; }
    let mx = -9999, my = -9999, inside = false, visible = true, raf;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(hero.current);
    const onMove = (e) => { mx = e.clientX; my = e.clientY; inside = true; };
    const onLeave = () => { inside = false; mx = my = -9999; };
    hero.current.addEventListener("pointermove", onMove);
    hero.current.addEventListener("pointerleave", onLeave);
    const frame = (t) => {
      if (visible) {
        all().forEach((c, i) => {
          if (inside) {
            const r = c.getBoundingClientRect();
            const dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2);
            set(c, 300 + 500 * Math.exp(-(dx * dx + dy * dy) / (2 * 180 * 180)));
          } else if (t > 2200) {
            set(c, 380 + 160 * Math.sin(t / 900 - i * 0.55));
          }
        });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const el = hero.current;
    return () => {
      cancelAnimationFrame(raf); io.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [reduce, canHover]);

  let n = 0;
  return (
    <section className="hero" id="home" ref={hero}>
      <div className="hero-top"><p className="status">Available for new projects</p></div>
      <h1 className="name" aria-label="Sujith Kumar">
        {HERO_LINES.map((line) => (
          <span className="name-line" aria-hidden="true" key={line}>
            {line.split("").map((ch) => {
              const i = n++;
              return <span key={i} className="char" style={{ "--i": i }} ref={(el) => { chars.current[i] = el; }}>{ch}</span>;
            })}
          </span>
        ))}
      </h1>
      <div className="hero-foot">
        <p className="role">Full-stack developer building <Phrase /> for the web.</p>
        <div className="cta">
          <a href="#work" className="btn solid magnetic" {...magA}><span>See my work</span></a>
          <a href="#contact" className="btn line magnetic" {...magB}><span>Get in touch</span></a>
        </div>
      </div>
    </section>
  );
}
