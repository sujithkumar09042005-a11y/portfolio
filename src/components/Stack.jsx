// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useEffect, useRef, useState } from "react";
import { STACK_GROUPS } from "../data.js";
import { useReducedMotion } from "../hooks.js";
import { useArena } from "../physics/useArena.js";

/** Optional phone feature: gravity follows device tilt. Needs a tap because iOS asks permission. */
function useTilt(arenaRef, live) {
  const [state, setState] = useState("idle"); // idle | on | denied
  const supported = typeof window !== "undefined" && "DeviceOrientationEvent" in window && matchMedia("(pointer: coarse)").matches;
  const handler = useRef(null);
  useEffect(() => () => { if (handler.current) window.removeEventListener("deviceorientation", handler.current); }, []);
  useEffect(() => {
    if (!live && handler.current) { window.removeEventListener("deviceorientation", handler.current); handler.current = null; setState("idle"); }
  }, [live]);
  async function enable() {
    const D = window.DeviceOrientationEvent;
    try {
      if (typeof D.requestPermission === "function" && (await D.requestPermission()) !== "granted") { setState("denied"); return; }
    } catch { setState("denied"); return; }
    handler.current = (e) => {
      const a = arenaRef.current;
      if (!a || e.gamma == null) return;
      const gx = Math.max(-1, Math.min(1, e.gamma / 35));
      const gy = Math.max(-1, Math.min(1, (e.beta - 40) / 35));
      a.engine.gravity.x = gx;
      a.engine.gravity.y = Math.max(0.15, 1 - Math.abs(gx) * 0.3 + gy * 0.6);
    };
    window.addEventListener("deviceorientation", handler.current);
    setState("on");
  }
  function disable() {
    window.removeEventListener("deviceorientation", handler.current);
    handler.current = null;
    const a = arenaRef.current;
    if (a) { a.engine.gravity.x = 0; a.engine.gravity.y = 1; }
    setState("idle");
  }
  return { supported, state, toggle: state === "on" ? disable : enable };
}

export default function Stack() {
  const reduce = useReducedMotion();
  const pit = useRef(null);
  const items = STACK_GROUPS.flatMap((g) => g.items.map((label) => ({ label, tone: g.id })));

  const [status, arenaRef] = useArena(pit, (root) => {
    const rr = root.getBoundingClientRect();
    const chips = [...root.querySelectorAll("[data-body]")];
    const list = chips.map((el, i) => {
      const r = el.getBoundingClientRect();
      const x = r.width / 2 + 10 + Math.random() * Math.max(1, rr.width - r.width - 20);
      return { el, x, y: -40 - i * 46, w: r.width, h: r.height, radius: r.height / 2, angle: (Math.random() - 0.5) * 1.4, body: { restitution: 0.4, friction: 0.25 } };
    });
    return {
      items: list,
      opts: { gravityY: 1, hoverPush: { radius: 95, strength: 1.8 }, jiggle: { min: 600, max: 1500, vx: 2.5, vy: 5.5, spin: 0.14 } },
      after(arena) {
        const t = setTimeout(() => arena.addCeiling(), 3500);
        return () => clearTimeout(t);
      },
    };
  }, { enabled: !reduce, whenVisible: true });

  const live = status === "live";
  const tilt = useTilt(arenaRef, live);

  return (
    <div className="stack">
      <h2 className="section-title">The stack, in a pile</h2>
      <p className="lede">Everything I work with. {live ? "Drag them, throw them, or just wave your cursor through." : "Grouped by what it is used for."}</p>
      <ul className={"stack-list" + (reduce || status === "off" ? "" : " sr-only")}>
        {STACK_GROUPS.map((g) => (
          <li key={g.id}>
            <span className="stack-group">{g.label}</span>
            <ul>{g.items.map((it) => <li key={it} className="chip" data-tone={g.id}>{it}</li>)}</ul>
          </li>
        ))}
      </ul>
      {!reduce && status !== "off" && (
        <div className={"pit" + (live ? " live" : "")} ref={pit} aria-hidden="true">
          <div className="pit-layer">
            {items.map((c) => <span key={c.label} className="chip" data-body data-tone={c.tone}>{c.label}</span>)}
          </div>
        </div>
      )}
      {live && (
        <div className="pit-tools">
          <ul className="legend" aria-hidden="true">
            {STACK_GROUPS.map((g) => <li key={g.id} data-tone={g.id}>{g.label}</li>)}
          </ul>
          {tilt.supported && (
            <button className="btn ghost" type="button" aria-pressed={tilt.state === "on"} onClick={tilt.toggle}>
              {tilt.state === "on" ? "Stop tilting" : tilt.state === "denied" ? "Tilt blocked" : "Tilt your phone to pour"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
