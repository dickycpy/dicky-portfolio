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
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

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
  type: "main" | "lab";
  sortOrder?: number;
  introduction?: string;
  challenge?: string;
  approach?: string;
  understanding?: string;
  define?: string;
  developDeliver?: string;
  reflection?: string;
  introductionImage?: string;
  introductionVideo?: string;
  challengeImage?: string;
  challengeVideo?: string;
  approachImage?: string;
  approachVideo?: string;
  understandingImage?: string;
  understandingVideo?: string;
  defineImage?: string;
  defineVideo?: string;
  developDeliverImage?: string;
  developDeliverVideo?: string;
  reflectionImage?: string;
  reflectionVideo?: string;
  introductionImageDescription?: string;
  challengeImageDescription?: string;
  approachImageDescription?: string;
  understandingImageDescription?: string;
  defineImageDescription?: string;
  developDeliverImageDescription?: string;
  reflectionImageDescription?: string;
  subSections?: Record<string, { 
    title: string; 
    content: string;
    image?: string;
    video?: string;
    imageDescription?: string;
    carouselImages?: string[];
  }[]>;
  password?: string;
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

export default function Admin() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "content" | "settings">("general");
  const [listTab, setListTab] = useState<"main" | "lab">("main");

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Artificial Intelligence",
    type: "main" as "main" | "lab",
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
    reflection: "",
    introductionImage: "",
    introductionVideo: "",
    challengeImage: "",
    challengeVideo: "",
    approachImage: "",
    approachVideo: "",
    understandingImage: "",
    understandingVideo: "",
    defineImage: "",
    defineVideo: "",
    developDeliverImage: "",
    developDeliverVideo: "",
    reflectionImage: "",
    reflectionVideo: "",
    introductionImageDescription: "",
    challengeImageDescription: "",
    approachImageDescription: "",
    understandingImageDescription: "",
    defineImageDescription: "",
    developDeliverImageDescription: "",
    reflectionImageDescription: "",
    subSections: {} as Record<string, { 
      title: string; 
      content: string;
      image?: string;
      video?: string;
      imageDescription?: string;
      carouselImages?: string[];
    }[]>
  });
  const [file, setFile] = useState<File | null>(null);
  const [sectionFiles, setSectionFiles] = useState<Record<string, File>>({});

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => setUser(u));
    const q = query(collection(db, "projects"));
    const unsubscribeProjects = onSnapshot(q, (snapshot) => {
      const fetchedProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];
      
      // Client-side sorting: 
      // 1. Projects with sortOrder come first (sorted by sortOrder)
      // 2. Projects without sortOrder come next (sorted by createdAt desc)
      fetchedProjects.sort((a, b) => {
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        if (a.sortOrder !== undefined) return -1;
        if (b.sortOrder !== undefined) return 1;
        
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setProjects(fetchedProjects);
    }, (err) => {
      console.error("Firestore error in Admin:", err);
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
      type: "main",
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
      reflection: "",
      introductionImage: "",
      introductionVideo: "",
      challengeImage: "",
      challengeVideo: "",
      approachImage: "",
      approachVideo: "",
      understandingImage: "",
      understandingVideo: "",
      defineImage: "",
      defineVideo: "",
      developDeliverImage: "",
      developDeliverVideo: "",
      reflectionImage: "",
      reflectionVideo: "",
      introductionImageDescription: "",
      challengeImageDescription: "",
      approachImageDescription: "",
      understandingImageDescription: "",
      defineImageDescription: "",
      developDeliverImageDescription: "",
      reflectionImageDescription: "",
      subSections: {}
    });
    setFile(null);
    setSectionFiles({});
    setEditingId(null);
    setShowForm(false);
    setActiveTab("general");
  };

  const handleEdit = (project: Project) => {
    setFormData({
      title: project.title || "",
      description: project.description || "",
      category: project.category || "Artificial Intelligence",
      type: project.type || "main",
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
      reflection: project.reflection || "",
      introductionImage: project.introductionImage || "",
      introductionVideo: project.introductionVideo || "",
      challengeImage: project.challengeImage || "",
      challengeVideo: project.challengeVideo || "",
      approachImage: project.approachImage || "",
      approachVideo: project.approachVideo || "",
      understandingImage: project.understandingImage || "",
      understandingVideo: project.understandingVideo || "",
      defineImage: project.defineImage || "",
      defineVideo: project.defineVideo || "",
      developDeliverImage: project.developDeliverImage || "",
      developDeliverVideo: project.developDeliverVideo || "",
      reflectionImage: project.reflectionImage || "",
      reflectionVideo: project.reflectionVideo || "",
      introductionImageDescription: project.introductionImageDescription || "",
      challengeImageDescription: project.challengeImageDescription || "",
      approachImageDescription: project.approachImageDescription || "",
      understandingImageDescription: project.understandingImageDescription || "",
      defineImageDescription: project.defineImageDescription || "",
      developDeliverImageDescription: project.developDeliverImageDescription || "",
      reflectionImageDescription: project.reflectionImageDescription || "",
      subSections: project.subSections || {}
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
      
      // Upload section images
      const sectionImageUrls: Record<string, string> = {};
      const updatedSubSections = { ...formData.subSections };

      for (const [key, sectionFile] of Object.entries(sectionFiles)) {
        const fileToUpload = sectionFile as File;
        const storagePath = key.startsWith("sub_") ? `projects/subsections/${Date.now()}_${fileToUpload.name}` : `projects/sections/${Date.now()}_${fileToUpload.name}`;
        const sectionStorageRef = ref(storage, storagePath);
        await uploadBytes(sectionStorageRef, fileToUpload);
        const url = await getDownloadURL(sectionStorageRef);
        
        if (key.startsWith("sub_")) {
          // Format: sub_sectionId_index
          const [_, sectionId, indexStr] = key.split("_");
          const index = parseInt(indexStr);
          if (updatedSubSections[sectionId] && updatedSubSections[sectionId][index]) {
            updatedSubSections[sectionId][index].image = url;
          }
        } else {
          sectionImageUrls[`${key}Image`] = url;
        }
      }

      const projectData = {
        ...rest,
        ...sectionImageUrls,
        subSections: updatedSubSections,
        image: finalImageUrl,
        tools: formData.tools.split(",").map(t => t.trim()).filter(t => t),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "projects", editingId), projectData);
      } else {
        // Calculate sortOrder based on how many projects of the same type already exist
        const sameTypeCount = projects.filter(p => {
          const projectType = p.type || "main";
          return projectType === formData.type;
        }).length;
        await addDoc(collection(db, "projects"), {
          ...projectData,
          createdAt: serverTimestamp(),
          authorId: user.uid,
          sortOrder: sameTypeCount
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

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    // Filter projects by current tab
    const filteredItems = projects.filter(p => {
      const projectType = p.type || "main";
      return projectType === listTab;
    });
    const otherItems = projects.filter(p => {
      const projectType = p.type || "main";
      return projectType !== listTab;
    });
    
    const items = Array.from(filteredItems) as Project[];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Combine back for state update
    const newAllProjects = [...items, ...otherItems];
    
    // Sort the final array to maintain consistent UI if needed, 
    // but setProjects will trigger a re-render with our client-side sort anyway
    setProjects(newAllProjects);

    // Update Firestore for the reordered items in this tab
    try {
      const batch: Promise<void>[] = [];
      items.forEach((item, index) => {
        if (item.sortOrder !== index) {
          batch.push(updateDoc(doc(db, "projects", item.id), { sortOrder: index }));
        }
      });
      await Promise.all(batch);
    } catch (error) {
      console.error("Failed to update sort order", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
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
    <div className="pt-24 md:pt-32 px-6 md:px-12 lg:px-24 pb-40 max-w-7xl mx-auto">
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
                      <label htmlFor="project-type" className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Project Type</label>
                      <select id="project-type" name="type" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as any})} className="w-full bg-white border border-neutral-200 rounded-2xl px-6 py-4 focus:border-black outline-none transition-colors appearance-none">
                        <option value="main">Main Project (Career)</option>
                        <option value="lab">My Lab (Freelance)</option>
                      </select>
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
                      <div key={section.id} className="space-y-6 pb-12 border-b border-neutral-100 last:border-0">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-bold uppercase tracking-[0.2em] text-black">{section.label}</label>
                          <button
                            type="button"
                            onClick={() => {
                              const currentSubSections = formData.subSections?.[section.id] || [];
                              setFormData({
                                ...formData,
                                subSections: {
                                  ...formData.subSections,
                                  [section.id]: [...currentSubSections, { title: "", content: "" }]
                                }
                              });
                            }}
                            className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-neutral-100 rounded-full hover:bg-black hover:text-white transition-all"
                          >
                            + Add Content Block
                          </button>
                        </div>

                        <div className="space-y-8">
                          {(formData.subSections?.[section.id] || []).length === 0 ? (
                            <div className="py-12 border-2 border-dashed border-neutral-100 rounded-[2.5rem] flex flex-col items-center justify-center text-neutral-300">
                              <FileText size={32} className="mb-4 opacity-20" />
                              <p className="text-[10px] font-bold uppercase tracking-widest">No blocks added yet</p>
                            </div>
                          ) : (
                            (formData.subSections?.[section.id] || []).map((sub, subIndex) => (
                              <div key={subIndex} className="p-8 bg-white rounded-[2.5rem] border border-neutral-100 space-y-6 relative group/sub shadow-sm hover:shadow-md transition-shadow">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentSubSections = [...(formData.subSections?.[section.id] || [])];
                                    currentSubSections.splice(subIndex, 1);
                                    setFormData({
                                      ...formData,
                                      subSections: {
                                        ...formData.subSections,
                                        [section.id]: currentSubSections
                                      }
                                    });
                                  }}
                                  className="absolute top-6 right-6 w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover/sub:opacity-100"
                                >
                                  <Trash2 size={14} />
                                </button>
                                
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Block Title (Optional)</label>
                                  <input 
                                    type="text" 
                                    value={sub.title} 
                                    onChange={(e) => {
                                      const currentSubSections = [...(formData.subSections?.[section.id] || [])];
                                      currentSubSections[subIndex].title = e.target.value;
                                      setFormData({
                                        ...formData,
                                        subSections: {
                                          ...formData.subSections,
                                          [section.id]: currentSubSections
                                        }
                                      });
                                    }} 
                                    placeholder="e.g., SWOT Analysis, Persona..." 
                                    className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl px-6 py-4 text-sm font-medium focus:border-black outline-none transition-colors" 
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Block Content</label>
                                  <div className="bg-neutral-50 rounded-2xl border border-neutral-100 overflow-hidden resizable-editor">
                                    <ReactQuill 
                                      theme="snow" 
                                      value={sub.content} 
                                      onChange={(val) => {
                                        const currentSubSections = [...(formData.subSections?.[section.id] || [])];
                                        currentSubSections[subIndex].content = val;
                                        setFormData({
                                          ...formData,
                                          subSections: {
                                            ...formData.subSections,
                                            [section.id]: currentSubSections
                                          }
                                        });
                                      }} 
                                      modules={quillModules} 
                                      formats={quillFormats} 
                                      className="admin-quill" 
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-neutral-50 rounded-3xl border border-neutral-100">
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">Block Image (Optional)</label>
                                    <input 
                                      type="url" 
                                      value={sub.image || ""} 
                                      onChange={(e) => {
                                        const currentSubSections = [...(formData.subSections?.[section.id] || [])];
                                        currentSubSections[subIndex].image = e.target.value;
                                        setFormData({
                                          ...formData,
                                          subSections: {
                                            ...formData.subSections,
                                            [section.id]: currentSubSections
                                          }
                                        });
                                      }} 
                                      placeholder="Image URL (https://...)" 
                                      className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-colors mb-4" 
                                    />
                                    <div className="flex items-center gap-4">
                                      <input 
                                        type="file" 
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) setSectionFiles(prev => ({ ...prev, [`sub_${section.id}_${subIndex}`]: file }));
                                        }} 
                                        className="flex-1 text-[10px] text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-black file:text-white hover:file:bg-neutral-800 transition-all" 
                                        accept="image/*" 
                                      />
                                      {(sub.image || sectionFiles[`sub_${section.id}_${subIndex}`]) && (
                                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-neutral-200 bg-white flex-shrink-0">
                                          <img 
                                            src={sectionFiles[`sub_${section.id}_${subIndex}`] ? URL.createObjectURL(sectionFiles[`sub_${section.id}_${subIndex}`]) : sub.image} 
                                            alt="Preview" 
                                            className="w-full h-full object-cover" 
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">Block Video (Optional)</label>
                                    <input 
                                      type="url" 
                                      value={sub.video || ""} 
                                      onChange={(e) => {
                                        const currentSubSections = [...(formData.subSections?.[section.id] || [])];
                                        currentSubSections[subIndex].video = e.target.value;
                                        setFormData({
                                          ...formData,
                                          subSections: {
                                            ...formData.subSections,
                                            [section.id]: currentSubSections
                                          }
                                        });
                                      }} 
                                      placeholder="https://www.youtube.com/watch?v=..." 
                                      className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-colors" 
                                    />
                                    <input 
                                      type="text" 
                                      value={sub.imageDescription || ""} 
                                      onChange={(e) => {
                                        const currentSubSections = [...(formData.subSections?.[section.id] || [])];
                                        currentSubSections[subIndex].imageDescription = e.target.value;
                                        setFormData({
                                          ...formData,
                                          subSections: {
                                            ...formData.subSections,
                                            [section.id]: currentSubSections
                                          }
                                        });
                                      }} 
                                      placeholder="Image Description (Optional)" 
                                      className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-colors mt-4" 
                                    />
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">Carousel Images (Optional)</label>
                                    <div className="space-y-4">
                                      {(sub.carouselImages || []).map((imgUrl: string, imgIdx: number) => (
                                        <div key={imgIdx} className="flex items-center gap-3">
                                          <input 
                                            type="url" 
                                            value={imgUrl} 
                                            onChange={(e) => {
                                              const currentSubSections = [...(formData.subSections?.[section.id] || [])];
                                              const currentCarousel = [...(currentSubSections[subIndex].carouselImages || [])];
                                              currentCarousel[imgIdx] = e.target.value;
                                              currentSubSections[subIndex].carouselImages = currentCarousel;
                                              setFormData({
                                                ...formData,
                                                subSections: { ...formData.subSections, [section.id]: currentSubSections }
                                              });
                                            }} 
                                            placeholder="Image URL" 
                                            className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-2 text-sm focus:border-black outline-none transition-colors" 
                                          />
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              const currentSubSections = [...(formData.subSections?.[section.id] || [])];
                                              const currentCarousel = [...(currentSubSections[subIndex].carouselImages || [])];
                                              currentCarousel.splice(imgIdx, 1);
                                              currentSubSections[subIndex].carouselImages = currentCarousel;
                                              setFormData({
                                                ...formData,
                                                subSections: { ...formData.subSections, [section.id]: currentSubSections }
                                              });
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                          >
                                            <X size={14} />
                                          </button>
                                        </div>
                                      ))}
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          const currentSubSections = [...(formData.subSections?.[section.id] || [])];
                                          const currentCarousel = [...(currentSubSections[subIndex].carouselImages || [])];
                                          currentCarousel.push("");
                                          currentSubSections[subIndex].carouselImages = currentCarousel;
                                          setFormData({
                                            ...formData,
                                            subSections: { ...formData.subSections, [section.id]: currentSubSections }
                                          });
                                        }}
                                        className="w-full py-2 border-2 border-dashed border-neutral-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:border-black hover:text-black transition-all"
                                      >
                                        + Add Carousel Image
                                      </button>
                                    </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <h2 className="text-3xl font-bold tracking-tighter">Existing Projects</h2>
          
          <div className="flex bg-neutral-100 p-1 rounded-2xl">
            <button
              onClick={() => setListTab("main")}
              className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                listTab === "main" ? "bg-white text-black shadow-sm" : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              Main Project
            </button>
            <button
              onClick={() => setListTab("lab")}
              className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                listTab === "lab" ? "bg-white text-black shadow-sm" : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              My Lab
            </button>
          </div>

          <p className="text-xs text-neutral-400 font-medium uppercase tracking-widest">Drag cards to reorder</p>
        </div>
        
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="projects-list" direction="vertical">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
              >
                {projects
                  .filter(p => {
                    const projectType = p.type || "main";
                    return projectType === listTab;
                  })
                  .map((p, index) => {
                    const DraggableComponent = Draggable as any;
                    return (
                      <DraggableComponent key={p.id} draggableId={p.id} index={index}>
                      {(provided: any, snapshot: any) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`group bg-white rounded-[2.5rem] overflow-hidden border border-neutral-100 hover:border-neutral-200 hover:shadow-2xl transition-all duration-300 relative ${
                            snapshot.isDragging ? "shadow-2xl scale-[1.02] z-50 ring-2 ring-brand-teal" : ""
                          }`}
                        >
                          <div className="aspect-[4/3] relative overflow-hidden bg-neutral-100">
                            <img src={p.image} alt={p.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
                            
                            {/* Drag Handle */}
                            <div 
                              {...provided.dragHandleProps}
                              className="absolute top-6 left-6 p-3 bg-white/90 backdrop-blur-md text-black rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-all cursor-grab active:cursor-grabbing z-40"
                            >
                              <GripVertical size={18} />
                            </div>

                            <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-30">
                              <button onClick={() => handleEdit(p)} className="p-4 bg-white/90 backdrop-blur-md text-black rounded-2xl shadow-xl hover:bg-black hover:text-white transition-all">
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={async () => {
                                  if (window.confirm("Delete this project?")) {
                                    await deleteDoc(doc(db, "projects", p.id));
                                  }
                                }} 
                                className="p-4 bg-white/90 backdrop-blur-md text-red-500 rounded-2xl shadow-xl hover:bg-red-500 hover:text-white transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                            <div className="absolute bottom-6 left-6 flex gap-2 z-20">
                              <div className="px-4 py-2 bg-black/80 backdrop-blur-md text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
                                {p.type === "lab" ? "My Lab" : "Main"}
                              </div>
                              <div className="px-4 py-2 bg-brand-teal/80 backdrop-blur-md text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
                                {p.category}
                              </div>
                            </div>
                          </div>
                          <div className="p-10">
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="font-bold text-2xl tracking-tight leading-tight">{p.title}</h3>
                              <Link to={`/projects/${p.id}`} target="_blank" className="p-2 text-neutral-300 hover:text-black transition-colors">
                                <ExternalLink size={18} />
                              </Link>
                            </div>
                            <p className="text-neutral-500 text-sm leading-relaxed line-clamp-2 mb-8">{p.description}</p>
                            <div className="flex items-center gap-4">
                              {p.password && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-lg text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                  <Shield size={12} /> Locked
                                </div>
                              )}
                              <div className="flex-grow h-px bg-neutral-100" />
                            </div>
                          </div>
                        </div>
                      )}
                    </DraggableComponent>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
