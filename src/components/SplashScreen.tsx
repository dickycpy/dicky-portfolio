import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const location = useLocation();

  // Hide on admin panel
  useEffect(() => {
    const isAdmin = location.pathname.startsWith("/admin");

    if (!isAdmin) {
      setIsVisible(true);
      
      // Auto-complete after animations finish (Progress bar is 1.2s + some buffer)
      const timer = setTimeout(() => {
        setIsComplete(true);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [location]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ 
            y: "-100%",
            transition: { duration: 1, ease: [0.22, 1, 0.36, 1] }
          }}
          className="fixed inset-0 z-[9999] bg-brand-white flex flex-col items-center justify-center overflow-hidden"
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
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              filter: 'contrast(150%) brightness(100%)'
            }}
          />

          {/* Main Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.8 } }}
            className="relative z-10 text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4 flex items-center justify-center gap-2"
            >
              <motion.div 
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1, times: [0, 0.5, 1] }}
                className="w-1.5 h-1.5 rounded-full bg-brand-teal"
              />
              <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-brand-teal font-bold">
                Initializing Experience
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
                      duration: 0.8, 
                      delay: 0.1 + (index * 0.03), 
                      ease: [0.22, 1, 0.36, 1] 
                    }}
                    className={char === " " ? "mr-4" : ""}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.h1>
            </div>

            <div className="flex flex-col items-center">
              {/* Progress Bar */}
              <div className="w-48 h-[2px] bg-black/5 relative overflow-hidden rounded-full">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="absolute inset-0 bg-brand-teal"
                />
              </div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 1.6 }}
                className="mt-4 text-[9px] font-mono uppercase tracking-[0.3em]"
              >
                My work, at a glance
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
