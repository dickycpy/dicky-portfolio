import { motion, useMotionValue, useAnimationFrame, useTransform } from "motion/react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { usePageContent, DEFAULT_SITE } from "@/lib/content";

export default function LogoWall() {
  const { content } = usePageContent("site", DEFAULT_SITE);
  const logos = content.logos;
  const [isHovered, setIsHovered] = useState(false);
  const [activeCenterIndex, setActiveCenterIndex] = useState(-1);
  const xTranslation = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Correctly transform the numeric value to a percentage string
  const xPercent = useTransform(xTranslation, (value) => `${value}%`);

  // Use useAnimationFrame for a perfectly smooth, pause-in-place marquee
  useAnimationFrame((_, delta) => {
    if (isHovered) return;

    // Speed: 2.5% of the total width per second
    const speed = 2.5; 
    const moveBy = (delta / 1000) * speed;
    
    let nextX = xTranslation.get() - moveBy;
    
    // Reset when we've scrolled past the first set of logos (-50%)
    if (nextX <= -50) {
      nextX = 0;
    }
    
    xTranslation.set(nextX);

    // Calculate which logo is in the center of the screen
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const screenCenter = window.innerWidth / 2;
      // nextX is negative, so we use -nextX to get the positive offset
      const currentOffset = (-nextX / 100) * containerWidth;
      
      const totalLogosCount = logos.length * 2;
      const logoWidth = containerWidth / totalLogosCount;
      
      // The index of the logo that is currently at the screen center
      const centerIndex = Math.floor((screenCenter + currentOffset) / logoWidth);
      
      if (centerIndex !== activeCenterIndex) {
        setActiveCenterIndex(centerIndex);
      }
    }
  });

  return (
    <div className="w-full overflow-hidden py-24 border-y border-black/5 bg-transparent backdrop-blur-md relative z-10">
      <div className="px-6 md:px-12 lg:px-24 mb-12">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400">
          {content.logoWallHeading}
        </h3>
      </div>
      
      <motion.div
        ref={containerRef}
        className="flex whitespace-nowrap items-center w-max"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ x: xPercent }}
      >
        {[...logos, ...logos].map((logo, i) => {
          // A logo is highlighted if it's the one in the center OR if the user is hovering (desktop)
          const isHighlighted = i === activeCenterIndex;
          
          return (
            <div
              key={i}
              className={cn(
                "px-8 md:px-12 transition-all duration-700 ease-in-out",
                (isHovered || isHighlighted) 
                  ? "opacity-100 grayscale-0 scale-110" 
                  : "opacity-20 grayscale scale-100"
              )}
            >
              <div className="h-12 md:h-16 w-32 md:w-48 flex items-center justify-center">
                <img 
                  src={logo} 
                  alt="Brand Logo" 
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
