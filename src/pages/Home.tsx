import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowDownRight } from "lucide-react";
import LogoWall from "@/components/LogoWall";
import ProjectCard from "@/components/ProjectCard";
import { projects as mockProjects } from "@/lib/data";
import { Link } from "react-router-dom";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";

const focusAreas = ["digital marketing", "Artificial intelligence", "interactive experience"];

export default function Home() {
  const [focusIndex, setFocusIndex] = useState(0);
  const [projects, setProjects] = useState(mockProjects);

  useEffect(() => {
    const interval = setInterval(() => {
      setFocusIndex((prev) => (prev + 1) % focusAreas.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"), limit(3));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      if (fetchedProjects.length > 0) {
        setProjects(fetchedProjects);
      }
    }, (error) => {
      console.error("Error fetching projects:", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="pt-32">
      {/* Hero Section */}
      <section className="px-6 md:px-12 lg:px-24 mb-40">
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-xl font-medium mb-4"
        >
          Hey, I'm Dicky.
        </motion.p>
        <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1] mb-12">
          a digital product designer <br />
          with focus on <br />
          <span className="relative inline-block h-[1.3em] overflow-hidden align-bottom px-2 -ml-2">
            <AnimatePresence mode="wait">
              <motion.span
                key={focusAreas[focusIndex]}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-100%" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="block italic text-neutral-400 whitespace-nowrap leading-[1.3] py-1"
              >
                {focusAreas[focusIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
        </h1>
      </section>

      {/* Logo Wall */}
      <LogoWall />

      {/* Featured Projects */}
      <section className="px-6 md:px-12 lg:px-24 py-40">
        <div className="flex justify-between items-end mb-20">
          <h2 className="text-4xl font-bold tracking-tighter uppercase">Featured Projects</h2>
          <Link to="/projects" className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest hover:opacity-60 transition-opacity">
            View All <ArrowDownRight size={16} />
          </Link>
        </div>
        <div className="flex flex-col">
          {projects.map((project, i) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <ProjectCard
                index={i}
                title={project.title}
                category={project.category}
                image={project.image}
                isLocked={!!project.password}
              />
            </Link>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="px-6 md:px-12 lg:px-24 py-40 bg-neutral-50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <motion.p
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-medium tracking-tight leading-tight mb-12"
            >
              I excel at investigating problems and designing solutions that go beyond just the user interface. My approach involves suggesting innovative solutions through various channel, bridging the gap between human to human, and or human to objects.
            </motion.p>
            <Link
              to="/about"
              className="inline-block px-8 py-4 bg-black text-white rounded-full text-sm font-medium uppercase tracking-widest hover:scale-105 transition-transform"
            >
              About Me
            </Link>
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="aspect-square rounded-3xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700"
          >
            <img
              src="https://picsum.photos/seed/dicky/1000/1000"
              alt="Dicky"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 lg:px-24 py-20 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="text-sm opacity-40">© 2026 Dicky Portfolio. All rights reserved.</p>
        <div className="flex gap-8">
          <a 
            href="https://www.linkedin.com/in/dicky-chu/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm font-medium uppercase tracking-widest hover:opacity-60"
          >
            LinkedIn
          </a>
        </div>
      </footer>
    </div>
  );
}
