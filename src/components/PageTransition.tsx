import React from "react";
import { motion } from "motion/react";

// Signature four-colour panel sweep: panels cover on exit, reveal on enter.
// Now keyed directly by AnimatePresence, so both phases play cleanly.
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const transition = { duration: 0.8, ease: [0.76, 0, 0.24, 1] };

  const layers = [
    { color: "bg-brand-teal", delay: 0 },
    { color: "bg-brand-pink", delay: 0.05 },
    { color: "bg-neutral-800", delay: 0.1 },
    { color: "bg-brand-white", delay: 0.15 },
  ];

  return (
    <div className="relative">
      {/* Content fade */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        {children}
      </motion.div>

      {/* Transition layers */}
      <div className="fixed inset-0 pointer-events-none z-[999]">
        {layers.map((layer, i) => (
          <motion.div
            key={i}
            className={`absolute inset-0 ${layer.color}`}
            initial={{ x: "0%" }} // covered (entering page)
            animate={{ x: "100%" }} // slide off to reveal
            exit={{ x: ["-100%", "0%"] }} // slide on to cover (leaving page)
            transition={{ ...transition, delay: layer.delay }}
            style={{ zIndex: 100 - i }}
          />
        ))}
      </div>
    </div>
  );
};

export default PageTransition;
