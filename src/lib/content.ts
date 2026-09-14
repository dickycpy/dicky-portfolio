// -----------------------------------------------------------------------------
// Page content CMS (Phase 1: Home + About)
//
// Each editable page has a typed content model and a matching DEFAULT_* object.
// The DEFAULT_* objects mirror the hard-coded copy that used to live inline in
// the page components EXACTLY, so a page renders identically until an admin
// edits it. Content is stored per-page in Firestore under `settings/<page>`.
//
// Rich text markup (see RichText.tsx):
//   *teal*    -> teal accent span
//   **bold**  -> bold black span
//   \n        -> line break
// -----------------------------------------------------------------------------
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";

// --- Content models ---------------------------------------------------------

export interface HomeContent {
  eyebrow: string; // "Hey, I'm Dicky."
  headshot: string; // profile pic URL
  heroHeadline: string; // rich text
  heroSub: string; // rich text
  heroPills: string[];
  aboutHeadline: string; // rich text
  aboutBody: string; // rich text
  aboutPills: string[];
  aboutCta: string; // button label
  aboutImage: string; // image URL
}

export interface AboutContent {
  headline: string; // rich text
  sub: string; // rich text
  pills: string[];
}

// --- Career path (About page accordion) -------------------------------------

export interface CareerClient {
  name: string;
  logo: string;
}

export interface CareerCheckpoint {
  periodSub: string;
  title: string;
  company: string;
  location: string;
  industry: string;
  handle?: string;
  logo: string;
  bullets: string[];
  clients: CareerClient[];
  caseStudyTitle?: string;
  caseStudyLink?: string;
}

export interface CareerContent {
  journey: CareerCheckpoint[];
}

// --- Expertise (About page skill groups) ------------------------------------

// One expertise group: a heading (e.g. "UX / UI Design") and its skill tags.
export interface ExpertiseGroup {
  label: string;
  items: string[];
}

export interface ExpertiseContent {
  heading: string; // section eyebrow, e.g. "Expertise"
  groups: ExpertiseGroup[];
}

// --- Contact page -----------------------------------------------------------

export interface ContactContent {
  eyebrow: string;
  headline: string; // rich text (newline = line break)
  intro: string;
  email: string;
  socialLabel: string;
  socialUrl: string;
  cardTitle: string;
  cardSubtitle: string;
}

// --- Site-wide (logo wall + footer) -----------------------------------------

// A footer social link. `platform` selects which logo icon renders (see the
// icon map in Footer.tsx); `url` is where it points.
export interface SocialLink {
  platform: string;
  url: string;
}

// Platforms offered in the admin dropdown. Keep `value` in sync with the icon
// map in Footer.tsx.
export const SOCIAL_PLATFORMS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "github", label: "GitHub" },
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "X / Twitter" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "dribbble", label: "Dribbble" },
  { value: "behance", label: "Behance" },
  { value: "email", label: "Email" },
  { value: "website", label: "Website / Other" },
] as const;

export interface SiteContent {
  logoWallHeading: string;
  logos: string[]; // image URLs
  footerCopyright: string;
  footerTagline: string;
  // Preferred: a list of social links rendered as logo icons in the footer.
  footerSocials: SocialLink[];
  // Legacy single link (kept for backward-compat with old docs; used as a
  // fallback only if footerSocials is empty).
  footerLinkLabel?: string;
  footerLinkUrl?: string;
  // Per-page navbar visibility. Keyed by NAV_PAGES `key`. A page is shown
  // unless its value is explicitly `false`, so pages added later (and old
  // docs missing this map) default to visible.
  pageVisibility?: Record<string, boolean>;
}

// Canonical list of top-level pages that can be shown/hidden in the navbar.
// Add future pages here so they appear in the admin visibility editor.
export const NAV_PAGES = [
  { key: "home", label: "Home", path: "/" },
  { key: "projects", label: "Projects", path: "/projects" },
  { key: "about", label: "About", path: "/about" },
  { key: "blogs", label: "Blogs", path: "/blogs" },
  { key: "contact", label: "Contact", path: "/contact" },
  { key: "resume", label: "Resume", path: "/resume" },
] as const;

export type PageKey = (typeof NAV_PAGES)[number]["key"];

// A page is visible unless explicitly turned off (default-visible semantics).
export function isPageVisible(
  vis: Record<string, boolean> | undefined,
  key: string
): boolean {
  return !vis || vis[key] !== false;
}

// --- Defaults (must match the current live copy verbatim) -------------------

export const DEFAULT_HOME: HomeContent = {
  eyebrow: "Hey, I'm Dicky.",
  headshot: "https://i.postimg.cc/WztpmZMX/profile-pic.jpg",
  heroHeadline: "a *Product BA*\nwith a *designer's eye*.",
  heroSub:
    "I bridge users, stakeholders & dev — sitting with people to uncover the real pain points, then turning them into requirements a team can build.",
  heroPills: ["Requirements", "Stakeholder discovery", "UX-minded delivery"],
  aboutHeadline:
    "I *investigate problems* and design solutions that go beyond the UI.",
  aboutBody:
    "I sit with stakeholders, uncover the real pain points, and turn them into requirements the team can build — with a UX eye that keeps the end user in the picture.",
  aboutPills: ["User stories", "UAT & delivery", "Cross-team facilitation"],
  aboutCta: "About Me",
  aboutImage: "https://i.postimg.cc/YC24jvP6/creato.jpg",
};

export const DEFAULT_ABOUT: AboutContent = {
  headline: "I'm a *Business Analyst* embedded in the app team.",
  sub: "I turn messy problems into **clear requirements** — then ship them with the **developers** who build the product.",
  pills: ["Requirements", "Stakeholder discovery", "Ship with devs"],
};

export const DEFAULT_CONTACT: ContactContent = {
  eyebrow: "Get in touch",
  headline: "SAY\nHELLO.",
  intro:
    "I'm always open to new challenges and interesting projects. Whether you have a question or just want to have a chat, my inbox is always open.",
  email: "chu.dicky@outlook.com",
  socialLabel: "LinkedIn",
  socialUrl: "https://www.linkedin.com/in/dicky-chu/",
  cardTitle: "Based in Hong Kong",
  cardSubtitle: "Available for projects worldwide.",
};

export const DEFAULT_SITE: SiteContent = {
  logoWallHeading: "brands I've worked with",
  logos: [
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkBN6ErFLOxDlTPOo_vt_L4EqUKptPvQ_qQQ&s",
    "https://static.wixstatic.com/media/60ffec_5e361527dd784fa291294157f29dfe37~mv2.png/v1/fill/w_274,h_106,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/sidebyside_orange.png",
    "https://i0.wp.com/glide.hk/wp-content/uploads/2023/05/HKU_iDendron_Logo_black-2.png?resize=950%2C148&ssl=1",
    "https://i.postimg.cc/HL9M79k7/HKSTP.png",
    "https://ibmix.de/wp-content/uploads/2023/05/IBM-iX-Logo.png",
    "https://upload.wikimedia.org/wikipedia/zh/thumb/8/8c/The_Hong_Kong_Jockey_Club.svg/960px-The_Hong_Kong_Jockey_Club.svg.png",
    "https://wp.logos-download.com/wp-content/uploads/2024/01/STARLUX_Airlines_Logo.png?dl",
    "https://hongkongai.org/wp-content/uploads/2019/08/HKAI-LAB_RGB.png",
  ],
  footerCopyright: "© 2026 Dicky Chu's Portfolio.",
  footerTagline: "Made in Hong Kong 🇭🇰",
  footerSocials: [
    { platform: "linkedin", url: "https://www.linkedin.com/in/dicky-chu/" },
  ],
  footerLinkLabel: "LinkedIn",
  footerLinkUrl: "https://www.linkedin.com/in/dicky-chu/",
  pageVisibility: {
    home: true,
    projects: true,
    about: true,
    blogs: true,
    contact: true,
    resume: true,
  },
};

export const DEFAULT_CAREER: CareerContent = {
  journey: [
    {
      periodSub: "Dec 2025 – Present",
      title: "Business Analyst",
      company: "IBM Consulting · IBM iX",
      location: "Hong Kong",
      industry: "Consulting / AI Products",
      logo: "https://cdn.worldvectorlogo.com/logos/ibm.svg",
      bullets: [
        "Primary client-facing BA on AI-powered, phygital customer experiences — including an AI horse-selection station and a live race broadcast blending real-time odds with Generative AI content.",
        "Translated business needs into actionable requirements and System Requirement Specifications, then led offshore development teams through implementation and delivery.",
        "Ran SA briefings and drove SAT/UAT coordination and defect triage — analysing reproduction conditions across app logic, real-time (MQTT) events, data and environment config.",
        "Investigated complex production issues, owned root-cause analysis and RCA reports, and coordinated releases across SAT/PROD with client IT.",
        "Prepared PDLC documentation and ran client knowledge-transfer sessions and walkthroughs to drive user adoption.",
        "Philosophy: if it repeats, automate it — for the customer and for the team.",
      ],
      clients: [
        {
          name: "Hong Kong Jockey Club",
          logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Hong_Kong_Jockey_Club_logo.svg/1280px-Hong_Kong_Jockey_Club_logo.svg.png",
        },
      ],
      caseStudyTitle: "Gen-AI digital racing",
      caseStudyLink: "/projects/ai-ops",
    },
    {
      periodSub: "2022 – 2025",
      title: "Product Designer / BA",
      company: "ESSAA Limited",
      location: "Hong Kong",
      industry: "AI Marketing SaaS / STEM Education",
      handle: "creatogether.app",
      logo: "https://static.wixstatic.com/media/6e47aa_bd763a11882242e0b0c85f29a32be46c~mv2.png",
      bullets: [
        "Led end-to-end delivery of an AI-powered Marketing SaaS platform — from product discovery and technical scoping to sprint management, UAT and regression testing.",
        "Owned the product experience end to end: turned user and stakeholder needs into requirements and user flows, then worked closely with dev to ship them.",
        "Planned and ran a pilot onboarding workshop for 50+ external stakeholders across South America.",
        "Represented the product at international summits (Hong Kong, Taiwan, Vancouver), translating technical value into clear business impact for clients.",
      ],
      clients: [
        {
          name: "STARLUX",
          logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAJ1BMVEVHcEyXak2Ob02Ic02Xak2Xak2EdU2TbE2EdU2Xak2Ob02Xak2EdU2Z9D7zAAAADHRSTlMA/x0TsDTcdvRQj8fnoB3qAAAAbUlEQVQokdXS0Q6AIAgFUARKRf//e8vCtgb0Ui/dN3d2FZ0AHwXPLGSFk6YaWybxWDwY5NgIGDDqgaQW9eqYjDO6vf3IJMGeIwwU2jWtZ/OeVanZZ7lFSj9SLJFSXx3r/zeMjUSpZKensZ/xTTZjvwXsKgulDgAAAABJRU5ErkJggg==",
        },
        {
          name: "HKU iDendron",
          logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvKwjcCnJapeWjOqfAZZc6Z84hOEX2D6ZA2w&s",
        },
      ],
    },
  ],
};

export const DEFAULT_EXPERTISE: ExpertiseContent = {
  heading: "Expertise",
  groups: [
    {
      label: "UX / UI Design",
      items: [
        "User Research",
        "Wireframing & Prototyping",
        "Responsive Design Systems",
        "Interaction Design",
      ],
    },
    {
      label: "Visual & Brand Design",
      items: [
        "Brand Identity & Positioning",
        "Logo Design",
        "Visual Storytelling",
        "Design Systems",
      ],
    },
    {
      label: "Web & Product Development",
      items: [
        "Web Design (UX-focused)",
        "HTML / CSS / JavaScript",
        "CMS (WordPress, Wix)",
        "E-Commerce",
      ],
    },
    {
      label: "Content & Communication",
      items: [
        "Copywriting",
        "Content Strategy",
        "Blogging & Editorial",
        "Photo & Video Production",
      ],
    },
    {
      label: "Growth & Optimization",
      items: [
        "SEO / SEM",
        "Email Marketing",
        "Analytics",
        "Conversion Awareness",
      ],
    },
  ],
};

// --- Hook + persistence -----------------------------------------------------

// Loads page content from Firestore, merged over `defaults` so any missing
// field falls back to the built-in copy (page can never render blank).
// Returns `{ content, loading }`; realtime is not needed here (content is
// re-read on each mount).
export function usePageContent<T extends object>(
  page: string,
  defaults: T
): { content: T; loading: boolean } {
  const [content, setContent] = useState<T>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", page));
        if (alive && snap.exists()) {
          setContent({ ...defaults, ...(snap.data() as Partial<T>) });
        }
      } catch (e) {
        console.error(`Failed to load content for "${page}":`, e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return { content, loading };
}

export async function savePageContent<T extends object>(
  page: string,
  data: T
): Promise<void> {
  await setDoc(doc(db, "settings", page), data as any, { merge: true });
}
