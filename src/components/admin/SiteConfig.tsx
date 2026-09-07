import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { File as FileIcon, CheckCircle2, ExternalLink, Loader2, Save } from "lucide-react";
import { useToast } from "./ToastProvider";

// Site-wide settings (currently the resume/CV link that drives the Navbar button).
export default function SiteConfig() {
  const { toast } = useToast();
  const [resumeUrl, setResumeUrl] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "site"));
        if (snap.exists()) {
          const data = snap.data() as { resumeUrl?: string };
          setResumeUrl(data.resumeUrl || "");
          setManualUrl(data.resumeUrl || "");
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "settings", "site"),
        { resumeUrl: manualUrl.trim() },
        { merge: true }
      );
      setResumeUrl(manualUrl.trim());
      toast("Resume link updated across the site.", "success");
    } catch (err) {
      console.error("Error saving manual URL:", err);
      toast("Failed to save link. Make sure you're authorized.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-neutral-50 rounded-[2.5rem] p-8 md:p-12 border border-neutral-100"
    >
      <div className="max-w-xl mx-auto md:mx-0">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 bg-black text-white rounded-[2rem] flex items-center justify-center shadow-2xl">
            <FileIcon size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Resume Management</h3>
            <p className="text-neutral-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">
              Link shown on your CV button
            </p>
          </div>
        </div>

        <div className="space-y-10">
          {resumeUrl && (
            <div className="p-8 bg-white border border-neutral-100 rounded-[2rem] flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">
                    Active CV Link
                  </p>
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-black hover:text-brand-teal flex items-center gap-2 transition-colors"
                  >
                    Review Current Link <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label
                htmlFor="manual-resume-url"
                className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4 ml-2"
              >
                CV / Resume Web Link
              </label>
              <p className="text-[11px] text-neutral-400 mb-4 ml-2 leading-relaxed">
                Paste any online hosting link (Google Drive, Dropbox, OneDrive
                or a personal file link) to update your CV button across the
                site instantly.
              </p>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  id="manual-resume-url"
                  type="url"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://drive.google.com/your-resume-id"
                  className="flex-grow bg-white border border-neutral-200 rounded-2xl px-6 py-4 text-sm focus:border-black outline-none transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="px-10 py-5 bg-black text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  {saving ? "Saving…" : "Save Link"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
