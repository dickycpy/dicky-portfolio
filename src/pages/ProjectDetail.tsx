import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useSpring, AnimatePresence } from "motion/react";
import { ArrowLeft, ChevronRight, Lock, ArrowRight, Clock, Tag, Calendar, ChevronLeft } from "lucide-react";
import { projects as mockProjects } from "@/lib/data";
import React, { useEffect, useState, useMemo } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";

const ImageCarousel = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  if (!images || images.length === 0) return null;

  return (
    <div className="relative group/carousel">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative aspect-[3/2] rounded-[2.5rem] overflow-hidden border border-neutral-100 bg-neutral-50 shadow-sm flex items-center justify-center"
      >
        {/* Design Frame Background */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-cover bg-center blur-3xl scale-110"
            style={{ backgroundImage: `url(${images[currentIndex]})` }}
          />
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.img 
            key={currentIndex}
            src={images[currentIndex]} 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain" 
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button 
              onClick={prev}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-black shadow-xl opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-black hover:text-white"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={next}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-black shadow-xl opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-black hover:text-white"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {images.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? "bg-black w-4" : "bg-black/20"}`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(mockProjects.find((p) => p.id === id));
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    if (!id) return;
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(doc(db, "projects", id), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProject({ id: snapshot.id, ...data });
        if (!data.password) {
          setIsAuthorized(true);
        }
      } else if (!mockProjects.find((p) => p.id === id)) {
        // If not in Firebase and not in mock data, it's a 404
        navigate("/404", { replace: true });
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching project detail:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [id, navigate]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === project.password) {
      setIsAuthorized(true);
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
      setPasswordInput("");
    }
  };

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [activeSection, setActiveSection] = useState("introduction");

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const getVimeoEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /vimeo\.com\/(?:video\/)?(\d+)/;
    const match = url.match(regExp);
    return match ? `https://player.vimeo.com/video/${match[1]}` : null;
  };

  const sections = useMemo(() => {
    const allSections = [
      { id: "introduction", label: "Introduction", num: "01" },
      { id: "challenge", label: "The Challenge", num: "02" },
      { id: "approach", label: "The Approach", num: "03" },
      { id: "understanding", label: "Understanding", num: "04" },
      { id: "define", label: "Define", num: "05" },
      { id: "developDeliver", label: "Develop & Deliver", num: "06" },
      { id: "reflection", label: "Reflection", num: "07" },
    ];

    if (!project) return [];

    // Only show sections that have at least one content block
    return allSections.filter(section => {
      const subSections = project.subSections?.[section.id] || [];
      return subSections.length > 0;
    });
  }, [project]);

  useEffect(() => {
    if (!isAuthorized || !project) return;

    const handleScroll = () => {
      const sectionIds = sections.map(s => s.id);
      for (const sectionId of sectionIds) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= 400) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isAuthorized, sections]);

  const cleanHtml = (html: string) => {
    if (!html) return "";
    return html
      .replace(/[\u00AD\u200B\u200C\u200D\uFEFF]/g, "") // Remove invisible breaks and BOM
      .replace(/&shy;/g, "") // Remove soft hyphen entities
      .replace(/&#173;/g, "") // Remove numeric soft hyphen entities
      .replace(/[\u00A0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]/g, " ") // Replace all types of non-breaking spaces
      .replace(/&nbsp;/g, " "); // Replace HTML non-breaking space entities
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-neutral-200 border-t-black rounded-full"
        />
      </div>
    );
  }

  if (!project) return null;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-neutral-100">
            <Lock size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter mb-4">Protected Project</h1>
          <p className="text-neutral-500 mb-12">This project is confidential. Please enter the password provided to you to view the case study.</p>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter Password"
                className="w-full border-b-2 border-black/10 py-4 focus:border-black outline-none transition-colors text-center text-xl tracking-widest bg-transparent"
                autoFocus
              />
              <AnimatePresence>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-500 text-sm mt-4 font-medium"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-black text-white rounded-full font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors"
            >
              Unlock Case Study <ArrowRight size={18} />
            </button>
          </form>
          
          <Link to="/projects" className="inline-block mt-12 text-sm font-medium uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity underline underline-offset-8">
            Back to Projects
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-black z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Hero Section */}
      <header className="pt-32 pb-20 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <Link to="/projects" className="relative z-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:opacity-50 transition-opacity mb-16 group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Projects
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.9]"
            >
              {project.title}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl text-neutral-500 max-w-2xl font-light leading-relaxed"
            >
              {project.description}
            </motion.p>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-widest text-neutral-400">
              <Tag size={14} /> {project.category}
            </div>
            <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-widest text-neutral-400">
              <Calendar size={14} /> {project.timeline}
            </div>
          </div>
        </div>
      </header>

      {/* Main Image */}
      <section className="w-full px-6 md:px-12 lg:px-24 mb-32 max-w-[1600px] mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative aspect-[3/2] rounded-[2rem] overflow-hidden bg-neutral-50 border border-neutral-100 flex items-center justify-center"
        >
          {/* Design Frame Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110"
            style={{ backgroundImage: `url(${project.image})` }}
          />
          <img 
            src={project.image} 
            alt={project.title} 
            className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain" 
            referrerPolicy="no-referrer" 
          />
        </motion.div>
      </section>

      {/* Content Grid */}
      <main className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20 pb-40">
        {/* Sticky Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-40 space-y-6">
            <div className="mb-12">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4">Case Study Navigation</h4>
              <div className="space-y-3">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`group flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest transition-all ${
                      activeSection === section.id ? "text-black" : "text-neutral-300 hover:text-neutral-500"
                    }`}
                  >
                    <span className={`w-4 h-[1px] transition-all ${activeSection === section.id ? "bg-black w-8" : "bg-neutral-200 group-hover:bg-neutral-400"}`} />
                    {section.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-12 border-t border-neutral-100">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4">Project Metadata</h4>
              <div className="space-y-6">
                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Role</span>
                  <span className="text-sm font-medium">{project.role}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Tools</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.tools?.map((tool: string) => (
                      <span key={tool} className="px-2 py-1 bg-neutral-50 border border-neutral-100 rounded text-[9px] font-bold uppercase tracking-widest">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="lg:col-span-9 min-w-0 space-y-32">
          {sections.map((section) => {
            const subSections = project.subSections?.[section.id] || [];
            
            // Check if section has any content blocks
            const hasSubSections = subSections.length > 0;

            if (!hasSubSections) return null;

            return (
              <section key={section.id} id={section.id} className="scroll-mt-40 group">
                <div className="flex items-center gap-4 mb-12">
                  <span className="text-4xl font-bold tracking-tighter text-neutral-100 group-hover:text-neutral-200 transition-colors">
                    {section.num}
                  </span>
                  <div className="h-[1px] flex-1 bg-neutral-100" />
                  <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-black">
                    {section.label}
                  </h2>
                </div>
                
                <div className="space-y-24">
                  {subSections.map((sub: any, idx: number) => (
                    <div key={idx} className="space-y-10">
                      {sub.title && (
                        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-black flex items-center gap-4">
                          <span className="w-8 h-[1px] bg-brand-teal" />
                          {sub.title}
                        </h3>
                      )}
                      
                      {sub.content && (
                        <div 
                          className="prose-content prose-lg max-w-none"
                          dangerouslySetInnerHTML={{ __html: cleanHtml(sub.content) }}
                        />
                      )}
                      
                      {(sub.image || sub.video || (sub.carouselImages && sub.carouselImages.length > 0)) && (
                        <div className="space-y-8 mt-12">
                          {sub.carouselImages && sub.carouselImages.length > 0 ? (
                            <ImageCarousel images={sub.carouselImages} />
                          ) : sub.image && (
                            <div className="space-y-4">
                              <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="relative aspect-[3/2] rounded-[2.5rem] overflow-hidden border border-neutral-100 bg-neutral-50 shadow-sm flex items-center justify-center"
                              >
                                {/* Design Frame Background */}
                                <div 
                                  className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110"
                                  style={{ backgroundImage: `url(${sub.image})` }}
                                />
                                <img 
                                  src={sub.image} 
                                  alt={sub.title || "Section visual"} 
                                  className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain" 
                                  referrerPolicy="no-referrer"
                                />
                              </motion.div>
                              {sub.imageDescription && (
                                <p className="text-xs font-medium text-neutral-400 text-center italic px-12 leading-relaxed">
                                  {sub.imageDescription}
                                </p>
                              )}
                            </div>
                          )}
                          
                          {sub.video && (
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              className="aspect-video rounded-[2.5rem] overflow-hidden border border-neutral-100 bg-black shadow-2xl"
                            >
                              <iframe
                                src={getYouTubeEmbedUrl(sub.video) || getVimeoEmbedUrl(sub.video) || ""}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={sub.title || "Section video"}
                              />
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {/* Section Navigation */}
          <nav className="pt-20 border-t border-neutral-100 flex justify-between items-center">
            <Link to="/projects" className="text-xs font-bold uppercase tracking-widest hover:opacity-50 transition-opacity flex items-center gap-2">
              <ArrowLeft size={14} /> All Projects
            </Link>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-xs font-bold uppercase tracking-widest hover:opacity-50 transition-opacity"
            >
              Back to Top
            </button>
          </nav>
        </div>
      </main>
    </div>
  );
}
