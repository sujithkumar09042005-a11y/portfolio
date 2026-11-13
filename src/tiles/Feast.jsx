// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useRef } from "react";
import { useFrame } from "../engine.js";

const ROUTE = "M44 190 H120 Q140 190 140 170 V120 Q140 100 160 100 H250 Q270 100 270 80 V58 Q270 40 290 40 H350";
const STATES = ["Preparing", "Out for delivery", "Delivered"];

export default function Feast() {
  const root = useRef(null);
  const path = useRef(null);
  const trail = useRef(null);
  const rider = useRef(null);
  const label = useRef(null);
  const ring = useRef(null);
  const len = useRef(0);
  const shown = useRef("");

  useFrame(root, (t, dt, still) => {
    const p = path.current;
    if (!len.current) len.current = p.getTotalLength();
    const L = len.current;
    // 2.2s preparing at the restaurant, 7s ride, 2s delivered, then loop
    const cycle = 11.2;
    let u = still ? 1 : (t % cycle);
    let prog, st;
    if (still) { prog = 1; st = 2; }
    else if (u < 2.2) { prog = 0; st = 0; }
    else if (u < 9.2) { const k = (u - 2.2) / 7; prog = k * k * (3 - 2 * k); st = 1; }
    else { prog = 1; st = 2; }
    const pt = p.getPointAtLength(prog * L);
    const ahead = p.getPointAtLength(Math.min(L, prog * L + 3));
    const ang = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180 / Math.PI;
    rider.current.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${prog > 0 && prog < 1 ? ang.toFixed(0) : 0})`);
    trail.current.style.strokeDasharray = `${(prog * L).toFixed(1)} ${L}`;
    ring.current.setAttribute("r", (10 + ((t * 14) % 22)).toFixed(1));
    ring.current.style.opacity = st === 1 || still ? "0" : (1 - ((t * 14) % 22) / 22).toFixed(2);
    if (shown.current !== STATES[st]) { shown.current = STATES[st]; label.current.textContent = STATES[st]; root.current.dataset.state = st; }
  });

  return (
    <div className="feast-vis" ref={root} data-state="2">
      <svg viewBox="0 0 400 240" role="img" aria-label="Animated route: a delivery rider travels from the restaurant to the customer.">
        <g className="blocks">
          {[[160, 130, 70, 40], [60, 118, 60, 54], [290, 100, 70, 50], [180, 40, 70, 40], [300, 170, 60, 40], [40, 40, 70, 40]].map((b, i) => (
            <rect key={i} x={b[0]} y={b[1]} width={b[2]} height={b[3]} rx="8" />
          ))}
        </g>
        <path ref={path} d={ROUTE} className="route" />
        <path ref={trail} d={ROUTE} className="route-done" />
        <g transform="translate(44 190)"><circle ref={ring} r="10" className="ping" /><circle r="9" className="stop a" /><path d="M-3.5 -3 V3 M-1 -3 V0 M1.5 -3 V0 M4 -3 V3" className="ico" /></g>
        <g transform="translate(350 40)"><circle r="12" className="stop b" /><path d="M-5 1 L0 -5 L5 1 M-3.5 0 V5 H3.5 V0" className="ico" /></g>
        <g ref={rider} className="rider">
          <circle r="11" className="rider-halo" />
          <circle r="7" className="rider-dot" />
          <path d="M3 0 L-2 -3.5 V3.5 Z" className="rider-arrow" />
        </g>
      </svg>
      <p className="vis-label"><i /><span ref={label}>Delivered</span></p>
    </div>
  );
}
