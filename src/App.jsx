// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { lazy, Suspense, useEffect } from "react";
import Contact from "./components/Contact.jsx";
import { About, Experience, Footer, Hero, Marquee, Nav } from "./components/Sections.jsx";
import Work from "./components/Work.jsx";
import { startEngine, subscribe } from "./engine.js";
import { useCanHover, useReducedMotion } from "./hooks.js";

// Cursor bubble and progress bar pull in motion/react, so they load after first paint
const Chrome = lazy(() => import("./components/Chrome.jsx"));

export default function App() {
  const reduce = useReducedMotion();
  const canHover = useCanHover();

  useEffect(() => {
    if (reduce) return;
    const stop = startEngine();
    const skewy = [...document.querySelectorAll(".skewy")];
    let lastSk = 0;
    // scroll velocity becomes a skew (deg) shared by every .skewy element
    const off = subscribe((t, dt, st) => {
      const sk = Math.round(Math.max(-9, Math.min(9, st.vel * 4.2)) * 20) / 20;
      if (sk === lastSk) return;
      lastSk = sk;
      skewy.forEach((el) => { el.style.transform = `skewY(${sk}deg)`; });
    });
    return () => { off(); stop(); skewy.forEach((el) => { el.style.transform = ""; }); };
  }, [reduce]);

  return (
    <>
      <a className="skip" href="#about">Skip to content</a>
      {!reduce && <Suspense fallback={null}><Chrome key={canHover ? "h" : "t"} /></Suspense>}
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <About />
        <Work />
        <Experience />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
