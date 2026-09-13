import React from "react";
import { motion } from "motion/react";
import { useLocation } from "react-router-dom";

// Signature four-colour panel sweep — but ONLY when the navigation came from a
// navbar page switch (the link passes `state={{ animate: true }}`). Every other
// navigation (project cards, in-content links, back button) renders plainly
// with no transition.
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const animate = Boolean((location.state as { animate?: boolean } | null)?.animate);

  if (!animate) {
    return <>{children}</>;
  }

  const transition = { duration: 0.8, ease: [0.76, 0, 0.24, 1] };

  const layers = [
    { color: "bg-brand-teal", delay: 0 },
    { color: "bg-brand-pink", delay: 0.05 },
    { color: "bg-neutral-800", delay: 0.1 },
    { color: "bg-brand-white", delay: 0.15 },
  ];

  return (
    <div className="relative">
      {/* Content fade-in behind the sweep */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        {children}
      </motion.div>

      {/* Panels slide off to reveal the page */}
      <div className="fixed inset-0 pointer-events-none z-[999]">
        {layers.map((layer, i) => (
          <motion.div
            key={i}
            className={`absolute inset-0 ${layer.color}`}
            initial={{ x: "0%" }}
            animate={{ x: "100%" }}
            transition={{ ...transition, delay: layer.delay }}
            style={{ zIndex: 100 - i }}
          />
        ))}
      </div>
    </div>
  );
};

export default PageTransition;
