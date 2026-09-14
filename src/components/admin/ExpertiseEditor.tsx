// Admin editor for the About-page "Expertise" section (settings/expertise).
// Shape: a heading + a list of groups, each with a label and skill-tag items.
// Loads → merges over DEFAULT_EXPERTISE → edits → saves.
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
import { DEFAULT_EXPERTISE, type ExpertiseGroup } from "@/lib/content";

const fieldCls =
  "w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:border-black outline-none transition-colors";
const labelCls =
  "block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2";

const emptyGroup = (): ExpertiseGroup => ({ label: "", items: [""] });

export default function ExpertiseEditor() {
  const { toast } = useToast();
  const [heading, setHeading] = useState<string>(DEFAULT_EXPERTISE.heading);
  const [groups, setGroups] = useState<ExpertiseGroup[]>(
    DEFAULT_EXPERTISE.groups
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "expertise"));
        if (alive && snap.exists()) {
          const d = snap.data() as {
            heading?: string;
            groups?: ExpertiseGroup[];
          };
          if (typeof d.heading === "string") setHeading(d.heading);
          if (Array.isArray(d.groups)) setGroups(d.groups);
        }
      } catch (e) {
        console.error("Failed to load expertise content:", e);
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

  const mutate = (fn: (list: ExpertiseGroup[]) => ExpertiseGroup[]) => {
    setGroups((list) =>
      fn(list.map((g) => ({ ...g, items: [...g.items] })))
    );
    setDirty(true);
  };

  const setHeadingValue = (value: string) => {
    setHeading(value);
    setDirty(true);
  };

  const setLabel = (i: number, value: string) =>
    mutate((list) => {
      list[i].label = value;
      return list;
    });

  const move = (i: number, dir: -1 | 1) =>
    mutate((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      [list[i], list[j]] = [list[j], list[i]];
      return list;
    });

  const addGroup = () => mutate((list) => [...list, emptyGroup()]);
  const removeGroup = (i: number) =>
    mutate((list) => list.filter((_, k) => k !== i));

  // items (skill tags)
  const setItem = (i: number, ii: number, value: string) =>
    mutate((list) => {
      list[i].items[ii] = value;
      return list;
    });
  const addItem = (i: number) =>
    mutate((list) => {
      list[i].items = [...list[i].items, ""];
      return list;
    });
  const removeItem = (i: number, ii: number) =>
    mutate((list) => {
      list[i].items = list[i].items.filter((_, k) => k !== ii);
      return list;
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      // Drop blank tags/labels so the public page stays clean.
      const cleaned = groups
        .map((g) => ({
          label: g.label.trim(),
          items: g.items.map((it) => it.trim()).filter(Boolean),
        }))
        .filter((g) => g.label || g.items.length);
      await setDoc(
        doc(db, "settings", "expertise"),
        { heading: heading.trim() || "Expertise", groups: cleaned },
        { merge: true }
      );
      setDirty(false);
      toast("Saved — the About page is updated.", "success");
    } catch (e) {
      console.error("Failed to save expertise content:", e);
      toast("Failed to save. Make sure you're authorized.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setHeading(DEFAULT_EXPERTISE.heading);
    setGroups(DEFAULT_EXPERTISE.groups.map((g) => ({ ...g, items: [...g.items] })));
    setDirty(true);
    toast("Reverted to the built-in defaults (not yet saved).", "success");
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
          <h2 className="text-2xl font-bold tracking-tight">Expertise</h2>
          <p className="text-sm text-neutral-400 mt-1">
            The grouped skill tags shown beside the career path. Changes go live
            on save.
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

      <div>
        <label className={labelCls}>Section heading</label>
        <input
          value={heading}
          onChange={(e) => setHeadingValue(e.target.value)}
          placeholder="Expertise"
          className={fieldCls}
        />
      </div>

      <div className="space-y-6">
        {groups.map((group, i) => (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-neutral-100 rounded-2xl p-5 space-y-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Group #{i + 1}
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
                  disabled={i === groups.length - 1}
                  className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-black transition-colors disabled:opacity-30"
                  title="Move down"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  onClick={() => removeGroup(i)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                  title="Remove group"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div>
              <label className={labelCls}>Group label</label>
              <input
                value={group.label}
                onChange={(e) => setLabel(i, e.target.value)}
                placeholder="UX / UI Design"
                className={fieldCls}
              />
            </div>

            <div>
              <label className={labelCls}>Skill tags</label>
              <div className="space-y-2">
                {group.items.map((item, ii) => (
                  <div key={ii} className="flex items-center gap-2">
                    <input
                      value={item}
                      onChange={(e) => setItem(i, ii, e.target.value)}
                      placeholder="User Research"
                      className={fieldCls}
                    />
                    <button
                      onClick={() => removeItem(i, ii)}
                      className="p-2.5 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-colors flex-shrink-0"
                      title="Remove tag"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addItem(i)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:underline mt-1"
                >
                  <Plus size={14} /> Add tag
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        <button
          onClick={addGroup}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-neutral-200 text-sm font-bold uppercase tracking-widest text-neutral-400 hover:border-brand-teal hover:text-brand-teal transition-colors inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add group
        </button>
      </div>
    </div>
  );
}
