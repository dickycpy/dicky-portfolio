import React from "react";
import { motion } from "motion/react";
import { ArrowUpRight, Lock, Shield, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface ProjectCardProps {
  id: string;
  title: string;
  category: string;
  image: string;
  description?: string;
  index: number;
  isLocked?: boolean;
  status?: "published" | "coming soon";
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ id, title, category, image, description, index, isLocked, status }) => {
  const isComingSoon = status === "coming soon";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group bg-white rounded-[2.5rem] overflow-hidden border border-neutral-100 hover:border-neutral-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative"
    >
      <Link to={`/projects/${id}`}>
        <div className="aspect-[4/3] relative overflow-hidden bg-neutral-100">
          <img 
            src={image} 
            alt={title} 
            className={cn(
              "w-full h-full object-cover transition-all duration-700",
              isComingSoon ? "grayscale blur-[2px] opacity-60" : "grayscale group-hover:grayscale-0"
            )} 
            referrerPolicy="no-referrer" 
          />
          <div className="absolute bottom-6 left-6 px-4 py-2 bg-black/80 backdrop-blur-md text-white rounded-full text-[10px] font-bold uppercase tracking-widest z-20">
            {category}
          </div>
          {isComingSoon && (
            <div className="absolute inset-0 flex items-center justify-center z-30">
              <div className="px-6 py-3 bg-white/90 backdrop-blur-md text-black rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-xl border border-white">
                Coming Soon
              </div>
            </div>
          )}
        </div>
        <div className="p-10">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-2xl tracking-tight leading-tight">{title}</h3>
            <div className="p-2 text-neutral-300 group-hover:text-black transition-colors">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <p className="text-neutral-500 text-sm leading-relaxed line-clamp-2 mb-8">
            {description || "Explore the intersection of design and technology through this comprehensive case study."}
          </p>
          <div className="flex items-center gap-4">
            {isLocked && (
              <div className="flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-lg text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                <Shield size={12} /> Password Required
              </div>
            )}
            {isComingSoon && (
              <div className="flex items-center gap-2 px-3 py-1 bg-brand-teal/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-brand-teal">
                <Clock size={12} /> Coming Soon
              </div>
            )}
            <div className="flex-grow h-px bg-neutral-100" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProjectCard;
