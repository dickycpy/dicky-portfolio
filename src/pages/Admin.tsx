import React, { useState } from "react";
import { auth, storage, db } from "@/firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { motion } from "motion/react";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function Admin() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Artificial Intelligence");
  const [role, setRole] = useState("Lead Designer");
  const [timeline, setTimeline] = useState("3 Months");
  const [tools, setTools] = useState("Figma, React, Tailwind");
  const [overview, setOverview] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [impact, setImpact] = useState("");

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setUser(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!file && !imageUrl) {
      alert("Please provide an Image URL or select a file to upload.");
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = imageUrl;

      // Only upload if a file is selected and no direct URL is provided
      if (file && !finalImageUrl) {
        const storageRef = ref(storage, `projects/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      const path = "projects";
      try {
        await addDoc(collection(db, path), {
          title,
          description,
          category,
          image: finalImageUrl,
          role,
          timeline,
          tools: tools.split(",").map(t => t.trim()),
          overview,
          problem,
          solution,
          impact,
          createdAt: serverTimestamp(),
          authorId: user.uid,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }

      alert("Project uploaded successfully!");
      setTitle("");
      setDescription("");
      setFile(null);
      setImageUrl("");
      setOverview("");
      setProblem("");
      setSolution("");
      setImpact("");
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="pt-40 px-6 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-8">Admin Access</h1>
        <button
          onClick={handleLogin}
          className="px-8 py-4 bg-black text-white rounded-full font-medium uppercase tracking-widest"
        >
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="pt-40 px-6 md:px-12 lg:px-24 pb-40">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <button onClick={handleLogout} className="text-sm font-medium uppercase tracking-widest opacity-40 hover:opacity-100">
          Logout
        </button>
      </div>

      <form onSubmit={handleUpload} className="max-w-xl space-y-8">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Project Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Short Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors"
            >
              <option>Artificial Intelligence</option>
              <option>Digital Marketing</option>
              <option>Interactive Experience</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2">Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2">Timeline</label>
            <input
              type="text"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2">Tools (comma separated)</label>
            <input
              type="text"
              value={tools}
              onChange={(e) => setTools(e.target.value)}
              className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Overview</label>
          <textarea
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors min-h-[100px] resize-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Problem Statement</label>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors min-h-[100px] resize-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Final Solution</label>
          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors min-h-[100px] resize-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Impact & Metrics</label>
          <textarea
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
            className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors min-h-[100px] resize-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Image URL (Recommended for Free Plan)</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/my-image.jpg"
            className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors"
          />
          <p className="text-[10px] text-black/40 mt-2 uppercase tracking-widest">
            Upload your image to a free host like PostImages.org and paste the direct link here.
          </p>
        </div>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-black/10"></span></div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-white px-2 text-black/40">Or Upload File</span></div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">Screenshot</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full py-4"
            accept="image/*"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-6 bg-black text-white rounded-2xl font-bold uppercase tracking-widest disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Project"}
        </button>
      </form>
    </div>
  );
}
