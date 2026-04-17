import React, { useState, useRef, useEffect } from "react";
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
  status?: "published" | "coming soon";
}

interface StackedProjectShowcaseProps {
  projects: Project[];
}

export default function StackedProjectShowcase({ projects }: StackedProjectShowcaseProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // The total height of the scrollable area for the stacking effect
  // We use a factor of 50vh per project to give enough scroll room
  const scrollHeight = `${100 + (projects.length * 50)}vh`;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <section 
      ref={containerRef} 
      className="relative" 
      style={{ height: scrollHeight }}
    >
      {/* Sticky Wrapper: This stays fixed while the cards animate inside */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col pt-20 md:pt-24 px-6 md:px-12 lg:px-24 z-10">
        <div className="flex justify-between items-end mb-6 md:mb-8">
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400">
              Selected Works
            </h2>
          </div>
          <Link 
            to="/projects" 
            className="group flex items-center gap-3 text-sm font-medium uppercase tracking-widest hover:text-brand-teal transition-colors"
          >
            <span className="hidden md:inline">Browse all projects</span>
            <div className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
              <ArrowUpRight size={18} />
            </div>
          </Link>
        </div>

        {/* Cards Container */}
        <div className="relative flex-grow">
          {projects.map((project, index) => (
            <ProjectCard 
              key={project.id}
              project={project}
              index={index}
              total={projects.length}
              scrollYProgress={scrollYProgress}
              onExpand={() => setSelectedProject(project)}
            />
          ))}
        </div>
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

const ProjectCard: React.FC<{ 
  project: Project; 
  index: number; 
  total: number;
  scrollYProgress: any;
  onExpand: () => void;
}> = ({ 
  project, 
  index, 
  total,
  scrollYProgress,
  onExpand 
}) => {
  // Animation logic:
  // Each card starts below the viewport and slides up to its stacked position.
  // The stacking position is 160px + (index * 40px) from the top of the viewport.
  // However, since we are inside a container that is already padded (pt-32), 
  // we calculate the Y relative to that.
  
  const startScroll = (index * 0.5) / total;
  const endScroll = ((index + 1) * 0.5) / total;
  
  // The final stacked Y position relative to the container
  const targetY = index * 40;
  
  // Each card slides from 100vh down to its targetY
  // We use a spring for smoother motion
  const yRaw = useTransform(
    scrollYProgress, 
    [0, startScroll, Math.min(endScroll, 1)], 
    [index === 0 ? 0 : 1000, index === 0 ? 0 : 1000, targetY]
  );
  
  const y = useSpring(yRaw, { stiffness: 100, damping: 20, restDelta: 0.001 });

  // Scale down cards that are "behind"
  const scale = useTransform(
    scrollYProgress,
    [endScroll, endScroll + 0.2],
    [1, 0.95]
  );

  return (
    <motion.div
      style={{ 
        y,
        scale,
        zIndex: index,
      }}
      className={cn(
        "absolute left-0 right-0 h-[50vh] md:h-[55vh] rounded-[2.5rem] overflow-hidden",
        "bg-neutral-900",
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
          className={cn(
            "w-full h-full object-cover transition-all duration-700",
            project.status === "coming soon" ? "opacity-30 blur-[2px] grayscale" : "opacity-60 group-hover:opacity-80 group-hover:scale-105"
          )}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </motion.div>

      {/* Card Content (Collapsed) */}
      <div className="absolute inset-0 z-10 p-8 md:p-12 md:pb-16 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <motion.div layoutId={`category-${project.id}`} className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
              {project.category}
            </motion.div>
            {project.status === "coming soon" && (
              <div className="px-4 py-2 bg-brand-teal/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-teal border border-brand-teal/30">
                Coming Soon
              </div>
            )}
          </div>
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
};

function ExpandedCard({ project, onClose }: { project: Project; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-6 lg:p-12">
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
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 z-50 p-4 bg-black text-white rounded-full hover:scale-110 transition-transform shadow-xl"
        >
          <X size={24} />
        </button>

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
            {project.status === "coming soon" && (
              <div className="px-4 py-2 bg-brand-teal/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-teal border border-brand-teal/30 mb-4 ml-3 inline-block">
                Coming Soon
              </div>
            )}
            <motion.h3 layoutId={`title-${project.id}`} className="text-3xl font-bold tracking-tighter text-white">
              {project.title}
            </motion.h3>
          </div>
        </div>

        <div className="w-full md:w-1/2 h-full overflow-y-auto p-8 md:p-16 lg:p-20 bg-white custom-scrollbar">
          <div className="hidden md:block mb-12">
            <div className="flex items-center gap-4 mb-6">
              <motion.div layoutId={`category-${project.id}`} className="px-4 py-2 bg-neutral-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-neutral-500 border border-neutral-200 inline-block">
                {project.category}
              </motion.div>
              {project.status === "coming soon" && (
                <div className="px-4 py-2 bg-brand-teal/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-teal border border-brand-teal/20 inline-block">
                  Coming Soon
                </div>
              )}
            </div>
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
              {project.status === "coming soon" ? (
                <div className="p-8 bg-neutral-50 rounded-2xl border border-neutral-100 border-dashed text-center">
                  <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">Full case study coming soon</p>
                </div>
              ) : (
                <Link 
                  to={`/projects/${project.id}`}
                  className="group w-full py-6 bg-black text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-neutral-800 transition-all shadow-xl"
                >
                  View Full Case Study <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
