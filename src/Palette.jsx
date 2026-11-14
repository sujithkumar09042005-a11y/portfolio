import { useEffect, useMemo, useRef, useState } from "react";
import { FILES } from "./files.js";

export default function Palette({ actions, onOpenFile, onClose }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const items = useMemo(() => {
    const all = [
      ...FILES.map((f) => ({ key: f.id, label: f.name, hint: f.dir ? `projects/` : "file", run: () => onOpenFile(f.id) })),
      ...actions.map((a) => ({ key: a.label, label: a.label, hint: "action", run: a.run })),
    ];
    const s = q.trim().toLowerCase();
    return s ? all.filter((i) => i.label.toLowerCase().includes(s) || i.hint.includes(s)) : all;
  }, [q, actions, onOpenFile]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSel(0); }, [q]);

  function onKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(items.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); const it = items[sel]; if (it) { it.run(); onClose(); } }
    else if (e.key === "Escape") onClose();
  }

  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Go to file or run an action">
        <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
          placeholder="Go to a file or run an action" role="combobox" aria-expanded="true" aria-controls="pal-list"
          aria-activedescendant={items[sel] ? `pal-${sel}` : undefined} aria-label="Search files and actions" spellCheck={false} />
        <ul id="pal-list" role="listbox">
          {items.length === 0 && <li className="none">Nothing matches "{q}".</li>}
          {items.map((it, i) => (
            <li key={it.key} id={`pal-${i}`} role="option" aria-selected={i === sel} className={i === sel ? "on" : ""}
              onMouseMove={() => setSel(i)} onClick={() => { it.run(); onClose(); }}>
              <span>{it.label}</span><em>{it.hint}</em>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
