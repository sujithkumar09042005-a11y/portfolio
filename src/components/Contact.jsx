// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useActionState, useEffect, useRef, useState } from "react";
import { EMAIL, SOCIALS } from "../data.js";
import { useMagnetic, useReducedMotion } from "../hooks.js";
import { Title } from "./Reveal.jsx";

const Arrow = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
);

const RULES = {
  name: (v) => (v.trim().length < 2 ? "Tell me your name." : ""),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter an email like name@example.com."),
  message: (v) => (v.trim().length < 10 ? "Write at least 10 characters." : ""),
};
const LABELS = { name: "Your name", email: "Your email", message: "What would you like to build?" };

function CopyEmail() {
  const [done, setDone] = useState(false);
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 2000);
    return () => clearTimeout(t);
  }, [done]);
  async function copy() {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(EMAIL);
      else {
        const t = document.createElement("textarea");
        t.value = EMAIL; document.body.appendChild(t); t.select();
        const ok = document.execCommand("copy"); t.remove();
        if (!ok) throw new Error("copy blocked");
      }
      setFallback(false); setDone(true);
    } catch { setFallback(true); }
  }
  return (
    <button className={"copy" + (done ? " done" : "")} type="button" onClick={copy} aria-label="Copy email address">
      <span>{done ? "Copied" : fallback ? "Press Ctrl+C" : "Copy"}</span>
    </button>
  );
}

function Field({ name, type = "text", textarea, error, value, onChange, onBlur, autoComplete }) {
  const Tag = textarea ? "textarea" : "input";
  const id = `f-${name}`;
  return (
    <div className={"field" + (error ? " invalid" : "") + (!error && value ? " valid" : "")} key={error ? "e" : "ok"}>
      <Tag
        id={id} name={name} type={textarea ? undefined : type} rows={textarea ? 4 : undefined}
        maxLength={textarea ? 600 : undefined} placeholder=" " autoComplete={autoComplete}
        value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
        aria-invalid={!!error} aria-describedby={`${id}-err`} required
      />
      <label htmlFor={id}>{LABELS[name]}</label>
      <span className="bar" />
      {textarea && <small className="count">{value.length} / 600</small>}
      <small className="err" id={`${id}-err`} role="alert">{error}</small>
    </div>
  );
}

function ContactForm() {
  const reduce = useReducedMotion();
  const mag = useMagnetic();
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [touched, setTouched] = useState({});
  const errors = Object.fromEntries(Object.keys(RULES).map((k) => [k, touched[k] ? RULES[k](values[k]) : ""]));
  const formRef = useRef(null);

  // React 19 form action: validate, show a loading state, then hand off to the visitor's mail app
  const [state, submit, pending] = useActionState(async (_prev, formData) => {
    const data = Object.fromEntries(formData);
    const bad = Object.keys(RULES).find((k) => RULES[k](data[k] ?? ""));
    if (bad) return { status: "invalid", field: bad };
    if (!reduce) await new Promise((r) => setTimeout(r, 900));
    const body = `${data.message}\n\n${data.name} (${data.email})`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Hello from " + data.name)}&body=${encodeURIComponent(body)}`;
    return { status: "ready" };
  }, { status: "idle" });

  useEffect(() => {
    if (state.status === "invalid") {
      setTouched({ name: true, email: true, message: true });
      formRef.current?.elements[state.field]?.focus();
    }
  }, [state]);

  const [showReady, setShowReady] = useState(false);
  useEffect(() => {
    if (state.status !== "ready") return;
    setShowReady(true);
    const t = setTimeout(() => setShowReady(false), 4000);
    return () => clearTimeout(t);
  }, [state]);

  const bind = (k) => ({
    value: values[k], error: errors[k],
    onChange: (v) => setValues((s) => ({ ...s, [k]: v })),
    onBlur: () => setTouched((t) => ({ ...t, [k]: true })),
  });

  return (
    <form className="form" action={submit} ref={formRef} noValidate>
      <Field name="name" autoComplete="name" {...bind("name")} />
      <Field name="email" type="email" autoComplete="email" {...bind("email")} />
      <Field name="message" textarea {...bind("message")} />
      <button className={"btn solid send magnetic" + (pending ? " loading" : "") + (showReady ? " success" : "")} type="submit" disabled={pending} {...mag}>
        <span className="send-label">{pending ? "Sending" : showReady ? "Message ready" : "Send message"}</span>
      </button>
      <p className="form-note" role="status" aria-live="polite">
        {state.status === "invalid" ? "Fix the highlighted fields and try again."
          : showReady ? "Your email app should open with the message filled in. Press send there to finish." : ""}
      </p>
    </form>
  );
}

export default function Contact() {
  return (
    <section className="section contact" id="contact">
      <Title>Let's work together</Title>
      <div className="contact-grid">
        <div className="contact-main">
          <p className="contact-lead">Have a project in mind, or just want to say hello? Write to me and I will reply within two working days.</p>
          <div className="mail-row">
            <a className="big-mail" href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <CopyEmail />
          </div>
          <ul className="socials">
            {SOCIALS.map((s) => (
              <li key={s.label}><a href={s.href} target="_blank" rel="noopener"><span>{s.label}</span><Arrow /></a></li>
            ))}
          </ul>
          <svg className="badge" viewBox="0 0 200 200" aria-hidden="true">
            <defs><path id="circ" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" /></defs>
            <text><textPath href="#circ">open for projects * open for projects * open for projects * </textPath></text>
            <circle cx="100" cy="100" r="6" />
          </svg>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
