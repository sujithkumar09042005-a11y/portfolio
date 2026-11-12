// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { lazy, Suspense } from "react";
import About from "./components/About.jsx";
import Contact from "./components/Contact.jsx";
import Experience from "./components/Experience.jsx";
import Footer from "./components/Footer.jsx";
import Hero from "./components/Hero.jsx";
import Marquee from "./components/Marquee.jsx";
import Nav from "./components/Nav.jsx";
import Work from "./components/Work.jsx";
import { useReducedMotion } from "./hooks.js";

// The canvas is decorative and heavy, so it loads after the first paint in its own chunk
const FlowField = lazy(() => import("./components/FlowField.jsx"));

export default function App() {
  const reduce = useReducedMotion();
  return (
    <>
      {!reduce && <Suspense fallback={null}><FlowField /></Suspense>}
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
