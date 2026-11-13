// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { HERO_LINE, HERO_LINES, RESUME, ROLE } from "../data.js";
import { Letters } from "../aurora/Letters.jsx";
import { scrollToId } from "../live.js";
import { Magnetic } from "./Interactive.jsx";

export default function Hero({ reduce }) {
  return (
    <section className="hero" id="top" data-hue="262" data-int="1">
      <p className="kicker">{ROLE}</p>
      <h1 className="display" aria-label={HERO_LINES.join(" ")}>
        {HERO_LINES.map((l, i) => (
          <span className="display-line" key={l}>
            <Letters text={l} lo={300} hi={800} wlo={75} radius={260} breath enabled={!reduce} key={reduce ? "s" : "d"} />
          </span>
        ))}
      </h1>
      <p className="lede">{HERO_LINE}</p>
      <div className="cta">
        <Magnetic as="a" className="btn solid" href={RESUME} target="_blank" rel="noopener">Resume</Magnetic>
        <a className="btn ghost" href="#work" onClick={(e) => { e.preventDefault(); scrollToId("work"); }}>See the work</a>
      </div>
      <p className="scroll-hint" aria-hidden="true"><i /> scroll</p>
    </section>
  );
}
