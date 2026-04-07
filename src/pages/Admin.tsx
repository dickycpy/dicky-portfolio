import React, { useState, useEffect } from "react";
import { auth, storage, db } from "@/firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Edit2, Trash2, Plus, X } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  role: string;
  timeline: string;
  tools: string[];
  overview: string;
  problem: string;
  solution: string;
  impact: string;
  password?: string;
  createdAt: any;
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

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
    ['link', 'clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link'
];

export default function Admin() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form State
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
  const [password, setPassword] = useState("");

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
    });

    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubscribeProjects = onSnapshot(q, (snapshot) => {
      const fetchedProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(fetchedProjects);
    }, (error) => {
      console.error("Error fetching projects:", error);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProjects();
    };
  }, []);

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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Artificial Intelligence");
    setRole("Lead Designer");
    setTimeline("3 Months");
    setTools("Figma, React, Tailwind");
    setOverview("");
    setProblem("");
    setSolution("");
    setImpact("");
    setImageUrl("");
    setPassword("");
    setFile(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (project: Project) => {
    setTitle(project.title);
    setDescription(project.description);
    setCategory(project.category);
    setRole(project.role);
    setTimeline(project.timeline);
    setTools(project.tools.join(", "));
    setOverview(project.overview);
    setProblem(project.problem);
    setSolution(project.solution);
    setImpact(project.impact);
    setImageUrl(project.image);
    setPassword(project.password || "");
    setEditingId(project.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteDoc(doc(db, "projects", id));
      alert("Project deleted successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
    }
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

      if (file) {
        const storageRef = ref(storage, `projects/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      const projectData = {
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
        password: password.trim() || null,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "projects", editingId), projectData);
        alert("Project updated successfully!");
      } else {
        await addDoc(collection(db, "projects"), {
          ...projectData,
          createdAt: serverTimestamp(),
          authorId: user.uid,
        });
        alert("Project added successfully!");
      }
      resetForm();
    } catch (error) {
      console.error("Operation failed", error);
      alert("Operation failed. Check console for details.");
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
        <div>
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-sm opacity-40 mt-2">Manage your portfolio projects</p>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Cancel" : "New Project"}
          </button>
          <button onClick={handleLogout} className="text-sm font-medium uppercase tracking-widest opacity-40 hover:opacity-100">
            Logout
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-20"
          >
            <form onSubmit={handleUpload} className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 bg-neutral-50 p-8 md:p-12 rounded-3xl">
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold mb-4">{editingId ? "Edit Project" : "Create New Project"}</h2>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">Project Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors bg-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">Short Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors bg-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors bg-transparent"
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
                  className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors bg-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">Timeline</label>
                <input
                  type="text"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors bg-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">Tools (comma separated)</label>
                <input
                  type="text"
                  value={tools}
                  onChange={(e) => setTools(e.target.value)}
                  className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors bg-transparent"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest mb-4">Overview</label>
                <ReactQuill 
                  theme="snow" 
                  value={overview} 
                  onChange={setOverview} 
                  modules={quillModules}
                  formats={quillFormats}
                  className="bg-white rounded-xl overflow-hidden"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest mb-4">Problem Statement</label>
                <ReactQuill 
                  theme="snow" 
                  value={problem} 
                  onChange={setProblem} 
                  modules={quillModules}
                  formats={quillFormats}
                  className="bg-white rounded-xl overflow-hidden"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest mb-4">Final Solution</label>
                <ReactQuill 
                  theme="snow" 
                  value={solution} 
                  onChange={setSolution} 
                  modules={quillModules}
                  formats={quillFormats}
                  className="bg-white rounded-xl overflow-hidden"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-widest mb-4">Impact & Metrics</label>
                <ReactQuill 
                  theme="snow" 
                  value={impact} 
                  onChange={setImpact} 
                  modules={quillModules}
                  formats={quillFormats}
                  className="bg-white rounded-xl overflow-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2">Project Password (Optional)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank for public access"
                  className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors bg-transparent"
                />
              </div>
              
              <div className="md:col-span-2 space-y-8 mt-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2">Image URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/my-image.jpg"
                    className="w-full border-b border-black/10 py-4 focus:border-black outline-none transition-colors bg-transparent"
                  />
                </div>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-black/10"></span></div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-neutral-50 px-2 text-black/40">Or Upload File</span></div>
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
                
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-6 bg-black text-white rounded-2xl font-bold uppercase tracking-widest disabled:opacity-50"
                  >
                    {loading ? "Processing..." : editingId ? "Update Project" : "Create Project"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-12 py-6 border border-black/10 rounded-2xl font-bold uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6">
        <h2 className="text-2xl font-bold mb-4">Existing Projects</h2>
        {projects.length === 0 ? (
          <p className="text-black/40 italic">No projects found. Create your first one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <motion.div 
                key={project.id}
                layout
                className="group bg-neutral-50 rounded-3xl overflow-hidden border border-black/5 hover:border-black/20 transition-all"
              >
                <div className="aspect-video overflow-hidden bg-neutral-200">
                  <img 
                    src={project.image} 
                    alt={project.title} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{project.title}</h3>
                    {project.password && (
                      <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Locked</span>
                    )}
                  </div>
                  <p className="text-sm text-black/60 line-clamp-2 mb-6">{project.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">{project.category}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(project)}
                        className="p-2 hover:bg-black hover:text-white rounded-full transition-colors"
                        title="Edit Project"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(project.id)}
                        className="p-2 hover:bg-red-500 hover:text-white rounded-full transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
