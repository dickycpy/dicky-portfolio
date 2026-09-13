import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ChevronDown, ExternalLink } from "lucide-react";

// ---------------------------------------------------------------------------
// Career path — an expandable list carrying the full BA detail for each role.
// Readable, scannable, mobile-friendly: the substance a recruiter reads.
// ---------------------------------------------------------------------------

interface Client {
  name: string;
  logo: string;
}
interface Checkpoint {
  periodSub: string;
  title: string;
  company: string;
  location: string;
  industry: string;
  handle?: string;
  logo: string;
  bullets: string[];
  clients: Client[];
  caseStudy?: { title: string; link: string };
}

const journey: Checkpoint[] = [
  {
    periodSub: "Dec 2025 – Present",
    title: "Business Analyst",
    company: "IBM Consulting · IBM iX",
    location: "Hong Kong",
    industry: "Consulting / AI Products",
    logo: "https://cdn.worldvectorlogo.com/logos/ibm.svg",
    bullets: [
      "Primary client-facing BA on AI-powered, phygital customer experiences — including an AI horse-selection station and a live race broadcast blending real-time odds with Generative AI content.",
      "Translated business needs into actionable requirements and System Requirement Specifications, then led offshore development teams through implementation and delivery.",
      "Ran SA briefings and drove SAT/UAT coordination and defect triage — analysing reproduction conditions across app logic, real-time (MQTT) events, data and environment config.",
      "Investigated complex production issues, owned root-cause analysis and RCA reports, and coordinated releases across SAT/PROD with client IT.",
      "Prepared PDLC documentation and ran client knowledge-transfer sessions and walkthroughs to drive user adoption.",
      "Philosophy: if it repeats, automate it — for the customer and for the team.",
    ],
    clients: [
      {
        name: "Hong Kong Jockey Club",
        logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Hong_Kong_Jockey_Club_logo.svg/1280px-Hong_Kong_Jockey_Club_logo.svg.png",
      },
    ],
    caseStudy: { title: "Gen-AI digital racing", link: "/projects/ai-ops" },
  },
  {
    periodSub: "2022 – 2025",
    title: "Product Designer / BA",
    company: "ESSAA Limited",
    location: "Hong Kong",
    industry: "AI Marketing SaaS / STEM Education",
    handle: "creatogether.app",
    logo: "https://static.wixstatic.com/media/6e47aa_bd763a11882242e0b0c85f29a32be46c~mv2.png",
    bullets: [
      "Led end-to-end delivery of an AI-powered Marketing SaaS platform — from product discovery and technical scoping to sprint management, UAT and regression testing.",
      "Owned the product experience end to end: turned user and stakeholder needs into requirements and user flows, then worked closely with dev to ship them.",
      "Planned and ran a pilot onboarding workshop for 50+ external stakeholders across South America.",
      "Represented the product at international summits (Hong Kong, Taiwan, Vancouver), translating technical value into clear business impact for clients.",
    ],
    clients: [
      {
        name: "STARLUX",
        logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAJ1BMVEVHcEyXak2Ob02Ic02Xak2Xak2EdU2TbE2EdU2Xak2Ob02Xak2EdU2Z9D7zAAAADHRSTlMA/x0TsDTcdvRQj8fnoB3qAAAAbUlEQVQokdXS0Q6AIAgFUARKRf//e8vCtgb0Ui/dN3d2FZ0AHwXPLGSFk6YaWybxWDwY5NgIGDDqgaQW9eqYjDO6vf3IJMGeIwwU2jWtZ/OeVanZZ7lFSj9SLJFSXx3r/zeMjUSpZKensZ/xTTZjvwXsKgulDgAAAABJRU5ErkJggg==",
      },
      {
        name: "HKU iDendron",
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvKwjcCnJapeWjOqfAZZc6Z84hOEX2D6ZA2w&s",
      },
    ],
  },
];

export default function CareerJourney() {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-3xl px-2">
      <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-8">
        Career path
      </p>
      <div className="space-y-4">
        {journey.map((item, i) => {
          const open = expanded === i;
          return (
            <motion.div
              key={i}
              layout
              className={`rounded-3xl border transition-colors duration-500 ${
                open
                  ? "border-black/10 bg-white shadow-xl shadow-black/5"
                  : "border-black/5 bg-neutral-50/60 hover:bg-neutral-50"
              }`}
            >
              <button
                onClick={() => setExpanded(open ? null : i)}
                aria-expanded={open}
                className="w-full text-left"
              >
                <div className="p-6 md:p-8 flex items-center justify-between gap-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-10">
                    <span className="text-sm font-medium text-neutral-400 md:w-36 shrink-0">
                      {item.periodSub}
                    </span>
                    <div className="flex flex-col">
                      <span
                        className={`text-xl md:text-2xl font-bold tracking-tight transition-colors ${
                          open ? "text-brand-teal" : "text-black"
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-widest opacity-40 mt-1">
                        {item.company}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    size={22}
                    className={`shrink-0 transition-transform duration-500 ${
                      open ? "rotate-180 text-brand-teal" : "opacity-20"
                    }`}
                  />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 md:px-8 pb-8">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 pt-6 border-t border-black/5 text-sm">
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-neutral-100 border border-black/5 shrink-0">
                          <img
                            src={item.logo}
                            alt={item.company}
                            className="w-full h-full object-contain p-1.5"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        {item.handle && (
                          <span className="text-brand-teal font-bold flex items-center gap-1.5">
                            {item.handle} <ExternalLink size={13} />
                          </span>
                        )}
                        <span className="text-neutral-400 font-medium">{item.location}</span>
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded text-[10px] font-bold uppercase tracking-wider">
                          {item.industry}
                        </span>
                      </div>

                      <ul className="space-y-3 mb-8">
                        {item.bullets.map((b, j) => (
                          <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-neutral-700">
                            <span className="w-1.5 h-1.5 rounded-sm bg-brand-teal mt-2.5 shrink-0" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>

                      {item.clients.length > 0 && (
                        <div className="pt-6 border-t border-black/5">
                          <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4">
                            Clients
                          </h5>
                          <div className="flex flex-wrap gap-x-8 gap-y-4 items-center opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                            {item.clients.map((c, k) => (
                              <div key={k} className="flex items-center gap-2">
                                <img
                                  src={c.logo}
                                  alt={c.name}
                                  className="h-4 w-auto object-contain"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="text-xs font-medium">{c.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.caseStudy && (
                        <a
                          href={item.caseStudy.link}
                          className="mt-8 inline-flex items-center gap-3 px-5 py-2.5 bg-brand-teal/5 text-brand-teal rounded-xl text-sm font-bold hover:bg-brand-teal/10 transition-colors group"
                        >
                          Case study: {item.caseStudy.title}
                          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
