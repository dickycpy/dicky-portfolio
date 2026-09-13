import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useInView,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import { Compass, PenLine, Rocket, ArrowRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Career journey — a CSS-3D "spatial depth" story of Dicky's roles.
//   • Spatial depth: each checkpoint floats in a perspective scene and dollies
//     forward on the Z-axis as you scroll it to centre (recedes + fades away).
//   • Pointer reactivity: the whole scene tilts (rotateX/Y) toward the cursor,
//     giving parallax — like looking into a box.
//   • Layered storytelling: foreground text sits over a receding card panel.
// Falls back to a calm flat layout for reduced-motion / touch (no cursor).
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

// Recurring motif: the same Discover → Specify → Ship loop on every checkpoint.
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

// The inner content of a checkpoint (shared by 3D and flat modes).
function CardContent({ item }: { item: Checkpoint; key?: any }) {
  return (
    <div className="relative flex flex-col items-center gap-6 text-center px-6 py-10">
      {/* receding panel behind the content */}
      <div className="absolute inset-0 rounded-[2rem] bg-white/70 border border-black/5 shadow-2xl shadow-black/10 backdrop-blur-sm -z-10" />

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

      <LoopGlyph />

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

// A checkpoint floating in 3D space. Pointer tilt (rx/ry) is shared across the
// scene; Z-dolly + scale + opacity are driven by this block's own scroll.
function Checkpoint3D({
  item,
  rx,
  ry,
}: {
  item: Checkpoint;
  rx: MotionValue<number>;
  ry: MotionValue<number>;
  key?: any;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Peak (front + full size + opaque) when the block is centred.
  const z = useTransform(scrollYProgress, [0, 0.5, 1], [-520, 0, -520]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.72, 1, 0.72]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.1, 1, 0.1]);

  return (
    <div
      ref={ref}
      className="min-h-[92vh] flex items-center justify-center"
      style={{ perspective: 1100 }}
    >
      <motion.div
        style={{ rotateX: rx, rotateY: ry, z, scale, opacity }}
        className="w-full max-w-md will-change-transform"
      >
        <CardContent item={item} />
      </motion.div>
    </div>
  );
}

export default function CareerJourney() {
  const reduce = useReducedMotion();

  // Shared pointer position → gentle scene tilt.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useSpring(useTransform(py, [-0.5, 0.5], [9, -9]), {
    stiffness: 120,
    damping: 20,
  });
  const ry = useSpring(useTransform(px, [-0.5, 0.5], [-14, 14]), {
    stiffness: 120,
    damping: 20,
  });

  const onMove = (e: any) => {
    if (reduce) return;
    px.set(e.clientX / window.innerWidth - 0.5);
    py.set(e.clientY / window.innerHeight - 0.5);
  };

  return (
    <section onMouseMove={onMove} className="py-8">
      <h2 className="text-center text-2xl md:text-3xl font-bold tracking-tight mb-2">
        The same loop, every product
      </h2>

      {reduce ? (
        // Calm, accessible fallback — no 3D, no motion.
        <div className="max-w-md mx-auto space-y-16 pt-8">
          {journey.map((item, i) => (
            <CardContent key={i} item={item} />
          ))}
        </div>
      ) : (
        <div>
          {journey.map((item, i) => (
            <Checkpoint3D key={i} item={item} rx={rx} ry={ry} />
          ))}
        </div>
      )}
    </section>
  );
}
