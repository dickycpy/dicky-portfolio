import { motion } from "motion/react";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const timeline = [
  {
    year: "2024 - Present",
    title: "Senior UX Designer",
    company: "Tech Innovators",
    description: "Leading design for AI-driven products and cross-platform experiences."
  },
  {
    year: "2022 - 2024",
    title: "Product Designer",
    company: "Creative Studio",
    description: "Focused on digital marketing tools and interactive web experiences."
  },
  {
    year: "2020 - 2022",
    title: "UX/UI Designer",
    company: "StartUp Inc",
    description: "Designed end-to-end mobile applications and design systems."
  }
];

export default function About() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div className="pt-32 px-6 md:px-12 lg:px-24 pb-40">
      <section className="mb-40">
        <motion.h1
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-tight mb-12"
        >
          Adaptable designer turning challenges into creative, user-centered solutions with clarity, teamwork, and impact.
        </motion.h1>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-20">
        <div className="lg:col-span-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8">Career Path</h2>
        </div>
        <div className="lg:col-span-8 space-y-4">
          {timeline.map((item, i) => (
            <div
              key={i}
              className="border-b border-black/5 pb-4"
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                className="w-full flex justify-between items-center py-6 text-left group"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-12">
                  <span className="text-sm font-medium text-neutral-400 w-32">{item.year}</span>
                  <span className="text-2xl font-bold tracking-tight group-hover:translate-x-2 transition-transform">{item.title}</span>
                  <span className="text-sm font-medium uppercase tracking-widest opacity-40">{item.company}</span>
                </div>
                {expandedIndex === i ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              <motion.div
                initial={false}
                animate={{ height: expandedIndex === i ? "auto" : 0, opacity: expandedIndex === i ? 1 : 0 }}
                className="overflow-hidden"
              >
                <p className="text-xl text-neutral-600 pb-8 max-w-2xl">
                  {item.description}
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
