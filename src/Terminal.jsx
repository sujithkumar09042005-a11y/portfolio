import { useEffect, useRef, useState } from "react";
import { EMAIL, GITHUB, HERO_LINE, LINKEDIN, PROJECTS, RESUME } from "./data.js";
import { FILES, byName } from "./files.js";

const A = ({ href, children }) => <a href={href} target="_blank" rel="noopener">{children}</a>;

const HELP = [
  ["ls", "list files, or ls projects"],
  ["open <file>", "open a file in the editor"],
  ["run <project>", "start a project's live demo"],
  ["whoami", "who built this"],
  ["theme <dark|light>", "switch the colour theme"],
  ["email, github, linkedin, resume", "ways to reach me"],
  ["clear", "empty the terminal"],
];

export default function Terminal({ open, run, setTheme, onClose, focusSignal, big, setBig }) {
  const [lines, setLines] = useState([
    { k: "out", t: "Sujith Kumar V, full-stack developer." },
    { k: "out", t: "Type help to see what this terminal can do." },
  ]);
  const [val, setVal] = useState("");
  const [hist, setHist] = useState([]);
  const [h, setH] = useState(-1);
  const inputRef = useRef(null);
  const logRef = useRef(null);

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [lines]);
  useEffect(() => { if (focusSignal) inputRef.current?.focus(); }, [focusSignal]);

  const say = (...items) => setLines((l) => [...l, ...items]);

  function exec(raw) {
    const cmd = raw.trim();
    const [c, ...rest] = cmd.split(/\s+/);
    const arg = rest.join(" ");
    const echo = { k: "in", t: cmd };
    setBig(true);
    if (!cmd) { say(echo); return; }
    switch (c.toLowerCase()) {
      case "help":
        say(echo, ...HELP.map(([a, b]) => ({ k: "out", t: <><b>{a}</b><span className="gap" />{b}</> })));
        break;
      case "ls":
        if (arg === "projects" || arg === "projects/")
          say(echo, { k: "out", t: PROJECTS.map((p) => byName(p.id).name).join("   ") });
        else
          say(echo, { k: "out", t: FILES.filter((f) => !f.dir).map((f) => f.name).concat("projects/").join("   ") });
        break;
      case "open": case "cat": case "code": {
        const f = byName(arg);
        if (!arg) say(echo, { k: "err", t: "Usage: open <file>. Try ls." });
        else if (!f) say(echo, { k: "err", t: `No file named ${arg}. Try ls.` });
        else { open(f.id); say(echo, { k: "out", t: `Opened ${f.name}` }); }
        break;
      }
      case "run": {
        const f = byName(arg);
        const p = f && PROJECTS.find((x) => x.id === f.id);
        if (!p) say(echo, { k: "err", t: `No project named ${arg || "(none)"}. Try ls projects.` });
        else if (!p.live) { open(p.id); say(echo, { k: "out", t: `${p.title} has no live demo yet. Showing its screenshots.` }); }
        else { run(p.id); say(echo, { k: "out", t: `Starting ${p.title} at ${p.live}` }); }
        break;
      }
      case "whoami":
        say(echo, { k: "out", t: "Sujith Kumar V" }, { k: "out", t: HERO_LINE });
        break;
      case "theme": {
        const t = arg.toLowerCase();
        if (t === "dark" || t === "light") { setTheme(t); say(echo, { k: "out", t: `Theme set to ${t}.` }); }
        else say(echo, { k: "err", t: "Usage: theme dark or theme light." });
        break;
      }
      case "email": say(echo, { k: "out", t: <A href={`mailto:${EMAIL}`}>{EMAIL}</A> }); break;
      case "github": say(echo, { k: "out", t: <A href={GITHUB}>{GITHUB}</A> }); break;
      case "linkedin": say(echo, { k: "out", t: <A href={LINKEDIN}>{LINKEDIN}</A> }); break;
      case "resume": say(echo, { k: "out", t: <A href={RESUME}>Open the resume</A> }); break;
      case "contact": open("contact"); say(echo, { k: "out", t: "Opened contact.sh" }); break;
      case "clear": setLines([]); break;
      case "sudo": say(echo, { k: "err", t: "Nice try. This portfolio is read-only." }); break;
      default: say(echo, { k: "err", t: `command not found: ${c}. Type help.` });
    }
  }

  function onKey(e) {
    if (e.key === "Enter") {
      exec(val);
      if (val.trim()) setHist((x) => [val, ...x]);
      setVal(""); setH(-1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const n = Math.min(hist.length - 1, h + 1);
      if (n >= 0) { setH(n); setVal(hist[n]); }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const n = h - 1;
      setH(n); setVal(n >= 0 ? hist[n] : "");
    } else if (e.key === "Tab") {
      e.preventDefault();
      const [c, ...r] = val.split(/\s+/);
      if (r.length === 1) {
        const m = FILES.find((f) => f.name.toLowerCase().startsWith(r[0].toLowerCase()));
        if (m) setVal(`${c} ${m.name}`);
      }
    } else if (e.key === "Escape") onClose();
  }

  return (
    <section className={"term" + (big ? " big" : "")} aria-label="Terminal" onClick={() => inputRef.current?.focus()}>
      <div className="term-log" ref={logRef} role="log" aria-live="polite">
        {lines.map((l, i) => (
          <p key={i} className={"ln " + l.k}>{l.k === "in" && <span className="ps" aria-hidden="true">$ </span>}{l.t}</p>
        ))}
      </div>
      <label className="term-in">
        <span className="ps" aria-hidden="true">$</span>
        <span className="sr">Terminal command</span>
        <input ref={inputRef} value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={onKey} onFocus={() => setBig(true)}
          spellCheck={false} autoComplete="off" autoCapitalize="off" placeholder="Try it: type help, ls, run voyager" />
      </label>
    </section>
  );
}
