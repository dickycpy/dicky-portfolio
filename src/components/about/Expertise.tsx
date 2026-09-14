import { motion } from "motion/react";
import { usePageContent, DEFAULT_EXPERTISE } from "@/lib/content";

// ---------------------------------------------------------------------------
// Expertise — a grouped set of skill tags shown alongside the career path.
// Read-only display; content is admin-editable (settings/expertise) and falls
// back to DEFAULT_EXPERTISE. Styling is kept cohesive with CareerJourney:
// same eyebrow treatment, rounded-3xl neutral cards and brand-teal accents.
// ---------------------------------------------------------------------------

export default function Expertise() {
  const { content } = usePageContent("expertise", DEFAULT_EXPERTISE);
  const { heading, groups } = content;

  if (!groups || groups.length === 0) return null;

  return (
    <section className="mx-auto max-w-3xl px-2">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-8">
        {heading}
      </p>
      <div className="space-y-4">
        {groups.map((group, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
            className="rounded-3xl border border-black/5 bg-neutral-50/60 p-6 md:p-7"
          >
            <h3 className="flex items-center gap-3 text-base md:text-lg font-bold tracking-tight text-black mb-4">
              <span className="w-6 h-[2px] rounded-full bg-brand-teal" />
              {group.label}
            </h3>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item, j) => (
                <span
                  key={j}
                  className="px-3 py-1.5 rounded-full border border-black/10 bg-white text-[13px] font-medium text-neutral-700 hover:border-brand-teal/40 hover:text-brand-teal transition-colors"
                >
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
