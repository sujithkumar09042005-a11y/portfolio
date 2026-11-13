// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useEffect, useRef } from "react";
import { DISPLAY_NAME, HERO_LINE, MARQUEE, RESUME, ROLE } from "../data.js";
import { useMagnetic, useReducedMotion } from "../hooks.js";
import { useArena } from "../physics/useArena.js";
import { Clock } from "./Ambient.jsx";

const TONES = ["back", "front", "tools", "core"];
const LIFT = 90; // extra room above the name so letters can be thrown up

export default function Hero() {
  const reduce = useReducedMotion();
  const mag = useMagnetic();
  const tray = useRef(null);
  const words = DISPLAY_NAME.split(" ");

  const [status, arenaRef] = useArena(tray, (root) => {
    const rr = root.getBoundingClientRect();
    const letters = [...root.querySelectorAll("[data-body]")];
    const items = letters.map((el, i) => {
      const r = el.getBoundingClientRect();
      const home = { x: r.left - rr.left + r.width / 2, y: r.top - rr.top + r.height / 2 + LIFT, angle: 0 };
      return { el, x: home.x, y: -80 - Math.random() * 260, w: r.width, h: r.height, radius: r.height * 0.22, angle: (Math.random() - 0.5) * 2, home, body: { restitution: 0.35 + (i % 3) * 0.05 } };
    });
    // a ledge under each line of letters, as wide as the line, so line one rests above line two
    const lines = [...root.querySelectorAll(".word")].map((w) => w.getBoundingClientRect());
    const shelves = lines.slice(0, -1).map((l) => ({ x: l.left - rr.left - 6, y: l.bottom - rr.top + LIFT, w: l.width + 12 }));
    return {
      height: rr.height + LIFT,
      items,
      opts: { gravityY: 1.1, ceiling: true, hoverPush: { radius: 110, strength: 2.4 }, dragStiffness: 0.22, shelves },
      after(arena) {
        arena.returnHome(1500);
        // after a quiet spell, tidy the name back into place
        const t = setInterval(() => {
          if (!arena.isHoming() && arena.displacement() > 4 && performance.now() - arena.lastTouch > 12000) arena.returnHome(1100);
        }, 1500);
        return () => clearInterval(t);
      },
    };
  }, { enabled: !reduce });

  const live = status === "live";
  useEffect(() => { document.documentElement.classList.toggle("hero-live", live); return () => document.documentElement.classList.remove("hero-live"); }, [live]);

  let n = 0;
  return (
    <div className="hero">
      <p className="eyebrow"><span className="live-dot" aria-hidden="true" /> {ROLE}, open to work</p>
      <h1 className="name" ref={tray} aria-label={undefined}>
        {words.map((w, wi) => (
          <span className="word" key={w}>
            {w.split("").map((ch) => {
              const i = n++;
              return <span key={i} className="letter" data-body data-tone={TONES[i % TONES.length]}>{ch}</span>;
            })}
            {wi < words.length - 1 && " "}
          </span>
        ))}
      </h1>
      <div className="hero-row">
        <p className="hero-line">{HERO_LINE}</p>
        <div className="hero-actions">
          <a className="btn solid magnetic" href={RESUME} target="_blank" rel="noopener" {...mag}>Resume</a>
          <a className="btn" href="#work">See the work</a>
          {live && (
            <button className="btn ghost" type="button" onClick={() => arenaRef.current?.returnHome(900)}>Reset the letters</button>
          )}
        </div>
      </div>
      <p className="hint" aria-hidden={!live}>{live ? "Go on, grab a letter and throw it." : " "}</p>
      <div className="hero-foot">
        <Clock />
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {[0, 1].map((k) => <span key={k}>{MARQUEE.map((m) => <b key={m}>{m}</b>)}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
