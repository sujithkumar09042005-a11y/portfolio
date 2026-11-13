import { lazy, Suspense } from "react";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";
import Dive from "./components/Dive.jsx";
import Nav from "./components/Nav.jsx";
import { useReducedMotion } from "./hooks.js";

// The canvas is decorative and heavy, so it loads after the first paint in its own chunk
const FlowField = lazy(() => import("./components/FlowField.jsx"));

export default function App() {
  const reduce = useReducedMotion();
  return (
    <>
      {!reduce && <Suspense fallback={null}><FlowField /></Suspense>}
      <Nav />
      <main>
        <Dive />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
