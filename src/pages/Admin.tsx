import React, { useState, useEffect } from "react";
import { auth, storage, db } from "@/firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { Edit2, Trash2, Plus, X, Layout, FileText, Settings, Image as ImageIcon, Save, LogOut, ExternalLink, Shield, GripVertical } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { writeBatch } from "firebase/firestore";

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
  introduction?: string;
  challenge?: string;
  approach?: string;
  understanding?: string;
  define?: string;
  developDeliver?: string;
  reflection?: string;
  password?: string;
  order: number;
  createdAt: any;
}

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list',
  'link'
];

interface SortableProjectProps {
  project: Project;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => Promise<void> | void;
  key?: any;
}

function SortableProject({ project, onEdit, onDelete }: SortableProjectProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white rounded-[2.5rem] overflow-hidden border transition-all duration-300 relative ${
        isDragging 
          ? "border-black ring-4 ring-black/5 opacity-40 scale-95" 
          : "border-neutral-100 hover:border-neutral-200 hover:shadow-2xl hover:-translate-y-1"
      }`}
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-neutral-100">
        <img 
          src={project.image} 
          alt={project.title} 
          className={`w-full h-full object-cover transition-all duration-700 ${
            isDragging ? "grayscale-0" : "grayscale group-hover:grayscale-0"
          }`}
          referrerPolicy="no-referrer" 
        />
        
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners} 
          className="absolute top-6 left-6 p-3 bg-white/90 backdrop-blur-md text-black rounded-2xl shadow-xl cursor-grab active:cursor-grabbing hover:scale-110 transition-all z-30"
        >
          <GripVertical size={18} />
        </div>

        {/* Actions */}
        <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-30">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(project);
            }} 
            className="p-4 bg-white/90 backdrop-blur-md text-black rounded-2xl shadow-xl hover:bg-black hover:text-white transition-all"
          >
            <Edit2 size={18} />
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(project.id);
            }} 
            className="p-4 bg-white/90 backdrop-blur-md text-red-500 rounded-2xl shadow-xl hover:bg-red-500 hover:text-white transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>
        
        {/* Category Badge */}
        <div className="absolute bottom-6 left-6 px-4 py-2 bg-black/80 backdrop-blur-md text-white rounded-full text-[10px] font-bold uppercase tracking-widest z-20">
          {project.category}
        </div>
      </div>

      <div className="p-10">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-2xl tracking-tight leading-tight">{project.title}</h3>
          <Link 
            to={`/projects/${project.id}`} 
            target="_blank" 
            className="p-2 text-neutral-300 hover:text-black transition-colors"
          >
            <ExternalLink size={18} />
          </Link>
        </div>
        <p className="text-neutral-500 text-sm leading-relaxed line-clamp-2 mb-8">{project.description}</p>
        <div className="flex items-center gap-4">
          {project.password && (
            <div className="flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-lg text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              <Shield size={12} /> Locked
            </div>
          )}
          <div className="flex-grow h-px bg-neutral-100" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-300">
            #{project.order + 1}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "content" | "settings">("general");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Artificial Intelligence",
    role: "",
    timeline: "",
    tools: "",
    imageUrl: "",
    password: "",
    introduction: "",
    challenge: "",
    approach: "",
    understanding: "",
    define: "",
    developDeliver: "",
    reflection: ""
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => setUser(u));
    const q = query(collection(db, "projects"), orderBy("order", "asc"));
    const unsubscribeProjects = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[]);
    });
    return () => {
      unsubscribeAuth();
      unsubscribeProjects();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "Artificial Intelligence",
      role: "",
      timeline: "",
      tools: "",
      imageUrl: "",
      password: "",
      introduction: "",
      challenge: "",
      approach: "",
      understanding: "",
      define: "",
      developDeliver: "",
      reflection: ""
    });
    setFile(null);
    setEditingId(null);
    setShowForm(false);
    setActiveTab("general");
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((p) => p.id === active.id);
      const newIndex = projects.findIndex((p) => p.id === over.id);

      const newProjects = arrayMove(projects, oldIndex, newIndex);
      setProjects(newProjects);

      // Update Firestore
      const batch = writeBatch(db);
      newProjects.forEach((project: Project, index: number) => {
        const docRef = doc(db, "projects", project.id);
        batch.update(docRef, { order: index });
      });

      try {
        await batch.commit();
      } catch (error) {
        console.error("Failed to update project order", error);
      }
    }
  };

  const handleEdit = (project: Project) => {
    setFormData({
      title: project.title || "",
      description: project.description || "",
      category: project.category || "Artificial Intelligence",
      role: project.role || "",
      timeline: project.timeline || "",
      tools: project.tools?.join(", ") || "",
      imageUrl: project.image || "",
      password: project.password || "",
      introduction: project.introduction || "",
      challenge: project.challenge || "",
      approach: project.approach || "",
      understanding: project.understanding || "",
      define: project.define || "",
      developDeliver: project.developDeliver || "",
      reflection: project.reflection || ""
    });
    setEditingId(project.id);
    setShowForm(true);
    setActiveTab("general");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let finalImageUrl = formData.imageUrl;
      if (file) {
        const storageRef = ref(storage, `projects/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      const { imageUrl, ...rest } = formData;
      const projectData = {
        ...rest,
        image: finalImageUrl,
        tools: formData.tools.split(",").map(t => t.trim()).filter(t => t),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "projects", editingId), projectData);
      } else {
        await addDoc(collection(db, "projects"), {
          ...projectData,
          createdAt: serverTimestamp(),
          authorId: user.uid,
          order: projects.length,
        });
      }
      resetForm();
    } catch (error) {
      console.error("Operation failed", error);
      alert("Failed to save project. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-neutral-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-neutral-100">
            <Shield size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter mb-4">Admin Access</h1>
          <p className="text-neutral-500 mb-12">Please sign in with an authorized Google account to manage your portfolio.</p>
          <button onClick={handleLogin} className="w-full py-4 bg-black text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors">
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 px-6 md:px-12 lg:px-24 pb-40 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter">Dashboard</h1>
          <p className="text-neutral-400 mt-1">Welcome back, {user.displayName?.split(" ")[0]}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors">
            {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? "Cancel" : "New Project"}
          </button>
          <button onClick={() => signOut(auth)} className="p-3 text-neutral-400 hover:text-black transition-colors" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="mb-24">
            <div className="bg-neutral-50 rounded-[2.5rem] p-8 md:p-12 border border-neutral-100">
              <div className="flex items-center gap-8 mb-12 border-b border-neutral-200 pb-4">
                {[
                  { id: "general", label: "General Info", icon: Layout },
                  { id: "content", label: "Case Study Content", icon: FileText },
                  { id: "settings", label: "Settings", icon: Settings }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest pb-4 relative transition-colors ${
                      activeTab === tab.id ? "text-black" : "text-neutral-400 hover:text-neutral-600"
                    }`}
                  >
                    <tab.icon size={14} /> {tab.label}
                    {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-black rounded-full" />}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-12">
                {activeTab === "general" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                      <label htmlFor="project-title" className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Project Title</label>
                      <input id="project-title" name="title" type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-white border border-neutral-200 rounded-2xl px-6 py-4 focus:border-black outline-none transition-colors" required />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="project-description" className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Short Description</label>
                      <textarea id="project-description" name="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-white border border-neutral-200 rounded-2xl px-6 py-4 focus:border-black outline-none transition-colors h-32 resize-none" required />
                    </div>
                    <div>
                      <label htmlFor="project-category" className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Category</label>
                      <select id="project-category" name="category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-white border border-neutral-200 rounded-2xl px-6 py-4 focus:border-black outline-none transition-colors appearance-none">
                        <option>Artificial Intelligence</option>
                        <option>Digital Marketing</option>
                        <option>Interactive Experience</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="project-role" className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Role</label>
                      <input id="project-role" name="role" type="text" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full bg-white border border-neutral-200 rounded-2xl px-6 py-4 focus:border-black outline-none transition-colors" required />
                    </div>
                    <div>
                      <label htmlFor="project-timeline" className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Timeline</label>
                      <input id="project-timeline" name="timeline" type="text" value={formData.timeline} onChange={(e) => setFormData({...formData, timeline: e.target.value})} className="w-full bg-white border border-neutral-200 rounded-2xl px-6 py-4 focus:border-black outline-none transition-colors" required />
                    </div>
                    <div>
                      <label htmlFor="project-tools" className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Tools (Comma Separated)</label>
                      <input id="project-tools" name="tools" type="text" value={formData.tools} onChange={(e) => setFormData({...formData, tools: e.target.value})} className="w-full bg-white border border-neutral-200 rounded-2xl px-6 py-4 focus:border-black outline-none transition-colors" required />
                    </div>
                  </div>
                )}

                {activeTab === "content" && (
                  <div className="space-y-12">
                    {[
                      { id: "introduction", label: "01. Introduction" },
                      { id: "challenge", label: "02. The Challenge" },
                      { id: "approach", label: "03. The Approach" },
                      { id: "understanding", label: "04. Understanding" },
                      { id: "define", label: "05. Define" },
                      { id: "developDeliver", label: "06. Develop & Deliver" },
                      { id: "reflection", label: "07. Reflection" }
                    ].map((section) => (
                      <div key={section.id}>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">{section.label}</label>
                        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                          <ReactQuill theme="snow" value={(formData as any)[section.id]} onChange={(val) => setFormData({...formData, [section.id]: val})} modules={quillModules} formats={quillFormats} className="admin-quill" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "settings" && (
                  <div className="space-y-8">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">Project Cover Image</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <input type="url" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} placeholder="Image URL (https://...)" className="w-full bg-white border border-neutral-200 rounded-2xl px-6 py-4 focus:border-black outline-none transition-colors mb-4" />
                          <div className="relative flex items-center py-4">
                            <div className="flex-grow border-t border-neutral-200"></div>
                            <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-neutral-300">Or</span>
                            <div className="flex-grow border-t border-neutral-200"></div>
                          </div>
                          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-widest file:bg-black file:text-white hover:file:bg-neutral-800" accept="image/*" />
                        </div>
                        <div className="aspect-video bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-200 flex items-center justify-center">
                          {formData.imageUrl || file ? (
                            <img src={file ? URL.createObjectURL(file) : formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={40} className="text-neutral-300" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="project-password" title="Project Password (Optional)" className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Project Password (Optional)</label>
                      <input id="project-password" name="password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Leave blank for public access" className="w-full bg-white border border-neutral-200 rounded-2xl px-6 py-4 focus:border-black outline-none transition-colors" />
                    </div>
                  </div>
                )}

                <div className="pt-12 border-t border-neutral-200 flex gap-4">
                  <button type="submit" disabled={loading} className="flex-1 py-6 bg-black text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    <Save size={18} /> {loading ? "Saving..." : editingId ? "Update Project" : "Create Project"}
                  </button>
                  {editingId && (
                    <button type="button" onClick={resetForm} className="px-12 py-6 border border-neutral-200 rounded-2xl font-bold uppercase tracking-widest hover:bg-neutral-50 transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-12">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tighter">Existing Projects</h2>
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Drag handle to reorder</p>
        </div>
        
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={projects.map(p => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {projects.map((p) => (
                <SortableProject
                  key={p.id}
                  project={p}
                  onEdit={handleEdit}
                  onDelete={async (id) => {
                    if (window.confirm("Delete this project?")) {
                      await deleteDoc(doc(db, "projects", id));
                    }
                  }}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay adjustScale={true}>
            {activeId ? (
              <div className="bg-white rounded-[2.5rem] overflow-hidden border border-black shadow-2xl scale-105 opacity-90 cursor-grabbing">
                {(() => {
                  const p = projects.find(proj => proj.id === activeId);
                  if (!p) return null;
                  return (
                    <>
                      <div className="aspect-[4/3] relative overflow-hidden bg-neutral-100">
                        <img src={p.image} alt={p.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute top-6 left-6 p-3 bg-black text-white rounded-2xl shadow-xl">
                          <GripVertical size={18} />
                        </div>
                      </div>
                      <div className="p-10">
                        <h3 className="font-bold text-2xl tracking-tight mb-2">{p.title}</h3>
                        <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">{p.category}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
