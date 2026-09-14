import { useState, useEffect } from "react";
import { motion } from "motion/react";
import LogoWall from "@/components/LogoWall";
import StackedProjectShowcase from "@/components/StackedProjectShowcase";
import { projects as mockProjects } from "@/lib/data";
import { Link } from "react-router-dom";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { db } from "@/firebase";
import RichText from "@/components/RichText";
import { usePageContent, DEFAULT_HOME } from "@/lib/content";

export default function Home() {
  const [projects, setProjects] = useState(mockProjects);
  const { content } = usePageContent("home", DEFAULT_HOME);

  useEffect(() => {
    // Fetch only projects marked for home display, ordered by homeSortOrder
    const q = query(
      collection(db, "projects"), 
      where("showOnHome", "==", true),
      orderBy("homeSortOrder", "asc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProjects = (snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[]).filter(p => !p.hidden); // respect admin hide toggle

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
            {content.eyebrow}
          </motion.p>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
            className="w-16 h-8 rounded-full overflow-hidden border border-black/5 bg-neutral-100"
          >
            <img
              src={content.headshot}
              alt="Dicky Headshot"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
        <h1 className="text-3xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1] mb-8">
          <RichText text={content.heroHeadline} italicAccent />
        </h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-2xl text-neutral-500 font-medium max-w-2xl leading-snug"
        >
          <RichText text={content.heroSub} />
        </motion.p>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap gap-3 mt-8"
        >
          {content.heroPills.map((k) => (
            <span
              key={k}
              className="px-5 py-2.5 rounded-full text-sm font-bold text-brand-teal bg-brand-teal/5 border border-brand-teal/30"
            >
              {k}
            </span>
          ))}
        </motion.div>
      </section>

      {/* Logo Wall */}
      <LogoWall />

      {/* Featured Projects - Stacked Wallet Style */}
      <StackedProjectShowcase projects={projects} />

      {/* About Section */}
      <section className="px-6 md:px-12 lg:px-24 py-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.08] mb-8">
              <RichText text={content.aboutHeadline} />
            </h2>
            <p className="text-lg text-neutral-500 font-medium leading-relaxed max-w-xl mb-8">
              <RichText text={content.aboutBody} />
            </p>
            <div className="flex flex-wrap gap-3 mb-12">
              {content.aboutPills.map((k) => (
                <span
                  key={k}
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-brand-teal bg-brand-teal/5 border border-brand-teal/30"
                >
                  {k}
                </span>
              ))}
            </div>
            <Link
              to="/about"
              state={{ animate: true }}
              className="inline-block px-8 py-4 bg-black text-white rounded-full text-sm font-medium uppercase tracking-widest hover:bg-brand-teal transition-all duration-300"
            >
              {content.aboutCta}
            </Link>
          </motion.div>
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
              src={content.aboutImage}
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
