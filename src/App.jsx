// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useRef } from "react";
import { NAME, SOCIALS } from "./data.js";
import { useReducedMotion } from "./hooks.js";
import { usePanels } from "./usePanels.js";
import About from "./components/About.jsx";
import { CursorBlob } from "./components/Ambient.jsx";
import Contact from "./components/Contact.jsx";
import Experience from "./components/Experience.jsx";
import Hero from "./components/Hero.jsx";
import Nav from "./components/Nav.jsx";
import Stack from "./components/Stack.jsx";
import Work from "./components/Work.jsx";

export default function App() {
  const reduce = useReducedMotion();
  const root = useRef(null);
  usePanels(root, !reduce);
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Nav />
      <main id="main" ref={root} className={"panels" + (reduce ? " calm" : "")}>
        <section className="panel" id="home" data-panel data-surface="0"><div className="inner"><Hero /></div></section>
        <section className="panel" id="about" data-panel data-surface="1"><div className="inner"><About /></div></section>
        <section className="panel" id="stack" data-panel data-surface="2"><div className="inner"><Stack /></div></section>
        <section className="panel" id="work" data-panel data-surface="3"><div className="inner"><Work /></div></section>
        <section className="panel" id="experience" data-panel data-surface="4"><div className="inner"><Experience /></div></section>
        <section className="panel last" id="contact" data-panel data-surface="5">
          <div className="inner">
            <Contact />
            <footer className="foot">
              <p>{NAME}. Built with React and matter-js.</p>
              <ul>{SOCIALS.map((s) => <li key={s.label}><a href={s.href} target="_blank" rel="noopener">{s.label}</a></li>)}</ul>
            </footer>
          </div>
        </section>
      </main>
      <CursorBlob />
    </>
  );
}
