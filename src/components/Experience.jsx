// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { EXPERIENCE } from "../data.js";

export default function Experience() {
  return (
    <div className="exp">
      <h2 className="section-title">Where I have been</h2>
      <ol className="timeline">
        {EXPERIENCE.map((e) => (
          <li key={e.title} className={"tl-item" + (e.current ? " current" : "")} data-tone={e.tone}>
            <span className="tl-dot" aria-hidden="true" />
            <p className="tl-when">{e.current && <span className="live-dot" aria-hidden="true" />}{e.when}</p>
            <h3>{e.title}</h3>
            {e.desc && <p>{e.desc}</p>}
            {e.tags && <ul className="tags">{e.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
          </li>
        ))}
      </ol>
    </div>
  );
}
