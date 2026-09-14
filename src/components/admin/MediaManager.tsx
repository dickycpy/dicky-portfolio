import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ref,
  listAll,
  getDownloadURL,
  deleteObject,
  getMetadata,
} from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";
import { storage, db, envLabel, firestoreDbLabel } from "@/firebase";
import {
  Loader2,
  Trash2,
  Copy,
  RefreshCw,
  ImageOff,
  Check,
  FileText,
  MapPin,
} from "lucide-react";
import { useToast } from "./ToastProvider";
import { Project, CASE_STUDY_SECTIONS } from "./types";

// A5: browse every file uploaded to Firebase Storage, see exactly where each
// one is used across the site, and delete the ones nothing references.
//
// Uploads live under:
//   projects/                 — project cover images (ProjectForm)
//   projects/subsections/     — case-study section images (ProjectForm)
//   site/content/             — CMS images: headshot, about image, brand logos,
//                               career logos (ImageUploadField)
//   site/                     — misc site assets (e.g. resume PDF)

interface MediaItem {
  fullPath: string;
  name: string;
  url: string;
  size: number;
  isImage: boolean;
  usedIn: string[]; // human-readable locations that reference this file
}

// Folders scanned. listAll is NOT recursive, so each nested folder is listed
// explicitly.
const FOLDERS = [
  "projects",
  "projects/sections",
  "projects/subsections",
  "site",
  "site/content",
];

const SECTION_LABEL: Record<string, string> = Object.fromEntries(
  CASE_STUDY_SECTIONS.map((s) => [s.id, s.label.replace(/^\d+\.\s*/, "")])
);

const norm = (u?: string) => (u ? u.split("?")[0] : "");

// Build a map of storage-URL -> list of places that reference it, drawn from
// projects plus the page-content docs (Home, Site logo wall, Career logos).
function buildUsageMap(
  projects: Project[],
  home: any,
  site: any,
  career: any
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const add = (u: string | undefined, where: string) => {
    const key = norm(u);
    if (!key) return;
    const list = map.get(key) || [];
    list.push(where);
    map.set(key, list);
  };

  // Projects: cover + case-study section/subsection images.
  projects.forEach((p) => {
    const title = p.title || "Untitled project";
    add(p.image, `Project: ${title} · cover`);
    Object.entries(p.subSections || {}).forEach(([sectionId, blocks]) => {
      const label = SECTION_LABEL[sectionId] || sectionId;
      blocks.forEach((b) => {
        add(b.image, `Project: ${title} · ${label}`);
        (b.carouselImages || []).forEach((c) =>
          add(c, `Project: ${title} · ${label} (carousel)`)
        );
      });
    });
  });

  // Home page.
  if (home) {
    add(home.headshot, "Home · headshot");
    add(home.aboutImage, "Home · about image");
  }

  // Site-wide logo wall.
  if (site && Array.isArray(site.logos)) {
    site.logos.forEach((logo: string, i: number) =>
      add(logo, `Logo wall · logo ${i + 1}`)
    );
  }

  // Career path (About page) — company + client logos.
  if (career && Array.isArray(career.journey)) {
    career.journey.forEach((role: any) => {
      const co = role.company || role.title || "role";
      add(role.logo, `Career · ${co} logo`);
      (role.clients || []).forEach((c: any) =>
        add(c.logo, `Career · ${co} · client ${c.name || ""}`.trim())
      );
    });
  }

  return map;
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
      // Pull page-content docs so we can flag site/career/home images too.
      const [homeSnap, siteSnap, careerSnap] = await Promise.all([
        getDoc(doc(db, "settings", "home")).catch(() => null),
        getDoc(doc(db, "settings", "site")).catch(() => null),
        getDoc(doc(db, "settings", "career")).catch(() => null),
      ]);
      const usage = buildUsageMap(
        projects,
        homeSnap?.exists() ? homeSnap.data() : null,
        siteSnap?.exists() ? siteSnap.data() : null,
        careerSnap?.exists() ? careerSnap.data() : null
      );

      const collected: MediaItem[] = [];
      for (const folder of FOLDERS) {
        try {
          const res = await listAll(ref(storage, folder));
          for (const itemRef of res.items) {
            const [url, meta] = await Promise.all([
              getDownloadURL(itemRef),
              getMetadata(itemRef).catch(
                () => ({ size: 0, contentType: "" } as any)
              ),
            ]);
            collected.push({
              fullPath: itemRef.fullPath,
              name: itemRef.name,
              url,
              size: meta.size || 0,
              isImage: (meta.contentType || "").startsWith("image/"),
              usedIn: usage.get(norm(url)) || [],
            });
          }
        } catch {
          // A missing folder simply lists nothing; keep scanning the rest.
        }
      }

      // Unused first (so orphans are easy to spot and clean up).
      collected.sort((a, b) => a.usedIn.length - b.usedIn.length);
      setItems(collected);
    } catch (err: any) {
      console.error("Media list failed:", err);
      setError(
        "Couldn't list storage files. Your Storage security rules may not allow listing the projects/ or site/ folders for admins."
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
    const used = item.usedIn.length > 0;
    if (
      !window.confirm(
        used
          ? `"${item.name}" is still used in ${item.usedIn.length} place(s):\n\n${item.usedIn.join(
              "\n"
            )}\n\nDelete anyway? Those images will break.`
          : `Delete "${item.name}"? This cannot be undone.`
      )
    )
      return;
    setBusy(item.fullPath);
    try {
      await deleteObject(ref(storage, item.fullPath));
      setItems((prev) => prev.filter((i) => i.fullPath !== item.fullPath));
      toast("File deleted.", "success");
    } catch (err: any) {
      console.error("Delete failed:", err);
      toast(
        err?.code === "storage/unauthorized"
          ? "Delete denied by Storage rules. Publish the updated storage.rules in the Firebase console."
          : "Failed to delete file. Check your permissions.",
        "error"
      );
    } finally {
      setBusy(null);
    }
  };

  const orphanCount = items.filter((i) => i.usedIn.length === 0).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-neutral-50 rounded-[2.5rem] p-8 md:p-12 border border-neutral-100"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold tracking-tight">Media Library</h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                envLabel === "PROD"
                  ? "bg-black text-white"
                  : "bg-amber-400 text-black"
              }`}
              title={`Firestore database: ${firestoreDbLabel}`}
            >
              {envLabel}
            </span>
          </div>
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
          {items.map((item) => {
            const used = item.usedIn.length > 0;
            return (
              <div
                key={item.fullPath}
                className="group bg-white rounded-2xl border border-neutral-100 overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="aspect-square bg-neutral-100 relative overflow-hidden flex items-center justify-center">
                  {item.isImage ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-neutral-400 gap-2">
                      <FileText size={28} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">
                        File
                      </span>
                    </div>
                  )}
                  <span
                    className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      used
                        ? "bg-brand-teal/90 text-white"
                        : "bg-amber-400/90 text-black"
                    }`}
                  >
                    {used ? "In use" : "Unused"}
                  </span>
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <p
                    className="text-[11px] font-medium text-neutral-600 truncate mb-1"
                    title={item.name}
                  >
                    {item.name}
                  </p>
                  <p className="text-[9px] text-neutral-300 truncate mb-2">
                    {item.fullPath.replace("/" + item.name, "") || "/"}
                  </p>

                  {used ? (
                    <div className="mb-3 space-y-1">
                      {item.usedIn.map((loc, i) => (
                        <p
                          key={i}
                          className="flex items-start gap-1 text-[10px] leading-tight text-neutral-500"
                          title={loc}
                        >
                          <MapPin
                            size={10}
                            className="mt-0.5 flex-shrink-0 text-brand-teal"
                          />
                          <span className="truncate">{loc}</span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mb-3 text-[10px] italic text-amber-600">
                      Not referenced anywhere — safe to delete.
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-auto">
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
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
