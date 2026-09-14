import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ChevronDown, ExternalLink } from "lucide-react";
import { usePageContent, DEFAULT_CAREER } from "@/lib/content";

// ---------------------------------------------------------------------------
// Career path — an expandable list carrying the full BA detail for each role.
// Readable, scannable, mobile-friendly: the substance a recruiter reads.
// Content is admin-editable (settings/career); falls back to DEFAULT_CAREER.
// ---------------------------------------------------------------------------

export default function CareerJourney() {
  const { content } = usePageContent("career", DEFAULT_CAREER);
  const journey = content.journey;
  const [expanded, setExpanded] = useState<number | null>(0);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Opening a card collapses the one above it, so the layout shifts up and the
  // card you just clicked can slide out of view. Once it expands, pull it back
  // to the top of the viewport. Delay lets the collapse/expand settle first.
  const toggle = (i: number) => {
    const willOpen = expanded !== i;
    setExpanded(willOpen ? i : null);
    if (willOpen) {
      setTimeout(() => {
        itemRefs.current[i]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 350);
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-2">
      <p className="pl-11 md:pl-12 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-8">
        Career path
      </p>
      <div className="relative">
        {/* Timeline spine */}
        <div
          aria-hidden
          className="absolute left-[7px] md:left-2 top-4 bottom-4 w-px bg-gradient-to-b from-brand-teal/40 via-black/10 to-transparent"
        />
        <div className="space-y-4">
        {journey.map((item, i) => {
          const open = expanded === i;
          return (
            <div
              key={i}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="relative pl-11 md:pl-12 scroll-mt-28"
            >
              {/* Timeline node */}
              <span
                aria-hidden
                className={`absolute left-[7px] md:left-2 top-8 -translate-x-1/2 w-3 h-3 rounded-full ring-4 ring-brand-white transition-colors duration-500 ${
                  open ? "bg-brand-teal" : "bg-neutral-300"
                }`}
              />
            <motion.div
              layout
              className={`rounded-3xl border transition-colors duration-500 ${
                open
                  ? "border-black/10 bg-white shadow-xl shadow-black/5"
                  : "border-black/5 bg-neutral-50/60 hover:bg-neutral-50"
              }`}
            >
              <button
                onClick={() => toggle(i)}
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

                      {item.caseStudyTitle && item.caseStudyLink && (
                        <a
                          href={item.caseStudyLink}
                          className="mt-8 inline-flex items-center gap-3 px-5 py-2.5 bg-brand-teal/5 text-brand-teal rounded-xl text-sm font-bold hover:bg-brand-teal/10 transition-colors group"
                        >
                          Case study: {item.caseStudyTitle}
                          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            </div>
          );
        })}
        </div>
      </div>
    </section>
  );
}
