export default function Footer() {
  return (
    <footer className="px-6 md:px-12 lg:px-24 py-20 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-8 bg-white relative z-10">
      <p className="text-sm opacity-40">© 2026 Dicky Chu's Portfolio. All rights reserved.</p>
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
    </footer>
  );
}
