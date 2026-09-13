import { useState, useEffect } from "react";
import { auth, db } from "@/firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { collection, onSnapshot, query } from "firebase/firestore";
import { AnimatePresence } from "motion/react";
import { motion } from "motion/react";
import { Plus, X, LogOut, Shield } from "lucide-react";
import { Project, ListTab } from "@/components/admin/types";
import { ToastProvider } from "@/components/admin/ToastProvider";
import ProjectForm from "@/components/admin/ProjectForm";
import ProjectList from "@/components/admin/ProjectList";
import MediaManager from "@/components/admin/MediaManager";
import ResumeEditor from "@/components/admin/ResumeEditor";
import ContentEditor, {
  type FieldSchema,
} from "@/components/admin/ContentEditor";
import CareerEditor from "@/components/admin/CareerEditor";
import { DEFAULT_HOME, DEFAULT_ABOUT } from "@/lib/content";

const HOME_SCHEMA: FieldSchema[] = [
  { key: "eyebrow", label: "Eyebrow greeting", type: "text" },
  { key: "headshot", label: "Headshot image URL", type: "url" },
  { key: "heroHeadline", label: "Hero headline", type: "richtext" },
  { key: "heroSub", label: "Hero sub-text", type: "richtext" },
  { key: "heroPills", label: "Hero keyword pills", type: "list" },
  { key: "aboutHeadline", label: "About-section headline", type: "richtext" },
  { key: "aboutBody", label: "About-section body", type: "richtext" },
  { key: "aboutPills", label: "About-section pills", type: "list" },
  { key: "aboutCta", label: "About button label", type: "text" },
  { key: "aboutImage", label: "About-section image URL", type: "url" },
];

const ABOUT_SCHEMA: FieldSchema[] = [
  { key: "headline", label: "Hero headline", type: "richtext" },
  { key: "sub", label: "Hero sub-text", type: "richtext" },
  { key: "pills", label: "Keyword pills", type: "list" },
];

export default function Admin() {
  const [user, setUser] = useState(auth.currentUser);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [listTab, setListTab] = useState<ListTab>("main");

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => setUser(u));
    const unsubProjects = onSnapshot(
      query(collection(db, "projects")),
      (snapshot) => {
        setProjects(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Project[]
        );
      },
      (err) => console.error("Firestore error in Admin:", err)
    );
    return () => {
      unsubAuth();
      unsubProjects();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const openNew = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-neutral-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-neutral-100">
            <Shield size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter mb-4">
            Admin Access
          </h1>
          <p className="text-neutral-500 mb-12">
            Please sign in with an authorized Google account to manage your
            portfolio.
          </p>
          <button
            onClick={handleLogin}
            className="w-full py-4 bg-black text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors"
          >
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  const tabs: { id: ListTab; label: string }[] = [
    { id: "main", label: "Main Project" },
    { id: "lab", label: "My Lab" },
    { id: "home", label: "Home Featured" },
    { id: "media", label: "Media" },
    { id: "resume", label: "Resume" },
    { id: "pageHome", label: "Home Page" },
    { id: "pageAbout", label: "About Page" },
    { id: "pageCareer", label: "Career Path" },
  ];

  const isContentTab =
    listTab === "pageHome" ||
    listTab === "pageAbout" ||
    listTab === "pageCareer";

  return (
    <ToastProvider>
      <div className="pt-24 md:pt-32 px-6 md:px-12 lg:px-24 pb-40 max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter">Dashboard</h1>
            <p className="text-neutral-400 mt-1">
              Welcome back, {user.displayName?.split(" ")[0]}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {!isContentTab && (
              <button
                onClick={() => (showForm ? closeForm() : openNew())}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors"
              >
                {showForm ? <X size={16} /> : <Plus size={16} />}{" "}
                {showForm ? "Cancel" : "New Project"}
              </button>
            )}
            <button
              onClick={() => signOut(auth)}
              className="p-3 text-neutral-400 hover:text-black transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <AnimatePresence>
          {showForm && (
            <ProjectForm
              key={editing?.id || "new"}
              editing={editing}
              existingProjects={projects}
              user={user}
              onDone={closeForm}
            />
          )}
        </AnimatePresence>

        <div className="space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <h2 className="text-3xl font-bold tracking-tighter">
              {isContentTab ? "Page Content" : "Existing Projects"}
            </h2>
            <div className="flex flex-wrap bg-neutral-100 p-1 rounded-2xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setListTab(tab.id)}
                  className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                    listTab === tab.id
                      ? "bg-white text-black shadow-sm"
                      : "text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {listTab === "pageHome" ? (
            <ContentEditor
              page="home"
              title="Home Page"
              description="Edit the Home hero and the About section. Changes go live on save."
              defaults={DEFAULT_HOME}
              schema={HOME_SCHEMA}
            />
          ) : listTab === "pageAbout" ? (
            <ContentEditor
              page="about"
              title="About Page"
              description="Edit the About page hero headline, sub-text and keyword pills."
              defaults={DEFAULT_ABOUT}
              schema={ABOUT_SCHEMA}
            />
          ) : listTab === "pageCareer" ? (
            <CareerEditor />
          ) : listTab === "resume" ? (
            <ResumeEditor />
          ) : listTab === "media" ? (
            <MediaManager projects={projects} />
          ) : (
            <ProjectList
              projects={projects}
              listTab={listTab}
              user={user}
              onEdit={openEdit}
            />
          )}
        </div>
      </div>
    </ToastProvider>
  );
}
