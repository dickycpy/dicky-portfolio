// Generic, schema-driven editor for page CMS content (settings/<page>).
// Reused by the Home Page and About Page admin tabs. Given a page id, its
// defaults, and a field schema, it loads → merges → edits → saves, with a
// toast on success/failure. Supports text / textarea / richtext / url / list
// fields. Rich-text fields show the *teal* / **bold** / newline hint.
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "./ToastProvider";

export type FieldType = "text" | "textarea" | "richtext" | "url" | "list";

export interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  hint?: string;
  placeholder?: string;
}

interface Props {
  page: string;
  title: string;
  description?: string;
  defaults: Record<string, any>;
  schema: FieldSchema[];
}

const fieldCls =
  "w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:border-black outline-none transition-colors";
const labelCls =
  "block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2";

const RICHTEXT_HINT =
  "Markup: *teal* for accent, **bold** for bold black, new line for a line break.";

export default function ContentEditor({
  page,
  title,
  description,
  defaults,
  schema,
}: Props) {
  const { toast } = useToast();
  const [data, setData] = useState<Record<string, any>>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", page));
        if (alive && snap.exists()) {
          setData({ ...defaults, ...(snap.data() as Record<string, any>) });
        }
      } catch (e) {
        console.error(`Failed to load content for "${page}":`, e);
        toast("Failed to load saved content.", "error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const set = (key: string, value: any) => {
    setData((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  const setListItem = (key: string, idx: number, value: string) => {
    const list = [...(data[key] || [])];
    list[idx] = value;
    set(key, list);
  };

  const addListItem = (key: string) => set(key, [...(data[key] || []), ""]);

  const removeListItem = (key: string, idx: number) => {
    const list = [...(data[key] || [])];
    list.splice(idx, 1);
    set(key, list);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", page), data, { merge: true });
      setDirty(false);
      toast("Saved — the live site is updated.", "success");
    } catch (e) {
      console.error(`Failed to save content for "${page}":`, e);
      toast("Failed to save. Make sure you're authorized.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setData(defaults);
    setDirty(true);
    toast("Reverted fields to the built-in defaults (not yet saved).", "success");
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
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm text-neutral-400 mt-1">{description}</p>
          )}
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
        {schema.map((f) => (
          <motion.div
            key={f.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-neutral-100 rounded-2xl p-5"
          >
            <label className={labelCls}>{f.label}</label>

            {f.type === "list" ? (
              <div className="space-y-2">
                {(data[f.key] || []).map((item: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      value={item}
                      onChange={(e) => setListItem(f.key, idx, e.target.value)}
                      placeholder={f.placeholder}
                      className={fieldCls}
                    />
                    <button
                      onClick={() => removeListItem(f.key, idx)}
                      className="p-2.5 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-colors flex-shrink-0"
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addListItem(f.key)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:underline mt-1"
                >
                  <Plus size={14} /> Add item
                </button>
              </div>
            ) : f.type === "textarea" || f.type === "richtext" ? (
              <textarea
                value={data[f.key] || ""}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                rows={f.type === "richtext" ? 3 : 4}
                className={`${fieldCls} resize-y leading-relaxed`}
              />
            ) : (
              <input
                type={f.type === "url" ? "url" : "text"}
                value={data[f.key] || ""}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className={fieldCls}
              />
            )}

            {(f.hint || f.type === "richtext") && (
              <p className="text-[11px] text-neutral-400 mt-2 leading-snug">
                {f.type === "richtext" ? `${RICHTEXT_HINT} ` : ""}
                {f.hint}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
