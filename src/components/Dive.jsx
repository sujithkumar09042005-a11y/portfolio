import { useEffect, useRef, useState } from "react";
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

// The readable copy flies with the scene: it arrives from the vanishing point at the speed of the world, slows to a
// near-stop while you read it, then flies past you. Index 0 is the intro, 1..N are the chapters.
// Tuned by simulation: no two texts visible together, no dead stretches, and the text stays with its giant word.
const HOLD = 380, INTRO_HOLD = 700, SLOW = 0.14, OFFSET = 400;
const centre = (c) => (c === 0 ? 0 : (FIRST + c - 1) * GAP - OFFSET);
const hold = (c) => (c === 0 ? INTRO_HOLD : HOLD);
const copyZ = (s, c) => { const h = hold(c), u = s - centre(c); return u < -h ? u + h - h * SLOW : u > h ? u - h + h * SLOW : u * SLOW; };
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
  const st = useRef({ s: 0, px: 0, py: 0, tx: 0, ty: 0 });
  const [active, setActive] = useState(-1);

  const write = () => {
    const { s, px, py } = st.current;
    world.current.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, ${s.toFixed(1)}px)`;
  };

  useScroll(() => {
    if (reduce || !sec.current) return;
    const travel = sec.current.offsetHeight - innerHeight;
    const p = travel > 0 ? clamp(-sec.current.getBoundingClientRect().top / travel, 0, 1) : 0;
    const s = p * D;
    st.current.s = s;
    write();
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
      el.style.transform = `translateZ(${z.toFixed(1)}px)`;   // the parent's perspective does the foreshortening
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
      <div className="dive-stage">
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
