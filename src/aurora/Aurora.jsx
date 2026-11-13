// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useEffect, useRef } from "react";
import { Geometry, Mesh, Program, Renderer } from "ogl";
import { live, onFrame } from "../live.js";

const N = 12; // wake trail length

const vert = /* glsl */ `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

// Colours are authored in OKLCH and converted to sRGB here, so lightness stays
// perceptually even while hue rotates (that keeps text contrast predictable).
const frag = /* glsl */ `#version 300 es
precision highp float;
#define N ${N}
uniform vec2 uRes;
uniform float uTime, uHue, uInt, uDark, uScroll, uPtrAmt;
uniform vec2 uPtr;
uniform vec4 uTrail[N];
out vec4 o;

vec3 oklch(float L, float C, float h) {
  float a = C * cos(h), b = C * sin(h);
  float l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  float m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  float s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  float l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  vec3 c = vec3(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
               -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
               -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
const mat2 R = mat2(0.8, 0.6, -0.6, 0.8);
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * vnoise(p); p = R * p * 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;

  // Pointer wake: every trail sample drags the field along its velocity and adds glow, then decays.
  vec2 disp = vec2(0.0); float glow = 0.0;
  for (int i = 0; i < N; i++) {
    vec2 d = p - uTrail[i].xy;
    float w = exp(-dot(d, d) * 9.0);
    disp += uTrail[i].zw * w;
    glow += length(uTrail[i].zw) * w;
  }
  vec2 d0 = p - uPtr;
  float near = exp(-dot(d0, d0) * 10.0) * uPtrAmt;
  p -= disp * 1.6;
  p += 0.10 * vec2(-d0.y, d0.x) * near;
  glow = clamp(glow * 2.2 + near * 0.35, 0.0, 1.0);

  vec2 q = p * 1.25 + vec2(0.0, uScroll * 2.2);
  float n1 = fbm(q + vec2(t * 0.045, 0.0));
  float n2 = fbm(q * 1.35 + n1 * 2.0 + vec2(-t * 0.035, t * 0.02));
  float band = sin(q.y * 1.9 + n2 * 2.8 + n1 * 1.3 + t * 0.09);
  float ribbon = pow(1.0 - abs(band), 2.4);
  float soft = smoothstep(0.25, 0.85, n2);
  float e = clamp(0.95 * ribbon * soft + 0.5 * soft * n1 + glow * 0.6, 0.0, 1.0) * uInt;

  float h = radians(uHue + 70.0 * n1 + 45.0 * n2 - 35.0 * glow);
  // dark: ink field with luminous ridges, lightness capped low so light text keeps contrast
  float Ld = mix(0.19, 0.39, e), Cd = 0.05 + 0.2 * e;
  // light: paper with pastel washes, lightness capped high so dark text keeps contrast
  float Ll = mix(0.965, 0.83, e), Cl = 0.015 + 0.11 * e;
  vec3 col = oklch(mix(Ll, Ld, uDark), mix(Cl, Cd, uDark), h);
  vec2 uv = gl_FragCoord.xy / uRes;
  col *= mix(1.0, 0.82 + 0.18 * smoothstep(1.1, 0.25, length(uv - 0.5)), uDark);
  col += (hash(gl_FragCoord.xy + t) - 0.5) / 255.0; // dither: no banding on slow gradients
  o = vec4(col, 1.0);
}`;

const smooth = (x) => x * x * (3 - 2 * x);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export default function Aurora({ reduce, onReady }) {
  const host = useRef(null);

  useEffect(() => {
    let renderer;
    try {
      renderer = new Renderer({ alpha: false, antialias: false, dpr: 1, webgl: 2, powerPreference: "high-performance" });
    } catch { return; }
    const gl = renderer.gl;
    if (!gl || !renderer.isWebgl2) return;
    const canvas = gl.canvas;
    host.current.appendChild(canvas);

    const maxDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const coarse = matchMedia("(pointer: coarse)").matches;
    let scale = coarse ? 0.6 : maxDpr * 0.8; // a soft field does not need native resolution
    const stats = (window.__aurora = { scale, ema: 16, frames: 0, steps: 0 });

    const trail = new Array(N * 4).fill(0); // plain array: OGL only accepts array uniforms in that form
    const program = new Program(gl, {
      vertex: vert, fragment: frag,
      uniforms: {
        uRes: { value: [1, 1] }, uTime: { value: 7 }, uHue: { value: 265 }, uInt: { value: 1 },
        uDark: { value: 1 }, uScroll: { value: 0 }, uPtrAmt: { value: 0 }, uPtr: { value: [0, 0] },
        uTrail: { value: trail },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Geometry(gl, { position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) } }), program });
    const U = program.uniforms;

    const resize = () => {
      renderer.dpr = scale;
      renderer.setSize(innerWidth, innerHeight);
      U.uRes.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
      stats.scale = scale;
    };
    resize();

    // Section keyframes come from the DOM (data-hue / data-int) so content and colour stay in sync.
    let secs = [];
    const measure = () => {
      secs = [...document.querySelectorAll("[data-hue]")].map((el) => ({
        top: el.getBoundingClientRect().top + scrollY, h: el.offsetHeight,
        hue: +el.dataset.hue, int: +(el.dataset.int || 1),
      }));
    };
    const target = () => {
      if (!secs.length) return [265, 1];
      const pos = scrollY + innerHeight * 0.5;
      let i = secs.findIndex((s, k) => pos < (secs[k + 1]?.top ?? Infinity));
      if (i < 0) i = secs.length - 1;
      const s = secs[i], n = secs[i + 1] || s;
      const u = smooth(clamp01(((pos - s.top) / s.h - 0.55) / 0.45));
      return [s.hue + (n.hue - s.hue) * u, s.int + (n.int - s.int) * u];
    };
    const isDark = () => (document.documentElement.dataset.theme === "light" ? 0 : 1);

    measure();
    let [hue, inten] = target();
    let dark = isDark(), time = 7;

    const draw = () => { renderer.render({ scene: mesh }); };
    const apply = () => {
      U.uHue.value = hue; U.uInt.value = inten; U.uDark.value = dark;
      U.uScroll.value = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
    };

    let ro, themeObs, off, onResize;
    let ready = false;
    const markReady = () => { if (!ready) { ready = true; onReady?.(); } };

    if (reduce) {
      // Static frame: no loop, no drift. Redraw only when size, theme or layout changes.
      const still = () => { measure(); [hue, inten] = target(); dark = isDark(); apply(); draw(); };
      onResize = () => { resize(); still(); };
      addEventListener("resize", onResize);
      themeObs = new MutationObserver(still);
      themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      still(); markReady();
    } else {
      ro = new ResizeObserver(measure); ro.observe(document.body);
      onResize = () => { resize(); measure(); };
      addEventListener("resize", onResize);
      let head = 0, frames = 0, slow = 0, ptrAmt = 0;
      off = onFrame((now, dt) => {
        time += dt;
        // adaptive resolution: if the frame budget stays blown, render fewer pixels
        stats.ema += (dt * 1000 - stats.ema) * 0.05;
        if (++frames > 30 && stats.ema > 26) {
          if (++slow > 20 && scale > 0.35) { scale = Math.max(0.35, scale * 0.8); slow = 0; stats.steps++; resize(); }
        } else slow = 0;
        stats.frames++;

        const [th, ti] = target();
        hue += (th - hue) * (1 - Math.pow(0.04, dt));
        inten += (ti - inten) * (1 - Math.pow(0.04, dt));
        dark += (isDark() - dark) * (1 - Math.pow(0.01, dt));
        ptrAmt += (live.active - ptrAmt) * (1 - Math.pow(0.05, dt));

        const w = innerWidth, h = innerHeight;
        const px = (live.sx - w / 2) / h, py = (h / 2 - live.sy) / h;
        U.uPtr.value = live.seen ? [px, py] : [9, 9]; U.uPtrAmt.value = ptrAmt;
        const decay = Math.pow(0.93, dt * 60);
        for (let i = 0; i < N; i++) { trail[i * 4 + 2] *= decay; trail[i * 4 + 3] *= decay; }
        const vx = live.vx / h, vy = -live.vy / h, m = Math.hypot(vx, vy);
        if (live.seen && m > 0.0004) {
          head = (head + 1) % N;
          const s = m > 0.05 ? 0.05 / m : 1;
          trail.splice(head * 4, 4, px, py, vx * s, vy * s);
        }
        U.uTime.value = time; apply(); draw();
        if (frames === 2) markReady();
      });
    }

    return () => {
      off?.(); ro?.disconnect(); themeObs?.disconnect();
      removeEventListener("resize", onResize);
      canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduce, onReady]);

  return <div ref={host} className="aurora" aria-hidden="true" />;
}
