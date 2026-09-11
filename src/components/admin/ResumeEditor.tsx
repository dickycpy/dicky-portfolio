import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import {
  FileText,
  Save,
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { useToast } from "./ToastProvider";
import type { ResumeData } from "./types";
import { defaultResume } from "@/lib/resumeData";

const fieldCls =
  "w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:border-black outline-none transition-colors";
const labelCls =
  "block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2";

export default function ResumeEditor() {
  const { toast } = useToast();
  const [data, setData] = useState<ResumeData>(defaultResume);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "resume"));
        if (snap.exists()) {
          setData({ ...defaultResume, ...(snap.data() as Partial<ResumeData>) });
        }
      } catch (err) {
        console.error("Error loading resume:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "resume"), data, { merge: true });
      toast("Resume saved — the /resume page is now updated.", "success");
    } catch (err) {
      console.error("Error saving resume:", err);
      toast("Failed to save. Make sure you're authorized.", "error");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    if (confirm("Reset all fields to the built-in CV template? Unsaved edits will be lost.")) {
      setData(defaultResume);
      toast("Reset to template — remember to Save.", "success");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-neutral-400">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-neutral-50 rounded-[2.5rem] p-6 md:p-10 border border-neutral-100"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-black text-white rounded-[1.5rem] flex items-center justify-center shadow-xl">
            <FileText size={26} />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Resume / CV</h3>
            <p className="text-neutral-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">
              Powers the /resume print page
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/resume"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 bg-white border border-neutral-200 rounded-full text-xs font-bold uppercase tracking-widest hover:border-black transition-colors"
          >
            Preview <ExternalLink size={14} />
          </a>
          <button
            onClick={resetToDefault}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-neutral-200 rounded-full text-xs font-bold uppercase tracking-widest hover:border-black transition-colors"
            title="Reset to CV template"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-7 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-lg disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="space-y-10 max-w-3xl">
        {/* Header block */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-bold tracking-tight mb-3">Header</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Title (top line)</label>
              <input className={fieldCls} value={data.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Name</label>
              <input className={fieldCls} value={data.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input className={fieldCls} value={data.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={fieldCls} value={data.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Portfolio URL</label>
              <input className={fieldCls} value={data.portfolioUrl} onChange={(e) => set("portfolioUrl", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>LinkedIn URL</label>
              <input className={fieldCls} value={data.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} />
            </div>
          </div>
        </fieldset>

        {/* Summary */}
        <fieldset>
          <legend className="text-sm font-bold tracking-tight mb-3">Executive Summary</legend>
          <textarea
            className={`${fieldCls} min-h-[110px] resize-y leading-relaxed`}
            value={data.summary}
            onChange={(e) => set("summary", e.target.value)}
          />
        </fieldset>

        {/* Experience */}
        <fieldset className="space-y-4">
          <div className="flex items-center justify-between mb-1">
            <legend className="text-sm font-bold tracking-tight">Professional Experience</legend>
            <button
              onClick={() =>
                set("experience", [
                  ...data.experience,
                  { company: "", role: "", dateRange: "", bullets: [""] },
                ])
              }
              className="flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:underline"
            >
              <Plus size={14} /> Add role
            </button>
          </div>
          {data.experience.map((exp, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-neutral-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Role #{i + 1}
                </span>
                <button
                  onClick={() => set("experience", data.experience.filter((_, k) => k !== i))}
                  className="text-neutral-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  className={fieldCls}
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) => {
                    const next = [...data.experience];
                    next[i] = { ...exp, company: e.target.value };
                    set("experience", next);
                  }}
                />
                <input
                  className={fieldCls}
                  placeholder="Role / title"
                  value={exp.role}
                  onChange={(e) => {
                    const next = [...data.experience];
                    next[i] = { ...exp, role: e.target.value };
                    set("experience", next);
                  }}
                />
                <input
                  className={fieldCls}
                  placeholder="Date range"
                  value={exp.dateRange}
                  onChange={(e) => {
                    const next = [...data.experience];
                    next[i] = { ...exp, dateRange: e.target.value };
                    set("experience", next);
                  }}
                />
              </div>
              {/* bullets */}
              <div className="space-y-2">
                {exp.bullets.map((b, j) => (
                  <div key={j} className="flex gap-2 items-start">
                    <textarea
                      className={`${fieldCls} min-h-[52px] resize-y`}
                      placeholder={`Bullet ${j + 1}`}
                      value={b}
                      onChange={(e) => {
                        const next = [...data.experience];
                        const bullets = [...exp.bullets];
                        bullets[j] = e.target.value;
                        next[i] = { ...exp, bullets };
                        set("experience", next);
                      }}
                    />
                    <button
                      onClick={() => {
                        const next = [...data.experience];
                        next[i] = { ...exp, bullets: exp.bullets.filter((_, k) => k !== j) };
                        set("experience", next);
                      }}
                      className="text-neutral-300 hover:text-red-500 transition-colors mt-2"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const next = [...data.experience];
                    next[i] = { ...exp, bullets: [...exp.bullets, ""] };
                    set("experience", next);
                  }}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 hover:text-black"
                >
                  <Plus size={12} /> Add bullet
                </button>
              </div>
            </div>
          ))}
        </fieldset>

        {/* Education */}
        <fieldset className="space-y-4">
          <div className="flex items-center justify-between mb-1">
            <legend className="text-sm font-bold tracking-tight">Education</legend>
            <button
              onClick={() => set("education", [...data.education, { school: "", program: "", dateRange: "" }])}
              className="flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:underline"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          {data.education.map((ed, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-neutral-100 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-center">
              <input
                className={fieldCls}
                placeholder="School"
                value={ed.school}
                onChange={(e) => {
                  const next = [...data.education];
                  next[i] = { ...ed, school: e.target.value };
                  set("education", next);
                }}
              />
              <input
                className={fieldCls}
                placeholder="Program"
                value={ed.program}
                onChange={(e) => {
                  const next = [...data.education];
                  next[i] = { ...ed, program: e.target.value };
                  set("education", next);
                }}
              />
              <div className="flex gap-2 items-center">
                <input
                  className={fieldCls}
                  placeholder="Dates"
                  value={ed.dateRange}
                  onChange={(e) => {
                    const next = [...data.education];
                    next[i] = { ...ed, dateRange: e.target.value };
                    set("education", next);
                  }}
                />
                <button
                  onClick={() => set("education", data.education.filter((_, k) => k !== i))}
                  className="text-neutral-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </fieldset>

        {/* Certifications */}
        <fieldset className="space-y-4">
          <div className="flex items-center justify-between mb-1">
            <legend className="text-sm font-bold tracking-tight">Licenses &amp; Certifications</legend>
            <button
              onClick={() => set("certifications", [...data.certifications, { name: "", issuer: "", dateRange: "" }])}
              className="flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:underline"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          {data.certifications.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-neutral-100 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-center">
              <input
                className={fieldCls}
                placeholder="Certification"
                value={c.name}
                onChange={(e) => {
                  const next = [...data.certifications];
                  next[i] = { ...c, name: e.target.value };
                  set("certifications", next);
                }}
              />
              <input
                className={fieldCls}
                placeholder="Issuer"
                value={c.issuer}
                onChange={(e) => {
                  const next = [...data.certifications];
                  next[i] = { ...c, issuer: e.target.value };
                  set("certifications", next);
                }}
              />
              <div className="flex gap-2 items-center">
                <input
                  className={fieldCls}
                  placeholder="Dates"
                  value={c.dateRange}
                  onChange={(e) => {
                    const next = [...data.certifications];
                    next[i] = { ...c, dateRange: e.target.value };
                    set("certifications", next);
                  }}
                />
                <button
                  onClick={() => set("certifications", data.certifications.filter((_, k) => k !== i))}
                  className="text-neutral-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </fieldset>

        {/* Skills */}
        <fieldset className="space-y-4">
          <div className="flex items-center justify-between mb-1">
            <legend className="text-sm font-bold tracking-tight">Technical &amp; AI Exposure</legend>
            <button
              onClick={() => set("skills", [...data.skills, { label: "", items: "" }])}
              className="flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:underline"
            >
              <Plus size={14} /> Add group
            </button>
          </div>
          {data.skills.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-neutral-100 grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3 items-start">
              <input
                className={fieldCls}
                placeholder="Category"
                value={s.label}
                onChange={(e) => {
                  const next = [...data.skills];
                  next[i] = { ...s, label: e.target.value };
                  set("skills", next);
                }}
              />
              <input
                className={fieldCls}
                placeholder="Comma-separated items"
                value={s.items}
                onChange={(e) => {
                  const next = [...data.skills];
                  next[i] = { ...s, items: e.target.value };
                  set("skills", next);
                }}
              />
              <button
                onClick={() => set("skills", data.skills.filter((_, k) => k !== i))}
                className="text-neutral-300 hover:text-red-500 transition-colors mt-2.5"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </fieldset>
      </div>
    </motion.div>
  );
}
