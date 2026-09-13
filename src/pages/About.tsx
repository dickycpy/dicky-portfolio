import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import CareerJourney from "@/components/about/CareerJourney";

const introText = "Across every role, I've worked inside an app team — turning messy problems into clear requirements, then shipping them with the developers who build the product.";

function RevealText({ text }: { text: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 95%", "end 40%"],
  });

  const words = text.split(" ");

  return (
    <div ref={containerRef} className="relative">
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1] mb-12 flex flex-wrap gap-x-[0.2em] gap-y-[0.1em]">
        {words.map((word, i) => {
          const start = i / words.length;
          const end = (i + 1) / words.length;
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const opacity = useTransform(scrollYProgress, [start, end], [0.15, 1]);
          
          const isHighlight = ["app", "team", "requirements,", "shipping", "build"].includes(word);

          return (
            <motion.span
              key={i}
              style={{ opacity }}
              whileHover={{ color: "#0F7B77", scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "cursor-default transition-colors",
                isHighlight ? "text-black" : "text-neutral-400"
              )}
            >
              {word}
            </motion.span>
          );
        })}
      </h1>
    </div>
  );
}

export default function About() {
  return (
    <div className="pt-24 md:pt-32 px-6 md:px-12 lg:px-24 pb-40">
      <section className="mb-32 md:mb-40">
        <RevealText text={introText} />
      </section>

      <CareerJourney />
    </div>
  );
}
