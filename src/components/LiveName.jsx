import { useEffect, useRef } from "react";
import { registerGroup } from "../liveEngine.js";
import { useReducedMotion } from "../hooks.js";

/**
 * The name, alive: every letter is a small spring that the pointer pushes, tilts and thickens, a click kicks, and a slow wave
 * moves through when nothing is touching it. Screen readers get the plain name; the letters are decorative.
 */
export default function LiveName({ lines }) {
  const root = useRef(null);
  const reduce = useReducedMotion();
  const letters = useRef([]);
  let n = 0;

  useEffect(() => {
    if (reduce) return;
    const units = letters.current.filter(Boolean);
    // the dive fades the name out as you scroll away from the start, so there is no point moving letters nobody can see
    const gate = () => parseFloat(root.current.parentElement.style.opacity || "1") > 0.03;
    return registerGroup({ kind: "name", units, gate });
  }, [reduce]);

  return (
    <span ref={root} className="live-name" role="text" aria-label={lines.join(" ")}>
      {lines.map((line, li) => (
        <span key={line} className="ln-line" aria-hidden="true">
          {line.split("").map((ch) => { const i = n++; return <span key={i} className="ln-ch" ref={(el) => { letters.current[i] = el; }}>{ch}</span>; })}
          {li < lines.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
