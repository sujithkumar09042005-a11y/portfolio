import { useEffect, useRef } from "react";

const R = 190;      // radius in which the pointer bends particles
const HALO = 80;    // radius of the faint visible halo

/**
 * Particles follow a slowly changing noise field and leave persistent traces on an offscreen layer.
 * The pointer swirls, pushes and drags nearby particles; a click sends out a shockwave.
 */
export default function FlowField() {
  const canvas = useRef(null);

  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv.getContext("2d");
    const trail = document.createElement("canvas");
    const tctx = trail.getContext("2d");
    const root = document.documentElement;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const css = (v) => getComputedStyle(root).getPropertyValue(v).trim();

    let W = 0, H = 0, tt = 0, frameNo = 0, running = true, raf = 0;
    let colA = css("--accent"), colB = css("--amber");
    const parts = [];
    const ptr = { x: -9999, y: -9999, vx: 0, vy: 0, active: false };
    let bursts = [];

    const spawn = () => ({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, life: Math.random() * 300, warm: Math.random() < 0.12 });
    const size = () => {
      W = innerWidth; H = innerHeight;
      cv.width = trail.width = W * dpr; cv.height = trail.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(260, Math.round((W * H) / 7000));
      while (parts.length < n) parts.push(spawn());
      parts.length = n;
    };
    const angle = (x, y) =>
      (Math.sin(x * 0.0021 + tt * 0.0004) + Math.cos(y * 0.0027 - tt * 0.0003) + Math.sin((x + y) * 0.0012 + tt * 0.0002)) * 1.7;

    const frame = () => {
      if (!running) return;
      tt += 8; frameNo++;
      const light = root.dataset.theme === "light";

      // traces persist; a very slow fade keeps the layer from saturating over minutes
      if (frameNo % 60 === 0) {
        tctx.globalCompositeOperation = "destination-out";
        tctx.fillStyle = "rgba(0,0,0,0.01)";
        tctx.fillRect(0, 0, W, H);
        tctx.globalCompositeOperation = "source-over";
      }
      bursts.forEach((b) => { b.r += 14; });
      bursts = bursts.filter((b) => b.r < 420);

      tctx.lineWidth = 0.8;
      for (const p of parts) {
        const px = p.x, py = p.y, a = angle(p.x, p.y);
        p.vx += (Math.cos(a) * 0.45 - p.vx) * 0.08;
        p.vy += (Math.sin(a) * 0.45 - p.vy) * 0.08;
        let near = false;
        if (ptr.active) {
          const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1, f = 1 - d / R;
            near = true;
            p.vx += (-dy / d) * f * 2.2 + (dx / d) * f * 0.8 + ptr.vx * f * 0.12;
            p.vy += (dx / d) * f * 2.2 + (dy / d) * f * 0.8 + ptr.vy * f * 0.12;
          }
        }
        for (const b of bursts) {
          const bx = p.x - b.x, by = p.y - b.y, bd = Math.sqrt(bx * bx + by * by) || 1;
          if (Math.abs(bd - b.r) < 40) { const k = (1 - b.r / 420) * 3; p.vx += (bx / bd) * k; p.vy += (by / bd) * k; }
        }
        const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (sp > 3.5) { p.vx *= 3.5 / sp; p.vy *= 3.5 / sp; }
        p.x += p.vx; p.y += p.vy; p.life++;
        tctx.strokeStyle = near || p.warm ? colB : colA;
        tctx.globalAlpha = (light ? 0.1 : 0.14) + (near ? 0.06 : 0);
        tctx.beginPath(); tctx.moveTo(px, py); tctx.lineTo(p.x, p.y); tctx.stroke();
        if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20 || p.life > 450) Object.assign(p, spawn(), { life: 0 });
      }
      tctx.globalAlpha = 1;
      ptr.vx *= 0.8; ptr.vy *= 0.8;

      // visible canvas = persistent traces + a small, faint halo drawn fresh each frame
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(trail, 0, 0, W, H);
      if (ptr.active) {
        const rgb = light ? "224,123,0" : "142,162,255";
        const g = ctx.createRadialGradient(ptr.x, ptr.y, 0, ptr.x, ptr.y, HALO);
        g.addColorStop(0, `rgba(${rgb},${light ? 0.1 : 0.07})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(ptr.x, ptr.y, HALO, 0, 6.2832); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e) => {
      ptr.vx = ptr.active ? e.clientX - ptr.x : 0;
      ptr.vy = ptr.active ? e.clientY - ptr.y : 0;
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.active = true;
    };
    const onLeave = () => { ptr.active = false; ptr.x = ptr.y = -9999; };
    const onDown = (e) => bursts.push({ x: e.clientX, y: e.clientY, r: 0 });
    const onVisibility = () => { running = !document.hidden; if (running) raf = requestAnimationFrame(frame); };

    // old traces were drawn for the other theme, so clear them when the theme changes
    const mo = new MutationObserver(() => { colA = css("--accent"); colB = css("--amber"); tctx.clearRect(0, 0, W, H); });
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    size();
    window.addEventListener("resize", size);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(frame);

    return () => {
      running = false; cancelAnimationFrame(raf); mo.disconnect();
      window.removeEventListener("resize", size);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas className="flow" ref={canvas} aria-hidden="true" />;
}
