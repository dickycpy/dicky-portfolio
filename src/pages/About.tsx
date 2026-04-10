import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, ArrowRight } from "lucide-react";

const timeline = [
  {
    year: "2024 - Present",
    title: "Digital Operation Analyst",
    company: "IBM Consulting",
    handle: "ibm.com",
    location: "Hong Kong",
    industry: "Consulting / Technology",
    logo: "https://cdn.worldvectorlogo.com/logos/ibm.svg",
    description: "Leading design for AI-driven products and cross-platform experiences.",
    bullets: [
      "Leading design for AI-driven products and cross-platform experiences.",
      "Collaborating with cross-functional teams to deliver high-impact solutions.",
      "Optimizing digital operations through automation and data-driven insights.",
      "Driving full automation transformation across service operations.",
      "Philosophy: if it repeats, automate it — for the customer and for the team."
    ],
    clients: [
      { name: "Marriott", logo: "https://cdn.worldvectorlogo.com/logos/marriott-international.svg" },
      { name: "Huawei", logo: "https://cdn.worldvectorlogo.com/logos/huawei-logo.svg" },
      { name: "Heineken", logo: "https://cdn.worldvectorlogo.com/logos/heineken-2.svg" },
      { name: "Microsoft", logo: "https://cdn.worldvectorlogo.com/logos/microsoft-5.svg" }
    ],
    caseStudy: { title: "AI Operations Framework", link: "/projects/ai-ops" }
  },
  {
    year: "2022 - 2024",
    title: "Product Designer",
    company: "ESSAA Limited",
    handle: "creatogether.app",
    location: "Hong Kong",
    industry: "SASS Digital Marketing / STEM Education",
    logo: "hhttps://static.wixstatic.com/media/526703_ce072d7e5dd141b98b8327ea1ebbfa27~mv2.png/v1/fill/w_33,h_30,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/creato%20logo_orange.png",
    description: "Focused on digital marketing tools and interactive web experiences.",
    bullets: [
      "Designed end-to-end mobile applications and design systems.",
      "Increased user engagement by 40% through intuitive UI patterns.",
      "Managed multiple client projects from discovery to delivery."
    ],
    clients: [
      { name: "Adobe", logo: "https://cdn.worldvectorlogo.com/logos/adobe-2.svg" },
      { name: "Spotify", logo: "https://cdn.worldvectorlogo.com/logos/spotify-1.svg" }
    ]
  },
  {
    year: "2020 - 2022",
    title: "UX/UI Designer",
    company: "StartUp Inc",
    handle: "startup.inc",
    location: "San Francisco, CA",
    industry: "SaaS / Fintech",
    logo: "https://picsum.photos/seed/startup/100/100",
    description: "Designed end-to-end mobile applications and design systems.",
    bullets: [
      "Built the initial design system from scratch.",
      "Collaborated with engineers to ensure high-fidelity implementation.",
      "Conducted user research and usability testing sessions."
    ]
  }
];

export default function About() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div className="pt-24 md:pt-32 px-6 md:px-12 lg:px-24 pb-40">
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
        <div className="lg:col-span-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8">Career Path</h2>
        </div>
        <div className="lg:col-span-9 space-y-6">
          {timeline.map((item, i) => (
            <motion.div
              key={i}
              layout
              initial={false}
              className={`relative rounded-3xl overflow-hidden border transition-all duration-500 ${
                expandedIndex === i 
                  ? "border-black/10 bg-white shadow-xl shadow-black/5" 
                  : "border-black/5 bg-neutral-50/50 hover:bg-neutral-50"
              }`}
            >
              {/* Dotted Background Pattern (Only visible when expanded) */}
              <AnimatePresence>
                {expandedIndex === i && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.03 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none"
                    style={{ 
                      backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                      backgroundSize: '24px 24px'
                    }}
                  />
                )}
              </AnimatePresence>

              <button
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                className="w-full text-left relative z-10"
              >
                <div className="p-8 md:p-10 flex justify-between items-center">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-16">
                    <span className="text-sm font-medium text-neutral-400 w-32 shrink-0">{item.year}</span>
                    <div className="flex flex-col">
                      <span className={`text-2xl md:text-3xl font-bold tracking-tight transition-colors ${expandedIndex === i ? "text-teal-600" : "text-black"}`}>
                        {item.title}
                      </span>
                      <span className="text-sm font-medium uppercase tracking-widest opacity-40 mt-1">{item.company}</span>
                    </div>
                  </div>
                  <div className={`transition-transform duration-500 ${expandedIndex === i ? "rotate-180" : ""}`}>
                    <ChevronDown size={24} className={expandedIndex === i ? "text-teal-600" : "opacity-20"} />
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {expandedIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10"
                  >
                    <div className="px-8 md:px-10 pb-10">
                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-10 pt-8 border-t border-black/5">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 border border-black/5 shrink-0">
                          <img src={item.logo} alt={item.company} className="w-full h-full object-contain p-1.5" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                          <span className="text-teal-600 font-bold flex items-center gap-1.5">
                            {item.handle} <ExternalLink size={14} />
                          </span>
                          <span className="text-neutral-400 font-medium">{item.location}</span>
                          <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded text-[10px] font-bold uppercase tracking-wider">
                            {item.industry}
                          </span>
                        </div>
                      </div>

                      {/* Bullet Points */}
                      <ul className="space-y-4 mb-12">
                        {item.bullets.map((bullet, idx) => (
                          <li key={idx} className="flex gap-4 text-neutral-600 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-sm bg-teal-600 mt-2.5 shrink-0" />
                            {bullet}
                          </li>
                        ))}
                      </ul>

                      {/* Corporate Clients */}
                      {item.clients && (
                        <div className="pt-8 border-t border-black/5">
                          <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-6">Corporate Clients</h5>
                          <div className="flex flex-wrap gap-x-12 gap-y-6 items-center opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                            {item.clients.map((client, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <img src={client.logo} alt={client.name} className="h-4 w-auto object-contain" referrerPolicy="no-referrer" />
                                <span className="text-xs font-medium">{client.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Case Study Button */}
                      {item.caseStudy && (
                        <div className="mt-12">
                          <a 
                            href={item.caseStudy.link}
                            className="inline-flex items-center gap-3 px-6 py-3 bg-teal-50 text-teal-700 rounded-xl text-sm font-bold hover:bg-teal-100 transition-colors group/btn"
                          >
                            Case Study: {item.caseStudy.title}
                            <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                          </a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
