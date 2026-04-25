import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface GlobalMessage {
  text: string;
  subtext?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
}

interface Props {
  message: GlobalMessage | null;
  onClose: () => void;
}

export function GlobalMessageOverlay({ message, onClose }: Props) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center backdrop-blur-md bg-black/40 pointer-events-auto p-4"
        >
          {message.showCloseButton && (
            <button 
              onClick={() => {
                if (message.onClose) message.onClose();
                onClose();
              }}
              className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
            >
              <X className="w-8 h-8" />
            </button>
          )}

          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center max-w-2xl w-full text-center"
          >
            <h2 
              className="text-white text-3xl md:text-5xl lg:text-6xl font-bold tracking-wide drop-shadow-xl mb-4"
            >
              {message.text}
            </h2>

            {message.subtext && (
              <p className="text-white/90 text-lg md:text-2xl font-medium drop-shadow-md mb-12 max-w-xl">
                {message.subtext}
              </p>
            )}
            
            <div className="flex flex-col gap-4 items-center mt-8">
              {message.primaryActionLabel && (
                <button 
                  onClick={() => {
                    if (message.onPrimaryAction) message.onPrimaryAction();
                    onClose();
                  }}
                  className="px-8 py-3 bg-white text-zinc-900 font-bold rounded-full text-lg sm:text-xl hover:bg-zinc-100 transition-colors shadow-2xl"
                >
                  {message.primaryActionLabel}
                </button>
              )}
              {message.secondaryActionLabel && (
                <button 
                  onClick={() => {
                    if (message.onSecondaryAction) message.onSecondaryAction();
                    onClose();
                  }}
                  className="px-8 py-3 bg-black/20 text-white font-bold rounded-full text-lg sm:text-xl hover:bg-black/30 transition-colors shadow-xl border-2 border-white/30 backdrop-blur-sm"
                >
                  {message.secondaryActionLabel}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
