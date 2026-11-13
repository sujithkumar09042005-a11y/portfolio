// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useEffect, useState } from "react";
import { NAME, NAV } from "../data.js";
import { useTheme } from "../hooks.js";
import { Eyes } from "./Ambient.jsx";

export default function Nav() {
  const [theme, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return (
    <header className="nav">
      <a href="#home" className="logo" aria-label={`${NAME}, back to top`}><Eyes /><span className="logo-t">SK</span></a>
      <nav aria-label="Primary" className={open ? "open" : ""}>
        <ul>
          {NAV.map(({ id, label }) => (
            <li key={id}><a href={`#${id}`} onClick={() => setOpen(false)}>{label}</a></li>
          ))}
        </ul>
      </nav>
      <button className="icon-btn menu-btn" type="button" aria-expanded={open} aria-label="Menu" onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d={open ? "M6 6l12 12M18 6 6 18" : "M4 8h16M4 16h16"} /></svg>
      </button>
      <button className="icon-btn" type="button" onClick={toggleTheme} aria-label="Switch between dark and light theme" data-theme-now={theme}>
        <svg className="sun" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        <svg className="moon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      </button>
    </header>
  );
}
