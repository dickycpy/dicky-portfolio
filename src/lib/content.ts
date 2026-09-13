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
