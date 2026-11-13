import { useRef, useState } from "react";
import { DIVE_CHAPTERS, DIVE_INTRO, HERO_LINES } from "../data.js";
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
// The chapter text follows whichever scene is actually in front, so words and picture never disagree.
function activeAt(s) {
  let a = -1, m = 0;
  for (let i = 0; i < N; i++) { const v = seen(cardZ(i) + s); if (v > m) { m = v; a = i; } }
  if (m < 0.4) return -1;
  if (a === 0 && m < 0.9 && cardZ(0) + s < -300) return -1;   // the intro holds until the first scene is nearly here
  return a;
}
// Where along the page's scroll a chapter is in front, as a fraction of the pinned travel (used for #anchors).
const anchorFraction = (i) => ((FIRST + i) * GAP - 300) / D;

// The floating words around each chapter's big word, flattened with their world depth.
const WORDS = DIVE_CHAPTERS.flatMap((c, i) => (c.words || []).map(([t, x, y, off, acc]) => ({ i, t, x, y, z: cardZ(i) + off, acc: !!acc })));

/**
 * The whole story in one forward flight: the name, About, three projects, then experience. Each chapter is a scene made of
 * type alone: one giant outlined word and floating words at other depths, with the readable copy as plain text beside it.
 * CSS 3D only. Reduced-motion visitors get every chapter as plain stacked content.
 */
export default function Dive() {
  const reduce = useReducedMotion();
  const sec = useRef(null);
  const world = useRef(null);
  const bar = useRef(null);
  const rings = useRef([]);
  const bigs = useRef([]);
  const words = useRef([]);
  const name = useRef(null);
  const [active, setActive] = useState(-1);

  useScroll(() => {
    if (reduce || !sec.current) return;
    const travel = sec.current.offsetHeight - innerHeight;
    const p = travel > 0 ? clamp(-sec.current.getBoundingClientRect().top / travel, 0, 1) : 0;
    const s = p * D;
    world.current.style.transform = `translateZ(${s.toFixed(1)}px)`;
    bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
    name.current.style.opacity = String(1 - smooth(0, 350, s));
    rings.current.forEach((el, k) => { if (el) el.style.opacity = (seen(-k * RING_GAP + s) * 0.5).toFixed(3); });
    bigs.current.forEach((el, i) => { if (el) el.style.opacity = seen(cardZ(i) + s).toFixed(3); });
    words.current.forEach((el, k) => { if (el) el.style.opacity = (seen(WORDS[k].z + s) * 0.9).toFixed(3); });
    setActive(activeAt(s));
  });

  const label = active < 0 ? "Start" : DIVE_CHAPTERS[active].label;
  const tab = (i) => (reduce || active === i ? 0 : -1);

  return (
    <section
      className={"dive" + (reduce ? " is-static" : "")}
      id="home" ref={sec} aria-label="About, projects and experience"
      style={{ "--dive-h": `${SECTION_VH}vh`, "--dive-h-m": `${SECTION_VH_M}vh` }}
    >
      {/* in-page anchors for the nav, placed along the pinned scroll where each chapter is in front */}
      {!reduce && DIVE_CHAPTERS.map((c, i) => c.anchor && (
        <span key={c.anchor} id={c.anchor} className="dive-anchor" style={{ "--f": anchorFraction(i) }} />
      ))}
      <div className="dive-stage">
        <div className="dive-view" aria-hidden="true">
          <div className="dive-world" ref={world}>
            {Array.from({ length: RINGS }, (_, k) => (
              <i key={k} className={"dive-ring" + (k % 4 === 0 ? " is-accent" : "")}
                ref={(el) => { rings.current[k] = el; }}
                style={{ "--z": `${-k * RING_GAP}px`, "--r": `${k * 5}deg` }} />
            ))}
            {DIVE_CHAPTERS.map((c, i) => (
              <span key={c.label} className="scene-big" data-on={active === i} ref={(el) => { bigs.current[i] = el; }} style={{ "--z": `${cardZ(i)}px` }}>{c.big}</span>
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

        <div className="dive-ui">
          <ol className="dive-copy">
            <li data-on={active === -1}>
              <p className="dive-title">{DIVE_INTRO}</p>
            </li>
            {DIVE_CHAPTERS.map((c, i) => (
              <li key={c.label} data-on={active === i} id={reduce ? c.anchor : undefined}>
                <h2 className="dive-title">{c.title}</h2>
                <p>{c.text}</p>
                {c.stack && <p className="dive-stack">{c.stack}</p>}
                {c.href && <a className="dive-link" href={c.href} target="_blank" rel="noopener" tabIndex={tab(i)}>{c.link}<span className="visually-hidden"> (opens in a new tab)</span></a>}
                {c.cta && (
                  <div className="dive-cta">
                    <a href="#contact" className="btn solid" tabIndex={tab(i)}><span>Get in touch</span></a>
                  </div>
                )}
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
