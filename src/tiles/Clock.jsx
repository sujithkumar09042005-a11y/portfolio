// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useRef } from "react";
import { useFrame } from "../engine.js";

const pad = (n) => String(n).padStart(2, "0");
const phaseOf = (h) => (h < 5 || h >= 20 ? "Night" : h < 8 ? "Dawn" : h < 17 ? "Daytime" : "Dusk");

export default function Clock() {
  const root = useRef(null);
  const hh = useRef(null), mm = useRef(null), ss = useRef(null);
  const hand = { h: useRef(null), m: useRef(null), s: useRef(null) };
  const last = useRef(-1);
  const zone = useRef(Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time");

  useFrame(root, (t, dt, still) => {
    const d = new Date();
    const ms = d.getMilliseconds();
    const sec = d.getSeconds() + (still ? 0 : ms / 1000);
    const min = d.getMinutes() + sec / 60;
    const hr = (d.getHours() % 12) + min / 60;
    hand.s.current.setAttribute("transform", `rotate(${sec * 6})`);
    hand.m.current.setAttribute("transform", `rotate(${min * 6})`);
    hand.h.current.setAttribute("transform", `rotate(${hr * 30})`);
    const key = d.getSeconds() + d.getMinutes() * 60 + d.getHours() * 3600;
    if (key !== last.current) {
      last.current = key;
      hh.current.textContent = pad(d.getHours());
      mm.current.textContent = pad(d.getMinutes());
      ss.current.textContent = pad(d.getSeconds());
      const frac = d.getHours() + d.getMinutes() / 60;
      const sun = Math.max(0, Math.sin(((frac - 6) / 12) * Math.PI));
      root.current.style.setProperty("--sun", sun.toFixed(3));
      root.current.dataset.phase = phaseOf(d.getHours());
      root.current.querySelector(".phase").textContent = phaseOf(d.getHours());
      root.current.querySelector(".date").textContent = d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
    }
  });

  // reduced motion still needs a ticking clock: step once per second without the sweep
  const ticks = [...Array(60)].map((_, i) => {
    const major = i % 5 === 0;
    return <line key={i} x1="0" y1={major ? -84 : -88} x2="0" y2="-92" transform={`rotate(${i * 6})`} className={major ? "tk major" : "tk"} />;
  });
  return (
    <div className="clock" ref={root}>
      <div className="sky" aria-hidden="true" />
      <svg className="dial" viewBox="-100 -100 200 200" role="img" aria-label="Analogue clock showing your local time">
        <circle r="97" className="face" />
        {ticks}
        <g ref={hand.h} className="hand hh"><line y1="6" y2="-48" /></g>
        <g ref={hand.m} className="hand mh"><line y1="8" y2="-72" /></g>
        <g ref={hand.s} className="hand sh"><line y1="14" y2="-80" /><circle r="3.4" cy="-80" /></g>
        <circle r="4.5" className="pin" />
      </svg>
      <div className="digital">
        <p className="digits" aria-label="Local time"><span ref={hh} /><i>:</i><span ref={mm} /><i className="sec">:</i><span ref={ss} className="sec" /></p>
        <p className="phase" />
        <p className="date" />
        <p className="zone">{zone.current}</p>
      </div>
    </div>
  );
}
