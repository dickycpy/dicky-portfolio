import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { ArrowUpRight, Lock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Project {
  id: string;
  title: string;
  category: string;
  image: string;
  password?: string;
}

interface StackedProjectShowcaseProps {
  projects: Project[];
}

export default function StackedProjectShowcase({ projects }: StackedProjectShowcaseProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure the first project is expanded by default when projects are loaded
  useEffect(() => {
    if (projects.length > 0 && !expandedId) {
      setExpandedId(projects[0].id);
    }
  }, [projects, expandedId]);

  return (
    <section ref={containerRef} className="px-6 md:px-12 lg:px-24 py-40 relative">
      <div className="flex justify-between items-end mb-32">
        <div className="space-y-4">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-none">
            Selected <br /> <span className="text-neutral-400 italic">Works</span>
          </h2>
        </div>
        <Link 
          to="/projects" 
          className="group flex items-center gap-3 text-sm font-medium uppercase tracking-widest hover:text-teal-600 transition-colors"
        >
          View Archive 
          <div className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
            <ArrowUpRight size={18} />
          </div>
        </Link>
      </div>

      <div className="relative space-y-0">
        {projects.map((project, index) => (
          <ProjectCard 
            key={project.id}
            project={project}
            index={index}
            total={projects.length}
            isExpanded={expandedId === project.id}
            onToggle={() => setExpandedId(expandedId === project.id ? null : project.id)}
          />
        ))}
      </div>
    </section>
  );
}

interface ProjectCardProps {
  key?: string | number;
  project: Project;
  index: number;
  total: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function ProjectCard({ 
  project, 
  index, 
  total,
  isExpanded,
  onToggle 
}: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "start start"]
  });

  // Subtle scale and opacity based on scroll
  const scale = useTransform(scrollYProgress, [0, 1], [0.95, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  
  // Apple Wallet style: cards stick with an offset to show the top area
  const topOffset = 100 + (index * 64);

  return (
    <motion.div
      ref={cardRef}
      style={{ 
        top: `${topOffset}px`,
        scale,
        opacity,
        marginBottom: index === total - 1 ? "0" : "15vh"
      }}
      className={cn(
        "sticky w-full rounded-[2.5rem] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "bg-neutral-900 shadow-[0_-20px_80px_-20px_rgba(0,0,0,0.15)]",
        "hover:shadow-[0_-20px_80px_-10px_rgba(0,0,0,0.2)]",
        isExpanded ? "z-40 ring-1 ring-white/10" : "z-10",
        "group/card"
      )}
    >
      {/* Background Image (The "under" part) */}
      <div className="absolute inset-0 z-0">
        <img 
          src={project.image} 
          alt="" 
          className={cn(
            "w-full h-full object-cover transition-all duration-1000",
            isExpanded ? "opacity-100 scale-105" : "opacity-40 grayscale group-hover/card:opacity-60 group-hover/card:grayscale-0"
          )}
          referrerPolicy="no-referrer"
        />
        <div className={cn(
          "absolute inset-0 transition-opacity duration-700",
          isExpanded ? "bg-black/20" : "bg-black/40"
        )} />
      </div>

      {/* Card Header (Glassmorphic) */}
      <div 
        onClick={onToggle}
        className="h-20 md:h-24 px-8 md:px-12 flex items-center justify-between cursor-pointer group relative overflow-hidden z-10 backdrop-blur-md border-b border-white/10"
      >
        {/* Subtle hover background */}
        <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        
        <div className="flex items-center gap-6 relative z-10">
          <span className="text-[10px] font-mono text-white/40 font-bold">0{index + 1}</span>
          <div className="space-y-0.5">
            <h3 className="text-lg md:text-xl font-bold tracking-tight text-white group-hover:translate-x-1 transition-transform duration-500">
              {project.title}
            </h3>
            <p className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-bold">
              {project.category}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          {project.password && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full">
              <Lock size={10} className="text-white/40" />
              <span className="text-[8px] font-bold uppercase tracking-wider text-white/40">Private Access</span>
            </div>
          )}
          <motion.div 
            animate={{ rotate: isExpanded ? 90 : 0 }}
            className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500"
          >
            <ChevronRight size={20} />
          </motion.div>
        </div>
      </div>

      {/* Card Content (Details) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden relative z-10"
          >
            <div className="px-8 md:px-12 pb-12 pt-8 flex flex-col items-start gap-8">
              <div className="max-w-2xl">
                <p className="text-white/80 text-lg md:text-xl leading-relaxed mb-8">
                  {/* We could add a description here if available in the data */}
                  Explore the intersection of design and technology through this comprehensive case study.
                </p>
                <Link 
                  to={`/projects/${project.id}`}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl"
                >
                  Explore Case Study
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
