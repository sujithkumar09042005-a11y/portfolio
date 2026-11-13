// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useEffect, useRef } from "react";
import { MARQUEE } from "../data.js";
import { live, onFrame } from "../live.js";

/** Ticker that drifts on its own and speeds up (and reverses) with scroll velocity. Static when reduced. */
export default function Marquee({ reduce }) {
  const track = useRef(null);
  useEffect(() => {
    if (reduce) return;
    const el = track.current;
    let x = 0, boost = 0, vis = true;
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; });
    io.observe(el);
    const off = onFrame((_, dt) => {
      if (!vis) return;
      boost += (live.scrollVel - boost) * (1 - Math.pow(0.002, dt));
      const half = el.scrollWidth / 2;
      x -= (60 + boost * 22) * dt;
      x = ((x % half) - half) % half; // wrap seamlessly
      el.style.transform = `translate3d(${x}px,0,0)`;
    });
    return () => { off(); io.disconnect(); };
  }, [reduce]);

  const row = (hidden) => MARQUEE.map((w) => (
    <span className="mq-item" key={w + hidden} aria-hidden={hidden || undefined}>{w}<i /></span>
  ));
  return (
    <div className={"marquee" + (reduce ? " static" : "")} role="group" aria-label="Skills: Full-stack, Spring Boot, React, TypeScript, MySQL">
      <div className="mq-track" ref={track} aria-hidden="true">
        {row("a")}{row("b")}{row("c")}{row("d")}
      </div>
    </div>
  );
}
