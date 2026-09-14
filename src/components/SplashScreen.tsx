import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

// Plays once, on the very first load of the app — never again on route
// changes. Name reveal + a single progress line, then the signature
// four-colour panel sweep peels away UPWARD (bottom → top) to reveal the site.
// (Module-level flag survives re-mounts within a session.)
let hasPlayed = false;

export default function SplashScreen() {
  const isFirstLoad =
    !hasPlayed && !window.location.pathname.startsWith("/admin");
  const [isComplete, setIsComplete] = useState(!isFirstLoad);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (isFirstLoad) hasPlayed = true;
  }, [isFirstLoad]);

  useEffect(() => {
    if (!isFirstLoad) return;
    // Content settles by ~1.1s; hold a beat, then start the upward sweep…
    const startExit = setTimeout(() => setExiting(true), 1500);
    // …and unmount once the staggered panels have cleared the top.
    const finish = setTimeout(() => setIsComplete(true), 2700);
    return () => {
      clearTimeout(startExit);
      clearTimeout(finish);
    };
  }, [isFirstLoad]);

  if (!isFirstLoad) return null;

  // Same easing as the navbar page transition, just travelling on the Y axis.
  const sweep = { duration: 0.85, ease: [0.76, 0, 0.24, 1] };

  // Trailing colour panels that sit behind the white content panel. The
  // content panel lifts first, then teal → pink → neutral follow it up, each
  // slightly delayed, so a multi-colour curtain wipes off the top of the screen.
  const layers = [
    { color: "bg-brand-teal", delay: 0.1, z: 30 },
    { color: "bg-brand-pink", delay: 0.18, z: 20 },
    { color: "bg-neutral-800", delay: 0.26, z: 10 },
  ];

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          key="splash-screen"
          className="fixed inset-0 z-[9999] overflow-hidden"
        >
          {/* Trailing colour panels — revealed as the content panel lifts */}
          {layers.map((layer, i) => (
            <motion.div
              key={i}
              className={`absolute inset-0 ${layer.color}`}
              initial={{ y: 0 }}
              animate={exiting ? { y: "-100%" } : { y: 0 }}
              transition={{ ...sweep, delay: exiting ? layer.delay : 0 }}
              style={{ zIndex: layer.z }}
            />
          ))}

          {/* White content panel — sits on top, lifts away first */}
          <motion.div
            initial={{ y: 0 }}
            animate={exiting ? { y: "-100%" } : { y: 0 }}
            transition={{ ...sweep, delay: 0 }}
            style={{ zIndex: 40 }}
            className="absolute inset-0 bg-brand-white flex flex-col items-center justify-center overflow-hidden"
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

            {/* Content */}
            <div className="relative z-10 text-center">
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
