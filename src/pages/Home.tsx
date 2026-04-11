import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { ArrowDownRight } from "lucide-react";
import LogoWall from "@/components/LogoWall";
import StackedProjectShowcase from "@/components/StackedProjectShowcase";
import Footer from "@/components/Footer";
import { projects as mockProjects } from "@/lib/data";
import { Link } from "react-router-dom";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { cn } from "@/lib/utils";

const focusAreas = ["digital marketing", "Artificial intelligence", "interactive experience"];

function RevealText({ text, className, highlightWords = [] }: { text: string; className?: string; highlightWords?: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 95%", "end 40%"],
  });

  const words = text.split(" ");

  return (
    <div ref={containerRef} className="relative">
      <p className={cn("flex flex-wrap gap-x-[0.2em] gap-y-[0.1em]", className)}>
        {words.map((word, i) => {
          const start = i / words.length;
          const end = (i + 1) / words.length;
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const opacity = useTransform(scrollYProgress, [start, end], [0.15, 1]);
          
          const isHighlight = highlightWords.some(h => word.toLowerCase().includes(h.toLowerCase()));

          return (
            <motion.span
              key={i}
              style={{ opacity }}
              whileHover={{ color: "#0d9488", scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "cursor-default transition-colors",
                isHighlight ? "text-teal-950" : "text-neutral-400"
              )}
            >
              {word}
            </motion.span>
          );
        })}
      </p>
    </div>
  );
}

export default function Home() {
  const [focusIndex, setFocusIndex] = useState(0);
  const [projects, setProjects] = useState(mockProjects);

  useEffect(() => {
    const interval = setInterval(() => {
      setFocusIndex((prev) => (prev + 1) % focusAreas.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"), limit(3));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      if (fetchedProjects.length > 0) {
        setProjects(fetchedProjects);
      }
    }, (error) => {
      console.error("Error fetching projects:", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="pt-24 md:pt-32">
      {/* Hero Section */}
      <section className="px-6 md:px-12 lg:px-24 mb-40 pt-20 md:pt-32">
        <div className="flex items-center gap-4 mb-6">
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-xl font-medium"
          >
            Hey, I'm Dicky.
          </motion.p>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
            className="w-16 h-8 rounded-full overflow-hidden border border-black/5 bg-neutral-100"
          >
            <img 
              src="https://framerusercontent.com/images/VtheqcjE8jjlcVh3YVQXB4ymA.png?width=286&height=286" 
              alt="Dicky Headshot" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
        <h1 className="text-4xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1] mb-12">
          a digital product designer <br />
          with focus on <br />
          <span className="relative inline-block h-[1.3em] overflow-hidden align-bottom px-2 -ml-2">
            <AnimatePresence mode="wait">
              <motion.span
                key={focusAreas[focusIndex]}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-100%" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="block italic text-teal-600 whitespace-nowrap leading-[1.3] py-1"
              >
                {focusAreas[focusIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
        </h1>
      </section>

      {/* Logo Wall */}
      <LogoWall />

      {/* Featured Projects - Stacked Wallet Style */}
      <StackedProjectShowcase projects={projects} />

      {/* About Section */}
      <section className="px-6 md:px-12 lg:px-24 py-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <RevealText 
              text="I excel at investigating problems and designing solutions that go beyond just the user interface. My approach involves suggesting innovative solutions through various channel, bridging the gap between human to human, and or human to objects."
              className="text-3xl md:text-4xl font-medium tracking-tight leading-tight mb-12"
              highlightWords={["investigating", "problems", "designing", "solutions", "innovative", "human"]}
            />
            <Link
              to="/about"
              className="inline-block px-8 py-4 bg-black text-white rounded-full text-sm font-medium uppercase tracking-widest hover:scale-105 transition-transform"
            >
              About Me
            </Link>
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="aspect-square rounded-3xl overflow-hidden transition-all duration-700 md:hover:scale-105"
          >
            <motion.img
              initial={{ filter: "grayscale(100%)" }}
              whileInView={{ filter: "grayscale(0%)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.5, delay: 0.2 }}
              src="https://media.licdn.com/dms/image/v2/D4E22AQGkSwuqrPQ1Cg/feedshare-shrink_2048_1536/B4EZcwSfOgHQAo-/0/1748861862406?e=1777507200&v=beta&t=ROx_jE8Eb2O_8muzZhn6WSAk_4ewNWn4-1OsZ2AqCqg"
              alt="Creato!"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
