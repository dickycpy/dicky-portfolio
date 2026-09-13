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
import { Compass, PenLine, Rocket, ArrowRight, ChevronDown, ExternalLink } from "lucide-react";

// ---------------------------------------------------------------------------
// Career journey — a Prezi-style ZUI (zooming user interface).
//   • One infinite canvas. A "camera" flies over it as you scroll.
//   • The big dashed ring IS the container: the Discover → Specify → Ship loop
//     that every product goes through. Each role is a small node nested on the
//     ring — zoom into it to reveal what's inside (the "aha, there's more").
//   • Camera path: overview (whole loop) → zoom IBM → pull back to loop (breathe)
//     → pan + zoom ESSAA → pull all the way out. Space = meaning.
//   • Pointer parallax tilts the whole scene gently, like looking into a box.
// Falls back to a calm flat stack for reduced-motion / touch / narrow screens
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

// Camera keyframes over scroll progress.  x stays 0 (nodes are stacked
// vertically), so the camera only travels up/down + zooms.
// world point (0, cy) is centred when  y = -scale * cy.
//   overview → zoom IBM(top, cy=-NODE_Y) → back → zoom ESSAA(bottom, cy=+NODE_Y) → out
const NODE_Y = 340;
const CAM_P = [0, 0.22, 0.4, 0.52, 0.7, 0.85, 1];
const CAM_SCALE = [0.62, 1.6, 1.6, 0.62, 1.6, 1.6, 0.72];
// y = -scale*cy :  IBM cy=-340 → +544 ;  ESSAA cy=+340 → -544
const CAM_Y = [0, 544, 544, 0, -544, -544, 0];

// per-node focus windows (badge ↔ full card cross-fade)
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
      className="rounded-2xl border border-black/5 bg-white/80 px-3 py-4 text-center"
    >
      <div className="text-xl md:text-2xl font-bold text-brand-teal tracking-tight leading-none">
        {display}
      </div>
      <div className="text-[11px] text-neutral-500 mt-2 leading-tight">{label}</div>
    </div>
  );
}

// Recurring motif — the same loop, small, shown on each expanded card.
function LoopGlyph() {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-24 h-24">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-dashed border-brand-teal/40"
          animate={reduce ? undefined : { rotate: 360 }}
          transition={reduce ? undefined : { duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <span className="absolute left-1/2 -top-1 -translate-x-1/2 bg-white rounded-full p-1.5 text-brand-teal shadow-sm">
          <Compass size={18} />
        </span>
        <span className="absolute -left-1 bottom-2 bg-white rounded-full p-1.5 text-brand-teal shadow-sm">
          <PenLine size={18} />
        </span>
        <span className="absolute -right-1 bottom-2 bg-white rounded-full p-1.5 text-brand-teal shadow-sm">
          <Rocket size={18} />
        </span>
      </div>
      <div className="flex items-center gap-4 text-[11px] font-semibold text-neutral-500">
        <span>Discover</span>
        <span>Specify</span>
        <span>Ship</span>
      </div>
    </div>
  );
}

// The full detail of a role (shown flat, and as the "opened" node in ZUI).
function CardContent({ item, showLoop = true }: { item: Checkpoint; showLoop?: boolean; key?: any }) {
  return (
    <div className="relative flex flex-col items-center gap-6 text-center px-6 py-10">
      {/* receding panel behind the content */}
      <div className="absolute inset-0 rounded-[2rem] bg-white/80 border border-black/5 shadow-2xl shadow-black/10 backdrop-blur-sm -z-10" />

      <span className="w-3 h-3 rounded-full bg-brand-teal ring-4 ring-brand-teal/15" />

      <div>
        <div className="text-6xl md:text-7xl font-bold tracking-tighter leading-none">
          {item.periodBig}
        </div>
        <div className="text-xs font-medium text-neutral-400 mt-2">{item.periodSub}</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-black/5 shrink-0">
          <img
            src={item.logo}
            alt={item.company}
            className="w-full h-full object-contain p-1.5"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="text-left">
          <div className="text-lg font-bold tracking-tight leading-tight">{item.title}</div>
          <div className="text-sm text-neutral-500">{item.company}</div>
        </div>
      </div>

      {showLoop && <LoopGlyph />}

      <div className="grid grid-cols-3 gap-3 w-full">
        {item.stats.map((s, i) => (
          <StatTile key={i} value={s.value} label={s.label} />
        ))}
      </div>

      {item.clients.length > 0 && (
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
          {item.clients.map((c, i) => (
            <img
              key={i}
              src={c.logo}
              alt={c.name}
              title={c.name}
              className="h-5 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
      )}

      {item.caseStudy && (
        <a
          href={item.caseStudy.link}
          className="group inline-flex items-center gap-2 text-sm font-bold text-brand-teal"
        >
          Case study: {item.caseStudy.title}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </a>
      )}
    </div>
  );
}

// The collapsed node you see from far away — a labelled dot on the ring.
function NodeBadge({ item }: { item: Checkpoint; key?: any }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="w-20 h-20 rounded-full bg-white border border-black/10 shadow-xl shadow-black/10 flex items-center justify-center overflow-hidden">
        <img
          src={item.logo}
          alt={item.company}
          className="w-12 h-12 object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="text-4xl font-bold tracking-tighter leading-none">{item.periodBig}</div>
      <div className="text-xs font-medium text-neutral-500 max-w-[10rem]">{item.title}</div>
    </div>
  );
}

// A node nested on the ring: badge (far) cross-fades into the full card (near).
function ZuiNode({
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
  const cardOpacity = useTransform(
    progress,
    [cardIn, cardFull, cardHold, cardOut],
    [0, 1, 1, 0]
  );
  const badgeOpacity = useTransform(
    progress,
    [cardIn, cardFull, cardHold, cardOut],
    [1, 0, 0, 1]
  );

  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{ transform: `translate(-50%, calc(-50% + ${yOffset}px))` }}
    >
      {/* full card — readable only when the camera is on it */}
      <motion.div
        style={{ opacity: cardOpacity }}
        className="w-[380px] -translate-x-1/2 -translate-y-1/2 absolute left-1/2 top-1/2"
      >
        <CardContent item={item} />
      </motion.div>
      {/* collapsed badge — what you see from the overview */}
      <motion.div
        style={{ opacity: badgeOpacity }}
        className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 top-1/2"
      >
        <NodeBadge item={item} />
      </motion.div>
    </div>
  );
}

// The big container ring — the loop every product runs through.
function LoopRing({ progress }: { progress: MotionValue<number> }) {
  const reduce = useReducedMotion();
  // fade the ring back a touch while zoomed into a node, so cards stay clean
  const opacity = useTransform(
    progress,
    [0, 0.18, 0.24, 0.46, 0.52, 0.64, 0.7, 0.92, 1],
    [1, 1, 0.12, 0.12, 1, 1, 0.12, 0.12, 1]
  );
  return (
    <motion.div
      style={{ opacity }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <div className="relative w-[720px] h-[720px]">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-dashed border-brand-teal/35"
          animate={reduce ? undefined : { rotate: 360 }}
          transition={reduce ? undefined : { duration: 90, repeat: Infinity, ease: "linear" }}
        />
        <span className="absolute left-1/2 top-6 -translate-x-1/2 text-xs font-semibold tracking-widest text-neutral-400">
          DISCOVER
        </span>
        <span className="absolute left-10 top-1/2 -translate-y-1/2 text-xs font-semibold tracking-widest text-neutral-400">
          SPECIFY
        </span>
        <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs font-semibold tracking-widest text-neutral-400">
          SHIP
        </span>
      </div>
    </motion.div>
  );
}

// Desktop ZUI scene.
function ZuiScene() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const rawScale = useTransform(scrollYProgress, CAM_P, CAM_SCALE);
  const rawY = useTransform(scrollYProgress, CAM_P, CAM_Y);
  // light spring softens the camera → gentler on the eyes
  const scale = useSpring(rawScale, { stiffness: 80, damping: 22, mass: 0.4 });
  const camY = useSpring(rawY, { stiffness: 80, damping: 22, mass: 0.4 });

  // pointer parallax — subtle tilt of the whole scene
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useSpring(useTransform(py, [-0.5, 0.5], [5, -5]), { stiffness: 120, damping: 20 });
  const ry = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), { stiffness: 120, damping: 20 });
  const onMove = (e: any) => {
    if (reduce) return;
    px.set(e.clientX / window.innerWidth - 0.5);
    py.set(e.clientY / window.innerHeight - 0.5);
  };

  // opening hint fades once you start scrolling
  const hintOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);

  return (
    // tall driver — gives the camera room to travel (≈ 5 waypoints)
    <div ref={sectionRef} className="relative h-[500vh]">
      <div
        onMouseMove={onMove}
        className="sticky top-0 h-screen overflow-hidden flex items-center justify-center"
        style={{ perspective: 1400 }}
      >
        {/* pinned foreground caption */}
        <div className="pointer-events-none absolute top-24 left-0 right-0 z-20 text-center px-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            The same loop, every product
          </h2>
        </div>
        <motion.div
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute bottom-10 left-0 right-0 z-20 text-center text-xs font-medium tracking-widest text-neutral-400"
        >
          SCROLL TO TRAVEL ↓
        </motion.div>

        {/* the world, seen through the camera */}
        <motion.div style={{ rotateX: rx, rotateY: ry }} className="w-full h-full">
          <motion.div
            style={{ y: camY, scale }}
            className="relative w-full h-full will-change-transform"
          >
            <LoopRing progress={scrollYProgress} />
            {journey.map((item, i) => (
              <ZuiNode
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
// This is where a recruiter reads the real evidence — always present, readable,
// scannable, mobile-friendly. The ZUI above is the hook; this is the proof.
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

  // Compact / reduced-motion: skip the camera flight entirely — go straight to
  // the readable, scannable accordion (with its own heading).
  if (reduce || compact) {
    return <CareerAccordion showHeading />;
  }

  // Desktop: ZUI is the hook, the accordion below is the substance.
  return (
    <>
      <ZuiScene />
      <div className="pt-8 pb-8">
        <CareerAccordion />
      </div>
    </>
  );
}
