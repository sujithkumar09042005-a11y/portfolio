// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
// Procedural "Journey" world: everything is code-built geometry, one fixed canvas.
import {
  WebGLRenderer, Scene, PerspectiveCamera, FogExp2, Color, Vector2, Vector3, CatmullRomCurve3,
  Group, Mesh, LineSegments, LineLoop, BufferGeometry, BufferAttribute, InstancedBufferAttribute,
  InstancedMesh, Object3D, Points, ShaderMaterial, LineBasicMaterial, MeshBasicMaterial,
  IcosahedronGeometry, OctahedronGeometry, TetrahedronGeometry, BoxGeometry, TorusGeometry,
  SphereGeometry, CylinderGeometry, EdgesGeometry, DoubleSide, ColorManagement, LinearSRGBColorSpace,
} from "three";
import { oklch } from "./color.js";
import { store } from "./store.js";

// ---------- layout of the journey ----------
// Stops: hero, about, stack, 3 projects, 3 experience, contact (matches [data-stop] order in the DOM)
const ZS = [0, -32, -64, -98, -114, -130, -158, -174, -190, -222];
const N = ZS.length;
const pathX = (z) => Math.sin(z * 0.03) * 4;
const pathY = (z) => Math.cos(z * 0.022) * 2;
const FAR_Z = -250;

// ---------- shared uniforms (same objects referenced by every custom material) ----------
const G = {
  uTime: { value: 0 }, uFog: { value: new Color() }, uFogD: { value: 0.014 }, uTheme: { value: 0 },
  uPtr: { value: new Vector2(9, 9) }, uAspect: { value: 1 }, uPx: { value: 1 },
  uA: { value: new Color() }, uB: { value: new Color() },
};

const REPEL = /* glsl */`
uniform vec2 uPtr; uniform float uAspect;
vec4 repel(vec4 clip, float k, out float push) {
  vec2 ndc = clip.xy / clip.w; vec2 d = ndc - uPtr; d.x *= uAspect;
  float r2 = dot(d, d); push = exp(-r2 / 0.05);
  vec2 dir = d / (sqrt(r2) + 0.0001); dir.x /= uAspect;
  clip.xy += dir * push * k * clip.w; return clip;
}`;

const FACET_V = /* glsl */`
varying vec3 vV; varying vec3 vC; varying float vDist;
void main() {
  vec4 p = vec4(position, 1.0);
  #ifdef USE_INSTANCING
  p = instanceMatrix * p;
  #endif
  vec4 mv = modelViewMatrix * p;
  vV = mv.xyz; vDist = -mv.z;
  #ifdef USE_INSTANCING_COLOR
  vC = instanceColor;
  #else
  vC = vec3(1.0);
  #endif
  gl_Position = projectionMatrix * mv;
}`;

const FACET_F = /* glsl */`
uniform vec3 uColor; uniform vec3 uFog; uniform float uFogD, uTheme, uGlow, uGlass;
varying vec3 vV; varying vec3 vC; varying float vDist;
void main() {
  vec3 n = normalize(cross(dFdx(vV), dFdy(vV)));
  vec3 v = normalize(-vV);
  float fres = pow(1.0 - abs(dot(n, v)), 2.2);
  float diff = 0.5 + 0.5 * dot(n, normalize(vec3(0.35, 0.75, 0.55)));
  vec3 c = uColor * vC;
  vec3 dark = c * (0.05 + 0.22 * diff) + c * fres * uGlow;
  vec3 light = mix(vec3(0.97, 0.975, 1.0), c, 0.1 + 0.28 * (1.0 - diff) + 0.4 * fres);
  vec3 col = mix(dark, light, uTheme);
  float f = 1.0 - exp(-uFogD * uFogD * vDist * vDist);
  col = mix(col, uFog, f);
  float a = uGlass > 0.5 ? 0.1 + 0.55 * fres : 1.0;
  gl_FragColor = vec4(col, a);
}`;

const SHARD_V = /* glsl */`
attribute vec4 aSeed;
uniform float uTime;
varying vec3 vV; varying vec3 vC; varying float vDist;
${REPEL}
mat3 rot(vec3 ax, float a) {
  float s = sin(a), c = cos(a), o = 1.0 - c;
  return mat3(o*ax.x*ax.x+c, o*ax.x*ax.y+ax.z*s, o*ax.z*ax.x-ax.y*s,
              o*ax.x*ax.y-ax.z*s, o*ax.y*ax.y+c, o*ax.y*ax.z+ax.x*s,
              o*ax.z*ax.x+ax.y*s, o*ax.y*ax.z-ax.x*s, o*ax.z*ax.z+c);
}
void main() {
  vec3 ax = normalize(aSeed.xyz * 2.0 - 1.0 + 0.001);
  float a = uTime * (0.15 + aSeed.x * 0.5) + aSeed.y * 6.2831;
  vec3 lp = rot(ax, a) * position * (0.5 + aSeed.w * 1.3);
  vec4 w = instanceMatrix * vec4(lp, 1.0);
  w.y += sin(uTime * 0.5 + aSeed.z * 6.2831) * 0.8;
  vec4 mv = modelViewMatrix * w;
  vV = mv.xyz; vDist = -mv.z;
  float push;
  vec4 clip = repel(projectionMatrix * mv, 0.12, push);
  vC = mix(vec3(0.55), vec3(1.0), aSeed.w) * (1.0 + push);
  gl_Position = clip;
}`;

const PT_V = /* glsl */`
attribute vec4 aSeed;
uniform float uTime, uPx;
uniform vec3 uA, uB;
varying vec3 vCol; varying float vA;
uniform float uFogD;
${REPEL}
void main() {
  vec3 p = position;
  p += vec3(sin(uTime * 0.3 + aSeed.x * 6.28), cos(uTime * 0.25 + aSeed.y * 6.28), sin(uTime * 0.2 + aSeed.z * 6.28)) * 0.7;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = -mv.z;
  float push;
  vec4 clip = repel(projectionMatrix * mv, 0.16, push);
  gl_Position = clip;
  float tw = 0.65 + 0.35 * sin(uTime * 1.6 + aSeed.w * 40.0);
  gl_PointSize = max(1.6 * uPx, (0.5 + aSeed.x * 1.1) * uPx * 70.0 / dist) * (1.0 + push * 1.6);
  vCol = mix(uA, uB, aSeed.y);
  float f = 1.0 - exp(-uFogD * uFogD * dist * dist);
  vA = (1.0 - f) * tw * (0.55 + aSeed.w * 0.45) * (1.0 + push * 0.8) * smoothstep(0.5, 3.0, dist);
}`;
const PT_F = /* glsl */`
varying vec3 vCol; varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d) * vA;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vCol, a);
}`;

// ---------- helpers ----------
function mulberry(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const damp = (dt, k) => 1 - Math.exp(-dt * k);
const rgb = [0, 0, 0];
const rgb2 = [0, 0, 0];

export function createWorld(canvas, { onFirstFrame } = {}) {
  ColorManagement.enabled = false; // colours are authored as final sRGB values
  const coarse = matchMedia("(pointer: coarse)").matches || innerWidth < 700;
  const dprCap = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 1.75);
  const renderer = new WebGLRenderer({ canvas, antialias: !coarse, powerPreference: "high-performance" });
  renderer.outputColorSpace = LinearSRGBColorSpace;
  let dpr = dprCap;
  renderer.setPixelRatio(dpr);
  G.uPx.value = dpr;

  const scene = new Scene();
  scene.fog = new FogExp2(0x000000, G.uFogD.value);
  const camera = new PerspectiveCamera(56, 1, 0.1, 300);
  const rng = mulberry(7);

  // colour bookkeeping: every tinted material registers a Color here
  const tints = [];
  const tint = (col, hue, o = {}) => { tints.push({ col, hue, dh: o.dh || 0, C: o.C ?? 0.14, dL: o.dL || 0 }); return col; };

  const owned = []; // geometries and materials to dispose
  const own = (x) => { owned.push(x); return x; };

  function facet(hue, o = {}) {
    const col = tint(new Color(), hue, o);
    return own(new ShaderMaterial({
      uniforms: { ...G, uColor: { value: col }, uGlow: { value: o.glow ?? 1.2 }, uGlass: { value: o.glass ? 1 : 0 } },
      vertexShader: FACET_V, fragmentShader: FACET_F,
      transparent: !!o.glass, depthWrite: !o.glass, side: o.glass ? DoubleSide : 0,
    }));
  }
  function lineMat(hue, o = {}) {
    const m = own(new LineBasicMaterial({ transparent: true, opacity: o.op ?? 0.85 }));
    m.color = tint(new Color(), hue, o);
    return m;
  }
  function basicMat(hue, o = {}) {
    const m = own(new MeshBasicMaterial({ transparent: o.op != null, opacity: o.op ?? 1 }));
    m.color = tint(new Color(), hue, o);
    return m;
  }
  const geo = (g) => own(g);
  const edges = (g, hue, o) => new LineSegments(own(new EdgesGeometry(g, 12)), lineMat(hue, o));
  function circleGeo(r, seg = 96) {
    const a = new Float32Array(seg * 3);
    for (let i = 0; i < seg; i++) { const t = (i / seg) * Math.PI * 2; a[i * 3] = Math.cos(t) * r; a[i * 3 + 2] = Math.sin(t) * r; }
    const g = own(new BufferGeometry()); g.setAttribute("position", new BufferAttribute(a, 3)); return g;
  }

  // ---------- path ----------
  const pts = ZS.map((z) => new Vector3(pathX(z), pathY(z), z));
  pts.push(new Vector3(pathX(FAR_Z), pathY(FAR_Z), FAR_Z));
  const curve = new CatmullRomCurve3(pts, false, "centripetal");
  const camPos = new Vector3(), look = new Vector3();

  // ---------- ambient field: points ----------
  const phone = coarse;
  const tunnelN = phone ? 2200 : 5500;
  const floorX = phone ? 34 : 64, floorZ = phone ? 90 : 170;
  const total = tunnelN + floorX * floorZ;
  const pos = new Float32Array(total * 3);
  const seed = new Float32Array(total * 4);
  let o = 0;
  for (let i = 0; i < tunnelN; i++, o++) {
    const z = 18 - rng() * 250;
    const ang = rng() * Math.PI * 2;
    const r = 7 + Math.pow(rng(), 0.75) * 46;
    pos[o * 3] = pathX(z) + Math.cos(ang) * r;
    pos[o * 3 + 1] = pathY(z) + Math.sin(ang) * r * 0.7;
    pos[o * 3 + 2] = z;
  }
  for (let ix = 0; ix < floorX; ix++) for (let iz = 0; iz < floorZ; iz++, o++) {
    const z = 18 - (iz / floorZ) * 250 + (rng() - 0.5) * 1.2;
    const x = (ix / (floorX - 1) - 0.5) * 120 + (rng() - 0.5) * 1.4;
    const h = Math.sin(x * 0.11 + z * 0.05) * 2.2 + Math.cos(x * 0.05 - z * 0.09) * 2.8 + Math.sin(z * 0.2) * 0.6;
    pos[o * 3] = x; pos[o * 3 + 1] = pathY(z) - 11 + h; pos[o * 3 + 2] = z;
  }
  for (let i = 0; i < total * 4; i++) seed[i] = rng();
  const fieldGeo = own(new BufferGeometry());
  fieldGeo.setAttribute("position", new BufferAttribute(pos, 3));
  fieldGeo.setAttribute("aSeed", new BufferAttribute(seed, 4));
  const fieldMat = own(new ShaderMaterial({
    uniforms: { ...G }, vertexShader: PT_V, fragmentShader: PT_F, transparent: true, depthWrite: false,
  }));
  const field = new Points(fieldGeo, fieldMat);
  field.frustumCulled = false;
  scene.add(field);

  // ---------- ambient shards (instanced) ----------
  const shardN = phone ? 110 : 260;
  const shardGeo = geo(new TetrahedronGeometry(0.45, 0));
  const shardMat = own(new ShaderMaterial({
    uniforms: { ...G, uColor: { value: tint(new Color(), null, { dh: 40, C: 0.12 }) }, uGlow: { value: 1.0 }, uGlass: { value: 0 } },
    vertexShader: SHARD_V, fragmentShader: FACET_F,
  }));
  const shards = new InstancedMesh(shardGeo, shardMat, shardN);
  const sSeed = new Float32Array(shardN * 4);
  const dummy = new Object3D();
  for (let i = 0; i < shardN; i++) {
    const z = 10 - rng() * 245, ang = rng() * 6.283, r = 6 + rng() * 22;
    dummy.position.set(pathX(z) + Math.cos(ang) * r, pathY(z) + Math.sin(ang) * r * 0.8, z);
    dummy.updateMatrix(); shards.setMatrixAt(i, dummy.matrix);
    for (let k = 0; k < 4; k++) sSeed[i * 4 + k] = rng();
  }
  shardGeo.setAttribute("aSeed", new InstancedBufferAttribute(sSeed, 4));
  shards.frustumCulled = false;
  scene.add(shards);

  // ---------- chapter objects ----------
  const chapters = []; // { k, g, upd }
  const slots = []; // layout: where each group sits relative to its stop
  const stopPos = (k) => pts[k];
  function chapter(k, g, upd, side = 1, extra = {}) {
    scene.add(g);
    chapters.push({ k, g, upd, range: extra.range ?? 2.0 });
    if (!extra.free) slots.push({ g, k, side, dx: extra.dx ?? 5.2, dy: extra.dy ?? 0.2, dz: extra.dz ?? -15 });
    return g;
  }
  const px = () => store.sx, py = () => store.sy;

  // 0 HERO: glass icosahedron with a bright core and a thin ring
  {
    const g = new Group();
    const ico = geo(new IcosahedronGeometry(2.6, 1));
    g.add(new Mesh(ico, facet(null, { glass: true, glow: 1.6 })));
    g.add(edges(ico, null, { op: 0.8 }));
    const core = new Group();
    const ci = geo(new IcosahedronGeometry(1.05, 0));
    core.add(new Mesh(ci, facet(null, { dh: 50, glow: 2.2 })), edges(ci, null, { dh: 50, op: 1 }));
    g.add(core);
    const ring = new LineLoop(circleGeo(4.2), lineMat(null, { dh: 30, op: 0.6 })); ring.rotation.x = 1.2; g.add(ring);
    const ring2 = new LineLoop(circleGeo(3.5), lineMat(null, { dh: -30, op: 0.5 })); ring2.rotation.z = 0.9; g.add(ring2);
    chapter(0, g, (t) => {
      g.rotation.y = t * 0.18 + px() * 0.7; g.rotation.x = Math.sin(t * 0.3) * 0.12 + py() * 0.5;
      core.rotation.y = -t * 0.5; core.rotation.x = t * 0.31;
      ring.rotation.z = t * 0.12; ring2.rotation.y = -t * 0.2;
      const s = 1 + Math.sin(t * 1.1) * 0.035; g.scale.setScalar(s * g.userData.k);
    });
  }

  // 1 ABOUT: a gyroscope of three rings round a small octahedron
  {
    const g = new Group();
    const rs = [3.3, 2.7, 2.1].map((r, i) => {
      const m = new Mesh(geo(new TorusGeometry(r, 0.035, 6, 96)), basicMat(null, { dh: i * 25 }));
      g.add(m); return m;
    });
    const oc = geo(new OctahedronGeometry(0.9, 0));
    const core = new Group(); core.add(new Mesh(oc, facet(null, { dh: 60, glow: 2 })), edges(oc, null, { dh: 60 }));
    g.add(core);
    chapter(1, g, (t) => {
      rs[0].rotation.set(t * 0.35, t * 0.12, 0); rs[1].rotation.set(0.5, t * 0.45, t * 0.1); rs[2].rotation.set(t * 0.2, 0.3, t * 0.5);
      core.rotation.y = t * 0.6; g.rotation.y = px() * 0.5; g.rotation.x = py() * 0.4;
      g.scale.setScalar((1 + Math.sin(t * 0.9) * 0.04) * g.userData.k);
    }, -1);
  }

  // 2 STACK: eight instanced spheres orbiting a core, one per tool
  {
    const g = new Group();
    const ci = geo(new IcosahedronGeometry(0.95, 1));
    g.add(new Mesh(ci, facet(null, { dh: 20, glow: 2 })), edges(ci, null, { dh: 20 }));
    const sph = geo(new SphereGeometry(0.34, 10, 8));
    const orbs = new InstancedMesh(sph, facet(null, { glow: 1.6, dh: 0 }), 8);
    orbs.frustumCulled = false;
    const c = [0, 0, 0];
    for (let i = 0; i < 8; i++) { oklch(0.74, 0.13, 250 + i * 18, c); orbs.setColorAt(i, new Color(c[0], c[1], c[2])); }
    g.add(orbs);
    const radii = [2.3, 3.2, 4.1];
    const rings = radii.map((r, i) => { const l = new LineLoop(circleGeo(r), lineMat(null, { op: 0.35 })); l.rotation.set(i * 0.5 - 0.3, 0, i * 0.35); g.add(l); return l; });
    const d = new Object3D();
    chapter(2, g, (t) => {
      for (let i = 0; i < 8; i++) {
        const ri = i % 3, r = radii[ri];
        const a = t * (0.55 - ri * 0.12) * (ri === 1 ? -1 : 1) + i * 2.4;
        d.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
        d.position.applyEuler(rings[ri].rotation);
        d.rotation.set(t * 0.8, t * 0.5 + i, 0);
        d.scale.setScalar(1 + Math.sin(t * 1.5 + i) * 0.12);
        d.updateMatrix(); orbs.setMatrixAt(i, d.matrix);
      }
      orbs.instanceMatrix.needsUpdate = true;
      g.rotation.y = px() * 0.5 + t * 0.05; g.rotation.x = py() * 0.4;
      g.scale.setScalar(g.userData.k);
    }, 1);
  }

  // Gate: three rings the camera flies through on the way to the projects
  const gates = [];
  {
    for (let i = 0; i < 3; i++) {
      const z = -80 - i * 6.5;
      const g = new Group();
      const R = 8.2 + i * 0.6;
      g.add(new Mesh(geo(new TorusGeometry(R, 0.045, 6, 120)), basicMat(null, { dh: 30 + i * 20, dL: -0.18, C: 0.1 })));
      const ticks = new LineLoop(circleGeo(R - 0.7, 48), lineMat(null, { dh: 30, op: 0.5 }));
      ticks.rotation.x = Math.PI / 2; g.add(ticks);
      g.position.set(pathX(z), pathY(z), z);
      scene.add(g); gates.push(g);
    }
  }

  // 3-5 PROJECTS: three distinct monoliths
  const proj = (k, side, build) => {
    const g = new Group(); const upd = build(g);
    chapter(k, g, (t) => { upd(t); g.scale.setScalar(g.userData.k * 1.15); }, side, { range: 1.25 });
  };
  // FeastFlow: a stack of slabs that slide like a conveyor, with a rider orbiting
  proj(3, 1, (g) => {
    const H = 55;
    const slab = geo(new BoxGeometry(3.4, 0.5, 1.7));
    const slabs = [];
    for (let i = 0; i < 6; i++) {
      const m = new Group();
      m.add(new Mesh(slab, facet(H, { glow: 1.4 })), edges(slab, H, { op: 0.9 }));
      m.position.y = (i - 2.5) * 0.72; g.add(m); slabs.push(m);
    }
    const rider = new Mesh(geo(new SphereGeometry(0.22, 12, 10)), basicMat(H, { dL: 0.1 }));
    g.add(rider);
    const track = new LineLoop(circleGeo(3.1, 80), lineMat(H, { op: 0.5 })); track.rotation.x = 0.35; g.add(track);
    return (t) => {
      slabs.forEach((m, i) => { m.position.x = Math.sin(t * 0.9 + i * 0.9) * 0.55; m.rotation.y = Math.sin(t * 0.5 + i) * 0.08; });
      rider.position.set(Math.cos(t * 1.2) * 3.1, Math.sin(t * 1.2) * 3.1 * Math.sin(0.35), Math.sin(t * 1.2) * 3.1 * Math.cos(0.35));
      g.rotation.y = t * 0.2 + px() * 0.6; g.rotation.x = py() * 0.3;
    };
  });
  // Voyager: a tall spire with two compass rings and a travelling pin
  proj(4, -1, (g) => {
    const H = 215;
    const spire = geo(new OctahedronGeometry(1, 0));
    const sp = new Group(); sp.scale.set(1.15, 3.4, 1.15);
    sp.add(new Mesh(spire, facet(H, { glow: 1.6 })), edges(spire, H, { op: 0.95 }));
    g.add(sp);
    const r1 = new LineLoop(circleGeo(2.6, 96), lineMat(H, { op: 0.75 })), r2 = new LineLoop(circleGeo(3.3, 96), lineMat(H, { op: 0.5 }));
    g.add(r1, r2);
    const pin = new Mesh(geo(new SphereGeometry(0.2, 12, 10)), basicMat(H, { dL: 0.12 })); g.add(pin);
    return (t) => {
      r1.rotation.set(0.4, t * 0.3, 0.2); r2.rotation.set(-0.5, -t * 0.22, 0.7);
      pin.position.set(Math.cos(t * 0.9) * 2.6, 0, Math.sin(t * 0.9) * 2.6).applyEuler(r1.rotation);
      sp.position.y = Math.sin(t * 0.8) * 0.2;
      g.rotation.y = -t * 0.15 + px() * 0.6; g.rotation.x = py() * 0.3;
    };
  });
  // SplitWise: a block split in two halves that drift apart and settle, with three settling cubes
  proj(5, 1, (g) => {
    const H = 335;
    const half = geo(new BoxGeometry(1.5, 3.2, 1.9));
    const a = new Group(), b = new Group();
    a.add(new Mesh(half, facet(H, { glow: 1.5 })), edges(half, H, { op: 0.95 }));
    b.add(new Mesh(half, facet(H, { glow: 1.5 })), edges(half, H, { op: 0.95 }));
    g.add(a, b);
    const cube = geo(new BoxGeometry(0.55, 0.55, 0.55));
    const cubes = [0, 1, 2].map(() => { const m = new Group(); m.add(new Mesh(cube, facet(H, { glow: 2, dL: 0.05 })), edges(cube, H, { dL: 0.1 })); g.add(m); return m; });
    return (t) => {
      const s = 0.95 + (Math.sin(t * 0.8) * 0.5 + 0.5) * 0.7;
      a.position.x = -s; b.position.x = s;
      cubes.forEach((m, i) => {
        const ph = t * 0.8 + i * 2.1;
        m.position.set(Math.sin(ph) * 0.35 * (i - 1), -2.4 + Math.abs(Math.sin(ph * 0.5)) * 0.5, (i - 1) * 0.5);
        m.rotation.set(t * 0.7 + i, t * 0.5, 0);
      });
      g.rotation.y = t * 0.17 + px() * 0.6; g.rotation.x = py() * 0.3;
    };
  });

  // 6-8 EXPERIENCE: a path of hex stepping stones rising toward the present
  const stones = [];
  {
    const g = new Group();
    const sg = geo(new CylinderGeometry(1.5, 1.8, 0.5, 6));
    const mk = (major) => {
      const m = new Group();
      m.add(new Mesh(sg, facet(null, { glow: major ? 1.8 : 1.1, dh: major ? 40 : 0 })), edges(sg, null, { dh: major ? 40 : 0, op: major ? 1 : 0.5 }));
      m.scale.setScalar(major ? 1.15 : 0.62);
      g.add(m); return m;
    };
    // order along the path: M0 m m M1 m m M2
    const order = [1, 0, 0, 1, 0, 0, 1];
    order.forEach((mj) => stones.push({ m: mk(mj), major: !!mj }));
    const halo = new LineLoop(circleGeo(2.4, 64), lineMat(null, { dh: 40, op: 0.9 }));
    g.add(halo);
    const beacon = new Mesh(geo(new OctahedronGeometry(0.4, 0)), basicMat(null, { dh: 50, dL: 0.1 }));
    g.add(beacon);
    chapter(7, g, (t) => {
      stones.forEach((s, i) => { s.m.rotation.y = Math.sin(t * 0.3 + i) * 0.2; s.m.position.y = s.base + Math.sin(t * 0.7 + i * 1.3) * 0.12; });
      const last = stones[6].m;
      halo.position.copy(last.position); halo.position.y += 0.4; halo.scale.setScalar(1 + Math.sin(t * 2) * 0.08);
      beacon.position.copy(last.position); beacon.position.y += 1.5 + Math.sin(t * 1.4) * 0.25; beacon.rotation.y = t;
    }, 1, { free: true, range: 2.6 });
  }

  // 9 CONTACT: a warm beacon
  {
    const g = new Group();
    const ico = geo(new IcosahedronGeometry(3, 2));
    g.add(new Mesh(ico, facet(30, { glass: true, glow: 1.8 })), edges(ico, 30, { op: 0.35 }));
    const core = new Mesh(geo(new SphereGeometry(0.9, 20, 14)), basicMat(30, { dL: 0.12, C: 0.15 })); g.add(core);
    const r1 = new LineLoop(circleGeo(4.4), lineMat(30, { op: 0.6 })), r2 = new LineLoop(circleGeo(5.2), lineMat(30, { op: 0.35 }));
    g.add(r1, r2);
    chapter(9, g, (t) => {
      r1.rotation.set(t * 0.2, 0, 0.5); r2.rotation.set(-t * 0.15, 0, -0.4);
      g.rotation.y = t * 0.1 + px() * 0.5; core.scale.setScalar(1 + Math.sin(t * 1.3) * 0.08);
      g.scale.setScalar(g.userData.k);
    }, 1, { dz: -18, range: 2.5 });
  }

  // ---------- layout (depends on aspect) ----------
  let wide = true;
  function layout() {
    wide = camera.aspect > 1.05;
    for (const s of slots) {
      const p = stopPos(s.k);
      if (wide) s.g.position.set(p.x + s.side * s.dx, p.y + s.dy, p.z + s.dz);
      else s.g.position.set(p.x, p.y + (s.k === 1 ? 7.2 : 4.9), p.z + s.dz - 3);
      s.g.userData.k = wide ? 1 : 0.8;
    }
    // stones: majors at experience stops, minors interpolated
    const maj = [6, 7, 8].map((k) => { const p = stopPos(k); return wide ? new Vector3(p.x + 4.6, p.y - 2.4, p.z - 12) : new Vector3(p.x, p.y + 2.2, p.z - 14); });
    const spots = [maj[0]];
    for (let i = 0; i < 2; i++) for (let j = 1; j <= 3; j++) spots.push(new Vector3().lerpVectors(maj[i], maj[i + 1], j / 3));
    stones.forEach((s, i) => {
      s.m.position.copy(spots[i]); s.m.position.y += i * 0.12; s.base = s.m.position.y;
    });
    const ex = chapters.find((c) => c.k === 7);
    ex.g.userData.k = 1;
  }

  // ---------- DOM anchors -> camera position ----------
  let anchors = [];
  function measure() {
    const els = document.querySelectorAll("[data-stop]");
    const y = scrollY;
    anchors = Array.from(els, (e) => { const r = e.getBoundingClientRect(); return y + r.top + r.height / 2; });
  }
  function stopIndex(s) {
    const n = anchors.length;
    if (n < 2) return 0;
    if (s <= anchors[0]) return 0;
    for (let i = 0; i < n - 1; i++) {
      if (s < anchors[i + 1]) return Math.min(N - 1, i + (s - anchors[i]) / Math.max(1, anchors[i + 1] - anchors[i]));
    }
    return Math.min(N - 1, n - 1);
  }

  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    G.uAspect.value = w / h;
    baseFov = w / h < 1 ? 66 : 56;
    camera.fov = baseFov; camera.updateProjectionMatrix();
    layout(); measure();
  }
  let baseFov = 56;

  // ---------- palette ----------
  let th = 0;
  const bgCss = document.documentElement;
  function palette(idx, frame) {
    const hue = 262 + 9 * idx;
    const hh = hue % 360;
    const lerp = (a, b) => a + (b - a) * th;
    const L = lerp(0.78, 0.46), Cs = lerp(1, 1.15);
    // background + fog tinted by the arc
    oklch(0.165, 0.032, hh, rgb); oklch(0.965, 0.016, hh, rgb2);
    const r = lerp(rgb[0], rgb2[0]), g = lerp(rgb[1], rgb2[1]), b = lerp(rgb[2], rgb2[2]);
    G.uFog.value.setRGB(r, g, b); scene.fog.color.setRGB(r, g, b);
    renderer.setClearColor(G.uFog.value, 1);
    if (frame % 8 === 0) bgCss.style.setProperty("--sbg", `rgb(${(r * 255) | 0} ${(g * 255) | 0} ${(b * 255) | 0})`);
    oklch(L, 0.14 * Cs, hh, rgb); G.uA.value.setRGB(rgb[0], rgb[1], rgb[2]);
    oklch(L, 0.14 * Cs, hh + 55, rgb); G.uB.value.setRGB(rgb[0], rgb[1], rgb[2]);
    for (let i = 0; i < tints.length; i++) {
      const t = tints[i];
      oklch(L + t.dL * (1 - th * 0.6), t.C * Cs, (t.hue == null ? hue : t.hue) + t.dh, rgb);
      t.col.setRGB(rgb[0], rgb[1], rgb[2]);
    }
  }

  // ---------- loop ----------
  let idx = 0, velS = 0, last = 0, tt = 0, raf = 0, frames = 0, slow = 0, firstDone = false;
  let sx = 0, sy = 0, ema = 1 / 60, disposed = false;
  const hasMoved = () => store.moved && performance.now() - store.t < 4000;
  store.sx = 0; store.sy = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.max(0.001, Math.min(0.05, (now - last) / 1000 || 0.016)); last = now; tt += dt; frames++;
    ema += (dt - ema) * 0.08;

    // adaptive resolution: drop DPR if frames stay slow
    if (ema > 1 / 38) { if (++slow > 40 && dpr > 0.75) { dpr = Math.max(0.75, dpr - 0.25); renderer.setPixelRatio(dpr); G.uPx.value = dpr; renderer.setSize(canvas.clientWidth, canvas.clientHeight, false); slow = 0; } } else slow = 0;

    // scroll -> stop index, damped
    const target = stopIndex(scrollY + innerHeight * 0.5);
    const prev = idx;
    idx += (target - idx) * damp(dt, 4.2);
    velS += ((idx - prev) / Math.max(dt, 0.001) - velS) * damp(dt, 6);

    // pointer (real when recently moved, otherwise a slow ambient drift)
    const live = hasMoved();
    const tx = live ? store.px : Math.sin(tt * 0.33) * 0.3, ty = live ? store.py : Math.cos(tt * 0.27) * 0.18;
    sx += (tx - sx) * damp(dt, 3.5); sy += (ty - sy) * damp(dt, 3.5);
    store.sx = sx; store.sy = sy;
    G.uPtr.value.set(live ? store.px : 9, live ? store.py : 9);

    th += ((document.documentElement.dataset.theme === "light" ? 1 : 0) - th) * damp(dt, 4);
    G.uTime.value = tt; G.uTheme.value = th;
    palette(idx, frames);

    // camera on the spline, parallaxed by the pointer
    const u = Math.max(0, Math.min(1, idx / N));
    curve.getPoint(u, camPos); curve.getPoint(Math.min(1, u + 0.6 / N), look);
    camera.position.set(camPos.x + sx * 1.5, camPos.y + sy * 1.0 + Math.sin(tt * 0.4) * 0.12, camPos.z);
    look.x += sx * 2.2; look.y += sy * 1.4;
    camera.lookAt(look);
    camera.rotateZ(-sx * 0.05 + Math.sin(tt * 0.23) * 0.01);
    const fov = baseFov + Math.min(14, Math.abs(velS) * 4);
    if (Math.abs(fov - camera.fov) > 0.02) { camera.fov = fov; camera.updateProjectionMatrix(); }

    for (let i = 0; i < chapters.length; i++) {
      const c = chapters[i];
      const vis = Math.abs(c.k - idx) < c.range;
      c.g.visible = vis;
      if (vis) c.upd(tt);
    }
    const gv = idx > 2.6 && idx < 4.4;
    for (let i = 0; i < gates.length; i++) { gates[i].visible = gv; if (gv) { gates[i].rotation.z = tt * (0.12 + i * 0.05) * (i % 2 ? -1 : 1); } }

    renderer.render(scene, camera);
    if (!firstDone) { firstDone = true; onFirstFrame && onFirstFrame(); }
  }

  const onVis = () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else if (!raf && !disposed) { last = performance.now(); raf = requestAnimationFrame(frame); }
  };
  const onMove = (e) => {
    store.px = (e.clientX / innerWidth) * 2 - 1; store.py = -((e.clientY / innerHeight) * 2 - 1);
    store.moved = true; store.t = performance.now();
  };
  const ro = new ResizeObserver(() => measure());
  ro.observe(document.body);
  addEventListener("resize", resize);
  addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("visibilitychange", onVis);
  resize();
  last = performance.now();
  raf = requestAnimationFrame(frame);

  window.__journey = { get frames() { return frames; }, get dpr() { return dpr; }, get idx() { return idx; }, get fps() { return 1 / ema; }, get calls() { return renderer.info.render.calls; } };

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    removeEventListener("resize", resize);
    removeEventListener("pointermove", onMove);
    document.removeEventListener("visibilitychange", onVis);
    owned.forEach((x) => x.dispose && x.dispose());
    renderer.dispose();
    delete window.__journey;
  };
}
