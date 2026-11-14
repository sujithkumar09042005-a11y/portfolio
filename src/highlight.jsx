// A small syntax highlighter: every file in the editor is real source, coloured by language.
const KW = {
  java: "public private class static final void return new null if else for while import package extends this true false int",
  ts: "const let var function return export default import from new null true false if else type interface async await",
  sh: "if then else fi echo exit for do done set export",
};
KW.tsx = KW.jsx = KW.js = KW.ts;

const span = (c, t) => ({ c, t });

function code(line, lang) {
  const cm = lang === "sh" ? "#.*" : "\\/\\/.*";
  const rx = new RegExp(
    `(${cm})|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*')|(@\\w+)|(\\$\\{?\\w+\\}?)|(\\b\\d+(?:\\.\\d+)?\\b)|([A-Za-z_]\\w*)|(\\s+)|([\\s\\S])`,
    "g"
  );
  const kw = new Set((KW[lang] || "").split(" "));
  const out = [];
  let m;
  while ((m = rx.exec(line))) {
    const rest = line.slice(rx.lastIndex);
    if (m[1]) out.push(span("cm", m[1]));
    else if (m[2]) out.push(span(lang === "json" && /^\s*:/.test(rest) ? "pr" : "st", m[2]));
    else if (m[3]) out.push(span("an", m[3]));
    else if (m[4]) out.push(span("an", m[4]));
    else if (m[5]) out.push(span("nu", m[5]));
    else if (m[6]) {
      const w = m[6];
      if (kw.has(w)) out.push(span("kw", w));
      else if (rest.startsWith("(")) out.push(span("fn", w));
      else if (/^[A-Z]/.test(w)) out.push(span("ty", w));
      else out.push(span("", w));
    } else out.push(span("", m[0]));
  }
  return out;
}

function inline(s) {
  const out = [];
  const rx = /(`[^`]+`)|(\*\*[^*]+\*\*)|([^`*]+|\*)/g;
  let m;
  while ((m = rx.exec(s))) {
    if (m[1]) out.push(span("st", m[1]));
    else if (m[2]) out.push(span("b", m[2]));
    else out.push(span("", m[3]));
  }
  return out;
}

function md(line) {
  let m;
  if ((m = /^(#{1,3} )(.*)$/.exec(line))) return [span("kw", m[1]), span("h", m[2])];
  if ((m = /^(> )(.*)$/.exec(line))) return [span("cm", m[1]), span("q", m[2])];
  if ((m = /^(- )(.*)$/.exec(line))) return [span("kw", m[1]), ...inline(m[2])];
  return inline(line);
}

function log(line) {
  const m = /^(INFO)(  )(.{13})( )(.{10})( )(.*)$/.exec(line);
  if (!m) return [span("cm", line)];
  return [span("ty", m[1]), span("", m[2]), span("cm", m[3]), span("", m[4]), span("kw", m[5]), span("", m[6]), span("", m[7])];
}

export function tokenize(line, lang) {
  if (lang === "md") return md(line);
  if (lang === "log") return log(line);
  return code(line, lang);
}

export function Source({ text, lang }) {
  const lines = text.replace(/\n$/, "").split("\n");
  return (
    <ol className={"src lang-" + lang}>
      {lines.map((l, i) => (
        <li key={i} style={{ "--i": Math.min(i, 28) }}>
          {l === "" ? "​" : tokenize(l, lang).map((t, j) => (t.c ? <span key={j} className={"t-" + t.c}>{t.t}</span> : t.t))}
        </li>
      ))}
    </ol>
  );
}
