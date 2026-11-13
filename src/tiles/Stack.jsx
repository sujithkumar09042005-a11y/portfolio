// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useRef } from "react";
import { STACK_NODES } from "../data.js";
import { useFrame } from "../engine.js";

// Client (left) -> API (centre, raised) -> database (right). Requests travel forward on the
// upper lane, responses come back on a lane offset below it. Packet positions come from
// getPointAtLength so they follow the real curve.
const LANE = "M90 150 C 190 150, 190 84, 300 84 S 410 150, 510 150";
const OFFSET = 34;
const NODE_X = [92, 300, 508];
const NODE_Y = [150, 84, 150];
const REQ = 5;
const SPEED = 0.16;

function glow(x, cx) { return Math.exp(-(((x - cx) / 46) ** 2)); }

export default function Stack() {
  const root = useRef(null);
  const lane = useRef(null);
  const reqs = useRef([]);
  const ress = useRef([]);
  const nodes = useRef([]);
  const lenRef = useRef(0);

  useFrame(root, (t, dt, still) => {
    const path = lane.current;
    if (!lenRef.current) lenRef.current = path.getTotalLength();
    const len = lenRef.current;
    const heat = [0, 0, 0];
    const place = (el, p, off, back) => {
      const q = back ? 1 - p : p;
      const pt = path.getPointAtLength(q * len);
      el.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${(pt.y + off).toFixed(1)})`);
      const edge = Math.min(1, Math.min(p, 1 - p) * 9);
      el.setAttribute("opacity", edge.toFixed(2));
      NODE_X.forEach((cx, i) => { heat[i] = Math.max(heat[i], glow(pt.x, cx) * edge); });
    };
    reqs.current.forEach((el, i) => {
      const p = still ? (i + 0.5) / REQ : (t * SPEED + i / REQ) % 1;
      place(el, p, 0, false);
    });
    ress.current.forEach((el, i) => {
      const p = still ? (i + 0.85) / REQ : (t * SPEED + 0.5 / REQ + i / REQ) % 1;
      place(el, p, OFFSET, true);
    });
    nodes.current.forEach((el, i) => {
      if (el) el.style.setProperty("--heat", heat[i].toFixed(2));
    });
  });

  return (
    <div className="stack-vis" ref={root}>
      <svg viewBox="0 0 600 250" role="img" aria-label="Diagram: a React client sends requests to a Spring Boot API, which queries MySQL; responses travel back.">
        <defs>
          <pattern id="sgrid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" className="gridline" /></pattern>
        </defs>
        <rect width="600" height="250" fill="url(#sgrid)" className="grid-bg" />
        <path ref={lane} d={LANE} className="lane req" />
        <path d={LANE} className="lane res" transform={`translate(0 ${OFFSET})`} />
        {STACK_NODES.map((n, i) => (
          <g key={n.id} className="node" ref={(e) => (nodes.current[i] = e)} transform={`translate(${NODE_X[i]} ${NODE_Y[i] + (i === 1 ? 0 : 0)})`}>
            <rect x="-76" y="-26" width="152" height="52" rx="14" className="nbox" />
            <rect x="-76" y="-26" width="152" height="52" rx="14" className="nglow" />
            <text y="-3" className="nname" textAnchor="middle">{n.name}</text>
            <text y="14" className="ntech" textAnchor="middle">{n.tech}</text>
          </g>
        ))}
        {[...Array(REQ)].map((_, i) => (
          <g key={"q" + i} ref={(e) => (reqs.current[i] = e)}>
            <circle r="9" className="pk-halo req" />
            <rect x="-5" y="-5" width="10" height="10" rx="2.5" className="pk req" />
          </g>
        ))}
        {[...Array(REQ)].map((_, i) => (
          <g key={"s" + i} ref={(e) => (ress.current[i] = e)}>
            <circle r="9" className="pk-halo res" />
            <circle r="4.5" className="pk res" />
          </g>
        ))}
        <text x="140" y="214" className="cap">request</text>
        <text x="400" y="214" className="cap">response</text>
        <circle cx="116" cy="210" r="4" className="pk req" /><circle cx="376" cy="210" r="4" className="pk res" />
      </svg>
    </div>
  );
}
