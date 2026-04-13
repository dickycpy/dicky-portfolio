import React from "react";
import { motion } from "motion/react";

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const transition = { duration: 0.8, ease: [0.76, 0, 0.24, 1] };

  const layers = [
    { color: "bg-teal-600", delay: 0 },
    { color: "bg-neutral-800", delay: 0.05 },
    { color: "bg-white", delay: 0.1 },
  ];

  return (
    <div className="relative">
      {/* Content Fade */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        {children}
      </motion.div>

      {/* Transition Layers */}
      <div className="fixed inset-0 pointer-events-none z-[999]">
        {layers.map((layer, i) => (
          <motion.div
            key={i}
            className={`absolute inset-0 ${layer.color}`}
            initial={{ x: "0%" }} // Start covered (for the entering page)
            animate={{ x: "100%" }} // Slide off to reveal
            exit={{ x: ["-100%", "0%"] }} // Slide on to cover (for the leaving page)
            transition={{
              ...transition,
              delay: layer.delay,
            }}
            style={{ zIndex: 100 - i }}
          />
        ))}
      </div>
    </div>
  );
};

export default PageTransition;
