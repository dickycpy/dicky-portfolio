import { motion, AnimatePresence } from "motion/react";
import { X, Tag, Calendar } from "lucide-react";
import { CASE_STUDY_SECTIONS, ProjectFormData } from "./types";

// A4: renders the case study from the *current, unsaved* form data so the
// editor can preview exactly what visitors will see without leaving the panel
// or saving first. Mirrors the rendering logic of pages/ProjectDetail.tsx.

const cleanHtml = (html: string) => {
  if (!html) return "";
  return html
    .replace(/[­​‌‍﻿]/g, "")
    .replace(/&shy;/g, "")
    .replace(/&#173;/g, "")
    .replace(/[  ᠎ -   　]/g, " ")
    .replace(/&nbsp;/g, " ");
};

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}`
    : null;
};

const getVimeoEmbedUrl = (url: string) => {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
};

interface Props {
  open: boolean;
  data: ProjectFormData;
  coverPreview: string; // resolved cover image (object URL or remote URL)
  onClose: () => void;
}

export default function CaseStudyPreview({
  open,
  data,
  coverPreview,
  onClose,
}: Props) {
  const sections = CASE_STUDY_SECTIONS.filter(
    (s) => (data.subSections?.[s.id] || []).length > 0
  );
  const tools = data.tools
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 md:p-10 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-[2rem] w-full max-w-5xl my-auto overflow-hidden shadow-2xl"
          >
            <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-md border-b border-neutral-100">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                Live Preview — not saved
              </span>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-black hover:text-white flex items-center justify-center transition-colors"
                aria-label="Close preview"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 md:px-12 py-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-10">
                <div className="lg:col-span-8">
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-5 leading-[0.95]">
                    {data.title || "Untitled Project"}
                  </h1>
                  <p className="text-lg md:text-xl text-neutral-500 font-light leading-relaxed">
                    {data.description}
                  </p>
                </div>
                <div className="lg:col-span-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-widest text-neutral-400">
                    <Tag size={14} /> {data.category}
                  </div>
                  {data.timeline && (
                    <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-widest text-neutral-400">
                      <Calendar size={14} /> {data.timeline}
                    </div>
                  )}
                </div>
              </div>

              {coverPreview && (
                <div className="relative aspect-[3/2] rounded-[1.5rem] overflow-hidden bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-16">
                  <div
                    className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110"
                    style={{ backgroundImage: `url(${coverPreview})` }}
                  />
                  <img
                    src={coverPreview}
                    alt={data.title}
                    className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {tools.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-16">
                  {tools.map((tool) => (
                    <span
                      key={tool}
                      className="px-2 py-1 bg-neutral-50 border border-neutral-100 rounded text-[9px] font-bold uppercase tracking-widest"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              )}

              {sections.length === 0 ? (
                <div className="py-20 text-center text-neutral-300 border-2 border-dashed border-neutral-100 rounded-[1.5rem]">
                  <p className="text-xs font-bold uppercase tracking-widest">
                    Add content blocks to see the case study preview
                  </p>
                </div>
              ) : (
                <div className="space-y-24">
                  {sections.map((section) => {
                    const subs = data.subSections?.[section.id] || [];
                    return (
                      <section key={section.id}>
                        <div className="flex items-center gap-4 mb-10">
                          <span className="text-3xl font-bold tracking-tighter text-neutral-100">
                            {section.num}
                          </span>
                          <div className="h-[1px] flex-1 bg-neutral-100" />
                          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-black">
                            {section.label.replace(/^\d+\.\s*/, "")}
                          </h2>
                        </div>
                        <div className="space-y-16">
                          {subs.map((sub, idx) => {
                            const embed =
                              getYouTubeEmbedUrl(sub.video || "") ||
                              getVimeoEmbedUrl(sub.video || "");
                            return (
                              <div key={idx} className="space-y-6">
                                {sub.title && (
                                  <h3 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-4">
                                    <span className="w-8 h-[1px] bg-brand-teal" />
                                    {sub.title}
                                  </h3>
                                )}
                                {sub.content && (
                                  <div
                                    className="prose-content max-w-none"
                                    dangerouslySetInnerHTML={{
                                      __html: cleanHtml(sub.content),
                                    }}
                                  />
                                )}
                                {sub.image && (
                                  <div className="relative aspect-[3/2] rounded-[1.5rem] overflow-hidden border border-neutral-100 bg-neutral-50 flex items-center justify-center">
                                    <img
                                      src={sub.image}
                                      alt={sub.title || "Section visual"}
                                      className="relative z-10 max-w-full max-h-full object-contain"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                )}
                                {embed && (
                                  <div className="aspect-video rounded-[1.5rem] overflow-hidden border border-neutral-100 bg-black">
                                    <iframe
                                      src={embed}
                                      className="w-full h-full"
                                      allowFullScreen
                                      title={sub.title || "Section video"}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
