// Generic, schema-driven editor for page CMS content (settings/<page>).
// Reused by the Home Page and About Page admin tabs. Given a page id, its
// defaults, and a field schema, it loads → merges → edits → saves, with a
// toast on success/failure. Supports text / textarea / richtext / url / list
// fields. Rich-text fields show the *teal* / **bold** / newline hint.
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable as DraggableBase,
  DropResult,
} from "@hello-pangea/dnd";
// No @types/react here, so the strictly-typed Draggable rejects the required
// `key` prop. Alias to `any` (same workaround as ProjectList).
const Draggable: any = DraggableBase;
import { useToast } from "./ToastProvider";
import ImageUploadField from "./ImageUploadField";
import { SOCIAL_PLATFORMS, SocialLink } from "@/lib/content";
import { markDirty } from "@/lib/unsavedGuard";

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "url"
  | "list"
  | "image"
  | "imageList"
  | "socials";

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

  // Register this editor's dirty state with the app-wide guard so the admin
  // shell can warn before switching tabs or leaving the page. A stable id lets
  // pages with two editors (e.g. Home + Logo wall) track independently.
  const editorId = `${page}:${title}`;
  useEffect(() => {
    markDirty(editorId, dirty);
    return () => markDirty(editorId, false);
  }, [editorId, dirty]);

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

  // Reorder any list-like field (list / imageList / socials) via drag-and-drop.
  const onListDragEnd = (key: string) => (result: DropResult) => {
    if (!result.destination) return;
    const list = [...(data[key] || [])];
    const [moved] = list.splice(result.source.index, 1);
    list.splice(result.destination.index, 0, moved);
    set(key, list);
  };

  const removeListItem = (key: string, idx: number) => {
    const list = [...(data[key] || [])];
    list.splice(idx, 1);
    set(key, list);
  };

  // Object-list helpers (used by the `socials` field: {platform, url}[]).
  const setSocialItem = (
    key: string,
    idx: number,
    patch: Partial<SocialLink>
  ) => {
    const list: SocialLink[] = [...(data[key] || [])];
    list[idx] = { ...list[idx], ...patch };
    set(key, list);
  };

  const addSocialItem = (key: string) =>
    set(key, [...(data[key] || []), { platform: "linkedin", url: "" }]);

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

            {f.type === "image" ? (
              <ImageUploadField
                value={data[f.key] || ""}
                onChange={(url) => set(f.key, url)}
                placeholder={f.placeholder}
              />
            ) : f.type === "imageList" ? (
              <div className="space-y-3">
                <DragDropContext onDragEnd={onListDragEnd(f.key)}>
                  <Droppable droppableId={`imageList-${f.key}`}>
                    {(dp: any) => (
                      <div
                        ref={dp.innerRef}
                        {...dp.droppableProps}
                        className="space-y-3"
                      >
                        {(data[f.key] || []).map((item: string, idx: number) => (
                          <Draggable
                            key={idx}
                            draggableId={`${f.key}-${idx}`}
                            index={idx}
                          >
                            {(drag: any) => (
                              <div
                                ref={drag.innerRef}
                                {...drag.draggableProps}
                                className="flex items-start gap-2 bg-white"
                              >
                                <button
                                  type="button"
                                  {...drag.dragHandleProps}
                                  className="p-2.5 mt-1 rounded-xl text-neutral-300 hover:text-neutral-600 cursor-grab active:cursor-grabbing flex-shrink-0"
                                  title="Drag to reorder"
                                >
                                  <GripVertical size={16} />
                                </button>
                                <div className="flex-1 min-w-0">
                                  <ImageUploadField
                                    value={item}
                                    onChange={(url) =>
                                      setListItem(f.key, idx, url)
                                    }
                                    placeholder={f.placeholder}
                                  />
                                </div>
                                <button
                                  onClick={() => removeListItem(f.key, idx)}
                                  className="p-2.5 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-colors flex-shrink-0"
                                  title="Remove"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {dp.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                <button
                  onClick={() => addListItem(f.key)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:underline mt-1"
                >
                  <Plus size={14} /> Add image
                </button>
              </div>
            ) : f.type === "socials" ? (
              <div className="space-y-3">
                <DragDropContext onDragEnd={onListDragEnd(f.key)}>
                  <Droppable droppableId={`socials-${f.key}`}>
                    {(dp: any) => (
                      <div
                        ref={dp.innerRef}
                        {...dp.droppableProps}
                        className="space-y-3"
                      >
                        {(data[f.key] || []).map(
                          (item: SocialLink, idx: number) => (
                            <Draggable
                              key={idx}
                              draggableId={`${f.key}-${idx}`}
                              index={idx}
                            >
                              {(drag: any) => (
                                <div
                                  ref={drag.innerRef}
                                  {...drag.draggableProps}
                                  className="flex items-center gap-2 bg-white"
                                >
                                  <button
                                    type="button"
                                    {...drag.dragHandleProps}
                                    className="p-2.5 rounded-xl text-neutral-300 hover:text-neutral-600 cursor-grab active:cursor-grabbing flex-shrink-0"
                                    title="Drag to reorder"
                                  >
                                    <GripVertical size={16} />
                                  </button>
                                  <select
                                    value={item.platform}
                                    onChange={(e) =>
                                      setSocialItem(f.key, idx, {
                                        platform: e.target.value,
                                      })
                                    }
                                    className={`${fieldCls} max-w-[9rem] flex-shrink-0`}
                                  >
                                    {SOCIAL_PLATFORMS.map((p) => (
                                      <option key={p.value} value={p.value}>
                                        {p.label}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    value={item.url}
                                    onChange={(e) =>
                                      setSocialItem(f.key, idx, {
                                        url: e.target.value,
                                      })
                                    }
                                    placeholder={
                                      item.platform === "email"
                                        ? "you@example.com"
                                        : "https://…"
                                    }
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
                              )}
                            </Draggable>
                          )
                        )}
                        {dp.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                <button
                  onClick={() => addSocialItem(f.key)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-teal hover:underline mt-1"
                >
                  <Plus size={14} /> Add social link
                </button>
              </div>
            ) : f.type === "list" ? (
              <div className="space-y-2">
                <DragDropContext onDragEnd={onListDragEnd(f.key)}>
                  <Droppable droppableId={`list-${f.key}`}>
                    {(dp: any) => (
                      <div
                        ref={dp.innerRef}
                        {...dp.droppableProps}
                        className="space-y-2"
                      >
                        {(data[f.key] || []).map(
                          (item: string, idx: number) => (
                            <Draggable
                              key={idx}
                              draggableId={`${f.key}-${idx}`}
                              index={idx}
                            >
                              {(drag: any) => (
                                <div
                                  ref={drag.innerRef}
                                  {...drag.draggableProps}
                                  className="flex items-center gap-2 bg-white"
                                >
                                  <button
                                    type="button"
                                    {...drag.dragHandleProps}
                                    className="p-2.5 rounded-xl text-neutral-300 hover:text-neutral-600 cursor-grab active:cursor-grabbing flex-shrink-0"
                                    title="Drag to reorder"
                                  >
                                    <GripVertical size={16} />
                                  </button>
                                  <input
                                    value={item}
                                    onChange={(e) =>
                                      setListItem(f.key, idx, e.target.value)
                                    }
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
                              )}
                            </Draggable>
                          )
                        )}
                        {dp.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
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

      {/* Pinned save bar — sticks to the bottom of the viewport while editing
          so Save is always reachable without scrolling back to the top. Only
          appears when there are unsaved changes, doubling as a reminder. */}
      {dirty && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4 z-30 mt-4"
        >
          <div className="flex items-center justify-between gap-4 bg-black text-white rounded-2xl shadow-2xl px-5 py-3">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <AlertCircle size={16} className="text-amber-400" />
              Unsaved changes
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest text-neutral-300 hover:text-white transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest text-black bg-white hover:bg-brand-teal hover:text-white transition-colors disabled:opacity-40"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
