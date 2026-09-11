import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { Download, Mail, Phone, Globe, Linkedin } from "lucide-react";
import type { ResumeData } from "@/components/admin/types";
import { defaultResume } from "@/lib/resumeData";

function SectionHeading({ children }: { children: any }) {
  return (
    <h2 className="resume-h2 text-[13px] font-bold uppercase tracking-[0.18em] text-black border-b-2 border-black/80 pb-1 mb-3">
      {children}
    </h2>
  );
}

export default function Resume() {
  const [resume, setResume] = useState<ResumeData>(defaultResume);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "resume"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<ResumeData>;
          setResume({ ...defaultResume, ...data });
        }
      },
      (err) => console.error("Error loading resume:", err)
    );
    return () => unsub();
  }, []);

  const stripProtocol = (url: string) => url.replace(/^https?:\/\//, "");

  return (
    <div className="resume-page min-h-screen bg-neutral-100 pt-28 md:pt-32 pb-24 px-4 print:p-0 print:bg-white print:min-h-0">
      {/* Toolbar (hidden in print) */}
      <div className="no-print max-w-[800px] mx-auto mb-6 flex items-center justify-between gap-4">
        <p className="text-xs text-neutral-500 font-medium">
          Tip: in the print dialog, choose <strong>Save as PDF</strong> and set
          margins to <strong>None / Default</strong> for the cleanest export.
        </p>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-brand-teal transition-all shadow-lg shrink-0"
        >
          <Download size={14} /> Download PDF
        </button>
      </div>

      {/* The printable sheet */}
      <article className="resume-sheet mx-auto bg-white text-black shadow-xl print:shadow-none">
        {/* Header */}
        <header className="mb-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-brand-teal mb-1">
            {resume.title}
          </p>
          <h1 className="text-[32px] leading-none font-bold tracking-tight mb-3">
            {resume.name}
          </h1>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11.5px] text-neutral-700">
            {resume.email && (
              <a href={`mailto:${resume.email}`} className="flex items-center gap-1.5 hover:text-brand-teal">
                <Mail size={12} /> {resume.email}
              </a>
            )}
            {resume.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={12} /> {resume.phone}
              </span>
            )}
            {resume.portfolioUrl && (
              <a href={resume.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-brand-teal">
                <Globe size={12} /> {stripProtocol(resume.portfolioUrl)}
              </a>
            )}
            {resume.linkedinUrl && (
              <a href={resume.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-brand-teal">
                <Linkedin size={12} /> {stripProtocol(resume.linkedinUrl)}
              </a>
            )}
          </div>
        </header>

        {/* Executive Summary */}
        {resume.summary && (
          <section className="mb-5">
            <SectionHeading>Executive Summary</SectionHeading>
            <p className="text-[11.5px] leading-relaxed text-neutral-800 text-justify">
              {resume.summary}
            </p>
          </section>
        )}

        {/* Professional Experience */}
        {resume.experience.length > 0 && (
          <section className="mb-5">
            <SectionHeading>Professional Experience</SectionHeading>
            <div className="space-y-4">
              {resume.experience.map((exp, i) => (
                <div key={i} className="resume-entry">
                  <div className="flex justify-between items-baseline gap-4">
                    <h3 className="text-[14px] font-bold text-black">{exp.company}</h3>
                    <span className="text-[11px] font-semibold text-neutral-500 whitespace-nowrap">
                      {exp.dateRange}
                    </span>
                  </div>
                  <p className="text-[12px] font-semibold text-brand-teal mb-1.5">
                    {exp.role}
                  </p>
                  <ul className="space-y-1">
                    {exp.bullets.map((b, j) => (
                      <li key={j} className="flex gap-2 text-[11.5px] leading-relaxed text-neutral-800">
                        <span className="mt-[6px] w-1 h-1 rounded-full bg-brand-teal shrink-0" />
                        <span className="text-justify">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <section className="mb-5">
            <SectionHeading>Education</SectionHeading>
            <div className="space-y-2">
              {resume.education.map((ed, i) => (
                <div key={i} className="resume-entry flex justify-between items-baseline gap-4">
                  <div>
                    <h3 className="text-[13px] font-bold text-black">{ed.school}</h3>
                    <p className="text-[11.5px] text-neutral-700">{ed.program}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-neutral-500 whitespace-nowrap">
                    {ed.dateRange}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Licenses & Certifications */}
        {resume.certifications.length > 0 && (
          <section className="mb-5">
            <SectionHeading>Licenses &amp; Certifications</SectionHeading>
            <div className="space-y-2">
              {resume.certifications.map((c, i) => (
                <div key={i} className="resume-entry flex justify-between items-baseline gap-4">
                  <div>
                    <h3 className="text-[13px] font-bold text-black">{c.name}</h3>
                    <p className="text-[11.5px] text-neutral-700">{c.issuer}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-neutral-500 whitespace-nowrap">
                    {c.dateRange}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Technical & AI Exposure */}
        {resume.skills.length > 0 && (
          <section>
            <SectionHeading>Technical &amp; AI Exposure</SectionHeading>
            <div className="space-y-1.5">
              {resume.skills.map((s, i) => (
                <p key={i} className="text-[11.5px] leading-relaxed text-neutral-800">
                  <span className="font-bold text-black">{s.label}: </span>
                  {s.items}
                </p>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
