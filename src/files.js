// The editor's file system: every section of the portfolio is a file.
export const FILES = [
  { id: "readme", name: "README.md", lang: "Markdown", ext: "md" },
  { id: "stack", name: "stack.json", lang: "JSON", ext: "json" },
  { id: "feastflow", name: "FeastFlow.java", dir: "projects", lang: "Java", ext: "java" },
  { id: "voyager", name: "voyager.tsx", dir: "projects", lang: "TypeScript React", ext: "tsx" },
  { id: "fairshare", name: "fairshare.jsx", dir: "projects", lang: "JavaScript React", ext: "jsx" },
  { id: "gamesite", name: "gamesite.js", dir: "projects", lang: "JavaScript", ext: "js" },
  { id: "experience", name: "experience.log", lang: "Log", ext: "log" },
  { id: "contact", name: "contact.sh", lang: "Shell", ext: "sh" },
];
export const byId = (id) => FILES.find((f) => f.id === id);
export const byName = (q) => {
  const s = q.toLowerCase().replace(/^projects\//, "");
  return FILES.find((f) => f.id === s || f.name.toLowerCase() === s || f.name.toLowerCase().split(".")[0] === s);
};
