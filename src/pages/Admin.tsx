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
import PageVisibilityEditor from "@/components/admin/PageVisibilityEditor";
import {
  DEFAULT_HOME,
  DEFAULT_ABOUT,
  DEFAULT_CONTACT,
  DEFAULT_SITE,
} from "@/lib/content";

const HOME_SCHEMA: FieldSchema[] = [
  { key: "eyebrow", label: "Eyebrow greeting", type: "text" },
  { key: "headshot", label: "Headshot / profile image", type: "image" },
  { key: "heroHeadline", label: "Hero headline", type: "richtext" },
  { key: "heroSub", label: "Hero sub-text", type: "richtext" },
  { key: "heroPills", label: "Hero keyword pills", type: "list" },
  { key: "aboutHeadline", label: "About-section headline", type: "richtext" },
  { key: "aboutBody", label: "About-section body", type: "richtext" },
  { key: "aboutPills", label: "About-section pills", type: "list" },
  { key: "aboutCta", label: "About button label", type: "text" },
  { key: "aboutImage", label: "About-section image", type: "image" },
];

const ABOUT_SCHEMA: FieldSchema[] = [
  { key: "headline", label: "Hero headline", type: "richtext" },
  { key: "sub", label: "Hero sub-text", type: "richtext" },
  { key: "pills", label: "Keyword pills", type: "list" },
];

const CONTACT_SCHEMA: FieldSchema[] = [
  { key: "eyebrow", label: "Eyebrow", type: "text" },
  {
    key: "headline",
    label: "Big headline",
    type: "richtext",
    hint: "Use a new line to split across two lines (e.g. SAY / HELLO.).",
  },
  { key: "intro", label: "Intro paragraph", type: "textarea" },
  { key: "email", label: "Email address", type: "text" },
  { key: "socialLabel", label: "Social link label", type: "text" },
  { key: "socialUrl", label: "Social link URL", type: "url" },
  { key: "cardTitle", label: "Side-card title", type: "text" },
  { key: "cardSubtitle", label: "Side-card subtitle", type: "text" },
];

// The logo wall shows on the Home page, so it is edited under the Home Page
// tab. Its data still lives in the site-wide doc (settings/site) because
// LogoWall + the footer both read settings/site — so this schema targets
// page="site" even though it appears under Home in the admin UI.
const LOGO_SCHEMA: FieldSchema[] = [
  { key: "logoWallHeading", label: "Logo wall heading", type: "text" },
  {
    key: "logos",
    label: "Brand logos",
    type: "imageList",
    hint: "Upload or paste a URL. Order = display order in the marquee.",
  },
];

const SITE_SCHEMA: FieldSchema[] = [
  { key: "footerCopyright", label: "Footer copyright line", type: "text" },
  { key: "footerTagline", label: "Footer tagline", type: "text" },
  { key: "footerLinkLabel", label: "Footer link label", type: "text" },
  { key: "footerLinkUrl", label: "Footer link URL", type: "url" },
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

  const navGroups: { label: string; items: { id: ListTab; label: string }[] }[] =
    [
      {
        label: "Page Content",
        items: [
          { id: "main", label: "Main Projects" },
          { id: "lab", label: "My Lab" },
          { id: "home", label: "Home Featured" },
          { id: "pageHome", label: "Home Page" },
          { id: "pageAbout", label: "About Page" },
          { id: "pageContact", label: "Contact Page" },
          { id: "pageSite", label: "Site-wide" },
        ],
      },
      {
        label: "Documents",
        items: [{ id: "resume", label: "Resume / CV" }],
      },
      {
        label: "Settings",
        items: [
          { id: "media", label: "Media" },
          { id: "pageNav", label: "Navigation" },
        ],
      },
    ];

  // The three project-list tabs are the only ones that show the "New Project"
  // button and the "Existing Projects" heading.
  const isProjectList =
    listTab === "main" || listTab === "lab" || listTab === "home";

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
            {isProjectList && (
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

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <aside className="lg:w-56 flex-shrink-0">
            <nav className="flex flex-wrap lg:block gap-x-4 gap-y-6 lg:space-y-6 lg:sticky lg:top-32">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 mb-2 px-3">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap lg:block gap-1 lg:space-y-1">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setListTab(item.id);
                          closeForm();
                        }}
                        className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors lg:w-full ${
                          listTab === item.id
                            ? "bg-black text-white shadow-sm"
                            : "text-neutral-500 hover:bg-neutral-100 hover:text-black"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          <div className="flex-1 min-w-0 space-y-8">
            {isProjectList && (
              <h2 className="text-3xl font-bold tracking-tighter">
                Existing Projects
              </h2>
            )}

            {listTab === "pageHome" ? (
            <div className="space-y-8">
              <ContentEditor
                page="home"
                title="Home Page"
                description="Edit the Home hero and the About section. Changes go live on save."
                defaults={DEFAULT_HOME}
                schema={HOME_SCHEMA}
              />
              <ContentEditor
                page="site"
                title="Logo wall"
                description="The 'brands I've worked with' marquee shown on the Home page. Order = display order."
                defaults={DEFAULT_SITE}
                schema={LOGO_SCHEMA}
              />
            </div>
          ) : listTab === "pageAbout" ? (
            <div className="space-y-8">
              <ContentEditor
                page="about"
                title="About Page"
                description="Edit the About page hero headline, sub-text and keyword pills."
                defaults={DEFAULT_ABOUT}
                schema={ABOUT_SCHEMA}
              />
              <CareerEditor />
            </div>
          ) : listTab === "pageContact" ? (
            <ContentEditor
              page="contact"
              title="Contact Page"
              description="Edit the Contact page copy, email, and social link. Changes go live on save."
              defaults={DEFAULT_CONTACT}
              schema={CONTACT_SCHEMA}
            />
          ) : listTab === "pageSite" ? (
            <ContentEditor
              page="site"
              title="Site-wide"
              description="Edit the footer, shown across the whole site. (The logo wall is now edited under Home Page.)"
              defaults={DEFAULT_SITE}
              schema={SITE_SCHEMA}
            />
          ) : listTab === "pageNav" ? (
            <PageVisibilityEditor />
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
      </div>
    </ToastProvider>
  );
}
