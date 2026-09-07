import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import {
  DragDropContext,
  Droppable,
  Draggable as DraggableBase,
  DropResult,
} from "@hello-pangea/dnd";

// No @types/react is installed in this project, so React resolves to `any` and
// the strictly-typed Draggable rejects the required `key` prop. Alias to `any`.
const Draggable: any = DraggableBase;
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import {
  Edit2,
  Trash2,
  ExternalLink,
  Star,
  Shield,
  Search,
  Copy,
  GripVertical,
  Loader2,
} from "lucide-react";
import { useToast } from "./ToastProvider";
import { Project, ListTab } from "./types";

interface Props {
  projects: Project[];
  listTab: Exclude<ListTab, "config" | "media">;
  user: User;
  onEdit: (p: Project) => void;
}

const orderField = (tab: Props["listTab"]) =>
  tab === "home" ? "homeSortOrder" : "sortOrder";

function sortForTab(list: Project[], tab: Props["listTab"]): Project[] {
  const field = orderField(tab);
  return [...list].sort((a, b) => {
    const oa = a[field] !== undefined ? a[field] : 9999;
    const ob = b[field] !== undefined ? b[field] : 9999;
    if (oa !== ob) return oa - ob;
    return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
  });
}

export default function ProjectList({ projects, listTab, user, onEdit }: Props) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Project[]>([]);
  const [reordering, setReordering] = useState(false);

  const tabProjects = useMemo(() => {
    const filtered = projects.filter((p) =>
      listTab === "home" ? p.showOnHome : (p.type || "main") === listTab
    );
    return sortForTab(filtered, listTab);
  }, [projects, listTab]);

  // Keep local order in sync with incoming data (realtime snapshot updates).
  useEffect(() => {
    setItems(tabProjects);
  }, [tabProjects]);

  const query = search.trim().toLowerCase();
  const visible = query
    ? items.filter(
        (p) =>
          p.title?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query)
      )
    : items;

  const persistOrder = async (ordered: Project[]) => {
    const field = orderField(listTab);
    setReordering(true);
    try {
      await Promise.all(
        ordered.map((p, idx) =>
          p[field] !== idx + 1
            ? updateDoc(doc(db, "projects", p.id), { [field]: idx + 1 })
            : Promise.resolve()
        )
      );
    } catch (err) {
      console.error("Failed to save order:", err);
      toast("Failed to save the new order. Check permissions.", "error");
    } finally {
      setReordering(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || query) return;
    if (result.destination.index === result.source.index) return;
    const reordered = [...items];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setItems(reordered); // optimistic
    persistOrder(reordered);
  };

  const toggleFeature = async (p: Project) => {
    try {
      const featuring = !p.showOnHome;
      await updateDoc(doc(db, "projects", p.id), {
        showOnHome: featuring,
        homeSortOrder: featuring
          ? projects.filter((x) => x.showOnHome).length + 1
          : p.homeSortOrder || 0,
      });
      toast(
        featuring ? "Added to Home Featured." : "Removed from Home Featured.",
        "success"
      );
    } catch (err) {
      console.error("Toggle feature failed:", err);
      toast("Failed to update feature status.", "error");
    }
  };

  const handleDelete = async (p: Project) => {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "projects", p.id));
      toast("Project deleted.", "success");
    } catch (err) {
      console.error("Delete failed:", err);
      toast("Failed to delete project.", "error");
    }
  };

  // A6.2: duplicate a project as a new draft copy.
  const handleDuplicate = async (p: Project) => {
    try {
      const {
        id,
        createdAt,
        updatedAt,
        sortOrder,
        homeSortOrder,
        showOnHome,
        ...rest
      } = p;
      const sameTypeCount = projects.filter(
        (x) => (x.type || "main") === (p.type || "main")
      ).length;
      await addDoc(collection(db, "projects"), {
        ...rest,
        title: `${p.title} (Copy)`,
        showOnHome: false,
        status: "coming soon",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        authorId: user.uid,
        sortOrder: sameTypeCount,
      });
      toast("Project duplicated as a draft (Coming Soon).", "success");
    } catch (err) {
      console.error("Duplicate failed:", err);
      toast("Failed to duplicate project.", "error");
    }
  };

  if (tabProjects.length === 0) {
    return (
      <div className="py-24 text-center bg-neutral-50 rounded-[2.5rem] border border-neutral-100 p-8">
        <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs">
          {listTab === "home"
            ? "No featured projects selected for Home screen"
            : `No ${listTab === "main" ? "Main" : "Lab"} projects found`}
        </p>
        {listTab === "home" && (
          <p className="text-neutral-400 text-xs mt-3 max-w-md mx-auto">
            Go to a project and click the star (
            <Star size={12} className="inline mx-1" />) icon to feature it here.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, description or category…"
            className="w-full bg-white border border-neutral-200 rounded-full pl-11 pr-4 py-3 text-sm focus:border-black outline-none transition-colors"
          />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
          {reordering ? (
            <span className="text-brand-teal flex items-center gap-1.5">
              <Loader2 size={13} className="animate-spin" /> Saving order…
            </span>
          ) : query ? (
            `${visible.length} match${visible.length === 1 ? "" : "es"}`
          ) : (
            "Drag ⠿ to reorder • 1 is top"
          )}
        </p>
      </div>

      {query && (
        <p className="text-[11px] text-neutral-400 italic">
          Clear the search box to drag-and-drop reorder.
        </p>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="project-list" isDropDisabled={!!query}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-4"
            >
              {visible.map((p, index) => (
                <Draggable
                  key={p.id}
                  draggableId={p.id}
                  index={index}
                  isDragDisabled={!!query}
                >
                  {(dragProvided, snapshot) => (
                    <motion.div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      layout
                      className={`flex items-center gap-4 bg-white rounded-3xl border p-4 transition-shadow ${
                        snapshot.isDragging
                          ? "shadow-2xl border-neutral-300"
                          : "border-neutral-100 hover:border-neutral-200"
                      }`}
                    >
                      <div
                        {...dragProvided.dragHandleProps}
                        className={`flex-shrink-0 text-neutral-300 hover:text-black transition-colors ${
                          query ? "opacity-30 cursor-not-allowed" : "cursor-grab"
                        }`}
                        title={query ? "Clear search to reorder" : "Drag to reorder"}
                      >
                        <GripVertical size={20} />
                      </div>

                      <div className="flex-shrink-0 w-14 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-100 px-2 py-1 rounded-lg">
                          #{index + 1}
                        </span>
                      </div>

                      <div className="w-20 h-16 rounded-2xl overflow-hidden bg-neutral-100 flex-shrink-0">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg tracking-tight truncate">
                            {p.title}
                          </h3>
                          {p.password && (
                            <Shield size={13} className="text-neutral-400" />
                          )}
                          {p.status === "coming soon" && (
                            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-400 text-xs truncate">
                          {p.category} · {p.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => toggleFeature(p)}
                          className={`p-2.5 rounded-xl transition-colors ${
                            p.showOnHome
                              ? "bg-brand-teal text-white hover:bg-brand-teal/80"
                              : "text-neutral-400 hover:bg-neutral-100 hover:text-black"
                          }`}
                          title={p.showOnHome ? "Remove from Home" : "Feature on Home"}
                        >
                          <Star
                            size={16}
                            fill={p.showOnHome ? "currentColor" : "none"}
                          />
                        </button>
                        <Link
                          to={`/projects/${p.id}`}
                          target="_blank"
                          className="p-2.5 rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-black transition-colors"
                          title="View live page"
                        >
                          <ExternalLink size={16} />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(p)}
                          className="p-2.5 rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-black transition-colors"
                          title="Duplicate project"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => onEdit(p)}
                          className="p-2.5 rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-black transition-colors"
                          title="Edit project"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-2.5 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                          title="Delete project"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
