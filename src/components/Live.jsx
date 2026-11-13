import { useEffect, useRef } from "react";
import { registerGroup } from "../liveEngine.js";
import { useReducedMotion } from "../hooks.js";

/** Text split into units that each react to the pointer. unit: "chars" (letters), "words", or "whole" (one piece, for text with a
 *  clipped gradient fill). Every unit is a plain inline-block, so the text reads, wraps, selects and is read aloud normally.
 *  `outer` wraps each unit in another element, for effects that already use the unit's transform (such as a reveal).
 *  `gate` says when the text is on screen and should react; it can change every render without re-registering. */
export function LiveText({ text, kind, unit = "words", gate, perFrame = false, outer, className, ...rest }) {
  const reduce = useReducedMotion();
  const refs = useRef([]);
  const gateRef = useRef(gate);
  gateRef.current = gate;
  const parts = unit === "chars" ? text.split("") : unit === "whole" ? [text] : text.split(" ");

  useEffect(() => {
    if (reduce) return;
    const units = refs.current.filter(Boolean);
    return registerGroup({ kind, units, gate: () => (gateRef.current ? gateRef.current() : true), perFrame });
  }, [reduce, kind, unit, perFrame, text]);

  return (
    <span className={className} {...rest}>
      {parts.map((p, i) => {
        const u = <span key={i} className="lt-u" ref={(el) => { refs.current[i] = el; }}>{p}{unit === "words" && i < parts.length - 1 ? " " : ""}</span>;
        return outer ? <span key={i} className={outer} style={{ "--i": i }}>{u}</span> : u;
      })}
    </span>
  );
}
