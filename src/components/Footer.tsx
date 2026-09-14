import { usePageContent, DEFAULT_SITE, SocialLink } from "@/lib/content";
import {
  Linkedin,
  Github,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Dribbble,
  Mail,
  Globe,
} from "lucide-react";

// Maps a platform value (see SOCIAL_PLATFORMS in content.ts) to its logo icon.
const ICONS: Record<string, any> = {
  linkedin: Linkedin,
  github: Github,
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  youtube: Youtube,
  dribbble: Dribbble,
  behance: Globe, // lucide has no Behance icon; fall back to a generic globe
  email: Mail,
  website: Globe,
};

const PLATFORM_LABEL: Record<string, string> = {
  linkedin: "LinkedIn",
  github: "GitHub",
  instagram: "Instagram",
  twitter: "X / Twitter",
  facebook: "Facebook",
  youtube: "YouTube",
  dribbble: "Dribbble",
  behance: "Behance",
  email: "Email",
  website: "Website",
};

function hrefFor(s: SocialLink): string {
  if (s.platform === "email" && s.url && !s.url.startsWith("mailto:")) {
    return `mailto:${s.url}`;
  }
  return s.url;
}

export default function Footer() {
  const { content } = usePageContent("site", DEFAULT_SITE);

  // Prefer the new multi-link list; fall back to the legacy single link.
  const socials: SocialLink[] =
    content.footerSocials && content.footerSocials.length > 0
      ? content.footerSocials
      : content.footerLinkUrl
      ? [{ platform: "linkedin", url: content.footerLinkUrl }]
      : [];

  return (
    <footer className="px-6 md:px-12 lg:px-24 py-20 border-t border-black/5 bg-brand-white relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-sm opacity-40 text-center md:text-left">
            {content.footerCopyright} <br className="md:hidden" />{" "}
            {content.footerTagline}
          </p>
          <div className="flex items-center gap-5">
            {socials
              .filter((s) => s.url)
              .map((s, i) => {
                const Icon = ICONS[s.platform] || Globe;
                const label = PLATFORM_LABEL[s.platform] || "Link";
                return (
                  <a
                    key={i}
                    href={hrefFor(s)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="text-neutral-500 hover:text-black transition-colors"
                  >
                    <Icon size={22} strokeWidth={1.75} />
                  </a>
                );
              })}
          </div>
        </div>
      </div>
    </footer>
  );
}
