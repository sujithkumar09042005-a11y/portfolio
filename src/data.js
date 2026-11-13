// All site content lives here so components stay presentational.

export const NAME = "Sujith Kumar V";
export const HERO_LINES = ["Sujith", "Kumar"];
export const EMAIL = "sujithkumar09042005@gmail.com";
export const GITHUB = "https://github.com/sujithkumar09042005-a11y";
export const LINKEDIN = "https://www.linkedin.com/in/sujithkumar9425";
export const RESUME = "https://drive.google.com/file/d/16Ga2nFcqlgoyxr6YUDyS0sDLTHseXvGk/view?usp=sharing";

export const NAV = [
  { id: "about", label: "About" },
  { id: "work", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
];

export const SOCIALS = [
  { label: "GitHub", href: GITHUB },
  { label: "LinkedIn", href: LINKEDIN },
];

export const FOOTER_SITEMAP = NAV;

// The whole story lives in the dive, in this order: the name, About (a heading scene, then its content), Projects (a heading
// scene, then all three projects together), Experience (a heading scene, then college, TAP Academy and ReluSys in order).
// Contact is a separate section after the dive. Each scene has a `kind`, and each kind has its own layout:
//   head      a giant word you fly toward and one line under it
//   about     a large statement on the left and a quiet column of facts on the right
//   projects  the projects as an index: one row each, with a big name, a line about it, its stack and a link
//   timeline  one vertical line with the steps in order, each with its dates beside it
// `words` are floating words at other depths, as [text, x in vw, y in vh, depth offset in px, accent].
export const DIVE_INTRO = "Full-stack developer. Scroll to move forward.";
export const DIVE_SECTIONS = ["About", "Projects", "Experience"];
export const DIVE_SCENES = [
  {
    kind: "head", section: 0, label: "About", anchor: "about", big: "Full Stack Developer",
    title: "Java, Spring Boot and React, front to back.",
    words: [["Java", -33, -30, 200], ["Spring Boot", 29, -33, -300, true], ["React", 28, 30, -500], ["TypeScript", 36, 24, 100], ["MySQL", -14, 37, -700]],
  },
  {
    kind: "about", section: 0, label: "About",
    statement: "I build full-stack apps from the database to the screen, and I care that they are fast, keyboard-accessible and easy to use.",
    facts: [
      ["Studying", "B.E. in Electronics and Communication Engineering, CGPA 8.4, India"],
      ["Works in", "Java, Spring Boot, React, TypeScript, MySQL"],
      ["Certified", "Full-Stack Web Development Bootcamp (62 hours), Claude 101, Claude Cowork"],
    ],
    words: [["Hibernate", -35, -36, 240], ["REST APIs", 31, -30, -260, true], ["Tailwind CSS", -36, 33, 120], ["Git", 34, 27, -450], ["Spring", 4, -37, -650]],
  },
  {
    kind: "head", section: 1, label: "Projects", anchor: "work", big: "Projects",
    title: "Three things I built.",
    words: [["React", -33, -30, 250], ["Gemini", 30, -33, -250, true], ["Recharts", -31, 26, 120], ["Rider tracking", 26, 29, -450], ["Offline", 8, 37, -650]],
  },
  {
    kind: "projects", section: 1, label: "Projects",
    items: [
      { title: "FeastFlow", line: "Food delivery with a live rider tracker.", stack: "React, Spring Boot, MySQL", href: GITHUB, link: "FeastFlow on GitHub" },
      { title: "Voyager", line: "An AI trip planner that builds day-by-day itineraries.", stack: "React, TypeScript, Google Gemini", href: GITHUB, link: "Voyager on GitHub" },
      { title: "SplitWise", line: "Group bills settled in the fewest payments, offline.", stack: "React, Vite, Recharts", href: GITHUB, link: "SplitWise on GitHub" },
    ],
    words: [["Spring Boot", -34, -36, 220, true], ["MySQL", 31, -37, -260], ["TypeScript", -30, 30, 120], ["Vite", 32, 35, -450]],
  },
  {
    kind: "head", section: 2, label: "Experience", anchor: "experience", big: "Experience",
    title: "Where I studied and worked.",
    words: [["Hibernate", -33, -30, 240], ["Spring Boot", 30, -33, -260, true], ["JDBC", -37, 34, 110], ["MySQL", 30, 23, -450], ["J2EE", 4, 36, -650]],
  },
  {
    kind: "timeline", section: 2, label: "Experience", cta: true,
    items: [
      { when: "Expected 2026", title: "College", org: "Sri Ramakrishna Institute of Technology", text: "B.E. in Electronics and Communication, with a CGPA of 8.4. Data structures practice on LeetCode and Smart India Hackathon 2024." },
      { when: "6 months", title: "TAP Academy", org: "Java Full-Stack Intern, Bangalore", text: "Built backend applications with Spring, Hibernate, J2EE, JSP and JDBC on MySQL, and delivered a real-time project." },
      { when: "Now", title: "ReluSys", org: "Software Trainee", text: "" },
    ],
    words: [["DSA", -34, -36, 220, true], ["Smart India Hackathon", 26, -37, -280], ["LeetCode", -31, 31, 120], ["Java", 33, 35, -450]],
  },
];

// The dive's colour palette. Chapters sit at even steps along `arc` (OKLCH hue, start to end), so the colours drift slowly
// from one chapter to the next at the same lightness. `second` is the hue offset of the gradient's other end, and `pop` is
// the one warm (or contrasting) accent hue, used sparingly. Change DIVE_PALETTE to try another.
export const DIVE_PALETTE = "aurora";
export const DIVE_PALETTES = {
  aurora: { arc: [273, 195], second: -30, pop: 70 },    // indigo drifting to cyan, amber accent. Starts at the site's own indigo.
  ember: { arc: [28, 88], second: 28, pop: 250 },       // red-orange drifting to amber, blue accent
  dusk: { arc: [350, 280], second: -26, pop: 190 },     // rose drifting to violet, cyan accent
};
