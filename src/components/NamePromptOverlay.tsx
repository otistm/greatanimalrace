import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  show: boolean;
  onSubmit: (name: string) => void;
}

export function NamePromptOverlay({ show, onSubmit }: Props) {
  const [name, setName] = useState('');

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[150] flex flex-col items-center justify-center backdrop-blur-md bg-black/60 p-4 pointer-events-auto"
      >
        <motion.div 
          initial={{ y: 20, scale: 0.9, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          className="rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center border-4 border-pink-400 bg-transparent"
        >
          <h2 className="text-3xl font-black text-white text-center mb-2 drop-shadow-md">Name Your Toy!</h2>
          <p className="text-white/80 text-center mb-6 font-medium drop-shadow-sm">
            Give it a name so others can see it on the leaderboards.
          </p>
          
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sparkles"
            maxLength={20}
            className="w-full text-xl font-bold bg-white/20 border-2 border-white/30 rounded-xl px-4 py-3 mb-6 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 text-center text-white placeholder:text-white/50 shadow-inner"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) {
                onSubmit(name.trim());
              }
            }}
          />
          
          <button
            onClick={() => {
              if (name.trim()) onSubmit(name.trim());
            }}
            disabled={!name.trim()}
            className="w-full bg-pink-500 disabled:bg-white/20 disabled:text-white/40 text-white font-bold py-4 rounded-xl text-lg hover:bg-pink-600 transition-colors shadow-md disabled:shadow-none"
          >
            Ready to Play!
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
