import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ref,
  listAll,
  getDownloadURL,
  deleteObject,
  getMetadata,
} from "firebase/storage";
import { storage } from "@/firebase";
import {
  Loader2,
  Trash2,
  Copy,
  RefreshCw,
  ImageOff,
  Check,
} from "lucide-react";
import { useToast } from "./ToastProvider";
import { Project } from "./types";

// A5: browse images uploaded to Firebase Storage and delete orphaned files.
// Uploads live under projects/, projects/sections/ and projects/subsections/.

interface MediaItem {
  fullPath: string;
  name: string;
  url: string;
  size: number;
  used: boolean; // referenced by at least one project?
}

const FOLDERS = ["projects", "projects/sections", "projects/subsections"];

// Collect every image URL currently referenced across all projects so we can
// flag files that are safe to delete.
function collectUsedUrls(projects: Project[]): Set<string> {
  const used = new Set<string>();
  const add = (u?: string) => {
    if (u) used.add(u.split("?")[0]);
  };
  projects.forEach((p) => {
    add(p.image);
    Object.values(p.subSections || {}).forEach((blocks) =>
      blocks.forEach((b) => {
        add(b.image);
        (b.carouselImages || []).forEach(add);
      })
    );
  });
  return used;
}

export default function MediaManager({ projects }: { projects: Project[] }) {
  const { toast } = useToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const usedUrls = collectUsedUrls(projects);
      const collected: MediaItem[] = [];

      for (const folder of FOLDERS) {
        try {
          const res = await listAll(ref(storage, folder));
          for (const itemRef of res.items) {
            const [url, meta] = await Promise.all([
              getDownloadURL(itemRef),
              getMetadata(itemRef).catch(() => ({ size: 0 } as any)),
            ]);
            collected.push({
              fullPath: itemRef.fullPath,
              name: itemRef.name,
              url,
              size: meta.size || 0,
              used: usedUrls.has(url.split("?")[0]),
            });
          }
        } catch {
          // A missing folder simply lists nothing; keep scanning the rest.
        }
      }

      collected.sort((a, b) => Number(a.used) - Number(b.used));
      setItems(collected);
    } catch (err: any) {
      console.error("Media list failed:", err);
      setError(
        "Couldn't list storage files. Your Storage security rules may not allow listing the projects/ folder for admins."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied(null), 1500);
      toast("Image URL copied to clipboard.", "success");
    } catch {
      toast("Couldn't copy to clipboard.", "error");
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (
      !window.confirm(
        item.used
          ? `"${item.name}" is still used by a project. Delete anyway? The project image will break.`
          : `Delete "${item.name}"? This cannot be undone.`
      )
    )
      return;
    setBusy(item.fullPath);
    try {
      await deleteObject(ref(storage, item.fullPath));
      setItems((prev) => prev.filter((i) => i.fullPath !== item.fullPath));
      toast("File deleted.", "success");
    } catch (err) {
      console.error("Delete failed:", err);
      toast("Failed to delete file. Check your permissions.", "error");
    } finally {
      setBusy(null);
    }
  };

  const orphanCount = items.filter((i) => !i.used).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-neutral-50 rounded-[2.5rem] p-8 md:p-12 border border-neutral-100"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Media Library</h3>
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">
            {loading
              ? "Scanning storage…"
              : `${items.length} files • ${orphanCount} unused`}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-neutral-200 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
          Refresh
        </button>
      </div>

      {error ? (
        <div className="py-16 text-center">
          <ImageOff size={32} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-sm text-neutral-500 max-w-md mx-auto">{error}</p>
        </div>
      ) : loading ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-neutral-300" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-24 text-center text-neutral-400 text-xs font-bold uppercase tracking-widest">
          No uploaded files found
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.fullPath}
              className="group bg-white rounded-2xl border border-neutral-100 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square bg-neutral-100 relative overflow-hidden">
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <span
                  className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    item.used
                      ? "bg-brand-teal/90 text-white"
                      : "bg-amber-400/90 text-black"
                  }`}
                >
                  {item.used ? "In use" : "Unused"}
                </span>
              </div>
              <div className="p-3">
                <p className="text-[11px] font-medium text-neutral-600 truncate mb-2" title={item.name}>
                  {item.name}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(item.url)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[10px] font-bold uppercase tracking-widest transition-colors"
                    title="Copy URL"
                  >
                    {copied === item.url ? (
                      <Check size={12} />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={busy === item.fullPath}
                    className="py-2 px-3 rounded-lg bg-neutral-100 text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                    title="Delete file"
                  >
                    {busy === item.fullPath ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
