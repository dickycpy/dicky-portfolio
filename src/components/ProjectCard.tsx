import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  title: string;
  category: string;
  image: string;
  index: number;
}

export default function ProjectCard({ title, category, image, index }: ProjectCardProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "sticky top-32 w-full aspect-[16/9] bg-neutral-100 rounded-3xl overflow-hidden group mb-20 shadow-2xl",
        "border border-black/5"
      )}
    >
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-12 text-white">
        <p className="text-sm font-medium uppercase tracking-widest mb-2 opacity-80">
          {category}
        </p>
        <div className="flex justify-between items-end">
          <h3 className="text-4xl font-bold tracking-tighter">{title}</h3>
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black">
            <ArrowRight size={24} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
