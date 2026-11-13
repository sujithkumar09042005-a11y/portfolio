// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { NAV } from "../data.js";
import { scrollToId, scrollTop } from "../live.js";
import { useTheme } from "../hooks.js";

export default function Nav() {
  const [theme, toggle] = useTheme();
  const go = (id) => (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    scrollToId(id);
  };
  return (
    <header className="nav">
      <a className="logo" href="#top" onClick={(e) => { e.preventDefault(); scrollTop(); }} aria-label="Sujith Kumar, back to top">
        <span>SK</span><i aria-hidden="true" />
      </a>
      <nav aria-label="Primary">
        <ul className="links">
          {NAV.map((n) => <li key={n.id}><a href={`#${n.id}`} onClick={go(n.id)}>{n.label}</a></li>)}
        </ul>
      </nav>
      <button className="theme" type="button" onClick={toggle} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {theme === "dark"
            ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>
            : <path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" />}
        </svg>
      </button>
    </header>
  );
}
