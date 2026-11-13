import { useEffect, useRef, useState } from "react";
import { DIVE_CHAPTERS, DIVE_INTRO, DIVE_PALETTE, DIVE_PALETTES, HERO_LINES } from "../data.js";
import { chapterColors, worldColors } from "../palette.js";
import { useReducedMotion, useScroll } from "../hooks.js";

// World units are CSS pixels along z. The camera moves forward by `s`; an object at world z sits at z + s on screen.
const N = DIVE_CHAPTERS.length;
const GAP = 1200;                  // distance between chapter scenes
const FIRST = 1.6;                 // the first scene starts 1.6 gaps away, so the opening is just the name and the tunnel
const D = (FIRST + N - 1) * GAP;   // total travel: the last scene ends at the camera plane
const RING_GAP = 250;
const RINGS = Math.ceil((D + 2400) / RING_GAP);
const SECTION_VH = Math.round(100 + D * 0.0833);   // about 0.75 screen pixels of scrolling per pixel of travel
const SECTION_VH_M = Math.round(100 + D * 0.0688);

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
// Fades in from far away, full while near, fades out as it passes the camera.
const seen = (z) => smooth(-2400, -600, z) * (1 - smooth(0, 350, z));
const cardZ = (i) => -(FIRST + i) * GAP;

// Colour worlds. The hue drifts along the palette's arc as the camera travels, so every moment has its own colour and
// neighbouring chapters are close relatives at the same lightness (see palette.js and DIVE_PALETTES in data.js).
const PAL = DIVE_PALETTES[DIVE_PALETTE];
const hueAt = (s) => {
  const f = clamp((s - (cardZ(0) * -1)) / GAP, 0, N - 1) / (N - 1);   // 0 at the first chapter, 1 at the last
  return PAL.arc[0] + (PAL.arc[1] - PAL.arc[0]) * f;
};
const STREAKS = 26;
const streakSeed = Array.from({ length: STREAKS }, (_, k) => {
  const a = (k * 137.508) % 360, r = 0.18 + ((k * 0.61803) % 1) * 0.78;     // golden-angle scatter around the vanishing point
  return { a, r, len: 0.5 + ((k * 0.381966) % 1) * 0.9, warm: k % 5 === 0 };
});

// The readable copy flies with the scene: it arrives from the vanishing point at the speed of the world, slows to a
// near-stop while you read it, then flies past you. Index 0 is the intro, 1..N are the chapters.
// Tuned by simulation: no two texts visible together, no dead stretches, and the text stays with its giant word.
const HOLD = 380, INTRO_HOLD = 700, OFFSET = 400;
const REST = 0.7;                       // the middle 70% of the hold is perfectly flat, so the text is pixel-sharp while you read it
const centre = (c) => (c === 0 ? 0 : (FIRST + c - 1) * GAP - OFFSET);
const hold = (c) => (c === 0 ? INTRO_HOLD : HOLD);
const EDGE_Z = 53;                      // how far the text has drifted by the end of its hold (as before)
const copyZ = (s, c) => {
  const h = hold(c), u = s - centre(c), a = Math.abs(u), d = h * REST, sign = u < 0 ? -1 : 1;
  if (a <= d) return 0;
  if (a <= h) return sign * ((a - d) / (h - d)) * EDGE_Z;
  return sign * (a - h + EDGE_Z);
};
const enter = (z) => clamp((z + 420) / 340, 0, 1);              // 0 far away, 1 once it has arrived
const leave = (z) => 1 - smooth(40, 280, z);                    // 1 until it starts to pass, 0 once it is by
const copyOpacity = (z) => leave(z) * clamp(enter(z) * 2.5, 0, 1);

function activeAt(s) {
  let best = -1, m = 0;
  for (let c = 0; c <= N; c++) { const o = copyOpacity(copyZ(s, c)); if (o > m) { m = o; best = c; } }
  return m < 0.3 ? -1 : best - 1;      // -1 is the intro
}
// Where along the page's scroll a chapter's copy has arrived, as a fraction of the pinned travel (used for #anchors).
const anchorFraction = (i) => centre(i + 1) / D;

// The floating words around each chapter's big word, flattened with their world depth.
const WORDS = DIVE_CHAPTERS.flatMap((c, i) => (c.words || []).map(([t, x, y, off, acc]) => ({ i, t, x, y, z: cardZ(i) + off, acc: !!acc })));

/** A short title split into words so each can rise in turn as the chapter arrives. Screen readers still read it as a sentence. */
function Words({ text }) {
  return text.split(" ").map((w, i, all) => (
    <span key={i}><span className="tw" style={{ "--i": i }}>{w}</span>{i < all.length - 1 ? " " : ""}</span>
  ));
}

/**
 * The whole story in one forward flight: the name, About, three projects, then experience. Each chapter is a scene made of
 * type alone: one giant outlined word, floating words at other depths, and the readable copy flying in with them.
 * CSS 3D only. Reduced-motion visitors get every chapter as plain stacked content.
 */
export default function Dive() {
  const reduce = useReducedMotion();
  const sec = useRef(null);
  const world = useRef(null);
  const spin = useRef(null);
  const bar = useRef(null);
  const rings = useRef([]);
  const bigs = useRef([]);
  const words = useRef([]);
  const items = useRef([]);
  const name = useRef(null);
  const stage = useRef(null);
  const streaks = useRef([]);
  const st = useRef({ s: 0, px: 0, py: 0, tx: 0, ty: 0, v: 0, lastS: 0, phase: 0, lastT: 0, loop: 0 });
  const [active, setActive] = useState(-1);

  const write = () => {
    const { s, px, py } = st.current;
    world.current.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, ${s.toFixed(1)}px)`;
  };

  // The streaks are driven by a smoothed travel speed and their own phase, so they keep flying and fade out after scrolling stops.
  const paintSpeed = () => {
    const c = st.current;
    const speed = clamp(Math.abs(c.v) / 70, 0, 1), dir = c.v >= 0 ? 1 : -1;
    if (stage.current) stage.current.style.setProperty("--speed", speed.toFixed(3));
    streaks.current.forEach((el, k) => {
      if (!el) return;
      const run = (((c.phase * 0.5 + k * 400) % 1600) + 1600) % 1600;
      const t = dir > 0 ? run / 1600 : 1 - run / 1600;
      el.style.setProperty("--t", t.toFixed(3));
      el.style.opacity = (speed * (0.25 + 0.75 * Math.sin(Math.PI * t))).toFixed(3);
    });
  };
  const speedLoop = () => {
    const c = st.current;
    c.loop = 0;
    if (performance.now() - c.lastT > 70) c.v *= 0.9;          // no scroll for a moment: slow down
    c.phase += c.v;
    paintSpeed();
    if (Math.abs(c.v) > 0.4) c.loop = requestAnimationFrame(speedLoop);
    else { c.v = 0; paintSpeed(); }
  };
  useEffect(() => () => cancelAnimationFrame(st.current.loop), []);

  useScroll(() => {
    if (reduce || !sec.current) return;
    const travel = sec.current.offsetHeight - innerHeight;
    const p = travel > 0 ? clamp(-sec.current.getBoundingClientRect().top / travel, 0, 1) : 0;
    const s = p * D;
    const c = st.current;
    c.v += ((s - c.lastS) - c.v) * 0.35; c.lastS = s;                 // smoothed travel speed in px per frame
    c.s = s;
    write();
    // 2) colour world: one hue drifting along the palette's arc; the colours are OKLCH at fixed lightness steps per theme
    const lt = document.documentElement.dataset.theme === "light";
    const w = worldColors(lt ? "light" : "dark", hueAt(s), PAL);
    stage.current.style.setProperty("--c1", w.c1);
    stage.current.style.setProperty("--c2", w.c2);
    stage.current.style.setProperty("--pop", w.pop);
    chapterColors.c1 = w.c1; chapterColors.c2 = w.c2; chapterColors.pop = w.pop;
    // 1) speed streaks: they stretch and brighten with how fast you scroll, then fade away when you stop (see paintSpeed)
    c.lastT = performance.now();
    if (!c.loop) c.loop = requestAnimationFrame(speedLoop);
    paintSpeed();
    // 4) a light source: the vanishing-point glow swells as a chapter arrives and settles while you read it
    let arrive = 0;
    for (let i = 0; i < N; i++) { const o = seen(cardZ(i) + s); if (o > arrive) arrive = o; }
    stage.current.style.setProperty("--lit", (0.55 + 0.45 * arrive).toFixed(3));
    bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
    name.current.style.opacity = String(1 - smooth(0, 350, s));
    spin.current.style.transform = `rotateZ(${(s * 0.004).toFixed(2)}deg)`;
    rings.current.forEach((el, k) => { if (el) el.style.opacity = (seen(-k * RING_GAP + s) * 0.5).toFixed(3); });
    bigs.current.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = seen(cardZ(i) + s).toFixed(3);
      el.style.setProperty("--rot", `${(Math.sin(s * 0.0011 + i * 1.3) * 1.6).toFixed(2)}deg`);
    });
    words.current.forEach((el, k) => {
      if (!el) return;
      const o = seen(WORDS[k].z + s) * 0.9;
      el.style.opacity = o.toFixed(3);
      if (o > 0.02) {   // a slow drift so the floating words are never still
        el.style.setProperty("--dx", `${(Math.sin(s * 0.0016 + k * 1.7) * 22).toFixed(1)}px`);
        el.style.setProperty("--dy", `${(Math.cos(s * 0.0012 + k * 0.9) * 12).toFixed(1)}px`);
      }
    });
    items.current.forEach((el, c) => {
      if (!el) return;
      const z = copyZ(s, c);
      // while it rests the text has no transform at all, so the browser draws it as ordinary, pixel-aligned text
      el.style.transform = z === 0 ? "none" : `translateZ(${z.toFixed(1)}px)`;   // otherwise the parent's perspective does the foreshortening
      el.style.opacity = copyOpacity(z).toFixed(3);
      el.style.setProperty("--e", enter(z).toFixed(3));
    });
    setActive(activeAt(s));
  });

  // The camera sways a little toward the pointer, so the background layers slide against the text.
  useEffect(() => {
    if (reduce || !window.matchMedia("(hover: hover)").matches) return;
    const c = st.current;
    let raf = 0, visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(sec.current);
    const move = (e) => { c.tx = (e.clientX / innerWidth - 0.5) * -46; c.ty = (e.clientY / innerHeight - 0.5) * -26; };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const dx = c.tx - c.px, dy = c.ty - c.py;
      if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return;
      c.px += dx * 0.06; c.py += dy * 0.06;
      write();
    };
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("pointermove", move); };
  }, [reduce]);

  const label = active < 0 ? "Start" : DIVE_CHAPTERS[active].label;
  const tab = (i) => (reduce || active === i ? 0 : -1);

  return (
    <section
      className={"dive" + (reduce ? " is-static" : "")}
      id="home" ref={sec} aria-label="About, projects and experience"
      style={{ "--dive-h": `${SECTION_VH}vh`, "--dive-h-m": `${SECTION_VH_M}vh` }}
    >
      {/* in-page anchors for the nav, placed along the pinned scroll where each chapter's copy has arrived */}
      {!reduce && DIVE_CHAPTERS.map((c, i) => c.anchor && (
        <span key={c.anchor} id={c.anchor} className="dive-anchor" style={{ "--f": anchorFraction(i) }} />
      ))}
      <div className="dive-stage" ref={stage}>
        <div className="dive-light" aria-hidden="true" />
        <div className="dive-streaks" aria-hidden="true">
          {streakSeed.map((sd, k) => (
            <i key={k} className={sd.warm ? "is-warm" : undefined} ref={(el) => { streaks.current[k] = el; }}
              style={{ "--a": `${sd.a}deg`, "--r": sd.r, "--len": sd.len }} />
          ))}
        </div>
        <div className="dive-view" aria-hidden="true">
          <div className="dive-world" ref={world}>
            <div className="dive-spin" ref={spin}>
              {Array.from({ length: RINGS }, (_, k) => (
                <i key={k} className={"dive-ring" + (k % 4 === 0 ? " is-accent" : "")}
                  ref={(el) => { rings.current[k] = el; }}
                  style={{ "--z": `${-k * RING_GAP}px`, "--r": `${k * 5}deg` }} />
              ))}
            </div>
            {DIVE_CHAPTERS.map((c, i) => (
              <span key={c.label} className="scene-big" data-t={c.big} data-on={active === i} ref={(el) => { bigs.current[i] = el; }} style={{ "--z": `${cardZ(i)}px` }}>{c.big}</span>
            ))}
            {WORDS.map((w, k) => (
              <span key={k} className={"scene-w" + (w.acc ? " is-accent" : "")} ref={(el) => { words.current[k] = el; }}
                style={{ "--x": `${w.x}vw`, "--y": `${w.y}vh`, "--z": `${w.z}px` }}>{w.t}</span>
            ))}
          </div>
        </div>
        <h1 className="dive-name" ref={name}>
          {HERO_LINES.map((l, i) => <span key={l}>{l}{i < HERO_LINES.length - 1 ? " " : ""}</span>)}
        </h1>

        <div className="dive-vignette" aria-hidden="true" />
        <div className="dive-ui">
          <ol className="dive-copy">
            <li data-on={active === -1} ref={(el) => { items.current[0] = el; }}>
              <div className="dive-block">
                <p className="dive-title"><Words text={DIVE_INTRO} /></p>
              </div>
            </li>
            {DIVE_CHAPTERS.map((c, i) => (
              <li key={c.label} data-on={active === i} id={reduce ? c.anchor : undefined} ref={(el) => { items.current[i + 1] = el; }}>
                <div className="dive-block">
                  <h2 className="dive-title"><Words text={c.title} /></h2>
                  <div className="dive-body">
                    <p>{c.text}</p>
                    {c.stack && <p className="dive-stack">{c.stack}</p>}
                    {c.href && <a className="dive-link" href={c.href} target="_blank" rel="noopener" tabIndex={tab(i)}>{c.link}<span className="visually-hidden"> (opens in a new tab)</span></a>}
                    {c.cta && (
                      <div className="dive-cta">
                        <a href="#contact" className="btn solid" tabIndex={tab(i)}><span>Get in touch</span></a>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="dive-hud">
            <p><span className="muted">Chapter</span> <b>{active + 1}</b> of {N} <span className="muted">&middot;</span> {label}</p>
            <span className="dive-track"><span ref={bar} /></span>
            <a href="#contact" className="dive-skip">Skip to contact</a>
          </div>
        </div>
      </div>
    </section>
  );
}
