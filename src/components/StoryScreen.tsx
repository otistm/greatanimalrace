import React from 'react';
import { motion } from 'framer-motion';

interface StoryScreenProps {
  onContinue: () => void;
}

export function StoryScreen({ onContinue }: StoryScreenProps) {
  return (
    <div className="w-full h-screen bg-sky-100 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[20%] w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white/90 backdrop-blur-md p-8 md:p-12 rounded-[2rem] shadow-2xl max-w-2xl text-center z-10 border-2 border-zinc-200"
      >
        <p className="text-xl md:text-3xl text-zinc-800 font-medium leading-relaxed mb-10">
          I just turned 1, but all my teddies are sad that they can't be 1 too. So, I came up with a fun idea! Help them grow just like my Mama and Baba did for me. Work fast because the first person to get one of my teddies to 1 will get a cool prize. 
          <br/><br/>
          <span className="font-extrabold text-zinc-900">Good luck and Happy Birthday to me!!!</span>
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onContinue}
          className="bg-zinc-900 text-white font-bold text-xl md:text-2xl py-4 px-12 rounded-full shadow-lg hover:bg-zinc-800 transition-colors"
        >
          Continue
        </motion.button>
      </motion.div>
    </div>
  );
}
