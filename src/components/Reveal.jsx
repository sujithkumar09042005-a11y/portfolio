// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { useInView } from "../hooks.js";

/** Section heading whose text rises out of a mask when scrolled into view. */
export function Title({ children }) {
  const [ref, seen] = useInView();
  return (
    <h2 className="section-title">
      <span ref={ref} className={"mask" + (seen ? " visible" : "")}><span>{children}</span></span>
    </h2>
  );
}

/** Element with a hairline rule that draws in on first view. `as` sets the tag. */
export function Rule({ as: Tag = "div", index = 0, className = "", children, ...rest }) {
  const [ref, seen] = useInView();
  return (
    <Tag ref={ref} className={`rule ${className}${seen ? " visible" : ""}`} style={{ "--d": `${index * 120}ms` }} {...rest}>
      {children}
    </Tag>
  );
}
