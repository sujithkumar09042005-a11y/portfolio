// All site content lives here so components stay presentational.

export const NAME = "Sujith Kumar V";
export const HERO_LINES = ["Sujith", "Kumar"];
export const EMAIL = "sujithkumar09042005@gmail.com";
export const GITHUB = "https://github.com/sujithkumar09042005-a11y";
export const LINKEDIN = "https://www.linkedin.com/in/sujithkumar9425";
export const RESUME = "https://drive.google.com/file/d/16Ga2nFcqlgoyxr6YUDyS0sDLTHseXvGk/view?usp=sharing";

export const NAV = [
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "experience", label: "Career" },
  { id: "contact", label: "Contact" },
];

export const PHRASES = [
  "Spring Boot REST APIs",
  "React and TypeScript interfaces",
  "AI-assisted products",
  "keyboard-accessible experiences",
];

export const MARQUEE = ["Full-stack", "Spring Boot", "React", "TypeScript", "MySQL"];

export const STATEMENT =
  "I am a full-stack developer finishing my B.E. in Electronics and Communication Engineering. I build Java and Spring Boot backends with React frontends, and I care about interfaces that are fast, keyboard-accessible and easy to use. Lately I have been combining that with AI tools, from a Gemini-powered trip planner to AI-assisted development.";

export const FACTS = [
  ["Based in", "India"],
  ["Focus", "Full-stack web development"],
  ["Education", "B.E. in ECE, CGPA 8.4 (expected 2026)"],
  ["Tools", "Java, JavaScript, TypeScript, Spring Boot, React, MySQL, Git"],
];

export const STATS = [
  { to: 3, label: "Full-stack projects built" },
  { to: 6, label: "Months of full-stack internship" },
  { to: 3, label: "Certifications earned" },
];

export const CHIPS = ["Java", "JavaScript", "TypeScript", "Spring Boot", "React", "MySQL", "Tailwind CSS", "Git"];

export const PROJECTS = [
  {
    id: "feastflow",
    art: "a1",
    title: "FeastFlow",
    href: GITHUB,
    desc: "A full-stack food delivery app with Spring Boot REST APIs, a MySQL database for orders and delivery records, a live rider-tracking simulator and dark mode.",
    meta: ["React, Spring Boot", "MySQL"],
  },
  {
    id: "voyager",
    art: "a2",
    title: "Voyager",
    href: GITHUB,
    desc: "An AI travel discovery platform with live GPS distances, a Gemini-powered trip planner, day-by-day itineraries and keyboard-accessible navigation.",
    meta: ["React, TypeScript", "Tailwind, Gemini"],
  },
  {
    id: "splitwise",
    art: "a3",
    title: "SplitWise",
    href: GITHUB,
    desc: "An offline-first bill-splitting app that simplifies group debts to the fewest settlements, with itemized receipts, charts and PDF export.",
    meta: ["React, Vite", "Tailwind, Recharts"],
  },
];

export const EXPERIENCE = [
  {
    id: "relusys",
    when: "Current",
    title: "Software Trainee",
    org: "ReluSys",
    short: "Software Trainee, current",
    desc: "Working as a Software Trainee at ReluSys.",
    tags: ["Full-stack"],
    current: true,
  },
  {
    id: "tap",
    when: "6 months",
    title: "Java Full-Stack Intern",
    org: "TAP Academy, Bangalore",
    short: "Java full-stack internship, 6 months",
    desc: "Trained across frontend, backend and database work in Bangalore, built backend applications with Spring, Hibernate, J2EE, JSP and JDBC on MySQL, and delivered a real-time project.",
    tags: ["Spring Boot", "Hibernate", "MySQL"],
  },
  {
    id: "be",
    when: "Expected 2026",
    title: "B.E. Electronics and Communication",
    org: "Sri Ramakrishna Institute of Technology",
    short: "B.E. ECE, CGPA 8.4, expected 2026",
    desc: "Studying with a CGPA of 8.4, alongside solving data structures and algorithms problems on LeetCode and taking part in Smart India Hackathon 2024.",
    tags: ["DSA", "OOPS", "DBMS"],
  },
];

export const CERTIFICATIONS =
  "The Complete Full-Stack Web Development Bootcamp on Udemy (62 hours), plus Claude 101 and Introduction to Claude Cowork from Anthropic's Claude Academy.";

// Living status line in the identity tile: typed and erased in turn
export const STATUS_FACTS = [
  "Software Trainee at ReluSys",
  "Java full-stack, trained at TAP Academy in Bangalore",
  "B.E. in ECE, CGPA 8.4, expected 2026",
  "Building Spring Boot APIs with React frontends",
  "Using AI tools in my workflow, from Gemini to Claude",
];

export const STACK_NODES = [
  { id: "client", name: "Client", tech: "React, TypeScript" },
  { id: "api", name: "API", tech: "Java, Spring Boot" },
  { id: "db", name: "Database", tech: "MySQL" },
];

export const TILE_COPY = {
  stack: "Requests travel from a React and TypeScript client to a Spring Boot REST API, which reads and writes MySQL. The same shape sits behind FeastFlow.",
  clock: "This clock follows your own time zone, and the tint tracks the real hour where you are.",
};

export const SOCIALS = [
  { label: "Resume", href: RESUME },
  { label: "GitHub", href: GITHUB },
  { label: "LinkedIn", href: LINKEDIN },
];

export const FOOTER_SITEMAP = NAV;
