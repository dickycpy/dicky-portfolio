import { motion } from "motion/react";

const brands = [
  "Google", "Apple", "Meta", "Amazon", "Netflix", "Microsoft", "Adobe", "Spotify"
];

export default function LogoWall() {
  return (
    <div className="w-full overflow-hidden py-20 border-y border-black/5">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: [0, -1000] }}
        transition={{
          repeat: Infinity,
          duration: 20,
          ease: "linear",
        }}
      >
        {[...brands, ...brands, ...brands].map((brand, i) => (
          <span
            key={i}
            className="text-4xl md:text-6xl font-bold tracking-tighter uppercase px-12 opacity-10"
          >
            {brand}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
