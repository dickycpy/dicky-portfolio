import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Home, ArrowRight, TrainFront } from "lucide-react";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-brand-teal rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-pink rounded-full blur-[120px]" />
      </div>

      {/* Vector Train Track Illustration (CSS) */}
      <div className="relative mb-12">
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative"
        >
          {/* Track */}
          <div className="h-1 w-64 bg-neutral-200 rounded-full relative">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className="absolute top-0 w-[2px] h-4 bg-neutral-200 -translate-y-1/2" 
                style={{ left: `${i * 14}%` }}
              />
            ))}
          </div>
          
          {/* Train Icon */}
          <motion.div
            animate={{ 
              y: [0, -4, 0],
              rotate: [0, -2, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute -top-10 left-1/4 text-brand-teal"
          >
            <TrainFront size={48} strokeWidth={1.5} />
          </motion.div>

          {/* Broken Track Part */}
          <div className="absolute right-0 top-0 h-1 w-16 bg-neutral-100 rounded-full rotate-12 origin-left translate-x-full" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-4">
            404 <span className="text-neutral-200">—</span> <span className="text-brand-pink">Route Not Found</span>
          </h1>
          <p className="text-xl md:text-2xl text-neutral-500 font-light mb-12 max-w-lg mx-auto leading-relaxed">
            Looks like this train has left the track. <br className="hidden md:block" />
            The destination you're looking for doesn't exist.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col md:flex-row items-center justify-center gap-6"
        >
          <Link 
            to="/" 
            className="group relative px-8 py-4 bg-black text-white rounded-full font-bold uppercase tracking-widest text-xs flex items-center gap-3 overflow-hidden transition-all hover:pr-12"
          >
            <span className="relative z-10">Return to Home Station</span>
            <Home size={16} className="relative z-10" />
            <ArrowRight 
              size={16} 
              className="absolute right-4 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" 
            />
            <div className="absolute inset-0 bg-brand-teal translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Link>

          <Link 
            to="/projects" 
            className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors flex items-center gap-2"
          >
            Explore Projects <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>

      {/* Floating Elements */}
      <motion.div 
        animate={{ 
          y: [0, 20, 0],
          x: [0, 10, 0]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-1/4 w-4 h-4 rounded-full border-2 border-brand-teal opacity-20"
      />
      <motion.div 
        animate={{ 
          y: [0, -30, 0],
          x: [0, -15, 0]
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 left-1/4 w-6 h-6 rounded-full border-2 border-brand-pink opacity-20"
      />
    </div>
  );
};

export default NotFound;
