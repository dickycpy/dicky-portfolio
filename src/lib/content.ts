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
