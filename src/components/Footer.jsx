import { useEffect, useRef, useState } from "react";
import { FOOTER_SITEMAP, NAME, SOCIALS } from "../data.js";
import { useInView, useReducedMotion, useScroll } from "../hooks.js";

const CIRC = 125.7;

/** Giant outlined name: letters rise in, one colour wave sweeps through once, then hover lights letters. */
function Wordmark() {
  const reduce = useReducedMotion();
  const [ref, seen] = useInView({ threshold: 0.5 });
  const [lit, setLit] = useState(-1);
  useEffect(() => {
    if (!seen || reduce) return;
    const timers = [];
    NAME.split("").forEach((_, i) => {
      timers.push(setTimeout(() => setLit(i), 700 + i * 90));
    });
    timers.push(setTimeout(() => setLit(-1), 700 + NAME.length * 90 + 450));
    return () => timers.forEach(clearTimeout);
  }, [seen, reduce]);
  return (
    <div className={"wordmark" + (seen ? " in" : "")} ref={ref} aria-hidden="true">
      {NAME.split("").map((ch, i) => (
        <span key={i} className={"wch" + (ch === " " ? " sp" : "") + (lit === i ? " lit" : "")} style={{ "--i": i }}>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </div>
  );
}

function ToTop() {
  const reduce = useReducedMotion();
  const ring = useRef(null);
  useScroll(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    ring.current.style.strokeDashoffset = CIRC * (1 - (max > 0 ? window.scrollY / max : 0));
  });
  return (
    <button className="to-top" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}>
      <svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
        <circle className="ring-bg" cx="22" cy="22" r="20" />
        <circle className="ring" ref={ring} cx="22" cy="22" r="20" />
      </svg>
      <span className="arrow">&uarr;</span>
    </button>
  );
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="foot-top">
        <p className="foot-cta">Have an idea? <a href="#contact" className="foot-link">Let's talk</a></p>
        <nav className="foot-cols" aria-label="Footer">
          <ul>
            <li className="foot-head">Sitemap</li>
            {FOOTER_SITEMAP.map((n) => <li key={n.id}><a href={`#${n.id}`}>{n.label}</a></li>)}
          </ul>
          <ul>
            <li className="foot-head">Elsewhere</li>
            {SOCIALS.map((s) => <li key={s.label}><a href={s.href} target="_blank" rel="noopener">{s.label}</a></li>)}
          </ul>
        </nav>
      </div>
      <Wordmark />
      <div className="foot-bar">
        <p>&copy; {new Date().getFullYear()} {NAME}. Designed and built by hand.</p>
        <ToTop />
      </div>
    </footer>
  );
}
