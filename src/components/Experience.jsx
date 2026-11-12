// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useRef, useState } from "react";
import { EXPERIENCE, RESUME } from "../data.js";
import { useMagnetic, useScroll } from "../hooks.js";
import { Title } from "./Reveal.jsx";

function Card({ job }) {
  const ref = useRef(null);
  return (
    <div
      className="card"
      ref={ref}
      onPointerMove={(e) => {
        const r = ref.current.getBoundingClientRect();
        ref.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
        ref.current.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      <h3>{job.title}</h3>
      <p>{job.desc}</p>
      <ul className="tags">{job.tags.map((t) => <li key={t}>{t}</li>)}</ul>
    </div>
  );
}

export default function Experience() {
  const mag = useMagnetic();
  const timeline = useRef(null);
  const fill = useRef(null);
  const items = useRef([]);
  const [on, setOn] = useState(() => new Set());

  useScroll(() => {
    const tr = timeline.current.getBoundingClientRect();
    const p = (innerHeight * 0.6 - tr.top) / tr.height;
    fill.current.style.height = `${Math.max(0, Math.min(1, p)) * 100}%`;
    const next = new Set();
    items.current.forEach((it, i) => { if (it && it.getBoundingClientRect().top < innerHeight * 0.62) next.add(i); });
    setOn((prev) => (prev.size === next.size && [...next].every((i) => prev.has(i)) ? prev : next));
  });

  return (
    <section className="section" id="experience">
      <Title>Experience</Title>
      <div className="timeline" ref={timeline}>
        <div className="line-fill" ref={fill} />
        {EXPERIENCE.map((job, i) => (
          <article key={job.title} className={"item" + (on.has(i) ? " on" : "")} ref={(el) => { items.current[i] = el; }}>
            <p className="when">{job.when}</p>
            <Card job={job} />
          </article>
        ))}
      </div>
      <a href={RESUME} className="btn line magnetic" target="_blank" rel="noopener" {...mag}><span>View resume</span></a>
    </section>
  );
}
