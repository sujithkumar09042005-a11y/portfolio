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
// Contact is a separate section after the dive. Each scene has a `kind`:
//   head   a giant word you fly toward and one line under it
//   body   a title, a paragraph and a few extra lines in the middle of the scene
//   dense  several entries side by side (`items`)
// `words` are floating words at other depths, as [text, x in vw, y in vh, depth offset in px, accent].
export const DIVE_INTRO = "Full-stack developer. Scroll to move forward.";
export const DIVE_SECTIONS = ["About", "Projects", "Experience"];
export const DIVE_SCENES = [
  {
    kind: "head", section: 0, label: "About", anchor: "about", big: "About",
    title: "Full-Stack Developer.",
    words: [["Java", -33, -30, 200], ["Spring Boot", 29, -33, -300, true], ["React", 22, 31, -500], ["TypeScript", 36, 24, 100], ["MySQL", -14, 37, -700]],
  },
  {
    kind: "body", section: 0, label: "About",
    title: "The developer behind it.",
    text: "I am finishing a B.E. in Electronics and Communication Engineering in India, with a CGPA of 8.4, and I build full-stack apps in Java, Spring Boot and React. I care about interfaces that are fast, keyboard-accessible and easy to use, and I have started combining that with AI tools.",
    extra: [
      "Tools: Java, JavaScript, TypeScript, Spring Boot, React, MySQL, Git.",
      "Certified: the Complete Full-Stack Web Development Bootcamp on Udemy (62 hours), plus Claude 101 and Introduction to Claude Cowork from Anthropic's Claude Academy.",
    ],
    words: [["Hibernate", -35, -36, 240], ["REST APIs", 31, -30, -260, true], ["Tailwind CSS", -36, 33, 120], ["Git", 34, 27, -450], ["Spring", 4, -37, -650]],
  },
  {
    kind: "head", section: 1, label: "Projects", anchor: "work", big: "Projects",
    title: "Three things I built.",
    words: [["React", -33, -30, 250], ["Gemini", 30, -33, -250, true], ["Recharts", -31, 26, 120], ["Rider tracking", 25, 31, -450], ["Offline", 5, 36, -650]],
  },
  {
    kind: "dense", section: 1, label: "Projects",
    items: [
      { title: "FeastFlow", text: "A full-stack food delivery app with Spring Boot REST APIs, a MySQL database for orders and delivery records, a live rider-tracking simulator and dark mode.", stack: "React, Spring Boot and MySQL.", href: GITHUB, link: "View FeastFlow on GitHub" },
      { title: "Voyager", text: "An AI travel discovery platform with live GPS distances, a Gemini-powered trip planner, day-by-day itineraries and keyboard-accessible navigation.", stack: "React, TypeScript, Tailwind CSS and Google Gemini.", href: GITHUB, link: "View Voyager on GitHub" },
      { title: "SplitWise", text: "An offline-first bill-splitting app that simplifies group debts to the fewest settlements, with itemized receipts, charts and PDF export.", stack: "React, Vite, Tailwind CSS and Recharts.", href: GITHUB, link: "View SplitWise on GitHub" },
    ],
    words: [["Spring Boot", -34, -36, 220, true], ["MySQL", 31, -37, -260], ["TypeScript", -30, 30, 120], ["Vite", 32, 35, -450]],
  },
  {
    kind: "head", section: 2, label: "Experience", anchor: "experience", big: "Experience",
    title: "Where I studied and worked.",
    words: [["Hibernate", -33, -30, 240], ["Spring Boot", 30, -33, -260, true], ["JDBC", -37, 34, 110], ["MySQL", 30, 23, -450], ["J2EE", 4, 36, -650]],
  },
  {
    kind: "dense", section: 2, label: "Experience", cta: true,
    items: [
      { n: 1, when: "Expected 2026", title: "College", org: "B.E. in Electronics and Communication, Sri Ramakrishna Institute of Technology", text: "A CGPA of 8.4, alongside data structures and algorithms practice on LeetCode and Smart India Hackathon 2024." },
      { n: 2, when: "6 months", title: "TAP Academy", org: "Java Full-Stack Intern, Bangalore", text: "Trained across frontend, backend and database work, built backend applications with Spring, Hibernate, J2EE, JSP and JDBC on MySQL, and delivered a real-time project." },
      { n: 3, when: "Current", title: "ReluSys", org: "Software Trainee", text: "" },
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
