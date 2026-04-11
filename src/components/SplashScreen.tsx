import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const location = useLocation();
  const { scrollY } = useScroll();

  // Hide on admin panel and only show once per session
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    const isAdmin = location.pathname.startsWith("/admin");

    if (!hasSeenSplash && !isAdmin) {
      setIsVisible(true);
      // Prevent scrolling while splash is active
      document.body.style.overflow = "hidden";
    }
  }, [location]);

  const handleComplete = () => {
    setIsComplete(true);
    document.body.style.overflow = "auto";
    sessionStorage.setItem("hasSeenSplash", "true");
  };

  // Scroll-based reveal logic
  useEffect(() => {
    if (!isVisible || isComplete) return;

    const unsubscribe = scrollY.on("change", (latest) => {
      if (latest > 100) {
        // Once they start scrolling, we allow the body to scroll and eventually complete
        document.body.style.overflow = "auto";
      }
      if (latest > 450) {
        handleComplete();
      }
    });

    return () => unsubscribe();
  }, [isVisible, isComplete, scrollY]);

  const clipPath = useTransform(
    scrollY,
    [0, 500],
    ["inset(0% 0% 0% 0%)", "inset(0% 0% 100% 0%)"]
  );

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          style={{ clipPath }}
          className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Static Grid Background (Matching the site) */}
          <div 
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(0,0,0,1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0,0,0,1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Noise Texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] filter contrast-150 brightness-100" />

          {/* Main Content */}
          <div className="relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4 flex items-center justify-center gap-2"
            >
              <motion.div 
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1, times: [0, 0.5, 1] }}
                className="w-1.5 h-1.5 rounded-full bg-teal-600"
              />
              <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-teal-600 font-bold">
                System Initialization
              </span>
            </motion.div>

            <div className="overflow-hidden mb-12">
              <motion.h1
                className="text-6xl md:text-8xl font-bold tracking-tighter leading-none flex justify-center"
              >
                {"DICKY CHU".split("").map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{ 
                      duration: 1, 
                      delay: 0.2 + (index * 0.05), 
                      ease: [0.22, 1, 0.36, 1] 
                    }}
                    className={char === " " ? "mr-4" : ""}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.h1>
            </div>

            <div className="flex flex-col items-center gap-12">
              {/* Progress Bar */}
              <div className="w-48 h-[2px] bg-black/5 relative overflow-hidden rounded-full">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="absolute inset-0 bg-teal-600"
                />
              </div>

              {/* Scroll Indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-400">
                  Scroll to Explore
                </div>
                <div className="w-[1px] h-12 bg-gradient-to-b from-teal-600 to-transparent relative overflow-hidden">
                  <motion.div 
                    animate={{ y: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute inset-0 bg-white/50"
                  />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Decorative Elements */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute top-12 left-12 text-[10px] font-mono opacity-20"
          >
            VER: 2.0.26
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-12 right-12 text-[10px] font-mono opacity-20"
          >
            LOC: 22.3193° N, 114.1694° E
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
