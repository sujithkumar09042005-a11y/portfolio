// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useEffect, useState } from "react";
import { NAME, NAV } from "../data.js";
import { useTheme } from "../hooks.js";

export default function Nav({ goto }) {
  const [theme, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    NAV.forEach((n) => { const el = document.getElementById(n.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);

  return (
    <header className="nav">
      <a href="#home" className="logo" aria-label={`${NAME}, back to top`} onClick={(e) => goto(e, "home")}><span aria-hidden="true">SK</span></a>
      <nav aria-label="Primary" className={"menu" + (open ? " open" : "")} id="menu">
        <ul>
          {NAV.map(({ id, label }) => (
            <li key={id}>
              <a href={`#${id}`} aria-current={active === id ? "true" : undefined} onClick={(e) => { setOpen(false); goto(e, id); }}>{label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="nav-actions">
        <button className="icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
          {theme === "dark"
            ? <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
            : <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>}
        </button>
        <button className="icon-btn menu-btn" aria-expanded={open} aria-controls="menu" aria-label="Menu" onClick={() => setOpen(!open)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">{open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}</svg>
        </button>
      </div>
    </header>
  );
}
