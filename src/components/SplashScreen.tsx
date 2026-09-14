import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
  type Variants,
} from "motion/react";
import { useEffect, useState } from "react";

// Plays once, on the very first load of the app — never again on route
// changes. Concept: the DC logo mark acts as a container that "loads up",
// filling bottom→top with the brand gradient while a monospaced counter ticks
// to 100. On complete the panel peels away upward with the signature
// four-colour sweep to reveal the site.
// (Module-level flag survives re-mounts within a session.)
let hasPlayed = false;

const LOGO = "/logo-mark.png";
const FILL_DURATION = 1.5; // seconds for 0 → 100 (eased a touch slower)
// Fill completes at ~1.5s; hold ~0.9s longer so the filled logo can be read
// before the sweep begins.
const EXIT_AT = 2400; // ms before the sweep begins

const sweep = { duration: 0.7, ease: [0.76, 0, 0.24, 1] as const };

// Each panel rests over the screen, then slides up off the top on exit. The
// container staggers them so they leave in sequence (content → teal → pink →
// neutral) — a multi-colour curtain wiping upward.
const panelVariants: Variants = {
  visible: { y: 0 },
  exit: { y: "-100%", transition: sweep },
};

const containerVariants: Variants = {
  visible: {},
  exit: { transition: { staggerChildren: 0.07 } },
};

// The logo mark clips whatever sits inside the wrapper to the DC silhouette.
const maskStyle = {
  WebkitMaskImage: `url(${LOGO})`,
  maskImage: `url(${LOGO})`,
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
} as const;

export default function SplashScreen() {
  const isFirstLoad =
    !hasPlayed && !window.location.pathname.startsWith("/admin");
  const [isComplete, setIsComplete] = useState(!isFirstLoad);
  // Fires the owl's greeting blink once the fill has topped out.
  const [blink, setBlink] = useState(false);

  // Loading counter 0 → 100, shared by the number readout and the fill height.
  const count = useMotionValue(0);
  const percent = useTransform(count, (v) => Math.round(v));
  const fillHeight = useTransform(count, (v) => `${v}%`);

  useEffect(() => {
    if (isFirstLoad) hasPlayed = true;
  }, [isFirstLoad]);

  useEffect(() => {
    if (!isFirstLoad) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const controls = animate(count, 100, {
      duration: reduce ? 0.01 : FILL_DURATION,
      ease: [0.22, 1, 0.36, 1],
    });

    // Blink shortly after the fill reaches 100% — a little greeting.
    const blinkTimer = setTimeout(
      () => setBlink(true),
      reduce ? 0 : FILL_DURATION * 1000 + 200
    );

    const timer = setTimeout(
      () => setIsComplete(true),
      reduce ? 400 : EXIT_AT
    );

    return () => {
      controls.stop();
      clearTimeout(blinkTimer);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirstLoad]);

  if (!isFirstLoad) return null;

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          key="splash-screen"
          className="fixed inset-0 z-[9999] overflow-hidden"
          variants={containerVariants}
          initial="visible"
          animate="visible"
          exit="exit"
        >
          {/* Content panel — leaves first */}
          <motion.div
            variants={panelVariants}
            style={{ zIndex: 40 }}
            className="absolute inset-0 bg-brand-white flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Faint grid, tied to the site's structural language */}
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(0,0,0,1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0,0,0,1) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            />

            <div className="relative z-10 flex flex-col items-center">
              {/* Logo mark, filling up */}
              <div className="relative w-36 h-36 md:w-44 md:h-44">
                {/* Empty silhouette — light disabled grey */}
                <div
                  className="absolute inset-0 bg-neutral-200"
                  style={maskStyle}
                />
                {/* Solid brand-teal fill rising from the bottom, clipped to the mark */}
                <div className="absolute inset-0" style={maskStyle}>
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-brand-teal"
                    style={{ height: fillHeight }}
                  />
                </div>

                {/* Owl eyelids — teal discs over each eye that snap shut in a
                    quick double-blink once the fill is full. */}
                <motion.span
                  className="absolute rounded-full bg-brand-teal"
                  style={{
                    left: "32.6%",
                    top: "51%",
                    width: "20%",
                    height: "20%",
                    translate: "-50% -50%",
                  }}
                  initial={{ scaleY: 0 }}
                  animate={blink ? { scaleY: [0, 1, 0, 1, 0] } : { scaleY: 0 }}
                  transition={{
                    duration: 0.55,
                    times: [0, 0.18, 0.4, 0.6, 0.85],
                    ease: "easeInOut",
                  }}
                />
                <motion.span
                  className="absolute rounded-full bg-brand-teal"
                  style={{
                    left: "69%",
                    top: "51%",
                    width: "22%",
                    height: "22%",
                    translate: "-50% -50%",
                  }}
                  initial={{ scaleY: 0 }}
                  animate={blink ? { scaleY: [0, 1, 0, 1, 0] } : { scaleY: 0 }}
                  transition={{
                    duration: 0.55,
                    times: [0, 0.18, 0.4, 0.6, 0.85],
                    ease: "easeInOut",
                  }}
                />
              </div>

              {/* Name */}
              <h1 className="mt-10 text-3xl md:text-4xl font-bold tracking-tight text-black">
                Dicky Chu
              </h1>

              {/* Loading readout */}
              <div className="mt-3 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-neutral-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-brand-teal opacity-60 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-teal" />
                </span>
                <span>Loading</span>
                <motion.span className="text-black tabular-nums">
                  {percent}
                </motion.span>
                <span className="text-neutral-400">%</span>
              </div>
            </div>
          </motion.div>

          {/* Trailing colour panels — revealed as the content panel lifts */}
          <motion.div
            variants={panelVariants}
            style={{ zIndex: 30 }}
            className="absolute inset-0 bg-brand-teal"
          />
          <motion.div
            variants={panelVariants}
            style={{ zIndex: 20 }}
            className="absolute inset-0 bg-brand-pink"
          />
          <motion.div
            variants={panelVariants}
            style={{ zIndex: 10 }}
            className="absolute inset-0 bg-neutral-800"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
