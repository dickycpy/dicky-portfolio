import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative Background Elements - Subtle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full pointer-events-none opacity-[0.03]">
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-teal rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-pink rounded-full blur-[150px]" />
      </div>

      {/* Content */}
      <div className="text-center z-10 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="text-xs font-bold uppercase tracking-[0.4em] text-neutral-300 mb-8 block">Error Code 404</span>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-tight">
            404 <span className="text-neutral-200">—</span> <br className="md:hidden" />
            <span className="text-brand-pink">Route Not Found</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-500 font-light mb-12 max-w-md mx-auto leading-relaxed">
            Looks like this train has left the track. <br className="hidden md:block" />
            The destination you're looking for doesn't exist.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row items-center justify-center gap-8"
        >
          <Link 
            to="/" 
            className="inline-block px-10 py-5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-brand-teal transition-all duration-300 shadow-lg hover:shadow-brand-teal/20"
          >
            Return to Home Station
          </Link>

          <Link 
            to="/projects" 
            className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors flex items-center gap-2 group"
          >
            Explore Projects <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
