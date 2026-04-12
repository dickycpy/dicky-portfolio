import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { name: "Home", path: "/" },
  { name: "Projects", path: "/projects" },
  { name: "About", path: "/about" },
  { name: "Blogs", path: "/blogs" },
  { name: "Contact", path: "/contact" },
  { name: "Admin", path: "/admin" },
];

export default function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 w-full z-[100] transition-all duration-500 ease-in-out px-6 md:px-12",
          scrolled ? "py-4 md:py-6" : "py-6 md:py-10"
        )}
      >
        <nav 
          className={cn(
            "max-w-7xl mx-auto flex justify-between items-center transition-all duration-500 ease-in-out rounded-full px-6 py-3 md:py-4",
            scrolled 
              ? "bg-white/60 backdrop-blur-xl border border-white/20 shadow-md" 
              : "bg-white/10 backdrop-blur-md border border-black/5"
          )}
        >
          <Link 
            to="/" 
            className="text-xl font-bold tracking-tighter uppercase group flex items-center gap-2"
          >
            <motion.span 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              Dicky.
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full" />
            </motion.span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "relative px-5 py-2 text-sm font-medium tracking-tight transition-all duration-300 rounded-full",
                    isActive 
                      ? "text-black" 
                      : "text-neutral-500 hover:text-black hover:bg-black/5"
                  )}
                >
                  <span className="relative z-10">{link.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white shadow-sm border border-neutral-100 rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile Toggle */}
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="md:hidden p-3 bg-black/5 hover:bg-black/10 rounded-2xl transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu size={22} />
          </motion.button>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] md:hidden"
          >
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            
            {/* Menu Content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 w-[80%] h-full bg-white/80 backdrop-blur-2xl border-l border-white/20 shadow-2xl p-12 flex flex-col justify-center gap-10"
            >
              <div className="flex flex-col gap-6">
                {links.map((link, index) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={link.path}
                      className={cn(
                        "text-4xl font-bold tracking-tighter transition-all duration-300 block",
                        location.pathname === link.path 
                          ? "text-black translate-x-4" 
                          : "text-neutral-300 hover:text-black hover:translate-x-2"
                      )}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="mt-auto pt-12 border-t border-neutral-100">
                <div className="flex gap-6">
                  <a 
                    href="https://www.linkedin.com/in/dicky-chu/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm font-medium text-neutral-500 hover:text-black transition-colors"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
