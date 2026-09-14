import { motion } from "motion/react";
import CareerJourney from "@/components/about/CareerJourney";
import Expertise from "@/components/about/Expertise";
import RichText from "@/components/RichText";
import { usePageContent, DEFAULT_ABOUT } from "@/lib/content";

function AboutHero() {
  const { content } = usePageContent("about", DEFAULT_ABOUT);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.02] mb-8">
        <RichText text={content.headline} />
      </h1>
      <p className="text-xl md:text-2xl text-neutral-500 font-medium leading-relaxed max-w-3xl mb-10">
        <RichText text={content.sub} />
      </p>
      <div className="flex flex-wrap gap-3">
        {content.pills.map((k) => (
          <span
            key={k}
            className="px-5 py-2.5 rounded-full text-sm font-bold text-brand-teal bg-brand-teal/5 border border-brand-teal/30"
          >
            {k}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function About() {
  return (
    <div className="pt-24 md:pt-32 px-6 md:px-12 lg:px-24 pb-40">
      <section className="mb-32 md:mb-40">
        <AboutHero />
      </section>

      {/* Stacked on all viewports: career path on top, expertise below. */}
      <div className="space-y-24 md:space-y-32">
        <CareerJourney />
        <Expertise />
      </div>
    </div>
  );
}
