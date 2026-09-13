import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useInView,
  useReducedMotion,
} from "motion/react";
import { Compass, PenLine, Rocket, ArrowRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Career journey — an immersive, scroll-driven story of Dicky's roles.
// The throughline: on every product he's the BA embedded in an app team,
// running the same loop (Discover → Specify → Ship). Each checkpoint scales
// up and turns to full colour as it reaches the centre of the screen; the
// others shrink, blur and fade to grey — so there's always one focal point.
// Curved connectors draw themselves as you scroll between checkpoints.
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
  logo: string;
  stats: Stat[];
  clients: Client[];
  caseStudy?: { title: string; link: string };
}

const journey: Checkpoint[] = [
  {
    periodBig: "2025",
    periodSub: "Dec 2025 – Present",
    title: "Business Analyst",
    company: "IBM Consulting · IBM iX",
    logo: "https://cdn.worldvectorlogo.com/logos/ibm.svg",
    stats: [
      { value: "2", label: "AI phygital experiences" },
      { value: "1", label: "live Gen-AI race broadcast" },
      { value: "SAT→PROD", label: "release & RCA ownership" },
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
    company: "ESSAA Limited · creatogether.app",
    logo: "https://static.wixstatic.com/media/6e47aa_bd763a11882242e0b0c85f29a32be46c~mv2.png",
    stats: [
      { value: "50+", label: "stakeholders onboarded" },
      { value: "3", label: "international summits" },
      { value: "1", label: "AI marketing SaaS, end to end" },
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

// A single metric tile. Counts up from 0 when it scrolls into view (unless the
// value isn't a leading number, or the user prefers reduced motion).
function StatTile({ value, label }: Stat & { key?: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
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
      className="rounded-2xl border border-black/5 bg-neutral-50/70 px-3 py-4 text-center"
    >
      <div className="text-xl md:text-2xl font-bold text-brand-teal tracking-tight leading-none">
        {display}
      </div>
      <div className="text-[11px] text-neutral-500 mt-2 leading-tight">{label}</div>
    </div>
  );
}

// The recurring motif — a slow-rotating dashed ring with the three phases he
// owns on every app team. Same on every checkpoint: that repetition IS the point.
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
        <span className="absolute left-1/2 -top-1 -translate-x-1/2 bg-white rounded-full p-1.5 text-brand-teal">
          <Compass size={18} />
        </span>
        <span className="absolute -left-1 bottom-2 bg-white rounded-full p-1.5 text-brand-teal">
          <PenLine size={18} />
        </span>
        <span className="absolute -right-1 bottom-2 bg-white rounded-full p-1.5 text-brand-teal">
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

// A curved connector that draws its stroke as you scroll past it.
function Connector() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 85%", "end 45%"],
  });
  return (
    <div ref={ref} className="flex justify-center text-brand-teal">
      <svg width="60" height="120" viewBox="0 0 60 120" fill="none" aria-hidden="true">
        <motion.path
          d="M30 2 C 8 34, 52 86, 30 118"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ pathLength: scrollYProgress }}
        />
      </svg>
    </div>
  );
}

function CheckpointBlock({ item }: { item: Checkpoint }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const reduce = useReducedMotion();

  // Peak (full colour, full size) when the block is centred in the viewport.
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 1, 0.92]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.35, 1, 0.35]);
  const gray = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0, 1]);
  const blurPx = useTransform(scrollYProgress, [0, 0.5, 1], [4, 0, 4]);
  const filter = useMotionTemplate`grayscale(${gray}) blur(${blurPx}px)`;

  return (
    <div ref={ref} className="min-h-[85vh] flex items-center justify-center">
      <motion.div
        style={reduce ? undefined : { scale, opacity, filter }}
        className="w-full max-w-xl flex flex-col items-center gap-7 text-center px-2"
      >
        {/* node dot */}
        <span className="w-3 h-3 rounded-full bg-brand-teal ring-4 ring-brand-teal/15" />

        {/* period */}
        <div>
          <div className="text-6xl md:text-7xl font-bold tracking-tighter leading-none">
            {item.periodBig}
          </div>
          <div className="text-xs font-medium text-neutral-400 mt-2">{item.periodSub}</div>
        </div>

        {/* role + company */}
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

        <LoopGlyph />

        {/* metrics */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {item.stats.map((s, i) => (
            <StatTile key={i} value={s.value} label={s.label} />
          ))}
        </div>

        {/* clients */}
        {item.clients.length > 0 && (
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
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

        {/* case study */}
        {item.caseStudy && (
          <a
            href={item.caseStudy.link}
            className="group inline-flex items-center gap-2 text-sm font-bold text-brand-teal"
          >
            Case study: {item.caseStudy.title}
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </a>
        )}
      </motion.div>
    </div>
  );
}

export default function CareerJourney() {
  return (
    <section className="py-12">
      <h2 className="text-center text-2xl md:text-3xl font-bold tracking-tight mb-4">
        The same loop, every product
      </h2>
      <div>
        {journey.map((item, i) => (
          <div key={i}>
            {i > 0 && <Connector />}
            <CheckpointBlock item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
