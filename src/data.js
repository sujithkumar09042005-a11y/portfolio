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

export const SOCIALS = [
  { label: "GitHub", href: GITHUB },
  { label: "LinkedIn", href: LINKEDIN },
];

export const FOOTER_SITEMAP = NAV;

// The whole story lives in the dive: the name, About, three projects, then experience. Contact is a separate section.
// Each chapter is one scene. `big` is the giant word you fly toward; `words` are floating words at other depths,
// as [text, x in vw, y in vh, depth offset in px, accent]. The readable copy is `title`, `text` and `stack`.
export const DIVE_INTRO = "Full-stack developer. Scroll to move forward.";
export const DIVE_CHAPTERS = [
  {
    label: "About", anchor: "about", big: "Full-stack",
    title: "The developer behind it.",
    text: "I am finishing a B.E. in Electronics and Communication Engineering in India, with a CGPA of 8.4, and I build full-stack apps in Java, Spring Boot and React. I care about interfaces that are fast, keyboard-accessible and easy to use, and I have started combining that with AI tools.",
    words: [["Java", -33, -26, 200], ["Spring Boot", 29, -31, -300, true], ["React", -30, 8, -500], ["TypeScript", 33, 4, 100], ["MySQL", 3, -38, -700], ["India", -6, 10, 350]],
  },
  {
    label: "FeastFlow", anchor: "work", big: "FeastFlow", href: GITHUB, link: "View FeastFlow on GitHub",
    title: "A food delivery app, front to back.",
    text: "A full-stack app with Spring Boot REST APIs, a MySQL database for orders and delivery records, a live rider-tracking simulator and dark mode.",
    stack: "Built with React, Spring Boot and MySQL.",
    words: [["React", -32, -27, 250], ["Spring Boot", 30, -30, -250, true], ["MySQL", 31, 6, 120], ["Rider tracking", -24, 9, -450], ["Dark mode", 6, -37, -650]],
  },
  {
    label: "Voyager", big: "Voyager", href: GITHUB, link: "View Voyager on GitHub",
    title: "An AI travel planner.",
    text: "An AI travel discovery platform with live GPS distances, a Gemini-powered trip planner, day-by-day itineraries and keyboard-accessible navigation.",
    stack: "Built with React, TypeScript, Tailwind CSS and Google Gemini.",
    words: [["Gemini", 31, -29, 200, true], ["React", -33, -25, -250], ["TypeScript", 30, 7, -480], ["Itineraries", -26, 9, 150], ["Live GPS", 4, -37, -700]],
  },
  {
    label: "SplitWise", big: "SplitWise", href: GITHUB, link: "View SplitWise on GitHub",
    title: "Bills split, debts settled.",
    text: "An offline-first bill-splitting app that simplifies group debts to the fewest settlements, with itemized receipts, charts and PDF export.",
    stack: "Built with React, Vite, Tailwind CSS and Recharts.",
    words: [["Offline", -31, -28, 220], ["Recharts", 30, -30, -280, true], ["PDF export", 28, 8, 130], ["Fewest payments", -22, 10, -470], ["Vite", 5, -37, -680]],
  },
  {
    label: "Internship", anchor: "experience", big: "Intern",
    title: "Six months as a full-stack intern.",
    text: "At TAP Academy in Bangalore I trained across frontend, backend and database work, built backend applications with Spring, Hibernate, J2EE, JSP and JDBC on MySQL, and delivered a real-time project.",
    words: [["Hibernate", -32, -27, 240], ["Spring Boot", 31, -30, -260, true], ["JDBC", 30, 7, 100], ["J2EE", -27, 9, -450], ["MySQL", 5, -37, -680]],
  },
  {
    label: "Education", big: "B.E.",
    title: "Studying Electronics and Communication.",
    text: "At Sri Ramakrishna Institute of Technology, expected 2026, with a CGPA of 8.4. Alongside it I solve data structures and algorithms problems on LeetCode and took part in Smart India Hackathon 2024.",
    words: [["CGPA 8.4", 31, -29, 220, true], ["DSA", -33, -26, -250], ["OOPS", 30, 7, -470], ["DBMS", -26, 9, 140], ["Hackathon 2024", 4, -37, -700]],
  },
  {
    label: "Certifications", big: "Certified", cta: true,
    title: "Certified in full-stack and Claude.",
    text: "The Complete Full-Stack Web Development Bootcamp on Udemy, 62 hours, plus Claude 101 and Introduction to Claude Cowork from Anthropic's Claude Academy.",
    words: [["Udemy, 62 hours", -26, -28, 230], ["Claude 101", 30, -30, -260, true], ["Claude Cowork", 27, 8, -480], ["Full-stack", -30, 9, 120]],
  },
];
