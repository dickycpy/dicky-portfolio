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
  FilePlus2,
  Send,
  Pencil,
  Check,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useToast } from "./ToastProvider";
import type {
  ResumeData,
  ResumeVersion,
  ResumeHeadings,
  ResumeCustomSection,
  ResumeSectionLayout,
} from "./types";
import { defaultResume, DEFAULT_RESUME_HEADINGS } from "@/lib/resumeData";

const fieldCls =
  "w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:border-black outline-none transition-colors";
const labelCls =
  "block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2";

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function ResumeEditor() {
  const { toast } = useToast();
  const [data, setData] = useState<ResumeData>(defaultResume);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  // Which version is currently open in the editor, and which is published.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [liveId, setLiveId] = useState<string | null>(null);
  // Unsaved edits in the editor that haven't been written back to the version.
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [liveSnap, verSnap] = await Promise.all([
          getDoc(doc(db, "settings", "resume")),
          getDoc(doc(db, "settings", "resumeVersions")),
        ]);

        let list: ResumeVersion[] = [];
        let live: string | null = null;
        if (verSnap.exists()) {
          const d = verSnap.data();
          list = (d.versions as ResumeVersion[]) || [];
          live = (d.liveId as string) ?? null;
        }

        // First run: no versions yet → seed an "Initial CV" from the live doc
        // (or the built-in template) and append it to Firestore.
        if (list.length === 0) {
          const seedData: ResumeData = liveSnap.exists()
            ? { ...defaultResume, ...(liveSnap.data() as Partial<ResumeData>) }
            : defaultResume;
          const initial: ResumeVersion = {
            id: genId(),
            label: "Initial CV (pre-UAT)",
            savedAt: Date.now(),
            data: seedData,
          };
          list = [initial];
          live = initial.id;
          try {
            await setDoc(doc(db, "settings", "resumeVersions"), {
              versions: list,
              liveId: live,
            });
            if (!liveSnap.exists()) {
              await setDoc(doc(db, "settings", "resume"), seedData, { merge: true });
            }
          } catch (e) {
            console.error("Error seeding initial version:", e);
          }
        }

        list = [...list].sort((a, b) => b.savedAt - a.savedAt);
        // Fall back to the newest version if liveId is missing/stale.
        if (!live || !list.some((v) => v.id === live)) live = list[0]?.id ?? null;

        setVersions(list);
        setLiveId(live);
        const openId = live ?? list[0]?.id ?? null;
        setEditingId(openId);
        const open = list.find((v) => v.id === openId);
        setData(open ? { ...defaultResume, ...open.data } : defaultResume);
      } catch (err) {
        console.error("Error loading resume:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  // Editable section headings (fall back to defaults so they're never blank).
  const h = { ...DEFAULT_RESUME_HEADINGS, ...(data.headings || {}) };
  const setHeading = (key: keyof ResumeHeadings, value: string) => {
    setData((d) => ({
      ...d,
      headings: { ...DEFAULT_RESUME_HEADINGS, ...(d.headings || {}), [key]: value },
    }));
    setDirty(true);
  };

  // User-added custom sections.
  const customSections = data.customSections || [];
  const setCustom = (next: ResumeCustomSection[]) => set("customSections", next);
  const updateCustom = (i: number, patch: Partial<ResumeCustomSection>) => {
    const next = [...customSections];
    next[i] = { ...next[i], ...patch };
    setCustom(next);
  };
  const addCustomSection = () => {
    setCustom([
      ...customSections,
      {
        id: genId(),
        heading: "New Section",
        layout: "text",
        body: "",
        entries: [],
        items: [],
      },
    ]);
  };
  const moveCustom = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= customSections.length) return;
    const next = [...customSections];
    [next[i], next[j]] = [next[j], next[i]];
    setCustom(next);
  };

  // Editable heading input for a built-in section (kept as a plain function,
  // not a nested component, so the <input> doesn't lose focus on each keystroke).
  const headingField = (k: keyof ResumeHeadings) => (
    <div className="mb-3">
      <label className={labelCls}>Section heading (as shown on the CV)</label>
      <input
        className={`${fieldCls} font-bold`}
        value={h[k]}
        onChange={(e) => setHeading(k, e.target.value)}
      />
    </div>
  );

  const editingVersion = versions.find((v) => v.id === editingId) || null;
  const liveVersion = versions.find((v) => v.id === liveId) || null;

  // Write the whole versions doc (versions + which one is live).
  const persist = async (next: ResumeVersion[], nextLive: string | null) => {
    await setDoc(doc(db, "settings", "resumeVersions"), {
      versions: next,
      liveId: nextLive,
    });
  };

  // Suggest a label like "Sep 2026 v1", auto-incrementing within the month.
  const suggestLabel = () => {
    const now = new Date();
    const monthYear = now.toLocaleString("en-US", { month: "short", year: "numeric" });
    const sameMonth = versions.filter((v) => v.label.startsWith(monthYear));
    return `${monthYear} v${sameMonth.length + 1}`;
  };

  // Save the editor content BACK INTO the version currently being edited.
  // If that version is also the live one, refresh the public /resume doc too.
  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const next = versions
        .map((v) => (v.id === editingId ? { ...v, data, savedAt: Date.now() } : v))
        .sort((a, b) => b.savedAt - a.savedAt);
      await persist(next, liveId);
      if (editingId === liveId) {
        await setDoc(doc(db, "settings", "resume"), data, { merge: true });
      }
      setVersions(next);
      setDirty(false);
      toast(
        editingId === liveId
          ? "Saved — this is the live version, so /resume is updated too."
          : `Saved to "${editingVersion?.label}". Click "Make live" to publish it.`,
        "success"
      );
    } catch (err) {
      console.error("Error saving resume:", err);
      toast("Failed to save. Make sure you're authorized.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Duplicate the current editor content into a brand-new version and switch to it.
  const saveAsNewVersion = async () => {
    const label = prompt("Name the new version:", suggestLabel());
    if (label === null) return;
    const trimmed = label.trim();
    if (!trimmed) return;
    const nv: ResumeVersion = { id: genId(), label: trimmed, savedAt: Date.now(), data };
    const next = [nv, ...versions];
    try {
      await persist(next, liveId);
      setVersions(next);
      setEditingId(nv.id);
      setDirty(false);
      toast(`Created "${trimmed}" — you're now editing it.`, "success");
    } catch (err) {
      console.error("Error creating version:", err);
      toast("Failed to create version.", "error");
    }
  };

  // Open a version in the editor. Warn if the current one has unsaved edits.
  const openVersion = (v: ResumeVersion) => {
    if (v.id === editingId) return;
    if (
      dirty &&
      !confirm(
        `You have unsaved changes in "${editingVersion?.label}". Discard them and open "${v.label}"?`
      )
    )
      return;
    setEditingId(v.id);
    setData({ ...defaultResume, ...v.data });
    setDirty(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast(`Now editing "${v.label}".`, "success");
  };

  // Publish a version to the public /resume page.
  const makeLive = async (v: ResumeVersion) => {
    if (!confirm(`Publish "${v.label}" to your live /resume page?`)) return;
    try {
      let workingVersions = versions;
      // If we're publishing the version we're editing and it has unsaved edits,
      // fold those edits in first so what goes live matches what's on screen.
      const publishData = v.id === editingId ? data : v.data;
      if (v.id === editingId && dirty) {
        workingVersions = versions
          .map((x) => (x.id === v.id ? { ...x, data, savedAt: Date.now() } : x))
          .sort((a, b) => b.savedAt - a.savedAt);
        setVersions(workingVersions);
        setDirty(false);
      }
      await setDoc(doc(db, "settings", "resume"), publishData, { merge: true });
      await persist(workingVersions, v.id);
      setLiveId(v.id);
      toast(`"${v.label}" is now live on /resume.`, "success");
    } catch (err) {
      console.error("Error publishing version:", err);
      toast("Failed to publish version.", "error");
    }
  };

  const renameVersion = async (v: ResumeVersion) => {
    const label = prompt("Rename version:", v.label);
    if (label === null) return;
    const trimmed = label.trim();
    if (!trimmed) return;
    const next = versions.map((x) => (x.id === v.id ? { ...x, label: trimmed } : x));
    try {
      await persist(next, liveId);
      setVersions(next);
      toast("Renamed.", "success");
    } catch (err) {
      console.error("Error renaming version:", err);
      toast("Failed to rename.", "error");
    }
  };

  const deleteVersion = async (v: ResumeVersion) => {
    if (versions.length <= 1) {
      toast("Keep at least one version.", "error");
      return;
    }
    if (!confirm(`Delete version "${v.label}"? This cannot be undone.`)) return;
    const next = versions.filter((x) => x.id !== v.id);
    let nextLive = liveId;
    try {
      // If we deleted the live version, promote the newest remaining one.
      if (liveId === v.id) {
        nextLive = next[0]?.id ?? null;
      }
      await persist(next, nextLive);
      setVersions(next);
      if (nextLive !== liveId) {
        setLiveId(nextLive);
        const nv = next.find((x) => x.id === nextLive);
        if (nv) await setDoc(doc(db, "settings", "resume"), nv.data, { merge: true });
      }
      // If we deleted the version we were editing, open the live/newest one.
      if (editingId === v.id) {
        const openId = nextLive ?? next[0]?.id ?? null;
        setEditingId(openId);
        const open = next.find((x) => x.id === openId);
        setData(open ? { ...defaultResume, ...open.data } : defaultResume);
        setDirty(false);
      }
      toast(`Deleted "${v.label}".`, "success");
    } catch (err) {
      console.error("Error deleting version:", err);
      toast("Failed to delete version.", "error");
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
            onClick={saveAsNewVersion}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-neutral-200 rounded-full text-xs font-bold uppercase tracking-widest hover:border-black transition-colors"
            title="Copy the current fields into a brand-new version"
          >
            <FilePlus2 size={14} /> Save as new
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="flex items-center gap-2 px-7 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-lg disabled:opacity-40"
            title="Save your edits back into the version you're editing"
          >
            {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
            {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </button>
        </div>
      </div>

      {/* Status banner — always shows which version is open and which is live */}
      <div className="mb-6 max-w-3xl flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-3 bg-white border border-neutral-200 rounded-2xl px-5 py-3.5">
          <Pencil size={16} className="text-black shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Editing
            </p>
            <p className="text-sm font-bold text-black truncate">
              {editingVersion?.label ?? "—"}
              {dirty && (
                <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-amber-600">
                  ● unsaved
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-3 bg-black text-white rounded-2xl px-5 py-3.5">
          <Send size={16} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              Live on /resume
            </p>
            <p className="text-sm font-bold truncate">{liveVersion?.label ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Version history */}
      <div className="mb-10 max-w-3xl bg-white rounded-2xl border border-neutral-100 p-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText size={16} className="text-neutral-500" />
          <h4 className="text-sm font-bold tracking-tight">Versions</h4>
        </div>
        <p className="text-[11px] text-neutral-400 mb-4 leading-relaxed">
          Each version is an editable CV. <strong>Open</strong> loads one into the editor;
          your edits save back into it with <strong>Save changes</strong>.
          <strong> Make live</strong> publishes it to /resume. Use <strong>Save as new</strong> (top
          right) to branch a fresh version from what's on screen.
        </p>
        {versions.length === 0 ? (
          <p className="text-xs text-neutral-400 italic py-3">No versions yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {versions.map((v) => {
              const isEditing = v.id === editingId;
              const isLive = v.id === liveId;
              return (
                <li
                  key={v.id}
                  className={
                    "flex items-center justify-between gap-3 py-3 px-3 -mx-3 rounded-xl " +
                    (isEditing ? "bg-neutral-50" : "")
                  }
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-black truncate">{v.label}</p>
                      {isEditing && (
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-black text-white">
                          Editing
                        </span>
                      )}
                      {isLive && (
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-neutral-300 text-neutral-600">
                          Live
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {new Date(v.savedAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openVersion(v)}
                      disabled={isEditing}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-neutral-100 hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-default"
                      title="Open this version in the editor"
                    >
                      {isEditing ? <Check size={12} /> : <Pencil size={12} />}
                      {isEditing ? "Open" : "Open"}
                    </button>
                    <button
                      onClick={() => makeLive(v)}
                      disabled={isLive && !isEditing}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-default"
                      title="Publish to /resume"
                    >
                      <Send size={12} /> {isLive ? "Live" : "Make live"}
                    </button>
                    <button
                      onClick={() => renameVersion(v)}
                      className="p-1.5 text-neutral-300 hover:text-black transition-colors"
                      title="Rename version"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteVersion(v)}
                      className="p-1.5 text-neutral-300 hover:text-red-500 transition-colors"
                      title="Delete version"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
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
          {headingField("summary")}
          <textarea
            className={`${fieldCls} min-h-[110px] resize-y leading-relaxed`}
            value={data.summary}
            onChange={(e) => set("summary", e.target.value)}
          />
        </fieldset>

        {/* Experience */}
        <fieldset className="space-y-4">
          {headingField("experience")}
          <div className="flex items-center justify-end mb-1">
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
          {headingField("education")}
          <div className="flex items-center justify-end mb-1">
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
          {headingField("certifications")}
          <div className="flex items-center justify-end mb-1">
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
          {headingField("skills")}
          <div className="flex items-center justify-end mb-1">
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

        {/* Custom sections (user-added) */}
        <fieldset className="space-y-4 border-t border-neutral-200 pt-8">
          <div className="flex items-center justify-between mb-1">
            <div>
              <legend className="text-sm font-bold tracking-tight">Custom sections</legend>
              <p className="text-[11px] text-neutral-400 mt-1 max-w-md leading-relaxed">
                Add your own sections (e.g. Projects, Awards, Languages). They
                appear after the ones above, in the order shown here.
              </p>
            </div>
            <button
              onClick={addCustomSection}
              className="flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:underline shrink-0"
            >
              <Plus size={14} /> Add section
            </button>
          </div>

          {customSections.map((sec, i) => (
            <div
              key={sec.id}
              className="bg-white rounded-2xl p-5 border border-neutral-100 space-y-4"
            >
              {/* section toolbar */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Section #{i + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveCustom(i, -1)}
                    disabled={i === 0}
                    className="p-1.5 text-neutral-300 hover:text-black transition-colors disabled:opacity-30 disabled:cursor-default"
                    title="Move up"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => moveCustom(i, 1)}
                    disabled={i === customSections.length - 1}
                    className="p-1.5 text-neutral-300 hover:text-black transition-colors disabled:opacity-30 disabled:cursor-default"
                    title="Move down"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    onClick={() => setCustom(customSections.filter((_, k) => k !== i))}
                    className="p-1.5 text-neutral-300 hover:text-red-500 transition-colors"
                    title="Delete section"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3">
                <div>
                  <label className={labelCls}>Section heading</label>
                  <input
                    className={`${fieldCls} font-bold`}
                    placeholder="e.g. Selected Projects"
                    value={sec.heading}
                    onChange={(e) => updateCustom(i, { heading: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls}>Layout</label>
                  <select
                    className={fieldCls}
                    value={sec.layout}
                    onChange={(e) =>
                      updateCustom(i, {
                        layout: e.target.value as ResumeSectionLayout,
                      })
                    }
                  >
                    <option value="text">Paragraph</option>
                    <option value="entries">Entries (title + bullets)</option>
                    <option value="list">List (label: items)</option>
                  </select>
                </div>
              </div>

              {/* layout: text */}
              {sec.layout === "text" && (
                <div>
                  <label className={labelCls}>Body text</label>
                  <textarea
                    className={`${fieldCls} min-h-[90px] resize-y leading-relaxed`}
                    placeholder="Write a paragraph…"
                    value={sec.body}
                    onChange={(e) => updateCustom(i, { body: e.target.value })}
                  />
                </div>
              )}

              {/* layout: entries */}
              {sec.layout === "entries" && (
                <div className="space-y-3">
                  {sec.entries.map((e, ei) => (
                    <div
                      key={ei}
                      className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                          Entry #{ei + 1}
                        </span>
                        <button
                          onClick={() =>
                            updateCustom(i, {
                              entries: sec.entries.filter((_, k) => k !== ei),
                            })
                          }
                          className="text-neutral-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          className={fieldCls}
                          placeholder="Title"
                          value={e.title}
                          onChange={(ev) => {
                            const entries = [...sec.entries];
                            entries[ei] = { ...e, title: ev.target.value };
                            updateCustom(i, { entries });
                          }}
                        />
                        <input
                          className={fieldCls}
                          placeholder="Subtitle (optional)"
                          value={e.subtitle}
                          onChange={(ev) => {
                            const entries = [...sec.entries];
                            entries[ei] = { ...e, subtitle: ev.target.value };
                            updateCustom(i, { entries });
                          }}
                        />
                        <input
                          className={fieldCls}
                          placeholder="Date range (optional)"
                          value={e.dateRange}
                          onChange={(ev) => {
                            const entries = [...sec.entries];
                            entries[ei] = { ...e, dateRange: ev.target.value };
                            updateCustom(i, { entries });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        {e.bullets.map((b, bi) => (
                          <div key={bi} className="flex gap-2 items-start">
                            <textarea
                              className={`${fieldCls} min-h-[48px] resize-y`}
                              placeholder={`Bullet ${bi + 1}`}
                              value={b}
                              onChange={(ev) => {
                                const entries = [...sec.entries];
                                const bullets = [...e.bullets];
                                bullets[bi] = ev.target.value;
                                entries[ei] = { ...e, bullets };
                                updateCustom(i, { entries });
                              }}
                            />
                            <button
                              onClick={() => {
                                const entries = [...sec.entries];
                                entries[ei] = {
                                  ...e,
                                  bullets: e.bullets.filter((_, k) => k !== bi),
                                };
                                updateCustom(i, { entries });
                              }}
                              className="text-neutral-300 hover:text-red-500 transition-colors mt-2"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const entries = [...sec.entries];
                            entries[ei] = { ...e, bullets: [...e.bullets, ""] };
                            updateCustom(i, { entries });
                          }}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 hover:text-black"
                        >
                          <Plus size={12} /> Add bullet
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      updateCustom(i, {
                        entries: [
                          ...sec.entries,
                          { title: "", subtitle: "", dateRange: "", bullets: [""] },
                        ],
                      })
                    }
                    className="flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:underline"
                  >
                    <Plus size={14} /> Add entry
                  </button>
                </div>
              )}

              {/* layout: list */}
              {sec.layout === "list" && (
                <div className="space-y-3">
                  {sec.items.map((s, si) => (
                    <div
                      key={si}
                      className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3 items-start"
                    >
                      <input
                        className={fieldCls}
                        placeholder="Label (optional)"
                        value={s.label}
                        onChange={(ev) => {
                          const items = [...sec.items];
                          items[si] = { ...s, label: ev.target.value };
                          updateCustom(i, { items });
                        }}
                      />
                      <input
                        className={fieldCls}
                        placeholder="Items / description"
                        value={s.items}
                        onChange={(ev) => {
                          const items = [...sec.items];
                          items[si] = { ...s, items: ev.target.value };
                          updateCustom(i, { items });
                        }}
                      />
                      <button
                        onClick={() =>
                          updateCustom(i, {
                            items: sec.items.filter((_, k) => k !== si),
                          })
                        }
                        className="text-neutral-300 hover:text-red-500 transition-colors mt-2.5"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      updateCustom(i, {
                        items: [...sec.items, { label: "", items: "" }],
                      })
                    }
                    className="flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:underline"
                  >
                    <Plus size={14} /> Add row
                  </button>
                </div>
              )}
            </div>
          ))}
        </fieldset>
      </div>
    </motion.div>
  );
}
