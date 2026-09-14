// Shared types & constants for the Admin dashboard.
// Extracted from the former monolithic Admin.tsx (A7 refactor).

// A single case-study section. Sections are now stored per-project so their
// labels can be edited and they can be added / removed / reordered. The visible
// number (01, 02…) is derived from position, so it is NOT stored here.
export interface CaseStudySection {
  id: string;
  label: string;
}

export interface SubSectionBlock {
  title: string;
  content: string;
  image?: string;
  video?: string;
  imageDescription?: string;
  carouselImages?: string[];
  carouselDescription?: string;
}

export interface Project {
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
  homeSortOrder?: number;
  showOnHome?: boolean;
  password?: string;
  status?: "published" | "coming soon";
  // When true, the project is hidden from ALL public listings (Projects page,
  // Home featured). The detail page stays reachable by direct URL.
  hidden?: boolean;
  subSections?: Record<string, SubSectionBlock[]>;
  // Per-project case-study sections. Legacy projects have no `sections` field;
  // they fall back to DEFAULT_SECTIONS (see sectionsForProject()).
  sections?: CaseStudySection[];
  createdAt?: any;
  updatedAt?: any;
  authorId?: string;
  // Legacy flat fields (introductionImage, overview, etc.) may still exist on
  // older documents. They are no longer edited in the UI but are preserved on
  // write, so we keep an index signature for backward compatibility.
  [key: string]: any;
}

export interface ProjectFormData {
  title: string;
  description: string;
  category: string;
  type: "main" | "lab";
  role: string;
  timeline: string;
  tools: string;
  imageUrl: string;
  password: string;
  status: "published" | "coming soon";
  showOnHome: boolean;
  homeSortOrder: number;
  subSections: Record<string, SubSectionBlock[]>;
  sections: CaseStudySection[];
}

export type ListTab =
  | "main"
  | "lab"
  | "home"
  | "projects"
  | "media"
  | "resume"
  | "pageHome"
  | "pageAbout"
  | "pageContact"
  | "pageSite"
  | "pageNav";

// --- Resume / CV (print-to-PDF) ---------------------------------------------
export interface ResumeExperience {
  company: string;
  role: string;
  dateRange: string;
  bullets: string[];
}

export interface ResumeEducation {
  school: string;
  program: string;
  dateRange: string;
}

export interface ResumeCertification {
  name: string;
  issuer: string;
  dateRange: string;
}

export interface ResumeSkillGroup {
  label: string;
  items: string;
}

// Editable labels for the five built-in CV sections (so they aren't hardcoded).
export interface ResumeHeadings {
  summary: string;
  experience: string;
  education: string;
  certifications: string;
  skills: string;
}

// A generic, user-added CV section. `layout` picks how it renders/edits:
//  - "text"    → a single paragraph (like Executive Summary), uses `body`
//  - "entries" → title / subtitle / dates + bullets rows (like Experience), uses `entries`
//  - "list"    → "Label: comma-separated items" rows (like Skills), uses `items`
export type ResumeSectionLayout = "text" | "entries" | "list";

export interface ResumeCustomEntry {
  title: string;
  subtitle: string;
  dateRange: string;
  bullets: string[];
}

export interface ResumeCustomSection {
  id: string;
  heading: string;
  layout: ResumeSectionLayout;
  body: string;
  entries: ResumeCustomEntry[];
  items: ResumeSkillGroup[];
}

export interface ResumeData {
  title: string;
  name: string;
  email: string;
  phone: string;
  portfolioUrl: string;
  linkedinUrl: string;
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  certifications: ResumeCertification[];
  skills: ResumeSkillGroup[];
  // Editable section headings (optional for backward-compat with old docs).
  headings?: ResumeHeadings;
  // Extra sections the user adds beyond the five built-ins.
  customSections?: ResumeCustomSection[];
}

// A saved snapshot of the resume, for version history (e.g. "Sep 2026 v1").
export interface ResumeVersion {
  id: string;
  label: string;
  savedAt: number; // epoch ms
  data: ResumeData;
}

export const CATEGORIES = [
  "Artificial Intelligence",
  "Digital Marketing",
  "Interactive Experience",
] as const;

export const CASE_STUDY_SECTIONS = [
  { id: "introduction", label: "01. Introduction", num: "01" },
  { id: "challenge", label: "02. The Challenge", num: "02" },
  { id: "approach", label: "03. The Approach", num: "03" },
  { id: "understanding", label: "04. Understanding", num: "04" },
  { id: "define", label: "05. Define", num: "05" },
  { id: "developDeliver", label: "06. Develop & Deliver", num: "06" },
  { id: "reflection", label: "07. Reflection", num: "07" },
] as const;

// The default case-study sections a NEW project starts with, and the fallback
// for legacy projects saved before sections were editable. Labels carry no
// number prefix — the 01/02… is derived from position at render time so that
// reordering and add/remove renumber automatically.
export const DEFAULT_SECTIONS: CaseStudySection[] = [
  { id: "introduction", label: "Introduction" },
  { id: "challenge", label: "The Challenge" },
  { id: "approach", label: "The Approach" },
  { id: "understanding", label: "Understanding" },
  { id: "define", label: "Define" },
  { id: "developDeliver", label: "Develop & Deliver" },
  { id: "reflection", label: "Reflection" },
];

// Zero-padded section number from a 1-based position ("01", "02", …).
export const pad2 = (n: number): string => String(n).padStart(2, "0");

// Stable unique id for a newly added section.
export const newSectionId = (): string =>
  `sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// A project's sections, or the built-in defaults for legacy docs. Returns fresh
// copies so callers can safely mutate the array/objects.
export function sectionsForProject(
  sections?: CaseStudySection[]
): CaseStudySection[] {
  const src = sections && sections.length ? sections : DEFAULT_SECTIONS;
  return src.map((s) => ({ ...s }));
}

export const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "clean"],
  ],
};

export const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "link",
];

// A8 fix: status is always present so the <select> stays controlled after reset.
export const emptyFormData = (): ProjectFormData => ({
  title: "",
  description: "",
  category: "Artificial Intelligence",
  type: "main",
  role: "",
  timeline: "",
  tools: "",
  imageUrl: "",
  password: "",
  status: "published",
  showOnHome: false,
  homeSortOrder: 0,
  subSections: {},
  sections: sectionsForProject(),
});

export const projectToFormData = (p: Project): ProjectFormData => ({
  title: p.title || "",
  description: p.description || "",
  category: p.category || "Artificial Intelligence",
  type: p.type || "main",
  role: p.role || "",
  timeline: p.timeline || "",
  tools: p.tools?.join(", ") || "",
  imageUrl: p.image || "",
  password: p.password || "",
  status: p.status || "published",
  showOnHome: p.showOnHome || false,
  homeSortOrder: p.homeSortOrder || 0,
  subSections: p.subSections || {},
  sections: sectionsForProject(p.sections),
});

// Basic required-field validation (A3). Returns a map of field -> message.
export function validateForm(
  data: ProjectFormData,
  hasCoverFile: boolean
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.title.trim()) errors.title = "Project title is required.";
  if (!data.description.trim())
    errors.description = "A short description is required.";
  if (!data.role.trim()) errors.role = "Role is required.";
  if (!data.timeline.trim()) errors.timeline = "Timeline is required.";
  if (!data.tools.trim()) errors.tools = "Add at least one tool.";
  if (!data.imageUrl.trim() && !hasCoverFile)
    errors.imageUrl = "A cover image (URL or upload) is required.";
  return errors;
}
