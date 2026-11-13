// Copyright (c) 2026 ReLU Technologies Private Limited. All rights reserved.
import { NAME, SOCIALS } from "../data.js";
import { scrollTop } from "../live.js";

export default function Footer() {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} {NAME}</p>
      <ul>
        {SOCIALS.map((s) => <li key={s.label}><a href={s.href} target="_blank" rel="noopener">{s.label}</a></li>)}
        <li><button type="button" onClick={scrollTop}>Back to top</button></li>
      </ul>
    </footer>
  );
}
