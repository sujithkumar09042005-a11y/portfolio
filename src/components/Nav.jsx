import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { NAME, NAV } from "../data.js";
import { useReducedMotion, useScroll, useTheme } from "../hooks.js";

const IDS = NAV.map((n) => n.id);

// The current section is the last one whose anchor has reached the middle of the screen. The anchors are 1px markers
// inside the pinned dive (or the chapter items in the plain version), so an observer would almost never fire on them.
function useActiveSection(ids) {
  const [active, setActive] = useState("");
  useScroll(() => {
    const mid = innerHeight * 0.5;
    let cur = "";
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= mid) cur = id;
    }
    setActive(cur);
  });
  return active;
}

export default function Nav() {
  const reduce = useReducedMotion();
  const [theme, toggleTheme] = useTheme();
  const active = useActiveSection(IDS);
  const [hover, setHover] = useState(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const progress = useRef(null);
  const menu = useRef(null);
  const pill = useRef(null);
  const linkEls = useRef({});
  const target = hover || active;
  const targetRef = useRef(target);
  const prevTarget = useRef(null);

  useScroll(() => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.current.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    setScrolled(y > 20);
  });

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // The pill slides to the hovered link and rests on the active one. It is measured again when the window resizes and
  // when the web font has loaded, because both change the link widths.
  const place = useCallback((animate) => {
    const a = linkEls.current[targetRef.current], p = pill.current, m = menu.current;
    if (!a || !p || getComputedStyle(p).display === "none") { p?.classList.remove("on"); return; }
    p.style.width = a.offsetWidth + "px";
    p.style.transform = `translateX(${a.getBoundingClientRect().left - m.getBoundingClientRect().left}px)`;
    p.classList.add("on");
    if (animate) { p.classList.remove("stretch"); void p.offsetWidth; p.classList.add("stretch"); }
  }, []);

  useLayoutEffect(() => {
    targetRef.current = target;
    place(!reduce && prevTarget.current !== target);
    prevTarget.current = target;
  }, [target, reduce, place]);

  useEffect(() => {
    const again = () => place(false);
    window.addEventListener("resize", again);
    document.fonts?.ready.then(again);
    return () => window.removeEventListener("resize", again);
  }, [place]);

  return (
    <>
      <div className="progress" ref={progress} aria-hidden="true" />
      <header className={"nav" + (scrolled ? " scrolled" : "")}>
        <a href="#home" className="logo" aria-label={`${NAME}, back to top`}><span className="mono" aria-hidden="true">SK</span></a>
        <nav className="menu" ref={menu} aria-label="Primary">
          <span className="pill" ref={pill} aria-hidden="true" />
          <ul id="primary-links" className={"links" + (open ? " open" : "")} onPointerLeave={() => setHover(null)} onBlur={() => setHover(null)}>
            {NAV.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  ref={(el) => { linkEls.current[id] = el; }}
                  className={active === id ? "active" : undefined}
                  aria-current={active === id ? "true" : undefined}
                  aria-label={label}
                  onPointerEnter={() => setHover(id)}
                  onFocus={() => setHover(id)}
                  onClick={() => setOpen(false)}
                >
                  <span className="lbl">
                    {label.split("").map((ch, i) => <span key={i} className="ch" aria-hidden="true" style={{ "--i": i }}>{ch}</span>)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Switch between dark and light theme" data-theme-now={theme}>
            <svg className="sun" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
            <svg className="moon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
          </button>
          <button className="burger" onClick={() => setOpen((o) => !o)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="primary-links">
            <span /><span />
          </button>
        </div>
      </header>
    </>
  );
}
