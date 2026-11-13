// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useRef } from "react";
import { useFrame, ptr } from "../engine.js";

// Four people, five raw debts that net out to two settlements. The collapse is CSS-driven from
// data-settled so a hover/focus can force it; otherwise the tile cycles on its own.
const P = { A: [58, 54], B: [58, 186], C: [342, 54], D: [342, 186] };
const DEBTS = [
  ["A", "B", 10, "raw"], ["A", "C", 20, "merge"], ["B", "C", 30, "raw"], ["B", "D", 10, "raw"], ["C", "D", 20, "raw"],
];
// merged results
const FINAL = [["A", "C", 30], ["B", "D", 30]];

function arrow(a, b, bend = 0) {
  const [x1, y1] = P[a], [x2, y2] = P[b];
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
  const ux = dx / d, uy = dy / d;
  const sx = x1 + ux * 24, sy = y1 + uy * 24, ex = x2 - ux * 30, ey = y2 - uy * 30;
  const mx = (sx + ex) / 2 - uy * bend, my = (sy + ey) / 2 + ux * bend;
  return { d: `M${sx} ${sy} Q${mx} ${my} ${ex} ${ey}`, mx: (sx + ex) / 2 - uy * bend * 0.5, my: (sy + ey) / 2 + ux * bend * 0.5 };
}

export default function Split() {
  const root = useRef(null);
  const state = useRef({ t: 0, settled: false, hold: false });
  useFrame(root, (t, dt, still) => {
    const el = root.current;
    if (still) { el.dataset.settled = "1"; return; }
    const hover = el.closest("[data-tile]")?.matches(":hover, :focus-within");
    const phase = t % 7;
    const auto = phase > 3.2 && phase < 6.4;
    const want = hover ? "1" : auto ? "1" : "0";
    if (el.dataset.settled !== want) el.dataset.settled = want;
  });
  const raw = DEBTS.map(([a, b, amt, k], i) => ({ a, b, amt, k, i, ...arrow(a, b, 0) }));
  return (
    <div className="split-vis" ref={root} data-settled="1">
      <svg viewBox="0 0 400 240" role="img" aria-label="Debt graph: five debts between four people collapse into two settlements.">
        <defs>
          <marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 1 L9 5 L0 9 Z" className="ahead" /></marker>
          <marker id="ah2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 1 L9 5 L0 9 Z" className="ahead hot" /></marker>
        </defs>
        {raw.filter((r) => r.k === "raw").map((r) => (
          <g key={r.i} className="debt raw" style={{ "--i": r.i }}>
            <path d={r.d} pathLength="1" markerEnd="url(#ah)" />
            <text x={r.mx} y={r.my - 6} textAnchor="middle">{r.amt}</text>
          </g>
        ))}
        {/* A->C exists raw (20) and stays as the merged 30 */}
        <g className="debt keep">
          <path d={arrow("A", "C").d} pathLength="1" markerEnd="url(#ah2)" />
          <text x="200" y="40" textAnchor="middle" className="amt-final">30</text>
          <text x="200" y="40" textAnchor="middle" className="amt-raw">20</text>
        </g>
        <g className="debt new">
          <path d={arrow("B", "D").d} pathLength="1" markerEnd="url(#ah2)" transform="translate(0 0)" />
          <text x="200" y="212" textAnchor="middle" className="amt-final">30</text>
        </g>
        {Object.entries(P).map(([k, [x, y]]) => (
          <g key={k} className="person" transform={`translate(${x} ${y})`}>
            <circle r="20" /><text y="5" textAnchor="middle">{k}</text>
          </g>
        ))}
      </svg>
      <p className="vis-label"><i /><span className="l-raw">5 payments</span><span className="l-final">2 payments</span></p>
    </div>
  );
}
