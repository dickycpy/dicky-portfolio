import { useParams, Link } from "react-router-dom";
import { motion, useScroll, useSpring } from "motion/react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { projects as mockProjects } from "@/lib/data";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(mockProjects.find((p) => p.id === id));
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    if (!id) return;
    
    // If not in mock data, try fetching from Firestore
    const unsubscribe = onSnapshot(doc(db, "projects", id), (snapshot) => {
      if (snapshot.exists()) {
        setProject({ id: snapshot.id, ...snapshot.data() });
      }
    }, (error) => {
      console.error("Error fetching project detail:", error);
    });

    return () => unsubscribe();
  }, [id]);
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["overview", "discover", "define", "develop", "deliver", "outcome", "learning"];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= 300) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!project) return <div>Project not found</div>;

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "discover", label: "Discover" },
    { id: "define", label: "Define" },
    { id: "develop", label: "Develop" },
    { id: "deliver", label: "Deliver" },
    { id: "outcome", label: "Outcome" },
    { id: "learning", label: "Learning" },
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
        <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
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
          <section id="overview" className="scroll-mt-40">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
              01 <ChevronRight size={14} /> Overview
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
                <p className="text-lg">{project.tools.join(", ")}</p>
              </div>
            </div>
            <p className="text-2xl leading-relaxed">{project.overview}</p>
          </section>

          <section id="discover" className="scroll-mt-40">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
              02 <ChevronRight size={14} /> Discover
            </h2>
            <h3 className="text-4xl font-bold tracking-tighter mb-8">Problem Statement</h3>
            <p className="text-xl text-neutral-600 leading-relaxed">{project.problem}</p>
          </section>

          <section id="define" className="scroll-mt-40">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
              03 <ChevronRight size={14} /> Define
            </h2>
            <h3 className="text-4xl font-bold tracking-tighter mb-8">Key Insights</h3>
            <div className="aspect-[16/10] bg-neutral-100 rounded-2xl overflow-hidden mb-8">
              <img src="https://picsum.photos/seed/define/1200/800" alt="Define" className="w-full h-full object-cover" />
            </div>
          </section>

          <section id="develop" className="scroll-mt-40">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
              04 <ChevronRight size={14} /> Develop
            </h2>
            <h3 className="text-4xl font-bold tracking-tighter mb-8">Ideation & Wireframes</h3>
            <p className="text-xl text-neutral-600 leading-relaxed mb-12">
              Exploring multiple directions to find the most intuitive path for the user.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div className="aspect-square bg-neutral-100 rounded-2xl"></div>
              <div className="aspect-square bg-neutral-100 rounded-2xl"></div>
            </div>
          </section>

          <section id="deliver" className="scroll-mt-40">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
              05 <ChevronRight size={14} /> Deliver
            </h2>
            <h3 className="text-4xl font-bold tracking-tighter mb-8">Final Solution</h3>
            <p className="text-xl text-neutral-600 leading-relaxed mb-12">{project.solution}</p>
            <div className="space-y-8">
              <img src="https://picsum.photos/seed/deliver1/1200/800" alt="Deliver 1" className="w-full rounded-2xl" />
              <img src="https://picsum.photos/seed/deliver2/1200/800" alt="Deliver 2" className="w-full rounded-2xl" />
            </div>
          </section>

          <section id="outcome" className="scroll-mt-40">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
              06 <ChevronRight size={14} /> Outcome
            </h2>
            <h3 className="text-4xl font-bold tracking-tighter mb-8">Impact & Metrics</h3>
            <p className="text-3xl font-medium text-black">{project.impact}</p>
          </section>

          <section id="learning" className="scroll-mt-40">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
              07 <ChevronRight size={14} /> Learning
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h4 className="text-lg font-bold mb-4">What worked</h4>
                <p className="text-neutral-600">The iterative testing approach allowed us to catch usability issues early.</p>
              </div>
              <div>
                <h4 className="text-lg font-bold mb-4">What didn't</h4>
                <p className="text-neutral-600">Initial assumptions about user tech-savviness were slightly off.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
