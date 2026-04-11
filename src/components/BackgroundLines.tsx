import { motion } from "motion/react";

export default function BackgroundLines() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.05]"
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
        className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] filter contrast-150 brightness-100"
      />

      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white opacity-20" />
    </div>
  );
}
