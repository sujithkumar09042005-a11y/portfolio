import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import Contact from "./components/Contact.jsx";
import Nav from "./components/Nav.jsx";
import { About, Experience, Hero, Projects, Stack } from "./components/Sections.jsx";
import { NAME, GITHUB, LINKEDIN } from "./data.js";
import { useReducedMotion } from "./hooks.js";

// The 3D world is heavy and decorative: it loads after the first paint, in its own chunk
const Scene = lazy(() => import("./scene/Scene.jsx"));

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

export default function App() {
  const reduce = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const [live, setLive] = useState(false);
  const [wanted] = useState(() => !reduce && hasWebGL());
  const lenis = useRef(null);
  const enabled = wanted && !reduce && !failed;

  const onReady = useCallback(() => { setLive(true); }, []);
  const onFail = useCallback(() => setFailed(true), []);

  useEffect(() => {
    document.documentElement.classList.toggle("live", enabled && live);
    return () => document.documentElement.classList.remove("live");
  }, [enabled, live]);

  // Smooth scrolling (Lenis) + per-chapter copy fade/translate driven by scroll
  useEffect(() => {
    if (!enabled) return;
    let raf = 0, stop = false, inst = null;
    const secs = Array.from(document.querySelectorAll(".chap"));
    const apply = () => {
      const h = innerHeight;
      for (const s of secs) {
        const r = s.getBoundingClientRect();
        if (r.bottom < -50 || r.top > h + 50) continue;
        const d = (r.top + r.height / 2 - h / 2) / (h * 0.55); // -1..1 around centre
        const a = s.classList.contains("contact") ? 0 : Math.abs(d);
        const o = a < 0.3 ? 1 : Math.max(0, 1 - (a - 0.3) * 1.5);
        const el = s.firstElementChild;
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(0, ${(Math.max(-1, Math.min(1, d)) * 36 * (a ? 1 : 0)).toFixed(1)}px, 0)`;
      }
    };
    const loop = (t) => {
      if (stop) return;
      if (inst) inst.raf(t);
      raf = requestAnimationFrame(loop);
    };
    import("lenis").then(({ default: Lenis }) => {
      if (stop) return;
      inst = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
      lenis.current = inst;
      inst.on("scroll", apply);
    });
    addEventListener("scroll", apply, { passive: true });
    addEventListener("resize", apply);
    apply();
    raf = requestAnimationFrame(loop);
    const onVis = () => { if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(loop); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop = true; cancelAnimationFrame(raf);
      removeEventListener("scroll", apply); removeEventListener("resize", apply);
      document.removeEventListener("visibilitychange", onVis);
      inst && inst.destroy(); lenis.current = null;
      secs.forEach((s) => { s.firstElementChild.style.opacity = ""; s.firstElementChild.style.transform = ""; });
    };
  }, [enabled]);

  const goto = useCallback((e, id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis.current) {
      e.preventDefault();
      lenis.current.scrollTo(id === "home" ? 0 : el, { duration: 1.6 });
      history.replaceState(null, "", "#" + id);
    }
  }, []);

  return (
    <>
      <div className="poster" aria-hidden="true" />
      {enabled && <Suspense fallback={null}><Scene onReady={onReady} onFail={onFail} /></Suspense>}
      <a className="skip" href="#about">Skip to content</a>
      <Nav goto={goto} />
      <main>
        <Hero goto={goto} />
        <About />
        <Stack />
        <Projects />
        <Experience />
        <Contact />
      </main>
      <footer className="foot">
        <p>{NAME}</p>
        <p><a href={GITHUB} target="_blank" rel="noopener">GitHub</a> <a href={LINKEDIN} target="_blank" rel="noopener">LinkedIn</a></p>
      </footer>
    </>
  );
}
