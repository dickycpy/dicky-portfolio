import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import ProjectCard from "@/components/ProjectCard";
import { projects as mockProjects } from "@/lib/data";
import { Link } from "react-router-dom";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { cn } from "@/lib/utils";

export default function Projects() {
  const [projects, setProjects] = useState(mockProjects);
  const [activeTab, setActiveTab] = useState<"main" | "lab">("main");

  useEffect(() => {
    const q = query(collection(db, "projects"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Client-side sorting: 
      // 1. Projects with sortOrder come first (sorted by sortOrder)
      // 2. Projects without sortOrder come next (sorted by createdAt desc)
      fetchedProjects.sort((a, b) => {
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        if (a.sortOrder !== undefined) return -1;
        if (b.sortOrder !== undefined) return 1;
        
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      
      if (fetchedProjects.length > 0) {
        setProjects(fetchedProjects);
      }
    }, (error) => {
      console.error("Error fetching projects:", error);
    });

    return () => unsubscribe();
  }, []);

  const tabs = [
    { id: "main", label: "Main Project" },
    { id: "lab", label: "My Lab" }
  ];

  const filteredProjects = projects.filter(p => {
    if (activeTab === "main") return p.type === "main" || !p.type;
    return p.type === "lab";
  });

  return (
    <div className="pt-24 md:pt-32 px-6 md:px-12 lg:px-24 pb-40">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter">Projects</h1>
        
        <div className="flex gap-4 p-1 bg-black/5 rounded-2xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "relative px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                activeTab === tab.id ? "text-white" : "text-black/40 hover:text-black"
              )}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-brand-teal rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 block">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredProjects.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  index={i}
                  title={project.title}
                  category={project.category}
                  image={project.image}
                  description={project.description}
                  isLocked={!!project.password}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-black/5 rounded-[3rem]">
              <div className="w-20 h-20 rounded-full bg-brand-pink/10 flex items-center justify-center mb-6">
                <div className="w-10 h-10 rounded-full bg-brand-pink animate-pulse" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">No Projects Found</h2>
              <p className="text-black/40 font-medium">There are no projects in this category yet.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
