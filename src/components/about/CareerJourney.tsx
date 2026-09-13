import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useInView,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import { ArrowRight, ChevronDown, ExternalLink } from "lucide-react";

// ---------------------------------------------------------------------------
// Career journey — a zooming "timeline canvas".
//   • A vertical timeline spine runs through the roles. Each role is a clean
//     badge node on the line (year + logo + title).
//   • A "camera" flies down the timeline as you scroll: zoom into a node to
//     reveal its headline metrics, pull back to the line, travel to the next.
//   • The full, readable detail lives in the accordion below — the timeline is
//     the hook, the accordion is the proof.
// Falls back to the accordion alone for reduced-motion / touch / narrow screens
// (no camera flight — protects readability + avoids motion sickness).
// ---------------------------------------------------------------------------

interface Stat {
  value: string;
  label: string;
}
interface Client {
  name: string;
  logo: string;
}
interface Checkpoint {
  periodBig: string;
  periodSub: string;
  title: string;
  company: string;
  location: string;
  industry: string;
  handle?: string;
  logo: string;
  stats: Stat[];
  bullets: string[];
  clients: Client[];
  caseStudy?: { title: string; link: string };
}

const journey: Checkpoint[] = [
  {
    periodBig: "2025",
    periodSub: "Dec 2025 – Present",
    title: "Business Analyst",
    company: "IBM Consulting · IBM iX",
    location: "Hong Kong",
    industry: "Consulting / AI Products",
    logo: "https://cdn.worldvectorlogo.com/logos/ibm.svg",
    stats: [
      { value: "2", label: "AI phygital experiences" },
      { value: "1", label: "live Gen-AI race broadcast" },
      { value: "SAT→PROD", label: "release & RCA ownership" },
    ],
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
    periodBig: "2022",
    periodSub: "2022 – 2025",
    title: "Product Designer / BA",
    company: "ESSAA Limited",
    location: "Hong Kong",
    industry: "AI Marketing SaaS / STEM Education",
    handle: "creatogether.app",
    logo: "https://static.wixstatic.com/media/6e47aa_bd763a11882242e0b0c85f29a32be46c~mv2.png",
    stats: [
      { value: "50+", label: "stakeholders onboarded" },
      { value: "3", label: "international summits" },
      { value: "1", label: "AI marketing SaaS, end to end" },
    ],
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

// Camera keyframes over scroll progress. x stays 0 (nodes are stacked on a
// vertical timeline), so the camera only travels up/down + zooms.
// world point (0, cy) is centred when  y = -scale * cy.
const NODE_Y = 340;
const CAM_P = [0, 0.22, 0.4, 0.52, 0.7, 0.85, 1];
const CAM_SCALE = [0.66, 1.45, 1.45, 0.66, 1.45, 1.45, 0.74];
// y = -scale*cy :  IBM cy=-340 → +493 ;  ESSAA cy=+340 → -493
const CAM_Y = [0, 493, 493, 0, -493, -493, 0];

// per-node focus windows (badge ↔ metrics card cross-fade)
const NODE_FOCUS = [
  { cardIn: 0.15, cardFull: 0.23, cardHold: 0.39, cardOut: 0.47 }, // IBM
  { cardIn: 0.63, cardFull: 0.71, cardHold: 0.84, cardOut: 0.92 }, // ESSAA
];

// True on narrow screens or coarse (touch) pointers — where a flying camera
// hurts more than it helps.
function useCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const check = () => {
      const narrow = window.innerWidth < 768;
      const coarse =
        window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
      setCompact(narrow || coarse);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return compact;
}

// Metric tile — counts up from 0 when scrolled into view.
function StatTile({ value, label }: Stat & { key?: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const reduce = useReducedMotion();

  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : null;
  const suffix = match ? match[2] : "";

  const [n, setN] = useState<number>(target != null && !reduce ? 0 : target ?? 0);

  useEffect(() => {
    if (target == null || reduce || !inView) return;
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, reduce]);

  const display = target != null ? `${n}${suffix}` : value;

  return (
    <div
      ref={ref}
      className="rounded-xl border border-black/5 bg-neutral-50 px-2.5 py-3 text-center"
    >
      <div className="text-lg font-bold text-brand-teal tracking-tight leading-none">
        {display}
      </div>
      <div className="text-[10px] text-neutral-500 mt-1.5 leading-tight">{label}</div>
    </div>
  );
}

// The collapsed node you see from far away — a labelled dot on the timeline.
function NodeBadge({ item }: { item: Checkpoint; key?: any }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="w-20 h-20 rounded-full bg-white border border-black/10 shadow-xl shadow-black/10 flex items-center justify-center overflow-hidden">
        <img
          src={item.logo}
          alt={item.company}
          className="w-11 h-11 object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="text-4xl font-bold tracking-tighter leading-none">{item.periodBig}</div>
      <div className="text-xs font-medium text-neutral-500 max-w-[9rem]">{item.title}</div>
    </div>
  );
}

// The "opened" node — a compact, framed metrics card. Deliberately small type
// and a clear border so it reads as a card, not floating text.
function MetricsCard({ item }: { item: Checkpoint; key?: any }) {
  return (
    <div className="w-[340px] rounded-3xl bg-white border border-black/10 shadow-2xl shadow-black/10 px-6 py-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl overflow-hidden bg-white border border-black/5 shrink-0">
          <img
            src={item.logo}
            alt={item.company}
            className="w-full h-full object-contain p-1.5"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="text-left min-w-0">
          <div className="text-base font-bold tracking-tight leading-tight">{item.title}</div>
          <div className="text-xs text-neutral-500 truncate">{item.company}</div>
        </div>
        <div className="ml-auto text-2xl font-bold tracking-tighter text-neutral-300 leading-none">
          {item.periodBig}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {item.stats.map((s, i) => (
          <StatTile key={i} value={s.value} label={s.label} />
        ))}
      </div>

      <div className="mt-5 text-center text-[10px] font-semibold tracking-[0.2em] text-neutral-400">
        FULL DETAIL BELOW ↓
      </div>
    </div>
  );
}

// A node on the timeline: badge (far) cross-fades into the metrics card (near).
function TimelineNode({
  item,
  yOffset,
  progress,
  focus,
}: {
  item: Checkpoint;
  yOffset: number;
  progress: MotionValue<number>;
  focus: { cardIn: number; cardFull: number; cardHold: number; cardOut: number };
  key?: any;
}) {
  const { cardIn, cardFull, cardHold, cardOut } = focus;
  const cardOpacity = useTransform(progress, [cardIn, cardFull, cardHold, cardOut], [0, 1, 1, 0]);
  const badgeOpacity = useTransform(progress, [cardIn, cardFull, cardHold, cardOut], [1, 0, 0, 1]);

  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{ transform: `translate(-50%, calc(-50% + ${yOffset}px))` }}
    >
      <motion.div
        style={{ opacity: cardOpacity }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <MetricsCard item={item} />
      </motion.div>
      <motion.div
        style={{ opacity: badgeOpacity }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <NodeBadge item={item} />
      </motion.div>
    </div>
  );
}

// The timeline spine — a vertical line the nodes sit on.
function TimelineSpine() {
  const total = NODE_Y * 2 + 360; // extends a little past the top & bottom node
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <div
        className="w-[2px] bg-gradient-to-b from-transparent via-brand-teal/40 to-transparent"
        style={{ height: total }}
      />
    </div>
  );
}

// Desktop zooming-timeline scene.
function TimelineScene() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const rawScale = useTransform(scrollYProgress, CAM_P, CAM_SCALE);
  const rawY = useTransform(scrollYProgress, CAM_P, CAM_Y);
  const scale = useSpring(rawScale, { stiffness: 80, damping: 22, mass: 0.4 });
  const camY = useSpring(rawY, { stiffness: 80, damping: 22, mass: 0.4 });

  // pointer parallax — subtle tilt of the whole scene
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useSpring(useTransform(py, [-0.5, 0.5], [4, -4]), { stiffness: 120, damping: 20 });
  const ry = useSpring(useTransform(px, [-0.5, 0.5], [-6, 6]), { stiffness: 120, damping: 20 });
  const onMove = (e: any) => {
    if (reduce) return;
    px.set(e.clientX / window.innerWidth - 0.5);
    py.set(e.clientY / window.innerHeight - 0.5);
  };

  const hintOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);

  return (
    <div ref={sectionRef} className="relative h-[500vh]">
      <div
        onMouseMove={onMove}
        className="sticky top-0 h-screen overflow-hidden flex items-center justify-center"
        style={{ perspective: 1400 }}
      >
        <div className="pointer-events-none absolute top-8 left-0 right-0 z-20 text-center px-6">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            The same loop, every product
          </h2>
        </div>
        <motion.div
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute bottom-10 left-0 right-0 z-20 text-center text-xs font-medium tracking-widest text-neutral-400"
        >
          SCROLL TO TRAVEL ↓
        </motion.div>

        <motion.div style={{ rotateX: rx, rotateY: ry }} className="w-full h-full">
          <motion.div
            style={{ y: camY, scale }}
            className="relative w-full h-full will-change-transform"
          >
            <TimelineSpine />
            {journey.map((item, i) => (
              <TimelineNode
                key={i}
                item={item}
                yOffset={i === 0 ? -NODE_Y : NODE_Y}
                progress={scrollYProgress}
                focus={NODE_FOCUS[i]}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The substance layer: an expandable career path with the full BA detail.
// Always present, readable, scannable, mobile-friendly.
// ---------------------------------------------------------------------------
function CareerAccordion({ showHeading = false }: { showHeading?: boolean }) {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-3xl px-2">
      {showHeading && (
        <h2 className="text-center text-2xl md:text-3xl font-bold tracking-tight mb-8">
          The same loop, every product
        </h2>
      )}
      <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-8">
        Career path — the detail
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

export default function CareerJourney() {
  const reduce = useReducedMotion();
  const compact = useCompact();

  // Compact / reduced-motion: skip the camera flight — go straight to the
  // readable, scannable accordion (with its own heading).
  if (reduce || compact) {
    return <CareerAccordion showHeading />;
  }

  // Desktop: the zooming timeline is the hook, the accordion below is the substance.
  return (
    <>
      <TimelineScene />
      <div className="pt-8 pb-8">
        <CareerAccordion />
      </div>
    </>
  );
}
