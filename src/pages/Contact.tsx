import { motion } from "motion/react";
import { ArrowUpRight, Mail, Linkedin } from "lucide-react";
import Magnetic from "@/components/Magnetic";

export default function Contact() {
  return (
    <div className="pt-40 md:pt-60 px-6 md:px-12 lg:px-24 pb-40">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8">Get in touch</p>
          <h1 className="text-7xl md:text-9xl font-bold tracking-tighter leading-none mb-20">
            SAY <br /> HELLO.
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-end">
          <div>
            <p className="text-2xl md:text-3xl font-medium tracking-tight leading-tight text-neutral-500 mb-12 max-w-xl">
              I'm always open to new challenges and interesting projects. Whether you have a question or just want to have a chat, my inbox is always open.
            </p>
            
            <div className="space-y-8">
              <div className="group">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Email</p>
                <Magnetic strength={0.1}>
                  <a 
                    href="mailto:chu.dicky@outlook.com" 
                    className="text-3xl md:text-5xl font-bold tracking-tighter hover:text-teal-600 transition-colors flex items-center gap-4"
                  >
                    chu.dicky@outlook.com
                    <ArrowUpRight size={32} className="text-neutral-200 group-hover:text-teal-600 group-hover:translate-x-2 group-hover:-translate-y-2 transition-all" />
                  </a>
                </Magnetic>
              </div>

              <div className="group">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Social</p>
                <Magnetic strength={0.1}>
                  <a 
                    href="https://www.linkedin.com/in/dicky-chu/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-3xl md:text-5xl font-bold tracking-tighter hover:text-teal-600 transition-colors flex items-center gap-4"
                  >
                    LinkedIn
                    <ArrowUpRight size={32} className="text-neutral-200 group-hover:text-teal-600 group-hover:translate-x-2 group-hover:-translate-y-2 transition-all" />
                  </a>
                </Magnetic>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="aspect-square w-full max-w-md bg-neutral-50 rounded-[3rem] border border-black/5 p-12 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10">
                <Mail size={40} className="text-black mb-6" />
                <h3 className="text-2xl font-bold tracking-tight">Based in Hong Kong</h3>
                <p className="text-neutral-500 mt-2">Available for projects worldwide.</p>
              </div>
              <div className="relative z-10 flex justify-between items-end">
                <p className="text-sm font-medium opacity-40">© 2026</p>
                <div className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center">
                  <ArrowUpRight size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
