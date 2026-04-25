import React from 'react';
import { motion } from 'framer-motion';

interface StartScreenProps {
  onPlay: () => void;
}

export function StartScreen({ onPlay }: StartScreenProps) {
  return (
    <div className="w-full h-screen relative overflow-hidden flex flex-col items-center justify-center bg-pink-100">
      {/* 
        Background Video 
        Note: Please upload your video to the 'public' folder and name it 'background.mp4' 
      */}
      <video 
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/background.mp4" 
        autoPlay 
        loop 
        muted 
        playsInline
        onError={(e) => {
          // Fallback if video is not found
          e.currentTarget.style.display = 'none';
        }}
      />
      
      {/* Bottom Gradient for text readability */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-0" />

      <div className="relative z-10 flex flex-col items-center justify-end h-full w-full p-6 pb-8 md:pb-10 gap-4">
        <h1 className="text-white text-center tracking-wide drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] flex flex-col items-center">
          <span className="text-7xl md:text-8xl font-extrabold leading-none flex flex-row">
            <span className="text-red-500">C</span>
            <span className="text-orange-500">h</span>
            <span className="text-yellow-400">a</span>
            <span className="text-lime-400">r</span>
            <span className="text-green-500">l</span>
            <span className="text-teal-400">o</span>
            <span className="text-cyan-400">t</span>
            <span className="text-blue-500">t</span>
            <span className="text-indigo-400">e</span>
            <span className="text-purple-500">'</span>
            <span className="text-fuchsia-500">s</span>
          </span>
          <span className="text-3xl md:text-4xl font-bold text-pink-100 mt-1">Great Animal Race</span>
        </h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ 
            boxShadow: [
              "0px 0px 15px rgba(255, 255, 255, 0.4)", 
              "0px 0px 35px rgba(255, 255, 255, 0.9)", 
              "0px 0px 15px rgba(255, 255, 255, 0.4)"
            ] 
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          onClick={onPlay}
          className="bg-zinc-900 text-white font-bold text-6xl md:text-7xl py-2 px-24 rounded-full hover:bg-zinc-800 transition-colors mt-2 leading-tight [text-shadow:0_0_20px_rgba(255,255,255,0.8)]"
        >
          PLAY
        </motion.button>
      </div>
    </div>
  );
}
