// Client-side image downscale + re-encode, run before uploading to Firebase
// Storage. Keeps download egress within the free tier and makes the public
// portfolio load faster. Falls back to the original File on any error or for
// formats we don't want to rasterize (SVG/GIF).

const MAX_DIMENSION = 1600; // longest edge, in px
const QUALITY = 0.82; // webp quality

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  // Don't rasterize vectors or animated GIFs — we'd lose scalability/animation.
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const largestEdge = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, MAX_DIMENSION / largestEdge);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    // Free the decoded bitmap where supported.
    if (typeof bitmap.close === "function") bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALITY)
    );

    // If encoding failed or produced a bigger file (already-tiny images), keep
    // the original so we never make things worse.
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } catch {
    return file;
  }
}
