import { usePageContent, DEFAULT_SITE } from "@/lib/content";

export default function Footer() {
  const { content } = usePageContent("site", DEFAULT_SITE);

  return (
    <footer className="px-6 md:px-12 lg:px-24 py-20 border-t border-black/5 bg-brand-white relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-sm opacity-40 text-center md:text-left">
            {content.footerCopyright} <br className="md:hidden" /> {content.footerTagline}
          </p>
          <div className="flex gap-8">
            <a
              href={content.footerLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium uppercase tracking-widest hover:opacity-60"
            >
              {content.footerLinkLabel}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
