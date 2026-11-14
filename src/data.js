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
  { id: "experience", label: "Experience" },
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
  { to: 4, label: "Projects built" },
  { to: 6, label: "Months of full-stack internship" },
  { to: 3, label: "Certifications earned" },
];

export const CHIPS = ["Java", "JavaScript", "TypeScript", "Spring Boot", "React", "MySQL", "Tailwind CSS", "Git"];

export const PROJECTS = [
  {
    id: "feastflow",
    title: "FeastFlow",
    href: GITHUB,
    live: null,
    desc: "A full-stack food delivery app with Spring Boot REST APIs, a MySQL database for orders and delivery records, a live rider-tracking simulator and dark mode. It has a customer app and a merchant command center that follows live kitchen orders.",
    meta: ["React", "Spring Boot", "MySQL"],
    shots: [
      { src: "FeastFlow_Preview", label: "Customer home" },
      { src: "FeastFlow_Portal", label: "Customer and merchant apps" },
    ],
  },
  {
    id: "voyager",
    title: "Voyager",
    href: GITHUB,
    live: "https://voyager-cyan.vercel.app",
    desc: "An AI travel discovery platform with live GPS distances, a Gemini-powered trip planner, day-by-day itineraries and keyboard-accessible navigation.",
    meta: ["React", "TypeScript", "Tailwind", "Gemini"],
    shots: [
      { src: "Voyager_Preview", label: "Home" },
      { src: "Voyager_FullPage", label: "Full page", full: true },
    ],
  },
  {
    id: "fairshare",
    title: "FairShare",
    href: GITHUB,
    live: "https://fair-share-two-ivory.vercel.app/",
    desc: "An offline-first bill-splitting app that simplifies group debts to the fewest settlements, with itemized receipts, charts and PDF export.",
    meta: ["React", "Vite", "Tailwind", "Recharts"],
    shots: [
      { src: "FairShare_Preview", label: "Home" },
      { src: "FairShare_FullPage", label: "Full page", full: true },
    ],
  },
  {
    id: "gamesite",
    title: "GameSite",
    href: GITHUB,
    live: null,
    desc: "A cyber-themed arcade hub in vanilla JavaScript with four games: Neural Sync, Combat Sim, Data Serpent and Cyber Stack, a falling-blocks game with next-piece preview, high score and keyboard controls.",
    meta: ["Vanilla JavaScript"],
    shots: [
      { src: "GameSite_Preview", label: "Arcade hub" },
      { src: "GameSite_Tetris", label: "Cyber Stack" },
    ],
  },
];

export const EXPERIENCE = [
  {
    when: "Expected 2026",
    title: "B.E. Electronics and Communication",
    org: "Sri Ramakrishna Institute of Technology",
    desc: "Studying with a CGPA of 8.4, alongside solving data structures and algorithms problems on LeetCode and taking part in Smart India Hackathon 2024.",
    tags: ["DSA", "OOPS", "DBMS"],
  },
  {
    when: "6 months",
    title: "Java Full-Stack Intern",
    org: "TAP Academy, Bangalore",
    desc: "Trained across frontend, backend and database work, built backend applications with Spring, Hibernate, J2EE, JSP and JDBC on MySQL, and delivered a real-time project.",
    tags: ["Spring Boot", "Hibernate", "MySQL"],
  },
  {
    when: "Current",
    title: "Software Trainee",
    org: "ReluSys",
    desc: "Currently working here as a Software Trainee.",
    tags: [],
  },
];

export const SOCIALS = [
  { label: "GitHub", href: GITHUB },
  { label: "LinkedIn", href: LINKEDIN },
];

export const FOOTER_SITEMAP = NAV;

export const CERTS =
  "The Complete Full-Stack Web Development Bootcamp on Udemy (62 hours), plus Claude 101 and Introduction to Claude Cowork from Anthropic's Claude Academy.";

export const STACK = [
  { label: "Backend", items: ["Java", "Spring Boot", "Hibernate", "J2EE", "JDBC"] },
  { label: "Frontend", items: ["JavaScript", "TypeScript", "React", "Tailwind CSS", "Vite"] },
  { label: "Data and tools", items: ["MySQL", "Git"] },
];

export const HERO_LINE =
  "I build Java and Spring Boot backends with React frontends that are fast, keyboard-accessible and easy to use.";
