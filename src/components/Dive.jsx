import { useRef, useState } from "react";
import { DIVE_CHAPTERS, DIVE_INTRO, HERO_LINES } from "../data.js";
import { useReducedMotion, useScroll } from "../hooks.js";

// World units are CSS pixels along z. The camera moves forward by `s`; an object at world z sits at z + s on screen.
const GAP = 1200;                 // distance between chapter cards
const FIRST = 1.6;                // the first card starts 1.6 gaps away, so the opening is just the name and the tunnel
const D = (FIRST + 3) * GAP;      // total travel: the last card ends at the camera plane
const RINGS = 30;
const RING_GAP = 250;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
// Fades in from far away, full while near, fades out as it passes the camera.
const seen = (z) => smooth(-2400, -600, z) * (1 - smooth(0, 350, z));

const cardZ = (i) => -(FIRST + i) * GAP;
// The chapter text follows whichever card is actually on screen, so words and picture never disagree.
function activeAt(s) {
  let a = -1, m = 0;
  for (let i = 0; i < 4; i++) { const v = seen(cardZ(i) + s); if (v > m) { m = v; a = i; } }
  if (m < 0.4) return -1;
  if (a === 0 && m < 0.9 && cardZ(0) + s < -300) return -1;   // the intro holds until the first card is nearly here
  return a;
}

function Panel({ head, children }) {
  return (
    <>
      <div className="dc-head">{head}</div>
      <div className="dc-body">{children}</div>
      <div className="dc-foot">Sample data</div>
    </>
  );
}

const CARDS = [
  <Panel key="react" head="Client / React">
    <code>GET /api/orders</code>
    <span className="dc-btn">Place order</span>
  </Panel>,
  <Panel key="api" head="Server / Spring Boot">
    <ul className="dc-chain">
      <li>OrderController</li>
      <li>OrderService</li>
      <li>OrderRepository</li>
    </ul>
  </Panel>,
  <Panel key="db" head="Database / MySQL">
    <table className="dc-table">
      <thead><tr><th>id</th><th>item</th><th>status</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>Margherita pizza</td><td>Delivered</td></tr>
        <tr><td>2</td><td>Veg biryani</td><td>Preparing</td></tr>
        <tr><td>3</td><td>Cold coffee</td><td>Placed</td></tr>
      </tbody>
    </table>
  </Panel>,
  <Panel key="res" head="Response / 200 OK">
    <code>200 OK, 3 orders</code>
    <ul className="dc-list">
      <li>Margherita pizza</li>
      <li>Veg biryani</li>
      <li>Cold coffee</li>
    </ul>
  </Panel>,
];

/**
 * The opening: scrolling flies the camera forward through a tunnel, one chapter card per layer of the stack.
 * Built from CSS 3D only. Reduced-motion visitors get the same content as a plain stacked section.
 */
export default function Dive() {
  const reduce = useReducedMotion();
  const sec = useRef(null);
  const world = useRef(null);
  const bar = useRef(null);
  const rings = useRef([]);
  const cards = useRef([]);
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
    rings.current.forEach((el, k) => { if (el) el.style.opacity = (seen(-k * RING_GAP + s) * 0.6).toFixed(3); });
    cards.current.forEach((el, i) => { if (el) el.style.opacity = seen(cardZ(i) + s).toFixed(3); });
    setActive(activeAt(s));
  });

  const layer = active < 0 ? "Start" : DIVE_CHAPTERS[active].layer;

  return (
    <section className={"dive" + (reduce ? " is-static" : "")} id="home" ref={sec} aria-label="Introduction">
      <div className="dive-stage">
        <div className="dive-view">
          <div className="dive-world" ref={world}>
            {Array.from({ length: RINGS }, (_, k) => (
              <i key={k} className={"dive-ring" + (k % 4 === 0 ? " is-accent" : "")} aria-hidden="true"
                ref={(el) => { rings.current[k] = el; }}
                style={{ "--z": `${-k * RING_GAP}px`, "--r": `${k * 5}deg` }} />
            ))}
            <h1 className="dive-name" ref={name}>
              {HERO_LINES.map((l, i) => <span key={l}>{l}{i < HERO_LINES.length - 1 ? " " : ""}</span>)}
            </h1>
            {CARDS.map((c, i) => (
              <div key={i} className="dive-card" aria-hidden="true" ref={(el) => { cards.current[i] = el; }} style={{ "--z": `${cardZ(i)}px` }}>
                {c}
              </div>
            ))}
          </div>
        </div>

        <div className="dive-ui">
          <ol className="dive-copy">
            <li data-on={active === -1}>
              <p className="dive-title">{DIVE_INTRO}</p>
            </li>
            {DIVE_CHAPTERS.map((c, i) => (
              <li key={c.layer} data-on={active === i}>
                <h2 className="dive-title">{c.title}</h2>
                <p>{c.text}</p>
                {c.cta && (
                  <div className="dive-cta">
                    <a href="#work" className="btn solid" tabIndex={reduce || active === i ? 0 : -1}><span>See my work</span></a>
                    <a href="#contact" className="btn line" tabIndex={reduce || active === i ? 0 : -1}><span>Get in touch</span></a>
                  </div>
                )}
              </li>
            ))}
          </ol>
          <div className="dive-hud">
            <p><span className="muted">Layer</span> <b>{active < 0 ? "0" : active + 1}</b> of 4 <span className="muted">&middot;</span> {layer}</p>
            <span className="dive-track"><span ref={bar} /></span>
            <a href="#about" className="dive-skip">Skip the intro</a>
          </div>
        </div>
      </div>
    </section>
  );
}
