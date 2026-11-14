import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PROJECTS, NAME } from "./data.js";
import { FILES, byId } from "./files.js";
import { Source } from "./highlight.jsx";
import { useHotkeys, useNarrow, useTheme } from "./hooks.js";
import Palette from "./Palette.jsx";
import { ContactPreview, ExperiencePreview, ProjectPreview, ReadmePreview, StackPreview } from "./Previews.jsx";
import { sourceOf } from "./sources.js";
import Terminal from "./Terminal.jsx";

const Icon = ({ ext }) => <span className={"fi fi-" + ext} aria-hidden="true">{ext === "md" ? "M" : ext === "json" ? "{}" : ext === "log" ? "L" : ext === "sh" ? "$" : ext.toUpperCase().slice(0, 2)}</span>;
const Chevron = ({ open }) => (
  <svg className={"chev" + (open ? " open" : "")} viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 4 4 4-4 4" /></svg>
);

export default function App() {
  const narrow = useNarrow();
  const [theme, toggleTheme, setTheme] = useTheme();
  const [tabs, setTabs] = useState(["readme"]);
  const [active, setActive] = useState("readme");
  const [running, setRunning] = useState({});
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [termOpen, setTermOpen] = useState(true);
  const [termBig, setTermBig] = useState(false);
  const [termFocus, setTermFocus] = useState(0);
  const [pal, setPal] = useState(false);
  const [dirOpen, setDirOpen] = useState(true);
  const [pane, setPane] = useState("preview");
  const [navOpen, setNavOpen] = useState(false);
  const previewRef = useRef(null);

  // The terminal starts closed on small screens, where it would cover the content
  useEffect(() => { if (narrow) setTermOpen(false); }, [narrow]);

  const open = useCallback((id) => {
    setTabs((t) => (t.includes(id) ? t : [...t, id]));
    setActive(id);
    setPane("preview");
    setNavOpen(false);
    if (PROJECTS.some((p) => p.id === id)) setDirOpen(true);
    history.replaceState(null, "", "#" + id);
  }, []);
  const close = useCallback((id) => {
    setTabs((t) => {
      if (t.length === 1) return t;
      const n = t.filter((x) => x !== id);
      setActive((a) => (a === id ? n[Math.max(0, t.indexOf(id) - 1)] : a));
      return n;
    });
  }, []);
  const run = useCallback((id) => { open(id); setRunning((r) => ({ ...r, [id]: true })); }, [open]);

  // Deep links: /#voyager opens that file
  useEffect(() => {
    const id = location.hash.slice(1);
    if (id && byId(id)) open(id);
  }, [open]);

  useEffect(() => { previewRef.current?.scrollTo({ top: 0 }); }, [active]);

  useHotkeys(useCallback((e) => {
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === "k") { e.preventDefault(); setPal((p) => !p); }
    else if ((e.ctrlKey || e.metaKey) && (e.key === "`" || k === "j")) { e.preventDefault(); setTermOpen((o) => { if (!o) setTermFocus((n) => n + 1); return !o; }); }
  }, []));

  const actions = useMemo(() => [
    { label: "Toggle terminal", run: () => setTermOpen((o) => { if (!o) setTermFocus((n) => n + 1); return !o; }) },
    { label: "Switch to dark theme", run: () => setTheme("dark") },
    { label: "Switch to light theme", run: () => setTheme("light") },
    ...PROJECTS.filter((p) => p.live).map((p) => ({ label: `Run ${p.title} live`, run: () => run(p.id) })),
  ], [run, setTheme]);

  const file = byId(active);
  const project = PROJECTS.find((p) => p.id === active);
  const src = sourceOf(active, form);

  let view;
  if (active === "readme") view = <ReadmePreview open={open} />;
  else if (active === "stack") view = <StackPreview />;
  else if (active === "experience") view = <ExperiencePreview />;
  else if (active === "contact") view = <ContactPreview form={form} setForm={setForm} />;
  else view = <ProjectPreview key={active} p={project} running={!!running[active]} setRunning={(v) => setRunning((r) => ({ ...r, [active]: v }))} />;

  const loose = FILES.filter((f) => !f.dir);
  const projectFiles = FILES.filter((f) => f.dir);
  const entry = (f, indent) => (
    <li key={f.id}>
      <button type="button" className={"node" + (active === f.id ? " on" : "") + (indent ? " in" : "")} onClick={() => open(f.id)} aria-current={active === f.id ? "page" : undefined}>
        <Icon ext={f.ext} /><span>{f.name}</span>
        {running[f.id] && <i className="live-dot" title="running" />}
      </button>
    </li>
  );

  return (
    <div className="ide">
      <a className="skip" href="#editor">Skip to content</a>

      <header className="title">
        {narrow && <button type="button" className="tbtn" onClick={() => setNavOpen((o) => !o)} aria-expanded={navOpen} aria-controls="explorer" aria-label="Files">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>}
        <span className="brand"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 7-5 5 5 5M15 7l5 5-5 5" /></svg>{NAME}</span>
        <button type="button" className="search" onClick={() => setPal(true)} aria-label="Search files and actions">
          <span>Go to file or run an action</span><kbd>Ctrl K</kbd>
        </button>
        <div className="tools">
          <button type="button" className={"tbtn" + (termOpen ? " on" : "")} onClick={() => { setTermOpen((o) => !o); setTermFocus((n) => n + 1); }} aria-pressed={termOpen} aria-label="Terminal">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 8 5 4-5 4M12 17h7" /></svg>
          </button>
          <button type="button" className="tbtn" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
            {theme === "dark"
              ? <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
              : <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>}
          </button>
        </div>
      </header>

      <div className="body">
        <nav id="explorer" className={"explorer" + (navOpen ? " open" : "")} aria-label="Files">
          <p className="ex-title">Explorer</p>
          <p className="ex-root">portfolio</p>
          <ul>
            {entry(loose[0])}
            {entry(loose[1])}
            <li>
              <button type="button" className="node dir" onClick={() => setDirOpen((o) => !o)} aria-expanded={dirOpen}>
                <Chevron open={dirOpen} /><span>projects</span>
              </button>
              {dirOpen && <ul className="kids">{projectFiles.map((f) => entry(f, true))}</ul>}
            </li>
            {entry(loose[2])}
            {entry(loose[3])}
          </ul>
          <p className="ex-hint">Press <kbd>Ctrl K</kbd> to jump anywhere, or open the terminal and type <code>help</code>.</p>
        </nav>

        <main className="main" id="editor">
          <div className="tabs" role="tablist" aria-label="Open files">
            {tabs.map((id) => {
              const f = byId(id);
              return (
                <div key={id} className={"tab" + (active === id ? " on" : "")} role="presentation">
                  <button type="button" role="tab" aria-selected={active === id} onClick={() => open(id)}><Icon ext={f.ext} /><span>{f.name}</span></button>
                  {tabs.length > 1 && <button type="button" className="x" onClick={() => close(id)} aria-label={`Close ${f.name}`}>
                    <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m3 3 10 10M13 3 3 13" /></svg>
                  </button>}
                </div>
              );
            })}
          </div>

          {narrow && (
            <div className="seg" role="group" aria-label="View">
              <button type="button" aria-pressed={pane === "preview"} onClick={() => setPane("preview")}>Preview</button>
              <button type="button" aria-pressed={pane === "source"} onClick={() => setPane("source")}>Source</button>
            </div>
          )}

          <div className={"split pane-" + pane}>
            <section className="code" aria-label={`Source of ${file.name}`} tabIndex={0}>
              <Source key={active + (active === "contact" ? "" : "")} text={src} lang={file.ext} />
            </section>
            <section className="preview" ref={previewRef} aria-label={`Preview of ${file.name}`}>
              {view}
            </section>
          </div>

          {termOpen && (
            <Terminal open={open} run={run} setTheme={setTheme} focusSignal={termFocus} big={termBig} setBig={setTermBig} onClose={() => setTermOpen(false)} />
          )}
        </main>
      </div>

      <footer className="status">
        <span className="br"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="4.5" cy="3.5" r="1.7" /><circle cx="4.5" cy="12.5" r="1.7" /><circle cx="11.5" cy="6" r="1.7" /><path d="M4.5 5.2v5.6M11.5 7.7c0 2.6-7 1.4-7 3.6" /></svg>main</span>
        <span>{file.lang}</span>
        <span className="grow" />
        <span>{theme === "dark" ? "Dark" : "Light"} theme</span>
      </footer>

      {pal && <Palette actions={actions} onOpenFile={open} onClose={() => setPal(false)} />}
    </div>
  );
}
