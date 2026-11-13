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

export const FACTS = [
  ["Based in", "India"],
  ["Focus", "Full-stack web development"],
  ["Education", "B.E. in ECE, CGPA 8.4 (expected 2026)"],
  ["Tools", "Java, JavaScript, TypeScript, Spring Boot, React, MySQL, Git"],
];

export const STATS = [
  { to: 3, label: "Projects built" },
  { to: 6, label: "Months as a full-stack intern" },
  { to: 3, label: "Certifications earned" },
];

export const CHIPS = ["Java", "JavaScript", "TypeScript", "Spring Boot", "React", "MySQL", "Tailwind CSS", "Git"];

export const PROJECTS = [
  {
    art: "a1",
    title: "FeastFlow",
    href: GITHUB,
    desc: "A full-stack food delivery app with Spring Boot REST APIs, a MySQL database for orders and delivery records, a live rider-tracking simulator and dark mode.",
    meta: ["React, Spring Boot", "MySQL"],
  },
  {
    art: "a2",
    title: "Voyager",
    href: GITHUB,
    desc: "An AI travel discovery platform with live GPS distances, a Gemini-powered trip planner, day-by-day itineraries and keyboard-accessible navigation.",
    meta: ["React, TypeScript", "Tailwind, Gemini"],
  },
  {
    art: "a3",
    title: "SplitWise",
    href: GITHUB,
    desc: "An offline-first bill-splitting app that simplifies group debts to the fewest settlements, with itemized receipts, charts and PDF export.",
    meta: ["React, Vite", "Tailwind, Recharts"],
  },
];

export const EXPERIENCE = [
  {
    when: "6 months",
    title: "Java Full-Stack Intern, TAP Academy",
    desc: "Trained across frontend, backend and database work in Bangalore, built backend applications with Spring, Hibernate, J2EE, JSP and JDBC on MySQL, and delivered a real-time project.",
    tags: ["Spring Boot", "Hibernate", "MySQL"],
  },
  {
    when: "Expected 2026",
    title: "B.E. Electronics and Communication, Sri Ramakrishna Institute of Technology",
    desc: "Studying with a CGPA of 8.4, alongside solving data structures and algorithms problems on LeetCode and taking part in Smart India Hackathon 2024.",
    tags: ["DSA", "OOPS", "DBMS"],
  },
  {
    when: "2026",
    title: "Certifications",
    desc: "The Complete Full-Stack Web Development Bootcamp on Udemy (62 hours), plus Claude 101 and Introduction to Claude Cowork from Anthropic's Claude Academy.",
    tags: ["Full-stack", "Claude"],
  },
];

export const SOCIALS = [
  { label: "GitHub", href: GITHUB },
  { label: "LinkedIn", href: LINKEDIN },
];

export const FOOTER_SITEMAP = NAV;

// The dive: one request travelling forward through the stack, then the person behind it. One chapter per card.
// The cards for these chapters live in Dive.jsx and must stay in the same order.
export const DIVE_INTRO = "Full-stack developer. Scroll to send a request.";
export const DIVE_CHAPTERS = [
  { label: "React", title: "Every app starts as a request.", text: "A user taps a button and React sends it." },
  { label: "Spring Boot", title: "An API decides what happens next.", text: "Spring Boot checks the request and calls the service." },
  { label: "MySQL", title: "The data lives in a database.", text: "Hibernate asks MySQL for the rows." },
  { label: "Response", title: "I build every layer of it.", text: "The front end, the API and the database, all by one person." },
  { label: "About", anchor: "about", title: "The developer behind it.", text: "I am finishing a B.E. in Electronics and Communication Engineering. I build full-stack apps in Java, Spring Boot and React, and I care about interfaces that are fast, keyboard-accessible and easy to use." },
  { label: "Skills", title: "The tools I work with.", text: "Java and Spring Boot on the server, React and TypeScript on the client, MySQL underneath." },
  { label: "Numbers", title: "Where it stands today.", text: "Three projects, a six-month internship and three certifications.", cta: true },
];
