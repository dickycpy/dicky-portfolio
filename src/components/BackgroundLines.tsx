import { motion } from "motion/react";

export default function BackgroundLines() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
      {/* Structural Vertical Lines */}
      <div className="absolute left-6 md:left-12 lg:left-24 top-0 bottom-0 w-px bg-black/[0.06]" />
      <div className="absolute right-6 md:right-12 lg:right-24 top-0 bottom-0 w-px bg-black/[0.06]" />
      
      {/* Structural Horizontal Lines */}
      <div className="absolute top-24 md:top-32 left-0 right-0 h-px bg-black/[0.04]" />
      
      {/* Layout Coordinates */}
      <div className="absolute top-6 left-6 md:top-12 md:left-12 lg:top-12 lg:left-24 text-[10px] font-mono text-black/40 uppercase tracking-widest">
        Pos: 0.0.0
      </div>
      <div className="absolute top-6 right-6 md:top-12 md:right-12 lg:top-12 lg:right-24 text-[10px] font-mono text-black/40 uppercase tracking-widest">
        Ref: DC-2026
      </div>
      <div className="absolute bottom-6 left-6 md:bottom-12 md:left-12 lg:bottom-12 lg:left-24 text-[10px] font-mono text-black/40 uppercase tracking-widest vertical-text">
        Grid: 40px
      </div>

      {/* Center Line (Optional, very subtle) */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black/[0.04] -translate-x-1/2" />

      {/* Animated accent line */}
      <motion.div 
        initial={{ height: 0 }}
        animate={{ height: "100%" }}
        transition={{ duration: 2, ease: "easeInOut" }}
        className="absolute left-6 md:left-12 lg:left-24 top-0 w-px bg-teal-500/40"
      />
    </div>
  );
}
