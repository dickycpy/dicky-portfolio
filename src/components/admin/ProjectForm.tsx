import React, { useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { motion } from "motion/react";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebase";
import { compressImage } from "@/lib/imageCompression";
import {
  Layout,
  FileText,
  Settings,
  Save,
  Eye,
  Trash2,
  X,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  CASE_STUDY_SECTIONS,
  CATEGORIES,
  ProjectFormData,
  Project,
  emptyFormData,
  projectToFormData,
  quillFormats,
  quillModules,
  validateForm,
} from "./types";
import { useToast } from "./ToastProvider";
import { useAutosave, draftKey, readDraft, clearDraft } from "@/hooks/useAutosave";
import CaseStudyPreview from "./CaseStudyPreview";

type Tab = "general" | "content" | "settings";

interface Props {
  editing: Project | null;
  existingProjects: Project[];
  user: User;
  onDone: () => void;
}

const ProjectForm: React.FC<Props> = ({
  editing,
  existingProjects,
  user,
  onDone,
}) => {
  const { toast } = useToast();
  const key = useMemo(() => draftKey(editing?.id ?? null), [editing]);

  const [formData, setFormData] = useState<ProjectFormData>(() =>
    editing ? projectToFormData(editing) : emptyFormData()
  );
  const [file, setFile] = useState<File | null>(null);
  const [sectionFiles, setSectionFiles] = useState<Record<string, File>>({});
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState<ProjectFormData | null>(
    () => readDraft<ProjectFormData>(key)
  );

  // A2: continuously autosave the working copy.
  useAutosave(key, formData, !loading);

  const patch = (updates: Partial<ProjectFormData>) =>
    setFormData((prev) => ({ ...prev, ...updates }));

  const restoreDraft = () => {
    if (draftAvailable) {
      setFormData(draftAvailable);
      setDraftAvailable(null);
      toast("Unsaved draft restored.", "success");
    }
  };

  const discardDraft = () => {
    clearDraft(key);
    setDraftAvailable(null);
  };

  const coverPreview = file ? URL.createObjectURL(file) : formData.imageUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // A3: inline validation before hitting Firestore.
    const found = validateForm(formData, !!file);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Jump to the tab that hosts the first error.
      if (found.imageUrl) setActiveTab("settings");
      else setActiveTab("general");
      toast("Please fix the highlighted fields before saving.", "error");
      return;
    }

    setLoading(true);
    try {
      // Upload cover image if a file was chosen.
      let finalImageUrl = formData.imageUrl;
      if (file) {
        const compressed = await compressImage(file);
        const storageRef = ref(
          storage,
          `projects/${Date.now()}_${compressed.name}`
        );
        await uploadBytes(storageRef, compressed);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      // Upload any per-block images (keys formatted sub_<sectionId>_<index>).
      const updatedSubSections = JSON.parse(
        JSON.stringify(formData.subSections)
      ) as ProjectFormData["subSections"];

      for (const [fkey, sectionFile] of Object.entries(sectionFiles) as [
        string,
        File
      ][]) {
        const compressed = await compressImage(sectionFile);
        const storageRef = ref(
          storage,
          `projects/subsections/${Date.now()}_${compressed.name}`
        );
        await uploadBytes(storageRef, compressed);
        const url = await getDownloadURL(storageRef);
        const [, sectionId, indexStr] = fkey.split("_");
        const index = parseInt(indexStr, 10);
        if (updatedSubSections[sectionId]?.[index]) {
          updatedSubSections[sectionId][index].image = url;
        }
      }

      const projectData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        role: formData.role,
        timeline: formData.timeline,
        password: formData.password,
        status: formData.status,
        showOnHome: formData.showOnHome,
        homeSortOrder: formData.homeSortOrder,
        subSections: updatedSubSections,
        image: finalImageUrl,
        tools: formData.tools
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        updatedAt: serverTimestamp(),
      };

      if (editing) {
        await updateDoc(doc(db, "projects", editing.id), projectData);
        toast("Project updated.", "success");
      } else {
        const sameTypeCount = existingProjects.filter(
          (p) => (p.type || "main") === formData.type
        ).length;
        await addDoc(collection(db, "projects"), {
          ...projectData,
          createdAt: serverTimestamp(),
          authorId: user.uid,
          sortOrder: sameTypeCount,
        });
        toast("Project created.", "success");
      }

      clearDraft(key);
      onDone();
    } catch (err) {
      console.error("Operation failed", err);
      toast("Failed to save project. Check the console for details.", "error");
    } finally {
      setLoading(false);
    }
  };

  const addBlock = (sectionId: string) => {
    const current = formData.subSections?.[sectionId] || [];
    patch({
      subSections: {
        ...formData.subSections,
        [sectionId]: [...current, { title: "", content: "" }],
      },
    });
  };

  const updateBlock = (
    sectionId: string,
    index: number,
    updates: Partial<ProjectFormData["subSections"][string][number]>
  ) => {
    const current = [...(formData.subSections?.[sectionId] || [])];
    current[index] = { ...current[index], ...updates };
    patch({
      subSections: { ...formData.subSections, [sectionId]: current },
    });
  };

  const removeBlock = (sectionId: string, index: number) => {
    const current = [...(formData.subSections?.[sectionId] || [])];
    current.splice(index, 1);
    patch({
      subSections: { ...formData.subSections, [sectionId]: current },
    });
  };

  const tabs = [
    { id: "general" as const, label: "General Info", icon: Layout },
    { id: "content" as const, label: "Case Study Content", icon: FileText },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  const inputCls = (field: string) =>
    `w-full bg-white border rounded-2xl px-6 py-4 outline-none transition-colors ${
      errors[field]
        ? "border-red-400 focus:border-red-500"
        : "border-neutral-200 focus:border-black"
    }`;

  const ErrorText = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="text-red-500 text-xs font-medium mt-2 ml-1">
        {errors[field]}
      </p>
    ) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="mb-24"
    >
      <div className="bg-neutral-50 rounded-[2.5rem] p-8 md:p-12 border border-neutral-100">
        {/* A2: draft restore banner */}
        {draftAvailable && (
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4">
            <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
              <RotateCcw size={16} /> An unsaved draft was found for this
              project.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={restoreDraft}
                className="px-4 py-2 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={discardDraft}
                className="px-4 py-2 bg-white border border-neutral-200 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-100 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-6 md:gap-8 mb-12 border-b border-neutral-200 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest pb-4 relative transition-colors ${
                activeTab === tab.id
                  ? "text-black"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              <tab.icon size={14} /> {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeFormTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-black rounded-full"
                />
              )}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="ml-auto flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-white border border-neutral-200 rounded-full hover:bg-black hover:text-white transition-colors"
          >
            <Eye size={14} /> Preview
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {activeTab === "general" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                  Project Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  className={inputCls("title")}
                />
                <ErrorText field="title" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                  Short Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  className={`${inputCls("description")} h-32 resize-none`}
                />
                <ErrorText field="description" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                  Project Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    patch({ status: e.target.value as ProjectFormData["status"] })
                  }
                  className={`${inputCls("status")} appearance-none`}
                >
                  <option value="published">Published</option>
                  <option value="coming soon">Coming Soon</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                  Project Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    patch({ type: e.target.value as ProjectFormData["type"] })
                  }
                  className={`${inputCls("type")} appearance-none`}
                >
                  <option value="main">Main Project (Career)</option>
                  <option value="lab">My Lab (Freelance)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => patch({ category: e.target.value })}
                  className={`${inputCls("category")} appearance-none`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => patch({ role: e.target.value })}
                  className={inputCls("role")}
                />
                <ErrorText field="role" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                  Timeline
                </label>
                <input
                  type="text"
                  value={formData.timeline}
                  onChange={(e) => patch({ timeline: e.target.value })}
                  className={inputCls("timeline")}
                />
                <ErrorText field="timeline" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                  Tools (Comma Separated)
                </label>
                <input
                  type="text"
                  value={formData.tools}
                  onChange={(e) => patch({ tools: e.target.value })}
                  className={inputCls("tools")}
                />
                <ErrorText field="tools" />
              </div>
            </div>
          )}

          {activeTab === "content" && (
            <div className="space-y-12">
              {CASE_STUDY_SECTIONS.map((section) => (
                <div
                  key={section.id}
                  className="space-y-6 pb-12 border-b border-neutral-100 last:border-0"
                >
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-black">
                      {section.label}
                    </label>
                    <button
                      type="button"
                      onClick={() => addBlock(section.id)}
                      className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-neutral-100 rounded-full hover:bg-black hover:text-white transition-all"
                    >
                      + Add Content Block
                    </button>
                  </div>

                  <div className="space-y-8">
                    {(formData.subSections?.[section.id] || []).length === 0 ? (
                      <div className="py-12 border-2 border-dashed border-neutral-100 rounded-[2.5rem] flex flex-col items-center justify-center text-neutral-300">
                        <FileText size={32} className="mb-4 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">
                          No blocks added yet
                        </p>
                      </div>
                    ) : (
                      (formData.subSections?.[section.id] || []).map(
                        (sub, subIndex) => (
                          <div
                            key={subIndex}
                            className="p-8 bg-white rounded-[2.5rem] border border-neutral-100 space-y-6 relative group/sub shadow-sm hover:shadow-md transition-shadow"
                          >
                            <button
                              type="button"
                              onClick={() => removeBlock(section.id, subIndex)}
                              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover/sub:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>

                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                                Block Title (Optional)
                              </label>
                              <input
                                type="text"
                                value={sub.title}
                                onChange={(e) =>
                                  updateBlock(section.id, subIndex, {
                                    title: e.target.value,
                                  })
                                }
                                placeholder="e.g., SWOT Analysis, Persona…"
                                className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl px-6 py-4 text-sm font-medium focus:border-black outline-none transition-colors"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                                Block Content
                              </label>
                              <div className="bg-neutral-50 rounded-2xl border border-neutral-100 overflow-hidden resizable-editor">
                                <ReactQuill
                                  theme="snow"
                                  value={sub.content}
                                  onChange={(val) =>
                                    updateBlock(section.id, subIndex, {
                                      content: val,
                                    })
                                  }
                                  modules={quillModules}
                                  formats={quillFormats}
                                  className="admin-quill"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-neutral-50 rounded-3xl border border-neutral-100">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">
                                  Block Image (Optional)
                                </label>
                                <input
                                  type="url"
                                  value={sub.image || ""}
                                  onChange={(e) =>
                                    updateBlock(section.id, subIndex, {
                                      image: e.target.value,
                                    })
                                  }
                                  placeholder="Image URL (https://…)"
                                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-colors mb-4"
                                />
                                <div className="flex items-center gap-4">
                                  <input
                                    type="file"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f)
                                        setSectionFiles((prev) => ({
                                          ...prev,
                                          [`sub_${section.id}_${subIndex}`]: f,
                                        }));
                                    }}
                                    className="flex-1 text-[10px] text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-black file:text-white hover:file:bg-neutral-800 transition-all"
                                    accept="image/*"
                                  />
                                  {(sub.image ||
                                    sectionFiles[
                                      `sub_${section.id}_${subIndex}`
                                    ]) && (
                                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-neutral-200 bg-white flex-shrink-0">
                                      <img
                                        src={
                                          sectionFiles[
                                            `sub_${section.id}_${subIndex}`
                                          ]
                                            ? URL.createObjectURL(
                                                sectionFiles[
                                                  `sub_${section.id}_${subIndex}`
                                                ]
                                              )
                                            : sub.image
                                        }
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">
                                  Block Video (Optional)
                                </label>
                                <input
                                  type="url"
                                  value={sub.video || ""}
                                  onChange={(e) =>
                                    updateBlock(section.id, subIndex, {
                                      video: e.target.value,
                                    })
                                  }
                                  placeholder="https://www.youtube.com/watch?v=…"
                                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-colors"
                                />
                                <input
                                  type="text"
                                  value={sub.imageDescription || ""}
                                  onChange={(e) =>
                                    updateBlock(section.id, subIndex, {
                                      imageDescription: e.target.value,
                                    })
                                  }
                                  placeholder="Image Description (Optional)"
                                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-colors mt-4"
                                />
                              </div>
                            </div>

                            {/* Carousel images — now its own full-width row (C2 layout fix) */}
                            <div className="p-6 bg-neutral-50 rounded-3xl border border-neutral-100">
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">
                                Carousel Images (Optional)
                              </label>
                              <div className="space-y-4">
                                {(sub.carouselImages || []).map(
                                  (imgUrl, imgIdx) => (
                                    <div
                                      key={imgIdx}
                                      className="flex items-center gap-3"
                                    >
                                      <input
                                        type="url"
                                        value={imgUrl}
                                        onChange={(e) => {
                                          const carousel = [
                                            ...(sub.carouselImages || []),
                                          ];
                                          carousel[imgIdx] = e.target.value;
                                          updateBlock(section.id, subIndex, {
                                            carouselImages: carousel,
                                          });
                                        }}
                                        placeholder="Image URL"
                                        className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-2 text-sm focus:border-black outline-none transition-colors"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const carousel = [
                                            ...(sub.carouselImages || []),
                                          ];
                                          carousel.splice(imgIdx, 1);
                                          updateBlock(section.id, subIndex, {
                                            carouselImages: carousel,
                                          });
                                        }}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  )
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const carousel = [
                                      ...(sub.carouselImages || []),
                                      "",
                                    ];
                                    updateBlock(section.id, subIndex, {
                                      carouselImages: carousel,
                                    });
                                  }}
                                  className="w-full py-2 border-2 border-dashed border-neutral-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:border-black hover:text-black transition-all"
                                >
                                  + Add Carousel Image
                                </button>
                                <input
                                  type="text"
                                  value={sub.carouselDescription || ""}
                                  onChange={(e) =>
                                    updateBlock(section.id, subIndex, {
                                      carouselDescription: e.target.value,
                                    })
                                  }
                                  placeholder="Carousel Description (Optional)"
                                  className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:border-black outline-none transition-colors mt-4"
                                />
                              </div>
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">
                  Project Cover Image
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => patch({ imageUrl: e.target.value })}
                      placeholder="Image URL (https://…)"
                      className={`${inputCls("imageUrl")} mb-2`}
                    />
                    <ErrorText field="imageUrl" />
                    <div className="relative flex items-center py-4">
                      <div className="flex-grow border-t border-neutral-200" />
                      <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-neutral-300">
                        Or
                      </span>
                      <div className="flex-grow border-t border-neutral-200" />
                    </div>
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-widest file:bg-black file:text-white hover:file:bg-neutral-800"
                      accept="image/*"
                    />
                  </div>
                  <div className="aspect-video bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-200 flex items-center justify-center">
                    {coverPreview ? (
                      <img
                        src={coverPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={40} className="text-neutral-300" />
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                  Project Password (Optional)
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => patch({ password: e.target.value })}
                  placeholder="Leave blank for public access"
                  className="w-full bg-white border border-neutral-200 rounded-2xl px-6 py-4 focus:border-black outline-none transition-colors"
                />
                <p className="text-[11px] text-amber-600 mt-2 ml-1">
                  Note: this gate is client-side only and not true security.
                </p>
              </div>
              <div className="flex items-center gap-4 p-6 bg-white border border-neutral-200 rounded-2xl">
                <input
                  id="show-on-home"
                  type="checkbox"
                  checked={formData.showOnHome}
                  onChange={(e) => patch({ showOnHome: e.target.checked })}
                  className="w-5 h-5 rounded border-neutral-200 text-black focus:ring-black"
                />
                <div>
                  <label
                    htmlFor="show-on-home"
                    className="block text-sm font-bold uppercase tracking-widest text-black"
                  >
                    Feature on Home Screen
                  </label>
                  <p className="text-[10px] text-neutral-400 font-medium tracking-wider mt-1">
                    Make this project visible in the "Selected Works" section
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-12 border-t border-neutral-200 flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-6 bg-black text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />{" "}
              {loading
                ? "Saving…"
                : editing
                ? "Update Project"
                : "Create Project"}
            </button>
            <button
              type="button"
              onClick={onDone}
              className="px-12 py-6 border border-neutral-200 rounded-2xl font-bold uppercase tracking-widest hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <CaseStudyPreview
        open={showPreview}
        data={formData}
        coverPreview={coverPreview}
        onClose={() => setShowPreview(false)}
      />
    </motion.div>
  );
};

export default ProjectForm;
