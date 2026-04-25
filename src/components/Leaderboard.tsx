import React from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const ANIMAL_EMOJI: Record<string, string> = {
  bunny: '🐰',
  unicorn: '🦄',
  cow: '🐮',
  wolf: '🐺',
  lion: '🦁',
  owl: '🦉',
  tiger: '🐯',
  bear: '🐻',
  horse: '🐴',
  pig: '🐷',
  frog: '🐸',
};

export function Leaderboard({ gameId }: { gameId: string }) {
  const { entries, loading } = useLeaderboard(gameId);
  const { user, signIn, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[160px] animate-pulse mt-8 font-arcade">
        <div className="h-4 bg-gray-800 border-2 border-gray-700 w-1/2 mb-4"></div>
        <div className="w-32 h-10 bg-gray-800 border-2 border-gray-700"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full flex flex-col items-center justify-center mt-8 font-arcade">
        <p className="text-[#f1c40f] text-[10px] sm:text-xs mb-6 text-center text-glow uppercase leading-loose">Connection lost</p>
        <button 
          onClick={signIn}
          className="bg-blue-600 border-4 border-white text-white uppercase text-[10px] sm:text-xs py-4 px-6 cursor-pointer shadow-[4px_4px_0_0_#fff] active:shadow-none active:translate-y-1 transition-all"
        >
          Reconnect
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center font-arcade mt-8 mb-8">
      <div className="flex items-center gap-2 mb-8 w-full justify-center">
        <h3 className="text-lg sm:text-xl text-white text-glow uppercase">Top 3 Players</h3>
      </div>
      
      {loading ? (
        <div className="animate-pulse flex flex-col gap-4 w-full max-w-sm">
          {[1,2,3].map(i => (
            <div key={i} className="h-6 bg-gray-800 border-2 border-gray-700 w-full"></div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-[#f1c40f] text-[10px] sm:text-xs py-4 text-glow uppercase animate-pulse">Insert Coin to Play!</div>
      ) : (
        <div className="w-full max-w-sm flex flex-col gap-4">
          {entries.map((entry, idx) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={entry.userId} 
              className="flex items-center justify-between bg-transparent border-b-4 border-gray-800 pb-3 text-[10px] sm:text-[11px] text-white"
            >
              <div className="flex items-center gap-3">
                <span className={`${idx === 0 ? 'text-[#f1c40f] text-glow' : idx === 1 ? 'text-[#bdc3c7]' : idx === 2 ? 'text-[#cd7f32]' : 'text-gray-600'}`}>
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
                <span className="uppercase text-[#4fc3f7] truncate max-w-[80px] sm:max-w-[120px] flex items-center gap-2">
                  {entry.playerName} <span className="text-sm">{ANIMAL_EMOJI[entry.animalId] || '🐰'}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-[#f1c40f] text-glow text-[10px] sm:text-[11px]">
                  ★{(entry.totalStars ?? 0).toString().padStart(2, '0')}
                </span>
                <span className="text-white text-glow">{entry.score.toString().padStart(5, '0')}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
