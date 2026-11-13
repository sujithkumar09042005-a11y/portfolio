// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useCanHover, useReducedMotion, useInView } from "../hooks.js";

const SPRING = { stiffness: 220, damping: 18, mass: 0.6 };

/** Element that leans toward the pointer with a spring. Inert on touch and reduced motion. */
export function Magnetic({ as = "div", strength = 0.3, children, ...rest }) {
  const reduce = useReducedMotion();
  const hover = useCanHover();
  const x = useSpring(useMotionValue(0), SPRING);
  const y = useSpring(useMotionValue(0), SPRING);
  const Tag = motion[as];
  const on = !reduce && hover;
  return (
    <Tag
      {...rest}
      style={on ? { x, y } : undefined}
      onPointerMove={on ? (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      } : undefined}
      onPointerLeave={on ? () => { x.set(0); y.set(0); } : undefined}
    >
      {children}
    </Tag>
  );
}

/** Card with magnetic pull, cursor spotlight and a 3D tilt clamped to +-6deg. */
export function TiltCard({ as = "article", children, className = "", ...rest }) {
  const reduce = useReducedMotion();
  const hover = useCanHover();
  const ref = useRef(null);
  const mx = useSpring(useMotionValue(0), SPRING);
  const my = useSpring(useMotionValue(0), SPRING);
  const rx = useSpring(useMotionValue(0), SPRING);
  const ry = useSpring(useMotionValue(0), SPRING);
  const Tag = motion[as];
  const on = !reduce && hover;
  const transform = useTransform([mx, my, rx, ry], ([a, b, c, d]) =>
    `perspective(900px) translate3d(${a}px, ${b}px, 0) rotateX(${c}deg) rotateY(${d}deg)`);
  return (
    <Tag
      ref={ref}
      className={"tilt " + className}
      {...rest}
      style={on ? { transform } : undefined}
      onPointerMove={(e) => {
        const r = ref.current.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        ref.current.style.setProperty("--sx", `${e.clientX - r.left}px`);
        ref.current.style.setProperty("--sy", `${e.clientY - r.top}px`);
        if (!on) return;
        ry.set(Math.max(-6, Math.min(6, (px - 0.5) * 12)));
        rx.set(Math.max(-6, Math.min(6, (0.5 - py) * 12)));
        mx.set((px - 0.5) * 14); my.set((py - 0.5) * 10);
      }}
      onPointerEnter={() => ref.current.classList.add("lit")}
      onPointerLeave={() => { ref.current.classList.remove("lit"); mx.set(0); my.set(0); rx.set(0); ry.set(0); }}
    >
      {children}
    </Tag>
  );
}

/** Section heading: the text slides up out of a mask when it enters view. */
export function Title({ id, children }) {
  const [ref, seen] = useInView();
  return (
    <h2 className="section-title" id={id} tabIndex={-1}>
      <span ref={ref} className={"mask" + (seen ? " visible" : "")}><span>{children}</span></span>
    </h2>
  );
}

/** Generic reveal wrapper (fade + rise), used for blocks. */
export function Rise({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
  const [ref, seen] = useInView();
  return (
    <Tag ref={ref} className={`rise ${className}${seen ? " visible" : ""}`} style={{ "--d": `${delay}ms` }} {...rest}>{children}</Tag>
  );
}

/** Sets --px/--py on the container as the pointer moves over it, so children can glow toward it. */
export function useGlowToward(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e) => {
      el.querySelectorAll(".field").forEach((f) => {
        const r = f.getBoundingClientRect();
        const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
        const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
        const near = Math.max(0, 1 - Math.hypot(dx, dy) / 220);
        f.style.setProperty("--near", near.toFixed(3));
        f.style.setProperty("--gx", `${e.clientX - r.left}px`);
        f.style.setProperty("--gy", `${e.clientY - r.top}px`);
      });
    };
    const leave = () => el.querySelectorAll(".field").forEach((f) => f.style.setProperty("--near", "0"));
    addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => { removeEventListener("pointermove", move); document.documentElement.removeEventListener("pointerleave", leave); };
  }, [ref]);
}
