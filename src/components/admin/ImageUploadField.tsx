// Reusable image field for the admin CMS: shows a thumbnail preview, an
// "Upload" button (compresses to WebP via compressImage, then stores in
// Firebase Storage and fills in the resulting download URL), and a URL text
// box as a fallback so external image links still work. Used by ContentEditor
// (headshot, about image, brand logos) and CareerEditor (company/client logos).
import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebase";
import { compressImage } from "@/lib/imageCompression";
import { Upload, Loader2, X } from "lucide-react";
import { useToast } from "./ToastProvider";

interface Props {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  /** Storage subfolder. Lives under the already-permitted `site/**` rule. */
  folder?: string;
}

const fieldCls =
  "w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:border-black outline-none transition-colors";

export default function ImageUploadField({
  value,
  onChange,
  placeholder,
  folder = "site/content",
}: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file); // → WebP where possible
      const safe = compressed.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storageRef = ref(storage, `${folder}/${Date.now()}_${safe}`);
      await uploadBytes(storageRef, compressed);
      const url = await getDownloadURL(storageRef);
      onChange(url);
      toast("Image uploaded (stored as WebP).", "success");
    } catch (err) {
      console.error("Image upload failed:", err);
      toast("Upload failed. Check your connection or authorization.", "error");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="w-16 h-16 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center flex-shrink-0">
        {value ? (
          <img
            src={value}
            alt=""
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-[9px] text-neutral-300 uppercase tracking-wider">
            None
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <input
          type="url"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "https://…  or upload →"}
          className={fieldCls}
        />
        <div className="flex items-center gap-3">
          <label
            className={`inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
              uploading
                ? "text-neutral-400"
                : "text-brand-teal hover:underline"
            }`}
          >
            {uploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            {uploading ? "Uploading…" : "Upload image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
              disabled={uploading}
            />
          </label>
          {value && !uploading && (
            <button
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500 transition-colors"
              title="Clear image"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
