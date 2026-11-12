import { useEffect, useRef } from "react";
import { MARQUEE } from "../data.js";
import { useOnScreen, useReducedMotion } from "../hooks.js";

/** Skills ticker that drifts on its own and speeds up, skews and flips with scroll velocity. */
export default function Marquee() {
  const reduce = useReducedMotion();
  const [wrap, visible] = useOnScreen();
  const track = useRef(null);

  useEffect(() => {
    if (reduce) return;
    let x = 0, dir = -1, vel = 0, last = window.scrollY, raf;
    const frame = () => {
      const dy = window.scrollY - last;
      last = window.scrollY;
      vel += (dy - vel) * 0.1;
      if (Math.abs(dy) > 1) dir = dy > 0 ? -1 : 1;
      if (visible.current) {
        x += dir * (0.6 + Math.min(Math.abs(vel), 40) * 0.5);
        const half = track.current.scrollWidth / 2;
        if (x <= -half) x += half;
        if (x > 0) x -= half;
        track.current.style.transform = `translateX(${x}px) skewX(${Math.max(-8, Math.min(8, -vel * 0.25))}deg)`;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reduce, visible]);

  return (
    <div className="marquee" ref={wrap} aria-hidden="true">
      <div className="marquee-track" ref={track}>
        {[0, 1].flatMap((copy) => MARQUEE.flatMap((w) => [<span key={`${copy}-${w}`}>{w}</span>, <i key={`${copy}-${w}-i`} />]))}
      </div>
    </div>
  );
}
