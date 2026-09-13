import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

// Plays once, on the very first load of the app — never again on route
// changes. Kept short and crisp: name reveal + a single progress line, then
// a clean slide-away. (Module-level flag survives re-mounts within a session.)
let hasPlayed = false;

export default function SplashScreen() {
  const isFirstLoad =
    !hasPlayed && !window.location.pathname.startsWith("/admin");
  const [isComplete, setIsComplete] = useState(!isFirstLoad);

  useEffect(() => {
    if (isFirstLoad) hasPlayed = true;
  }, [isFirstLoad]);

  useEffect(() => {
    if (!isFirstLoad) return;
    // Content settles by ~1.1s; hold a beat, then leave.
    const timer = setTimeout(() => setIsComplete(true), 1500);
    return () => clearTimeout(timer);
  }, [isFirstLoad]);

  if (!isFirstLoad) return null;

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{
            y: "-100%",
            transition: { duration: 0.85, ease: [0.76, 0, 0.24, 1] },
          }}
          className="fixed inset-0 z-[9999] bg-brand-white flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Static grid background (matches the site) */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(0,0,0,1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0,0,0,1) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Content — rides up with the panel on exit */}
          <motion.div className="relative z-10 text-center">
            <div className="overflow-hidden mb-8">
              <motion.h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-none flex justify-center">
                {"DICKY CHU".split("").map((char, index) => (
                  <motion.span
                    key={index}
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.05 + index * 0.025,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={char === " " ? "mr-4" : ""}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.h1>
            </div>

            {/* Progress line */}
            <div className="mx-auto w-40 h-[2px] bg-black/5 relative overflow-hidden rounded-full">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "left" }}
                className="absolute inset-0 bg-brand-teal"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
