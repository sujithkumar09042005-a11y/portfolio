// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import Contact from "./components/Contact.jsx";
import Cursor from "./components/Cursor.jsx";
import Footer from "./components/Footer.jsx";
import Hero from "./components/Hero.jsx";
import Marquee from "./components/Marquee.jsx";
import Nav from "./components/Nav.jsx";
import { About, Experience, Projects } from "./components/Sections.jsx";
import { useCanHover, useReducedMotion } from "./hooks.js";
import { initScroll, trackPointer } from "./live.js";

// The shader is decorative and pulls in OGL, so it loads after first paint in its own chunk.
const Aurora = lazy(() => import("./aurora/Aurora.jsx"));

// Low-power hint: data saver, or very small devices, get the CSS gradient only.
const lowPower = () =>
  !!(navigator.connection?.saveData || (navigator.deviceMemory && navigator.deviceMemory <= 2));

function hasWebGL2() {
  try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; }
}

export default function App() {
  const reduce = useReducedMotion();
  const canHover = useCanHover();
  const [shader] = useState(() => !lowPower() && hasWebGL2());
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    document.documentElement.classList.toggle("shader-on", shader && ready);
  }, [shader, ready]);

  useEffect(() => {
    if (reduce) return;
    const stopPtr = trackPointer();
    const stopScroll = initScroll();
    document.documentElement.classList.add("lenis-on");
    return () => { stopPtr(); stopScroll(); document.documentElement.classList.remove("lenis-on"); };
  }, [reduce]);

  return (
    <>
      <div className="fallback-bg" aria-hidden="true" />
      {shader && <Suspense fallback={null}><Aurora reduce={reduce} onReady={onReady} /></Suspense>}
      {!reduce && canHover && <Cursor />}
      <a className="skip" href="#main">Skip to content</a>
      <Nav />
      <main id="main">
        <Hero reduce={reduce} />
        <Marquee reduce={reduce} />
        <About reduce={reduce} />
        <Projects reduce={reduce} />
        <Experience />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
