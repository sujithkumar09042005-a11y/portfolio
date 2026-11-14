// The source text shown in the left pane of each file. Built from data.js, so nothing is invented.
import { CERTS, EMAIL, EXPERIENCE, FACTS, GITHUB, HERO_LINE, PROJECTS, STACK, STATEMENT } from "./data.js";
import { byId } from "./files.js";

const q = (s) => `"${s}"`;
const comments = (text) => wrap(text, "// ");

function projectSource(p, ext) {
  const list = (items, pad) => items.length === 1 ? `{ ${q(items[0])} }` : `{\n${items.map((x) => pad + "    " + q(x)).join(",\n")}\n${pad}}`;
  const arr = (items) => items.length === 1 ? `[${q(items[0])}]` : `[\n${items.map((x) => "    " + q(x)).join(",\n")}\n  ]`;
  const stack = p.meta, shots = p.shots.map((s) => s.label);
  const live = p.live ? q(p.live) : null;
  if (ext === "java") {
    return `${comments(p.desc)}
@Project(name = ${q(p.title)})
public class ${p.title} {
    String[] stack = ${list(stack, "    ")};
    String[] screens = ${list(shots, "    ")};
${live ? `    String live =\n        ${live};\n` : ""}    String repo =\n        ${q(GITHUB)};
}
`;
  }
  const lang = ext === "tsx" ? ": Project" : "";
  return `${comments(p.desc)}
const ${p.id}${lang} = {
  name: ${q(p.title)},
  stack: ${arr(stack)},
  screens: ${arr(shots)},
${live ? `  live:\n    ${live},\n` : ""}  repo:\n    ${q(GITHUB)},
};

export default ${p.id};
`;
}

function wrap(text, prefix = "", n = 52) {
  const out = []; let line = "";
  for (const w of text.split(" ")) {
    if ((line + " " + w).trim().length > n) { out.push(line); line = w; } else line = (line + " " + w).trim();
  }
  out.push(line);
  return out.map((l) => prefix + l).join("\n");
}
const trim = (s, n) => (s.length > n ? s.slice(0, n - 3) + "..." : s);

export function sourceOf(id, form) {
  const f = byId(id);
  if (id === "readme") {
    return `# Sujith Kumar V
Full-stack developer

${wrap(HERO_LINE, "> ")}

## About
${wrap(STATEMENT)}

## Facts
${FACTS.map(([k, v]) => `- ${k}: ${v}`).join("\n")}
`;
  }
  if (id === "stack") {
    const rows = STACK.map((g, i) => {
      const key = g.label === "Data and tools" ? "dataAndTools" : g.label.toLowerCase();
      const items = g.items.map((it, j) => `    ${q(it)}${j < g.items.length - 1 ? "," : ""}`).join("\n");
      return `  ${q(key)}: [\n${items}\n  ]${i < STACK.length - 1 ? "," : ""}`;
    });
    return `{\n${rows.join("\n")}\n}\n`;
  }
  if (id === "experience") {
    const rows = [];
    const pad = (s, n) => s.padEnd(n).slice(0, n);
    EXPERIENCE.forEach((e) => {
      const when = e.when.toLowerCase();
      const kind = e.org.startsWith("Sri") ? "education" : e.title.includes("Intern") ? "intern" : "work";
      rows.push(`INFO  ${pad(when, 13)} ${pad(kind, 10)} ${trim(e.title, 26)}`);
      rows.push(`INFO  ${pad("", 13)} ${pad("at", 10)} ${trim(e.org, 26)}`);
      if (e.tags.length) rows.push(`INFO  ${pad("", 13)} ${pad("stack", 10)} ${trim(e.tags.join(", "), 26)}`);
    });
    rows.push(`INFO  ${pad("certified", 13)} ${pad("udemy", 10)} ${trim("Full-Stack Bootcamp, 62 hours", 26)}`);
    rows.push(`INFO  ${pad("certified", 13)} ${pad("anthropic", 10)} ${trim("Claude 101, Claude Cowork", 26)}`);
    return rows.join("\n") + "\n";
  }
  if (id === "contact") {
    const v = (s) => trim(s.replace(/\s+/g, " ").replace(/"/g, "'"), 46);
    return `#!/bin/sh
# Fill in the form and this script writes itself.

NAME=${q(v(form.name))}
EMAIL=${q(v(form.email))}
MESSAGE=${q(v(form.message))}

mail -s "Hello from $NAME" \\
  ${EMAIL_TO} <<< "$MESSAGE"
`;
  }
  const p = PROJECTS.find((x) => x.id === id);
  return projectSource(p, f.ext);
}

const EMAIL_TO = EMAIL;
