import { useEffect, useRef, useState } from "react";
import { DIVE_INTRO, DIVE_PALETTE, DIVE_PALETTES, DIVE_SCENES, DIVE_SECTIONS, HERO_LINES } from "../data.js";
import { chapterColors, worldColors } from "../palette.js";
import LiveName from "./LiveName.jsx";
import { LiveText } from "./Live.jsx";
import { startPointer } from "../pointer.js";
import { useReducedMotion, useScroll } from "../hooks.js";

// World units are CSS pixels along z. The camera moves forward by `s`; an object at world z sits at z + s on screen.
const SCENES = DIVE_SCENES;
const N = SCENES.length;
const FIRST = 1700;                // the first scene starts 1700px away, so the opening is just the name and the tunnel
// How far apart the scenes sit: a heading scene is a short beat, a content scene holds still long enough to read.
// Tuned by simulation over every scroll position: no two scenes' text at once, no dead stretch, and each scene readable for
// about 640 to 730px of scrolling.
const SPAN = { head: 1100, about: 1100, projects: 1100, timeline: 1100 };
const POS = [];                    // z distance at which each scene is in front of the camera
SCENES.forEach((sc, i) => POS.push((i === 0 ? FIRST : POS[i - 1]) + (i === 0 ? 0 : SPAN[sc.kind])));
const D = POS[N - 1];              // total travel: the last scene ends at the camera plane
const RING_GAP = 250;
const RINGS = Math.ceil((D + 2400) / RING_GAP);
const SECTION_VH = Math.round(100 + D * 0.0833);   // about 0.75 screen pixels of scrolling per pixel of travel
const SECTION_VH_M = Math.round(100 + D * 0.0688);

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
// Fades in from far away, full while near, fades out as it passes the camera.
const seen = (z) => smooth(-2400, -600, z) * (1 - smooth(0, 350, z));
// A giant heading word arrives later than the floating words do: it stays out of sight while the scene before it is being read.
const seenBig = (z) => smooth(-1500, -450, z) * (1 - smooth(0, 350, z));
const cardZ = (i) => -POS[i];

// Colour worlds. The hue drifts along the palette's arc as the camera travels, so every moment has its own colour and
// neighbouring chapters are close relatives at the same lightness (see palette.js and DIVE_PALETTES in data.js).
const PAL = DIVE_PALETTES[DIVE_PALETTE];
const hueAt = (s) => {
  const f = clamp((s - POS[0]) / (POS[N - 1] - POS[0]), 0, 1);   // 0 at the first scene, 1 at the last
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
const HOLDS = { head: 320, about: 380, projects: 380, timeline: 380 }, INTRO_HOLD = 700, OFFSET = 300;
const REST = 0.7;                       // the middle 70% of the hold is perfectly flat, so the text is pixel-sharp while you read it
const centre = (c) => (c === 0 ? 0 : POS[c - 1] - OFFSET);
const hold = (c) => (c === 0 ? INTRO_HOLD : HOLDS[SCENES[c - 1].kind]);
const EDGE_Z = 53;                      // how far the text has drifted by the end of its hold (as before)
const copyZ = (s, c) => {
  const h = hold(c), u = s - centre(c), a = Math.abs(u), d = h * REST, sign = u < 0 ? -1 : 1;
  if (a <= d) return 0;
  if (a <= h) return sign * ((a - d) / (h - d)) * EDGE_Z;
  return sign * (a - h + EDGE_Z);
};
const enter = (z) => clamp((z + 340) / 260, 0, 1);              // 0 far away, 1 once it has arrived
const leave = (z) => 1 - smooth(40, 320, z);                    // 1 until it starts to pass, 0 once it is by
const copyOpacity = (z) => leave(z) * clamp(enter(z) * 2.5, 0, 1);

// Text reacts to the pointer only while it is actually visible: the scene's script writes its opacity, and this reads it.
const seenOn = (el, min) => !!el && parseFloat(el.style.opacity || "0") > min;

function activeAt(s) {
  let best = -1, m = 0;
  for (let c = 0; c <= N; c++) { const o = copyOpacity(copyZ(s, c)); if (o > m) { m = o; best = c; } }
  return m < 0.3 ? -1 : best - 1;      // -1 is the intro
}
// Where along the page's scroll a chapter's copy has arrived, as a fraction of the pinned travel (used for #anchors).
const anchorFraction = (i) => centre(i + 1) / D;
// The section a scene belongs to, for the chapter counter (heading and content scenes count as one chapter).
const chapterOf = (i) => (i < 0 ? 0 : SCENES[i].section + 1);

// The floating words around each chapter's big word, flattened with their world depth.
const WORDS = SCENES.flatMap((c, i) => (c.words || []).map(([t, x, y, off, acc]) => ({ i, t, x, y, z: cardZ(i) + off, acc: !!acc })));

/** A short title split into words so each can rise in turn as the chapter arrives, and then react to the pointer. Screen readers
 *  still read it as a sentence. */
function Words({ text, gate }) {
  return <LiveText text={text} kind="title" unit="words" gate={gate} perFrame outer="tw" />;
}


/** A heading scene: a short line under the giant word. The giant word itself flies in the scene; this is its caption. */
function HeadScene({ c, gate }) {
  return (
    <div className="scene-cap">
      <h2 className="scene-h"><Words text={c.title} gate={gate} /></h2>
    </div>
  );
}

/** About: one large statement on the left, a quiet column of facts on the right. Reads as a sentence and its footnotes. */
function AboutScene({ c, gate }) {
  return (
    <div className="scene-about">
      <p className="about-statement"><LiveText text={c.statement} kind="title" unit="words" perFrame gate={gate} outer="tw" /></p>
      <dl className="about-facts">
        {c.facts.map(([k, v]) => (
          <div key={k} className="about-fact"><dt>{k}</dt><dd><LiveText text={v} kind="body" unit="words" perFrame gate={gate} /></dd></div>
        ))}
      </dl>
    </div>
  );
}

/** Projects: an index. Each project is one row with its name set large, a single line about it, its stack and a link. */
function ProjectsScene({ c, gate, tab }) {
  return (
    <ol className="scene-index">
      {c.items.map((it, k) => (
        <li key={it.title} className="index-row" style={{ "--k": k }}>
          <h3 className="index-name"><LiveText text={it.title} kind="title" unit="whole" perFrame gate={gate} /></h3>
          <p className="index-line"><LiveText text={it.line} kind="body" unit="words" perFrame gate={gate} /></p>
          <p className="index-stack">{it.stack}</p>
          <a className="index-link" href={it.href} target="_blank" rel="noopener" tabIndex={tab}>
            <span>{it.link}</span><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
            <span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Experience: a timeline. One line runs down the scene, each step hangs off it with its dates beside it, in order. */
function TimelineScene({ c, gate, tab }) {
  return (
    <div className="scene-timeline">
      <ol className="tl-list">
        {c.items.map((it, k) => (
          <li key={it.title} className={"tl-step" + (k === c.items.length - 1 ? " is-now" : "")} style={{ "--k": k }}>
            <p className="tl-when">{it.when}</p>
            <div className="tl-body">
              <h3 className="tl-title"><LiveText text={it.title} kind="title" unit="whole" perFrame gate={gate} /></h3>
              <p className="tl-org">{it.org}</p>
              {it.text && <p className="tl-text"><LiveText text={it.text} kind="body" unit="words" perFrame gate={gate} /></p>}
            </div>
          </li>
        ))}
      </ol>
      {c.cta && <div className="dive-cta"><a href="#contact" className="btn solid" tabIndex={tab}><span>Get in touch</span></a></div>}
    </div>
  );
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
  const zone = useRef({ l: 0, t: 0, r: 0, b: 0 });
  const streaks = useRef([]);
  const st = useRef({ s: 0, px: 0, py: 0, tx: 0, ty: 0, v: 0, lastS: 0, phase: 0, lastT: 0, lastFrame: 0, loop: 0, calm: 0 });
  const [active, setActive] = useState(-1);
  useEffect(() => { startPointer(); }, []);

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
      el.style.opacity = (speed * (0.25 + 0.75 * Math.sin(Math.PI * t)) * (1 - c.calm * 0.85)).toFixed(3);
    });
  };
  const speedLoop = () => {
    const c = st.current, now = performance.now(), f = clamp((now - (c.lastFrame || now)) / 16.7, 0.2, 6);
    c.lastFrame = now; c.loop = 0;
    if (now - c.lastT > 70) c.v *= Math.pow(0.9, f);          // no scroll for a moment: slow down, at the same pace whatever the frame rate
    c.phase += c.v * f;
    paintSpeed();
    if (Math.abs(c.v) > 0.4) c.loop = requestAnimationFrame(speedLoop);
    else { c.v = 0; c.lastFrame = 0; paintSpeed(); }
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
    let calm = 0;
    for (let k = 0; k <= N; k++) { const o = copyOpacity(copyZ(s, k)); const kind = k === 0 ? "head" : SCENES[k - 1].kind; calm = Math.max(calm, o * (kind === "head" ? 0.3 : 0.75)); }
    c.calm = calm;
    stage.current.style.setProperty("--calm", calm.toFixed(3));
    // 2) colour world: one hue drifting along the palette's arc; the colours are OKLCH at fixed lightness steps per theme
    const lt = document.documentElement.dataset.theme === "light";
    const w = worldColors(lt ? "light" : "dark", hueAt(s), PAL);
    stage.current.style.setProperty("--c1", w.c1);
    stage.current.style.setProperty("--c2", w.c2);
    stage.current.style.setProperty("--pop", w.pop);
    stage.current.style.setProperty("--c1-text", w.c1text);
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
    rings.current.forEach((el, k) => { if (el) el.style.opacity = (seen(-k * RING_GAP + s) * 0.5 * (1 - calm * 0.7)).toFixed(3); });
    bigs.current.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = seenBig(cardZ(i) + s).toFixed(3);
      el.style.setProperty("--rot", `${(Math.sin(s * 0.0011 + i * 1.3) * 1.6).toFixed(2)}deg`);
    });
    words.current.forEach((el, k) => {
      if (!el) return;
      let o = seen(WORDS[k].z + s) * 0.9 * (1 - calm * 0.6);
      if (o > 0.02) {
        // where the word is on screen right now: its spot, scaled about the vanishing point by the perspective of its depth
        const kk = 1000 / (1000 - (WORDS[k].z + s)), W = innerWidth, Hh = innerHeight, cx = W / 2, cy = Hh * 0.46;
        const px = cx + (WORDS[k].x * W / 100) * kk, py = cy + (WORDS[k].y * Hh / 100 + Hh * 0.04) * kk, z = zone.current;
        const dx = Math.max(z.l - px, 0, px - z.r), dy = Math.max(z.t - py, 0, py - z.b), d = Math.hypot(dx, dy);
        const copyUp = items.current[active + 1] ? parseFloat(items.current[active + 1].style.opacity || "0") : 0;
        o *= 1 - copyUp * (1 - clamp(d / 90, 0, 1));            // fully hidden behind the text, back to normal 90px away from it
      }
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

  // Where the active scene's readable text sits, so floating words can fade out as they pass behind it. Measured only when the
  // scene changes or the window resizes (the text is flat and still while it is read).
  useEffect(() => {
    const measure = () => {
      const li = items.current[active + 1];
      if (!li) return;
      const z = zone.current, w = li.offsetWidth, h = li.offsetHeight;
      const inner = li.querySelector(".scene-about, .scene-index, .scene-timeline, .scene-cap");
      const iw = inner ? Math.min(w, inner.scrollWidth) : w;
      z.l = li.offsetLeft + (w - iw) / 2; z.r = z.l + iw; z.t = li.offsetTop; z.b = li.offsetTop + h;
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active]);

  const chapter = chapterOf(active);
  const label = active < 0 ? "Start" : DIVE_SECTIONS[SCENES[active].section];
  const tab = (i) => (reduce || active === i ? 0 : -1);
  const ready = (i) => () => seenOn(items.current[i + 1], 0.25);     // a scene's text reacts only while that scene's copy is showing

  return (
    <section
      className={"dive" + (reduce ? " is-static" : "")}
      id="home" ref={sec} aria-label="About, projects and experience"
      style={{ "--dive-h": `${SECTION_VH}vh`, "--dive-h-m": `${SECTION_VH_M}vh` }}
    >
      {/* in-page anchors for the nav, placed along the pinned scroll where each chapter's copy has arrived */}
      {!reduce && SCENES.map((c, i) => c.anchor && (
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
            {SCENES.map((c, i) => c.big && (
              <span key={i} className="scene-big" data-on={active === i} ref={(el) => { bigs.current[i] = el; }} style={{ "--z": `${cardZ(i)}px` }}>
                {c.big.includes(" ")
                  ? c.big.split(" ").map((w, k) => <span key={k} className="big-line"><LiveText text={w} kind="giant" unit="whole" perFrame gate={() => seenOn(bigs.current[i], 0.04)} /></span>)
                  : <LiveText text={c.big} kind="giant" unit="whole" perFrame gate={() => seenOn(bigs.current[i], 0.04)} />}
              </span>
            ))}
            {WORDS.map((w, k) => (
              <span key={k} className={"scene-w" + (w.acc ? " is-accent" : "")} ref={(el) => { words.current[k] = el; }}
                style={{ "--x": `${w.x}vw`, "--y": `${w.y}vh`, "--z": `${w.z}px` }}>
                <LiveText text={w.t} kind="float" unit="whole" perFrame gate={() => seenOn(words.current[k], 0.05)} />
              </span>
            ))}
          </div>
        </div>
        <h1 className="dive-name" ref={name}>
          <LiveName lines={HERO_LINES} />
        </h1>

        <div className="dive-vignette" aria-hidden="true" />
        <div className="dive-ui">
          <ol className="dive-copy">
            <li className="scene scene--head scene--intro" data-on={active === -1} ref={(el) => { items.current[0] = el; }}>
              <div className="scene-cap">
                <p className="scene-h scene-intro"><Words text={DIVE_INTRO} gate={() => seenOn(items.current[0], 0.25)} /></p>
              </div>
            </li>
            {SCENES.map((c, i) => (
              <li key={i} className={"scene scene--" + c.kind} data-on={active === i} data-section={c.section} id={reduce ? c.anchor : undefined} ref={(el) => { items.current[i + 1] = el; }}>
                {c.kind === "head" && <HeadScene c={c} gate={ready(i)} />}
                {c.kind === "about" && <AboutScene c={c} gate={ready(i)} />}
                {c.kind === "projects" && <ProjectsScene c={c} gate={ready(i)} tab={tab(i)} />}
                {c.kind === "timeline" && <TimelineScene c={c} gate={ready(i)} tab={tab(i)} />}
              </li>
            ))}
          </ol>
          <div className="dive-hud">
            <p><span className="muted">Chapter</span> <b>{chapter}</b> of {DIVE_SECTIONS.length} <span className="muted">&middot;</span> {label}</p>
            <span className="dive-track"><span ref={bar} /></span>
            <a href="#contact" className="dive-skip">Skip to contact</a>
          </div>
        </div>
      </div>
    </section>
  );
}
