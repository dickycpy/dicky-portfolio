// Shared types & constants for the Admin dashboard.
// Extracted from the former monolithic Admin.tsx (A7 refactor).

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
  subSections?: Record<string, SubSectionBlock[]>;
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
}

export type ListTab = "main" | "lab" | "home" | "config" | "media" | "resume";

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
