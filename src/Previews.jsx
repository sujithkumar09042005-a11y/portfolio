import { useEffect, useState } from "react";
import { CERTS, EMAIL, EXPERIENCE, FACTS, GITHUB, HERO_LINE, LINKEDIN, PROJECTS, RESUME, STACK, STATEMENT } from "./data.js";
import { useReducedMotion } from "./hooks.js";

const BASE = import.meta.env.BASE_URL;
const shot = (name) => `${BASE}shots/${name}.jpg`;

const Ext = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
);
const Play = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" /></svg>
);
const Stop = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1.5" /></svg>
);

/* ---------------- README ---------------- */
export function ReadmePreview({ open }) {
  return (
    <article className="pv readme">
      <h1>Sujith Kumar V<span className="caret" aria-hidden="true" /></h1>
      <p className="role">Full-stack developer</p>
      <p className="pv-lead">{HERO_LINE}</p>
      <div className="actions">
        <a className="btn solid" href={RESUME} target="_blank" rel="noopener">Resume <Ext /></a>
        <button className="btn" type="button" onClick={() => open("voyager")}>Open a project</button>
      </div>
      <p className="pv-body">{STATEMENT}</p>
      <dl className="facts">
        {FACTS.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
      </dl>
      <h2>Projects</h2>
      <ul className="strip">
        {PROJECTS.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => open(p.id)}>
              <img src={shot(p.shots[0].src)} alt="" loading="lazy" width="1600" height="900" />
              <span>{p.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </article>
  );
}

/* ---------------- stack.json ---------------- */
export function StackPreview() {
  const layers = [STACK[1], STACK[0], STACK[2]];
  const notes = ["What people see", "What answers them", "What remembers"];
  return (
    <article className="pv stackpv">
      <h1>The stack</h1>
      <p className="pv-lead">Three layers, one request from top to bottom and back.</p>
      <div className="layers">
        <span className="wire" aria-hidden="true"><i /></span>
        {layers.map((g, i) => (
          <section key={g.label} className="layer">
            <header><h2>{g.label}</h2><p>{notes[i]}</p></header>
            <ul className="chips">{g.items.map((it) => <li key={it}>{it}</li>)}</ul>
          </section>
        ))}
      </div>
    </article>
  );
}

/* ---------------- projects ---------------- */
export function ProjectPreview({ p, running, setRunning }) {
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const cur = p.shots[i];
  const host = p.live ? p.live.replace(/^https?:\/\//, "").replace(/\/$/, "") : `${p.title} screenshots`;
  useEffect(() => { setLoaded(false); }, [running, p.id]);
  return (
    <article className="pv project">
      <h1>{p.title}</h1>
      <ul className="chips">{p.meta.map((m) => <li key={m}>{m}</li>)}</ul>
      <p className="pv-lead">{p.desc}</p>
      <div className="actions">
        {p.live && (
          <button className={"btn solid" + (running ? " on" : "")} type="button" onClick={() => setRunning(!running)} aria-pressed={running}>
            {running ? <><Stop /> Stop</> : <><Play /> Run live</>}
          </button>
        )}
        {p.live && <a className="btn" href={p.live} target="_blank" rel="noopener">Open in new tab <Ext /></a>}
        <a className="btn" href={p.href} target="_blank" rel="noopener">Source on GitHub <Ext /></a>
      </div>

      <figure className="browser">
        <div className="chrome">
          <span className={"dot" + (running ? " live" : "")} aria-hidden="true" />
          <span className="url">{host}</span>
          <span className="state">{running ? "running" : p.live ? "stopped" : "screenshot"}</span>
        </div>
        {running ? (
          <div className={"frame" + (loaded ? " ready" : "")}>
            <iframe title={`${p.title} running live`} src={p.live} loading="lazy" onLoad={() => setLoaded(true)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
            {!loaded && <p className="booting">Starting {p.title}...</p>}
          </div>
        ) : (
          <div className={"viewport" + (cur.full ? " tall" : "")} tabIndex={cur.full ? 0 : undefined} aria-label={cur.full ? `${p.title} full page screenshot, scrollable` : undefined}>
            <img key={cur.src} src={shot(cur.src)} alt={`${p.title}: ${cur.label}`} width="1600" height={cur.full ? undefined : 900} />
          </div>
        )}
      </figure>

      {!running && (
        <div className="shots" role="tablist" aria-label={`${p.title} screenshots`}>
          {p.shots.map((s, k) => (
            <button key={s.src} role="tab" type="button" aria-selected={k === i} className={k === i ? "on" : ""} onClick={() => setI(k)}>{s.label}</button>
          ))}
        </div>
      )}
    </article>
  );
}

/* ---------------- experience.log ---------------- */
export function ExperiencePreview() {
  return (
    <article className="pv exp">
      <h1>Experience</h1>
      <ol className="timeline">
        {[...EXPERIENCE].reverse().map((e) => (
          <li key={e.org}>
            <span className="when">{e.when}</span>
            <h2>{e.title}</h2>
            <p className="org">{e.org}</p>
            <p className="pv-body">{e.desc}</p>
            {e.tags.length > 0 && <ul className="chips">{e.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
          </li>
        ))}
      </ol>
      <p className="pv-body certs"><strong>Certifications.</strong> {CERTS}</p>
    </article>
  );
}

/* ---------------- contact.sh ---------------- */
const RULES = {
  name: (v) => (v.trim().length < 2 ? "Tell me your name." : ""),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter an email like name@example.com."),
  message: (v) => (v.trim().length < 10 ? "Write at least 10 characters." : ""),
};
const LABELS = { name: "Your name", email: "Your email", message: "What would you like to build?" };

export function ContactPreview({ form, setForm }) {
  const reduce = useReducedMotion();
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle");
  const [copied, setCopied] = useState(false);
  const err = (k) => (touched[k] ? RULES[k](form[k]) : "");

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);
  useEffect(() => {
    if (status !== "ready") return;
    const t = setTimeout(() => setStatus("idle"), 5000);
    return () => clearTimeout(t);
  }, [status]);

  async function copy() {
    try { await navigator.clipboard.writeText(EMAIL); setCopied(true); } catch { setStatus("copyfail"); }
  }
  async function submit(e) {
    e.preventDefault();
    const bad = Object.keys(RULES).find((k) => RULES[k](form[k]));
    if (bad) {
      setTouched({ name: true, email: true, message: true });
      setStatus("invalid");
      e.currentTarget.elements[bad]?.focus();
      return;
    }
    setStatus("sending");
    if (!reduce) await new Promise((r) => setTimeout(r, 700));
    const body = `${form.message}\n\n${form.name} (${form.email})`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Hello from " + form.name)}&body=${encodeURIComponent(body)}`;
    setStatus("ready");
  }

  const field = (k, props = {}) => {
    const id = `f-${k}`, e = err(k);
    const Tag = k === "message" ? "textarea" : "input";
    return (
      <div className={"field" + (e ? " bad" : "")}>
        <label htmlFor={id}>{LABELS[k]}</label>
        <Tag id={id} name={k} value={form[k]} rows={k === "message" ? 5 : undefined} maxLength={k === "message" ? 600 : undefined}
          onChange={(ev) => setForm((s) => ({ ...s, [k]: ev.target.value }))}
          onBlur={() => setTouched((t) => ({ ...t, [k]: true }))}
          aria-invalid={!!e} aria-describedby={`${id}-e`} {...props} />
        <small id={`${id}-e`} role="alert">{e}</small>
      </div>
    );
  };

  return (
    <article className="pv contact">
      <h1>Let's work together</h1>
      <p className="pv-lead">Have a project in mind, or just want to say hello? Write below and watch the script on the left fill itself in.</p>
      <div className="mail">
        <a className="big-mail" href={`mailto:${EMAIL}`}>{EMAIL}</a>
        <button className="btn" type="button" onClick={copy}>{copied ? "Copied" : status === "copyfail" ? "Press Ctrl+C" : "Copy"}</button>
      </div>
      <ul className="links">
        <li><a href={GITHUB} target="_blank" rel="noopener">GitHub <Ext /></a></li>
        <li><a href={LINKEDIN} target="_blank" rel="noopener">LinkedIn <Ext /></a></li>
        <li><a href={RESUME} target="_blank" rel="noopener">Resume <Ext /></a></li>
      </ul>
      <form className="form" onSubmit={submit} noValidate>
        {field("name", { autoComplete: "name" })}
        {field("email", { type: "email", autoComplete: "email" })}
        {field("message")}
        <div className="send">
          <button className="btn solid" type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Sending..." : status === "ready" ? "Message ready" : "Send message"}
          </button>
          <p role="status" aria-live="polite">
            {status === "invalid" ? "Fix the highlighted fields and try again."
              : status === "ready" ? "Your email app should open with the message filled in. Press send there to finish." : ""}
          </p>
        </div>
      </form>
    </article>
  );
}
