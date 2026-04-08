import { motion } from "motion/react";

const logos = [
  "https://framerusercontent.com/images/2yzk4oh8i7AXOuW4AYGYIDklOM.png?scale-down-to=512&width=2560&height=956",
  "https://cdn.worldvectorlogo.com/logos/apple.svg",
  "https://cdn.worldvectorlogo.com/logos/meta-1.svg",
  "https://cdn.worldvectorlogo.com/logos/amazon-2.svg",
  "https://cdn.worldvectorlogo.com/logos/netflix-3.svg",
  "https://cdn.worldvectorlogo.com/logos/microsoft-5.svg",
  "https://cdn.worldvectorlogo.com/logos/adobe-2.svg",
  "https://cdn.worldvectorlogo.com/logos/spotify-1.svg"
];

export default function LogoWall() {
  return (
    <div className="w-full overflow-hidden py-20 border-y border-black/5">
      <motion.div
        className="flex whitespace-nowrap items-center"
        animate={{ x: [0, -1000] }}
        transition={{
          repeat: Infinity,
          duration: 30,
          ease: "linear",
        }}
      >
        {[...logos, ...logos, ...logos].map((logo, i) => (
          <div
            key={i}
            className="px-16 opacity-20 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500"
          >
            <img 
              src={logo} 
              alt="Brand Logo" 
              className="h-8 md:h-12 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
