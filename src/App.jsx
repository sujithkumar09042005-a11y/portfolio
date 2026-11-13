import { lazy, Suspense } from "react";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";
import Dive from "./components/Dive.jsx";
import Nav from "./components/Nav.jsx";

// The background canvas is decorative, so it loads after the first paint in its own chunk
const Starfield = lazy(() => import("./components/Starfield.jsx"));

export default function App() {
  return (
    <>
      <Suspense fallback={null}><Starfield /></Suspense>
      <Nav />
      <main>
        <Dive />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
