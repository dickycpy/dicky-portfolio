// Admin editor for the About-page "Career path" accordion (settings/career).
// Handles the nested shape: a list of roles, each with bullets and a client
// list (name + logo). Loads → merges over DEFAULT_CAREER → edits → saves.
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useToast } from "./ToastProvider";
import {
  DEFAULT_CAREER,
  type CareerCheckpoint,
  type CareerClient,
} from "@/lib/content";

const fieldCls =
  "w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:border-black outline-none transition-colors";
const labelCls =
  "block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2";

const emptyCheckpoint = (): CareerCheckpoint => ({
  periodSub: "",
  title: "",
  company: "",
  location: "",
  industry: "",
  handle: "",
  logo: "",
  bullets: [""],
  clients: [],
  caseStudyTitle: "",
  caseStudyLink: "",
});

export default function CareerEditor() {
  const { toast } = useToast();
  const [journey, setJourney] = useState<CareerCheckpoint[]>(
    DEFAULT_CAREER.journey
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "career"));
        if (alive && snap.exists()) {
          const d = snap.data() as { journey?: CareerCheckpoint[] };
          if (Array.isArray(d.journey)) setJourney(d.journey);
        }
      } catch (e) {
        console.error("Failed to load career content:", e);
        toast("Failed to load saved content.", "error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mutate = (fn: (list: CareerCheckpoint[]) => CareerCheckpoint[]) => {
    setJourney((list) => fn(list.map((c) => ({ ...c }))));
    setDirty(true);
  };

  const setField = (i: number, key: keyof CareerCheckpoint, value: any) =>
    mutate((list) => {
      (list[i] as any)[key] = value;
      return list;
    });

  const move = (i: number, dir: -1 | 1) =>
    mutate((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      [list[i], list[j]] = [list[j], list[i]];
      return list;
    });

  const addRole = () => mutate((list) => [...list, emptyCheckpoint()]);
  const removeRole = (i: number) =>
    mutate((list) => list.filter((_, k) => k !== i));

  // bullets
  const setBullet = (i: number, bi: number, value: string) =>
    mutate((list) => {
      list[i].bullets = [...list[i].bullets];
      list[i].bullets[bi] = value;
      return list;
    });
  const addBullet = (i: number) =>
    mutate((list) => {
      list[i].bullets = [...list[i].bullets, ""];
      return list;
    });
  const removeBullet = (i: number, bi: number) =>
    mutate((list) => {
      list[i].bullets = list[i].bullets.filter((_, k) => k !== bi);
      return list;
    });

  // clients
  const setClient = (
    i: number,
    ci: number,
    key: keyof CareerClient,
    value: string
  ) =>
    mutate((list) => {
      list[i].clients = list[i].clients.map((c) => ({ ...c }));
      list[i].clients[ci][key] = value;
      return list;
    });
  const addClient = (i: number) =>
    mutate((list) => {
      list[i].clients = [...list[i].clients, { name: "", logo: "" }];
      return list;
    });
  const removeClient = (i: number, ci: number) =>
    mutate((list) => {
      list[i].clients = list[i].clients.filter((_, k) => k !== ci);
      return list;
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "career"), { journey }, { merge: true });
      setDirty(false);
      toast("Saved — the About page is updated.", "success");
    } catch (e) {
      console.error("Failed to save career content:", e);
      toast("Failed to save. Make sure you're authorized.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setJourney(DEFAULT_CAREER.journey.map((c) => ({ ...c })));
    setDirty(true);
    toast("Reverted to the built-in default roles (not yet saved).", "success");
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center text-neutral-400">
        <Loader2 className="animate-spin mr-2" size={18} /> Loading content…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Career Path</h2>
          <p className="text-sm text-neutral-400 mt-1">
            The expandable role list on the About page. Changes go live on save.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest text-neutral-500 border border-neutral-200 hover:border-neutral-400 transition-colors"
          >
            Reset to default
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest text-white bg-black hover:bg-brand-teal transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {journey.map((role, i) => (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-neutral-100 rounded-2xl p-5 space-y-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Role #{i + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-black transition-colors disabled:opacity-30"
                  title="Move up"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === journey.length - 1}
                  className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-black transition-colors disabled:opacity-30"
                  title="Move down"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  onClick={() => removeRole(i)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                  title="Remove role"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Period</label>
                <input
                  value={role.periodSub}
                  onChange={(e) => setField(i, "periodSub", e.target.value)}
                  placeholder="Dec 2025 – Present"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Title</label>
                <input
                  value={role.title}
                  onChange={(e) => setField(i, "title", e.target.value)}
                  placeholder="Business Analyst"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Company</label>
                <input
                  value={role.company}
                  onChange={(e) => setField(i, "company", e.target.value)}
                  placeholder="IBM Consulting · IBM iX"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Location</label>
                <input
                  value={role.location}
                  onChange={(e) => setField(i, "location", e.target.value)}
                  placeholder="Hong Kong"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Industry</label>
                <input
                  value={role.industry}
                  onChange={(e) => setField(i, "industry", e.target.value)}
                  placeholder="Consulting / AI Products"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Handle (optional)</label>
                <input
                  value={role.handle || ""}
                  onChange={(e) => setField(i, "handle", e.target.value)}
                  placeholder="creatogether.app"
                  className={fieldCls}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Company logo URL</label>
                <input
                  value={role.logo}
                  onChange={(e) => setField(i, "logo", e.target.value)}
                  placeholder="https://…"
                  className={fieldCls}
                />
              </div>
            </div>

            {/* Bullets */}
            <div>
              <label className={labelCls}>Highlights</label>
              <div className="space-y-2">
                {role.bullets.map((b, bi) => (
                  <div key={bi} className="flex items-start gap-2">
                    <textarea
                      value={b}
                      onChange={(e) => setBullet(i, bi, e.target.value)}
                      rows={2}
                      className={`${fieldCls} resize-y leading-relaxed`}
                    />
                    <button
                      onClick={() => removeBullet(i, bi)}
                      className="p-2.5 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-colors flex-shrink-0"
                      title="Remove highlight"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addBullet(i)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:underline mt-1"
                >
                  <Plus size={14} /> Add highlight
                </button>
              </div>
            </div>

            {/* Clients */}
            <div>
              <label className={labelCls}>Clients</label>
              <div className="space-y-2">
                {role.clients.map((c, ci) => (
                  <div key={ci} className="flex items-center gap-2">
                    <input
                      value={c.name}
                      onChange={(e) => setClient(i, ci, "name", e.target.value)}
                      placeholder="Client name"
                      className={`${fieldCls} md:w-1/3`}
                    />
                    <input
                      value={c.logo}
                      onChange={(e) => setClient(i, ci, "logo", e.target.value)}
                      placeholder="Logo URL"
                      className={fieldCls}
                    />
                    <button
                      onClick={() => removeClient(i, ci)}
                      className="p-2.5 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-colors flex-shrink-0"
                      title="Remove client"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addClient(i)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:underline mt-1"
                >
                  <Plus size={14} /> Add client
                </button>
              </div>
            </div>

            {/* Case study */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Case study label (optional)</label>
                <input
                  value={role.caseStudyTitle || ""}
                  onChange={(e) => setField(i, "caseStudyTitle", e.target.value)}
                  placeholder="Gen-AI digital racing"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>Case study link (optional)</label>
                <input
                  value={role.caseStudyLink || ""}
                  onChange={(e) => setField(i, "caseStudyLink", e.target.value)}
                  placeholder="/projects/ai-ops"
                  className={fieldCls}
                />
              </div>
            </div>
          </motion.div>
        ))}

        <button
          onClick={addRole}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-neutral-200 text-sm font-bold uppercase tracking-widest text-neutral-400 hover:border-brand-teal hover:text-brand-teal transition-colors inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add role
        </button>
      </div>
    </div>
  );
}
