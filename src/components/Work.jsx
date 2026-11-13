// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useRef } from "react";
import { PROJECTS } from "../data.js";
import { useReducedMotion, useTilt } from "../hooks.js";
import { useArena } from "../physics/useArena.js";

const ANGLES = [-2.2, 1.6, -1.2];

function Note({ p, i, live, tilt }) {
  return (
    <li className="note-slot">
      <a
        className="note" href={p.href} target="_blank" rel="noopener" data-body data-gripped data-tone={p.tone}
        style={{ "--a": ANGLES[i % ANGLES.length] + "deg" }} {...(live ? {} : tilt)}
      >
        <span className="grip" aria-hidden="true"><i /></span>
        <span className="note-no" aria-hidden="true">0{i + 1}</span>
        <h3>{p.title}</h3>
        <p>{p.desc}</p>
        <span className="note-meta">{p.meta.map((m) => <span key={m}>{m}</span>)}</span>
        <span className="note-open">Open on GitHub <span aria-hidden="true">-&gt;</span></span>
      </a>
    </li>
  );
}

export default function Work() {
  const reduce = useReducedMotion();
  const board = useRef(null);
  const tilt = useTilt(6);

  const [status] = useArena(board, (root) => {
    const rr = root.getBoundingClientRect();
    const notes = [...root.querySelectorAll("[data-body]")];
    const items = notes.map((el, i) => {
      const r = el.getBoundingClientRect();
      const ang = (ANGLES[i % ANGLES.length] * Math.PI) / 180;
      const home = { x: r.left - rr.left + r.width / 2, y: r.top - rr.top + r.height / 2, angle: ang };
      return { el, x: home.x, y: home.y, w: r.width, h: r.height, angle: ang, radius: 6, home, body: { frictionAir: 0.035, density: 0.003, restitution: 0.5 } };
    });
    return {
      items,
      opts: { gravityY: 0, ceiling: true, dragStiffness: 0.16 },
      after(arena) {
        const { Constraint, Vector } = arena.Matter;
        // two springs per note, like loose pins at its top corners: flick it and it swings back
        arena.entries.forEach((en) => {
          [-1, 1].forEach((s) => {
            const local = { x: s * en.w * 0.36, y: -en.h / 2 + 22 };
            const world = Vector.add(en.body.position, Vector.rotate(local, en.body.angle));
            arena.Matter.Composite.add(arena.world, Constraint.create({
              pointA: world, bodyB: en.body, pointB: local, length: 0, stiffness: 0.018, damping: 0.06,
            }));
          });
        });
      },
    };
  }, { enabled: !reduce, whenVisible: true });

  const live = status === "live";
  return (
    <div className="work">
      <h2 className="section-title">Things I have built</h2>
      <p className="lede">{live ? "Pinned loosely: flick a note, it swings back. Click one to open the code." : "Three full-stack projects. Open one to see the code."}</p>
      <div className="board">
        <ul className="notes" ref={board}>
          {PROJECTS.map((p, i) => <Note key={p.title} p={p} i={i} live={live} tilt={tilt} />)}
        </ul>
      </div>
    </div>
  );
}
