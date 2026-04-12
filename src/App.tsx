/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import FancyCursor from "./components/FancyCursor";
import BackgroundLines from "./components/BackgroundLines";
import Footer from "./components/Footer";
import SplashScreen from "./components/SplashScreen";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import About from "./pages/About";
import Blogs from "./pages/Blogs";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen text-black font-sans selection:bg-black selection:text-white cursor-none">
        {/* <SplashScreen /> */}
        <BackgroundLines />
        <FancyCursor />
        <Navbar />
        <main>
          <Routes>
            <Route path="/admin" element={<Admin />} />
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/about" element={<About />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="*" element={
              <div className="pt-40 px-6 text-center">
                <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                <p className="text-neutral-500">The path <span className="font-mono text-black">{window.location.pathname}</span> does not match any routes.</p>
                <Link to="/" className="inline-block mt-8 text-sm font-bold uppercase tracking-widest underline underline-offset-8">Back to Home</Link>
              </div>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

