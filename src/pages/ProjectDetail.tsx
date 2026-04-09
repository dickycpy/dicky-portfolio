import { useParams, Link } from "react-router-dom";
import { motion, useScroll, useSpring, AnimatePresence } from "motion/react";
import { ArrowLeft, ChevronRight, Lock, ArrowRight } from "lucide-react";
import { projects as mockProjects } from "@/lib/data";
import React, { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(mockProjects.find((p) => p.id === id));
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState("");
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    if (!id) return;
    
    const unsubscribe = onSnapshot(doc(db, "projects", id), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProject({ id: snapshot.id, ...data });
        // If no password, authorize immediately
        if (!data.password) {
          setIsAuthorized(true);
        }
      }
    }, (error) => {
      console.error("Error fetching project detail:", error);
    });

    return () => unsubscribe();
  }, [id]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === project.password) {
      setIsAuthorized(true);
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
      setPasswordInput("");
    }
  };

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    if (!isAuthorized) return;

    const handleScroll = () => {
      const sectionIds = sections.map(s => s.id);
      for (const sectionId of sectionIds) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= 300) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isAuthorized]);

  if (!project) return <div className="pt-40 px-6 text-center">Project not found</div>;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <Lock size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter mb-4">Protected Project</h1>
          <p className="text-neutral-500 mb-12">This project is confidential. Please enter the password provided to you to view the case study.</p>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter Password"
                className="w-full border-b-2 border-black/10 py-4 focus:border-black outline-none transition-colors text-center text-xl tracking-widest"
                autoFocus
              />
              <AnimatePresence>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-500 text-sm mt-4 font-medium"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-black text-white rounded-full font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
            >
              Unlock Case Study <ArrowRight size={18} />
            </button>
          </form>
          
          <Link to="/projects" className="inline-block mt-12 text-sm font-medium uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
            Back to Projects
          </Link>
        </motion.div>
      </div>
    );
  }

  const sections = [
    { id: "introduction", label: "Introduction" },
    { id: "challenge", label: "Challenge" },
    { id: "approach", label: "Approach" },
    { id: "understanding", label: "Understanding" },
    { id: "define", label: "Define" },
    { id: "developDeliver", label: "Develop & Deliver" },
    { id: "reflection", label: "Reflection" },
  ];

  return (
    <div className="pt-32">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-black z-[60] origin-left"
        style={{ scaleX }}
      />

      <div className="px-6 md:px-12 lg:px-24 mb-20">
        <Link to="/projects" className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest hover:opacity-60 transition-opacity mb-12">
          <ArrowLeft size={16} /> Back to Projects
        </Link>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8">{project.title}</h1>
        <p className="text-xl text-neutral-500 max-w-2xl">{project.description}</p>
      </div>

      <div className="w-full aspect-video bg-neutral-100 mb-20">
        <img src={project.image} alt={project.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>

      <div className="px-6 md:px-12 lg:px-24 grid grid-cols-1 lg:grid-cols-12 gap-20">
        {/* Sticky Nav */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-40 space-y-4">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`block text-sm font-medium uppercase tracking-widest transition-all ${
                  activeSection === section.id ? "text-black translate-x-2" : "text-neutral-300"
                }`}
              >
                {section.label}
              </a>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="lg:col-span-9 space-y-40 pb-40">
          <section id="introduction" className="scroll-mt-40">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
              01 <ChevronRight size={14} /> Introduction
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-2">Role</h4>
                <p className="text-lg">{project.role}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-2">Timeline</h4>
                <p className="text-lg">{project.timeline}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-2">Tools</h4>
                <p className="text-lg">{project.tools?.join(", ")}</p>
              </div>
            </div>
            <div 
              className="rich-text-content rich-text-xl max-w-full"
              dangerouslySetInnerHTML={{ __html: project.introduction || project.overview || "<p class='opacity-40 italic'>No introduction provided.</p>" }}
            />
          </section>

          <section id="challenge" className="scroll-mt-40">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
              02 <ChevronRight size={14} /> The Challenge
            </h2>
            <div 
              className="rich-text-content rich-text-lg max-w-full"
              dangerouslySetInnerHTML={{ __html: project.challenge || project.problem || "<p class='opacity-40 italic'>No challenge description provided.</p>" }}
            />
          </section>

          <section id="approach" className="scroll-mt-40">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
              03 <ChevronRight size={14} /> The Approach
            </h2>
            <div 
              className="rich-text-content rich-text-lg max-w-full"
              dangerouslySetInnerHTML={{ __html: project.approach || "<p class='opacity-40 italic'>No approach description provided.</p>" }}
            />
          </section>

          <section id="understanding" className="scroll-mt-40">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
              04 <ChevronRight size={14} /> Understanding
            </h2>
            <div 
              className="rich-text-content rich-text-lg max-w-full"
              dangerouslySetInnerHTML={{ __html: project.understanding || "<p class='opacity-40 italic'>No understanding description provided.</p>" }}
            />
          </section>

          <section id="define" className="scroll-mt-40">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
              05 <ChevronRight size={14} /> Define
            </h2>
            <div 
              className="rich-text-content rich-text-lg max-w-full"
              dangerouslySetInnerHTML={{ __html: project.define || "<p class='opacity-40 italic'>No definition provided.</p>" }}
            />
          </section>

          <section id="developDeliver" className="scroll-mt-40">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
              06 <ChevronRight size={14} /> Develop & Deliver
            </h2>
            <div 
              className="rich-text-content rich-text-lg max-w-full"
              dangerouslySetInnerHTML={{ __html: project.developDeliver || project.solution || "<p class='opacity-40 italic'>No development or delivery details provided.</p>" }}
            />
          </section>

          <section id="reflection" className="scroll-mt-40">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
              07 <ChevronRight size={14} /> Reflection
            </h2>
            <div 
              className="rich-text-content rich-text-lg max-w-full"
              dangerouslySetInnerHTML={{ __html: project.reflection || project.impact || "<p class='opacity-40 italic'>No reflection provided.</p>" }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
