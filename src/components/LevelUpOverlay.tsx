import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Star } from 'lucide-react';

interface Props {
  show: boolean;
  newAge: number;
  onClose: () => void;
}

export function LevelUpOverlay({ show, newAge, onClose }: Props) {
  const { width, height } = useWindowSize();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={400}
            gravity={0.15}
          />
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
            className="bg-white rounded-3xl p-8 md:p-10 max-w-sm w-full shadow-2xl text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400" />
            
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-10 -right-10 text-yellow-100 opacity-50 pointer-events-none"
            >
              <Star size={150} fill="currentColor" />
            </motion.div>

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", bounce: 0.6 }}
                className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-orange-500 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg border-4 border-white"
              >
                <span className="text-4xl font-black text-white">{newAge}</span>
              </motion.div>

              <h2 className="text-3xl md:text-4xl font-black text-zinc-800 mb-2 uppercase tracking-wide">
                Level Up!
              </h2>
              <p className="text-zinc-600 text-lg mb-8 font-medium">
                Your bunny is now {newAge} month{newAge !== 1 ? 's' : ''} old!
              </p>

              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold py-4 px-6 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-lg uppercase tracking-wider"
              >
                Awesome!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
