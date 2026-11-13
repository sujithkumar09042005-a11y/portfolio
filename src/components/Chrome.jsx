// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
// Cursor label bubble and scroll progress bar. Lazy loaded: the only user of motion/react.
import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { useCanHover } from "../hooks.js";

export default function Chrome() {
  const canHover = useCanHover();
  const x = useSpring(-100, { stiffness: 520, damping: 38, mass: 0.5 });
  const y = useSpring(-100, { stiffness: 520, damping: 38, mass: 0.5 });
  const [label, setLabel] = useState("");
  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 140, damping: 24 });

  useEffect(() => {
    if (!canHover) return;
    const move = (e) => { x.set(e.clientX); y.set(e.clientY); };
    const over = (e) => setLabel(e.target.closest?.("[data-cursor]")?.dataset.cursor || "");
    const out = (e) => { if (!e.relatedTarget) setLabel(""); };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerout", out, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerout", out);
    };
  }, [canHover, x, y]);

  return (
    <>
      <motion.div className="progress" style={{ scaleX: bar }} aria-hidden="true" />
      {canHover && (
        <motion.div className="cursor" style={{ x, y }} aria-hidden="true">
          <motion.span
            className="cursor-bub"
            initial={false}
            animate={{ scale: label ? 1 : 0, opacity: label ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
          >
            {label}
          </motion.span>
        </motion.div>
      )}
    </>
  );
}
