import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NAME, NAV } from "../data.js";
import { useReducedMotion, useScroll, useTheme } from "../hooks.js";

function useActiveSection(ids) {
  const [active, setActive] = useState("");
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    // the About chapter is an anchor point inside the pinned dive, so watch the dive itself and call it "about" while it runs
    const dive = document.getElementById("home");
    const io2 = new IntersectionObserver(([e]) => { if (e.isIntersecting && e.boundingClientRect.top <= 0) setActive("about"); }, { rootMargin: "-45% 0px -50% 0px" });
    if (dive) io2.observe(dive);
    return () => { io.disconnect(); io2.disconnect(); };
  }, [ids]);
  return active;
}

const IDS = NAV.map((n) => n.id);

export default function Nav() {
  const reduce = useReducedMotion();
  const [theme, toggleTheme] = useTheme();
  const active = useActiveSection(IDS);
  const [hover, setHover] = useState(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const progress = useRef(null);
  const menu = useRef(null);
  const pill = useRef(null);
  const linkEls = useRef({});
  const lastY = useRef(0);

  useScroll(() => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.current.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    setScrolled(y > 20);
    setHidden(y > lastY.current && y > 400 && !open);
    lastY.current = y;
  });

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Pill slides to the hovered link and rests on the active one
  const target = hover || active;
  const prevTarget = useRef(null);
  useLayoutEffect(() => {
    const a = linkEls.current[target], p = pill.current, m = menu.current;
    if (!a || !p || getComputedStyle(p).display === "none") { p?.classList.remove("on"); return; }
    p.style.width = a.offsetWidth + "px";
    p.style.transform = `translateX(${a.getBoundingClientRect().left - m.getBoundingClientRect().left}px)`;
    p.classList.add("on");
    if (!reduce && prevTarget.current !== target) {
      p.classList.remove("stretch"); void p.offsetWidth; p.classList.add("stretch");
    }
    prevTarget.current = target;
  }, [target, reduce]);

  return (
    <>
      <div className="progress" ref={progress} aria-hidden="true" />
      <header className={"nav" + (scrolled ? " scrolled" : "") + (hidden ? " hide" : "")}>
        <a href="#home" className="logo" aria-label={`${NAME}, back to top`}><span className="mono" aria-hidden="true">SK</span></a>
        <nav className="menu" ref={menu} aria-label="Primary">
          <span className="pill" ref={pill} aria-hidden="true" />
          <ul className={"links" + (open ? " open" : "")} onPointerLeave={() => setHover(null)} onBlur={() => setHover(null)}>
            {NAV.map(({ id, label }, n) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  ref={(el) => { linkEls.current[id] = el; }}
                  className={active === id ? "active" : undefined}
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
          <button className="burger" onClick={() => setOpen((o) => !o)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
            <span /><span />
          </button>
        </div>
      </header>
    </>
  );
}
