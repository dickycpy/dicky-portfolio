import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const links = [
  { name: "Home", path: "/" },
  { name: "Projects", path: "/projects" },
  { name: "About", path: "/about" },
  { name: "Blogs", path: "/blogs" },
  { name: "Contact", path: "/contact" },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-8 flex justify-between items-center mix-blend-difference text-white">
      <Link to="/" className="text-xl font-bold tracking-tighter uppercase">
        Dicky.
      </Link>
      <div className="flex gap-8">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              "text-sm font-medium tracking-tight transition-opacity hover:opacity-100",
              location.pathname === link.path ? "opacity-100" : "opacity-50"
            )}
          >
            {link.name}
            {location.pathname === link.path && (
              <motion.div
                layoutId="nav-underline"
                className="h-px bg-white w-full mt-0.5"
              />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
