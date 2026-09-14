import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff, Loader2, Save, PanelsTopLeft } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useToast } from "./ToastProvider";
import {
  NAV_PAGES,
  DEFAULT_SITE,
  isPageVisible,
  savePageContent,
} from "@/lib/content";

// Small admin panel to show/hide top-level pages in the navbar.
// Reads/writes the `pageVisibility` map on settings/site.
export default function PageVisibilityEditor() {
  const { toast } = useToast();
  const [vis, setVis] = useState<Record<string, boolean>>(
    DEFAULT_SITE.pageVisibility || {}
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "site"));
        const data = snap.exists() ? (snap.data() as any) : {};
        setVis({
          ...(DEFAULT_SITE.pageVisibility || {}),
          ...(data.pageVisibility || {}),
        });
      } catch (e) {
        console.error("Failed to load page visibility:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (key: string) => {
    setVis((v) => ({ ...v, [key]: !isPageVisible(v, key) }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePageContent("site", { pageVisibility: vis });
      setDirty(false);
      toast("Navigation visibility saved.", "success");
    } catch (e) {
      console.error("Failed to save page visibility:", e);
      toast("Failed to save. Make sure you're authorized.", "error");
    } finally {
      setSaving(false);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-black text-white rounded-[1.5rem] flex items-center justify-center shadow-xl">
            <PanelsTopLeft size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Navigation</h3>
            <p className="text-neutral-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">
              Show or hide pages in the menu
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="flex items-center gap-2 px-7 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-lg disabled:opacity-40"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            <Save size={14} />
          )}
          {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
        </button>
      </div>

      <p className="text-[13px] text-neutral-500 mb-6 max-w-xl leading-relaxed">
        Hidden pages are removed from the navbar. The page still works if someone
        opens its direct link — this only controls what appears in the menu.
      </p>

      <div className="max-w-xl space-y-3">
        {NAV_PAGES.map((page) => {
          const on = isPageVisible(vis, page.key);
          return (
            <div
              key={page.key}
              className="flex items-center justify-between gap-4 bg-white rounded-2xl border border-neutral-100 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-black">{page.label}</p>
                <p className="text-[11px] text-neutral-400 truncate">{page.path}</p>
              </div>
              <button
                onClick={() => toggle(page.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-colors shrink-0 ${
                  on
                    ? "bg-brand-teal text-white hover:bg-brand-teal/80"
                    : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                }`}
                title={on ? "Visible — click to hide" : "Hidden — click to show"}
              >
                {on ? <Eye size={14} /> : <EyeOff size={14} />}
                {on ? "Visible" : "Hidden"}
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
