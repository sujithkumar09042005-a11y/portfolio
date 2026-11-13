// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useEffect, useRef } from "react";
import { useFrame, local } from "../engine.js";

// Decorative route between a few pins on a rotating graticule globe (no real data implied).
const PINS = [[12.9, 77.6], [25.2, 55.3], [48.8, 2.3], [35.6, 139.7], [-33.8, 151.2]];
const RAD = Math.PI / 180;

function project(lat, lon, rotLon, tilt) {
  const phi = lat * RAD, lam = (lon + rotLon) * RAD;
  let x = Math.cos(phi) * Math.sin(lam);
  let y = Math.sin(phi);
  let z = Math.cos(phi) * Math.cos(lam);
  const c = Math.cos(tilt), s = Math.sin(tilt);
  const y2 = y * c - z * s, z2 = y * s + z * c;
  return [x, -y2, z2];
}
function slerp(a, b, k) {
  const p1 = a[0] * RAD, l1 = a[1] * RAD, p2 = b[0] * RAD, l2 = b[1] * RAD;
  const v1 = [Math.cos(p1) * Math.cos(l1), Math.cos(p1) * Math.sin(l1), Math.sin(p1)];
  const v2 = [Math.cos(p2) * Math.cos(l2), Math.cos(p2) * Math.sin(l2), Math.sin(p2)];
  const d = Math.acos(Math.max(-1, Math.min(1, v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2])));
  if (d < 1e-4) return a;
  const s1 = Math.sin((1 - k) * d) / Math.sin(d), s2 = Math.sin(k * d) / Math.sin(d);
  const v = [s1 * v1[0] + s2 * v2[0], s1 * v1[1] + s2 * v2[1], s1 * v1[2] + s2 * v2[2]];
  const lift = 1 + 0.16 * Math.sin(Math.PI * k);
  return [Math.asin(v[2]) / RAD, Math.atan2(v[1], v[0]) / RAD, lift];
}

export default function Voyager() {
  const wrap = useRef(null);
  const cv = useRef(null);
  const st = useRef({ rot: -40, tilt: 0.38, w: 0, h: 0, colors: null, cache: "" });

  useEffect(() => {
    const el = wrap.current;
    const ro = new ResizeObserver(() => {
      if (!cv.current) return;
      const r = el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.current.width = Math.round(r.width * dpr);
      cv.current.height = Math.round(r.height * dpr);
      st.current.w = r.width; st.current.h = r.height; st.current.dpr = dpr; st.current.dirty = true;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useFrame(wrap, (t, dt, still) => {
    const s = st.current;
    if (!s.w || !cv.current || !wrap.current) return;
    const cs = getComputedStyle(wrap.current);
    const line = cs.getPropertyValue("--g-line").trim() || "#888";
    const ink = cs.getPropertyValue("--g-ink").trim() || "#fff";
    const hot = cs.getPropertyValue("--g-hot").trim() || "#0ff";
    const fill = cs.getPropertyValue("--g-fill").trim() || "#000";
    const ctx = cv.current.getContext("2d");
    const { w, h, dpr } = s;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const R = Math.min(w, h) * 0.42;
    const cx = w * 0.5, cy = h * 0.5;
    // pointer steers the globe a little; otherwise it spins on its own
    const lp = local(wrap.current);
    if (!still) {
      s.rot += dt * (lp.inside ? 5 : 10);
      const tt = 0.38 + (lp.inside ? -lp.ny * 0.22 : 0);
      s.tilt += (tt - s.tilt) * Math.min(1, dt * 4);
    }
    const rot = still ? -70 : s.rot, tilt = s.tilt;
    // sphere
    const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    g.addColorStop(0, fill); g.addColorStop(1, "transparent");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = line; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
    // graticule
    ctx.lineWidth = 0.8;
    const seg = (pts) => {
      let pen = false;
      ctx.beginPath();
      for (const [x, y, z] of pts) {
        if (z < 0) { pen = false; continue; }
        const X = cx + x * R, Y = cy + y * R;
        if (pen) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); pen = true; }
      }
      ctx.stroke();
    };
    ctx.globalAlpha = 0.8;
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts = []; for (let lon = -180; lon <= 180; lon += 6) pts.push(project(lat, lon, rot, tilt));
      seg(pts);
    }
    for (let lon = -180; lon < 180; lon += 30) {
      const pts = []; for (let lat = -90; lat <= 90; lat += 6) pts.push(project(lat, lon, rot, tilt));
      seg(pts);
    }
    ctx.globalAlpha = 1;
    // route arcs through pins with a travelling comet
    const total = PINS.length - 1;
    const prog = still ? total : ((t * 0.22) % (total + 1.2));
    ctx.lineCap = "round";
    for (let i = 0; i < total; i++) {
      const k = Math.max(0, Math.min(1, prog - i));
      if (k <= 0) continue;
      ctx.strokeStyle = hot; ctx.lineWidth = 1.8; ctx.globalAlpha = still ? 0.9 : Math.max(0, Math.min(1, (total + 1.2 - prog) / 0.8));
      ctx.beginPath();
      let pen = false, tip = null;
      for (let j = 0; j <= 24; j++) {
        const kk = (j / 24) * k;
        const [la, lo, lift] = slerp(PINS[i], PINS[i + 1], kk);
        const [x, y, z] = project(la, lo, rot, tilt);
        if (z < -0.02) { pen = false; continue; }
        const X = cx + x * R * lift, Y = cy + y * R * lift;
        if (pen) ctx.lineTo(X, Y); else { ctx.moveTo(X, Y); pen = true; }
        tip = [X, Y, z];
      }
      ctx.stroke();
      if (tip && k < 1 && !still) { ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(tip[0], tip[1], 3.2, 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    // pins
    PINS.forEach(([la, lo], i) => {
      const [x, y, z] = project(la, lo, rot, tilt);
      if (z < 0.02) return;
      const X = cx + x * R, Y = cy + y * R;
      const reached = still || prog >= i;
      ctx.fillStyle = reached ? hot : line;
      ctx.beginPath(); ctx.arc(X, Y, 3.4, 0, 7); ctx.fill();
      if (reached && !still) {
        const ph = ((t * 0.9 + i * 0.3) % 1);
        ctx.strokeStyle = hot; ctx.globalAlpha = 1 - ph; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(X, Y, 3 + ph * 11, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
      }
    });
  }, 0);

  return (
    <div className="globe" ref={wrap}>
      <canvas ref={cv} role="img" aria-label="Rotating globe with a travel route drawn between pins" />
    </div>
  );
}
