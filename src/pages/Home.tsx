import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { ArrowDownRight } from "lucide-react";
import LogoWall from "@/components/LogoWall";
import StackedProjectShowcase from "@/components/StackedProjectShowcase";
import Footer from "@/components/Footer";
import { projects as mockProjects } from "@/lib/data";
import { Link } from "react-router-dom";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { db } from "@/firebase";
import { cn } from "@/lib/utils";

import Magnetic from "@/components/Magnetic";

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
              whileHover={{ color: "#0F7B77", scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "cursor-default transition-colors",
                isHighlight ? "text-black" : "text-neutral-400"
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
  const [projects, setProjects] = useState(mockProjects);

  useEffect(() => {
    // Fetch only projects marked for home display, ordered by homeSortOrder
    const q = query(
      collection(db, "projects"), 
      where("showOnHome", "==", true),
      orderBy("homeSortOrder", "asc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      if (fetchedProjects.length > 0) {
        setProjects(fetchedProjects);
      } else {
        // Fallback or explicit empty state if no projects are marked for home
        setProjects([]);
      }
    }, (error) => {
      console.error("Error fetching projects:", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="pt-24 md:pt-32">
      {/* Hero Section */}
      <section className="px-6 md:px-12 lg:px-24 mb-48 md:mb-40 pt-20 md:pt-32 min-h-[60vh] md:min-h-0">
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
              src="https://i.postimg.cc/WztpmZMX/profile-pic.jpg" 
              alt="Dicky Headshot" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
        <h1 className="text-3xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1] mb-8">
          a <span className="italic text-brand-teal">Product BA</span> <br />
          with a <span className="italic text-brand-teal">designer&apos;s eye</span>.
        </h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-2xl text-neutral-500 font-medium max-w-2xl leading-snug"
        >
          I bridge users, stakeholders &amp; dev — sitting with people to uncover the
          real pain points, then turning them into requirements a team can build.
        </motion.p>
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
              className="inline-block px-8 py-4 bg-black text-white rounded-full text-sm font-medium uppercase tracking-widest hover:bg-brand-teal transition-all duration-300"
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
              src="https://i.postimg.cc/YC24jvP6/creato.jpg"
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
