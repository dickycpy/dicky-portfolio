export default function Footer() {
  return (
    <footer className="px-6 md:px-12 lg:px-24 py-20 border-t border-black/5 bg-white relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-sm opacity-40 text-center md:text-left">
            © 2026 Dicky Chu's Portfolio. <br className="md:hidden" /> Made in Hong Kong 🇭🇰
          </p>
          <div className="flex gap-8">
            <a 
              href="https://www.linkedin.com/in/dicky-chu/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm font-medium uppercase tracking-widest hover:opacity-60"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
