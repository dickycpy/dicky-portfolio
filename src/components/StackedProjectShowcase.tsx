import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "motion/react";
import { ArrowUpRight, Lock, X, ArrowRight, Tag, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Project {
  id: string;
  title: string;
  category: string;
  image: string;
  description?: string;
  role?: string;
  timeline?: string;
  tools?: string[];
  password?: string;
}

interface StackedProjectShowcaseProps {
  projects: Project[];
}

export default function StackedProjectShowcase({ projects }: StackedProjectShowcaseProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

      <div className="relative flex flex-col gap-0">
        {projects.map((project, index) => (
          <ProjectCard 
            key={project.id}
            project={project}
            index={index}
            total={projects.length}
            onExpand={() => setSelectedProject(project)}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedProject && (
          <ExpandedCard 
            project={selectedProject} 
            onClose={() => setSelectedProject(null)} 
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function ProjectCard({ 
  project, 
  index, 
  total,
  onExpand 
}: { 
  project: Project; 
  index: number; 
  total: number;
  onExpand: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Apple Wallet stacking logic:
  // Each card is sticky and has an offset from the top.
  // As you scroll, the next card slides over the previous one.
  const topOffset = 100 + (index * 60);

  return (
    <motion.div
      ref={cardRef}
      style={{ 
        top: `${topOffset}px`,
        // We add a bit of margin at the bottom of the last card to allow scrolling past the stack
        marginBottom: index === total - 1 ? "20vh" : "0"
      }}
      className={cn(
        "sticky w-full h-[60vh] md:h-[70vh] rounded-[2.5rem] overflow-hidden transition-shadow duration-500",
        "bg-neutral-900 shadow-[0_-20px_80px_-20px_rgba(0,0,0,0.3)]",
        "hover:shadow-[0_-20px_80px_-10px_rgba(0,0,0,0.4)]",
        "group cursor-pointer"
      )}
      onClick={onExpand}
      layoutId={`card-${project.id}`}
    >
      {/* Background Image */}
      <motion.div className="absolute inset-0 z-0" layoutId={`image-container-${project.id}`}>
        <img 
          src={project.image} 
          alt={project.title} 
          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </motion.div>

      {/* Card Content (Collapsed) */}
      <div className="absolute inset-0 z-10 p-8 md:p-12 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <motion.div layoutId={`category-${project.id}`} className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
            {project.category}
          </motion.div>
          {project.password && (
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/10">
              <Lock size={14} />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <motion.h3 layoutId={`title-${project.id}`} className="text-3xl md:text-5xl font-bold tracking-tighter text-white">
            {project.title}
          </motion.h3>
          <motion.p layoutId={`description-${project.id}`} className="text-white/60 text-sm md:text-lg max-w-xl line-clamp-2">
            {project.description || "Explore the intersection of design and technology through this comprehensive case study."}
          </motion.p>
        </div>
      </div>

      {/* Tap to Expand Indicator */}
      <div className="absolute bottom-8 right-8 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest">
          Tap to expand <ArrowRight size={14} />
        </div>
      </div>
    </motion.div>
  );
}

function ExpandedCard({ project, onClose }: { project: Project; onClose: () => void }) {
  // Prevent body scroll when expanded
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 lg:p-12">
      {/* Backdrop Blur */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xl"
      />

      <motion.div
        layoutId={`card-${project.id}`}
        className="relative w-full h-full max-w-6xl bg-white md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 z-50 p-4 bg-black text-white rounded-full hover:scale-110 transition-transform shadow-xl"
        >
          <X size={24} />
        </button>

        {/* Left Side: Visuals */}
        <div className="w-full md:w-1/2 h-[40vh] md:h-full relative overflow-hidden">
          <motion.div className="absolute inset-0" layoutId={`image-container-${project.id}`}>
            <img 
              src={project.image} 
              alt={project.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
          
          <div className="absolute bottom-8 left-8 md:hidden">
            <motion.div layoutId={`category-${project.id}`} className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-white border border-white/20 mb-4 inline-block">
              {project.category}
            </motion.div>
            <motion.h3 layoutId={`title-${project.id}`} className="text-3xl font-bold tracking-tighter text-white">
              {project.title}
            </motion.h3>
          </div>
        </div>

        {/* Right Side: Details */}
        <div className="w-full md:w-1/2 h-full overflow-y-auto p-8 md:p-16 lg:p-20 bg-white custom-scrollbar">
          <div className="hidden md:block mb-12">
            <motion.div layoutId={`category-${project.id}`} className="px-4 py-2 bg-neutral-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-neutral-500 border border-neutral-200 mb-6 inline-block">
              {project.category}
            </motion.div>
            <motion.h3 layoutId={`title-${project.id}`} className="text-5xl lg:text-6xl font-bold tracking-tighter text-black mb-8">
              {project.title}
            </motion.h3>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-12"
          >
            <div className="grid grid-cols-2 gap-8 py-8 border-y border-neutral-100">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Role</span>
                <span className="text-sm font-medium">{project.role || "Lead Designer"}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Timeline</span>
                <span className="text-sm font-medium">{project.timeline || "3 Months"}</span>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-black">Overview</h4>
              <motion.p layoutId={`description-${project.id}`} className="text-neutral-500 text-lg leading-relaxed">
                {project.description || "A comprehensive redesign focusing on making complex data more accessible through intuitive UX and modern visual language."}
              </motion.p>
            </div>

            <div className="pt-8">
              <Link 
                to={`/projects/${project.id}`}
                className="group w-full py-6 bg-black text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-neutral-800 transition-all shadow-xl"
              >
                View Full Case Study <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
