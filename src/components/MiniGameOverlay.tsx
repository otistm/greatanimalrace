import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Carrot, Gamepad2 } from 'lucide-react';
import { Leaderboard } from './Leaderboard';
import { GAMES } from '../games/registry';

interface MiniGameOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (gameId: string, level: number) => void;
  ageInMonths: number;
  initialGameId?: string | null;
  gameProgress?: Record<string, { unlockedLevel: number; stars: Record<number, number> }>;
}

const GAME_ICONS: Record<string, React.ReactNode> = {
  toy_bin_bonanza: <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />,
  swaddle_gami: <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />,
  naptime_runner: <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500" />,
  hide_and_seek: <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />,
  tiny_chef: <Carrot className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />,
  bottle_rama: <Gamepad2 className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />,
};

export function MiniGameOverlay({ isOpen, onClose, onStartGame, ageInMonths, initialGameId, gameProgress = {} }: MiniGameOverlayProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevInitial, setPrevInitial] = useState(initialGameId);

  if (isOpen !== prevIsOpen || initialGameId !== prevInitial) {
    setPrevIsOpen(isOpen);
    setPrevInitial(initialGameId);
    if (isOpen) {
      setSelectedGame(initialGameId || null);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="overlay-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110] p-2 sm:p-4 pointer-events-auto"
          onClick={() => {
            onClose();
          }}
        >
          <AnimatePresence mode="wait">
            {!selectedGame ? (
              <motion.div
                key="white-menu"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.15 }}
                className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 w-[95vw] sm:w-[85vw] md:w-[75vw] lg:max-w-2xl max-h-[85dvh] flex flex-col shadow-2xl relative overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="absolute top-0 left-0 w-full h-2 sm:h-3 bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 shrink-0" />
                
                <div className="flex justify-end mb-2 sm:mb-4 mt-1 sm:mt-2 shrink-0">
                  <button 
                    onClick={() => {
                      onClose();
                    }} 
                    className="text-zinc-400 hover:text-zinc-800 transition-colors bg-zinc-100 hover:bg-zinc-200 p-1.5 sm:p-2 rounded-full shrink-0"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 shrink-0">
                    <div className="p-2 sm:p-3 bg-sky-100 rounded-xl sm:rounded-2xl text-sky-500 shrink-0">
                      <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-zinc-800 truncate">Mini Games</h2>
                  </div>

                  <div className="overflow-y-auto min-h-0 custom-scrollbar flex-1 pr-1 sm:pr-2">
                    <div className="space-y-3 sm:space-y-4 pb-2">
                      {GAMES.map(game => {
                        const isLocked = ageInMonths < game.unlockMonth;
                        return (
                          <button
                            key={game.id}
                            onClick={() => !isLocked && setSelectedGame(game.id)}
                            className={`w-full flex items-center p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all text-left ${
                              isLocked 
                                ? 'border-gray-100 bg-gray-50 opacity-75 cursor-not-allowed' 
                                : 'border-transparent bg-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                          >
                            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl mr-3 sm:mr-4 shrink-0 flex items-center justify-center ${isLocked ? 'bg-gray-200 text-gray-400' : game.color}`}>
                              {isLocked ? <Lock className="w-6 h-6 sm:w-8 sm:h-8" /> : GAME_ICONS[game.id]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-bold text-base sm:text-lg md:text-xl truncate ${isLocked ? 'text-gray-500' : 'text-zinc-800'}`}>
                                {game.name}
                              </h3>
                              {isLocked && (
                                <p className="text-xs sm:text-sm text-[#FF6B6B] font-medium truncate">
                                  Unlocks at {game.unlockMonth} months
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="arcade-menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 z-[120] bg-black font-arcade text-white flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                <div className="absolute inset-0 flex flex-col crt-flicker">
                  <div className="scanlines pointer-events-none"></div>
                </div>
                <div className="relative z-20 flex flex-col items-center flex-1 py-10 px-4 text-center max-w-[600px] mx-auto w-full h-full overflow-y-auto custom-scrollbar">
                  <button 
                    onClick={() => setSelectedGame(null)}
                    className="absolute top-4 left-4 text-white hover:text-gray-300 p-2 z-30"
                  >
                    <X className="w-6 h-6 sm:w-8 sm:h-8" />
                  </button>

                  {GAMES.filter(g => g.id === selectedGame).map(game => (
                    <div key="rules" className="flex flex-col items-center w-full mt-8 sm:mt-12">
                      <h1 className="text-2xl sm:text-4xl text-white mb-6 leading-loose text-glow text-center break-words w-full px-2">
                        {game.name.toUpperCase()}
                      </h1>
                      
                      <p className="text-gray-300 text-[10px] sm:text-xs mb-6 leading-loose uppercase max-w-md px-2">
                        {game.description}
                      </p>
                      
                      <div className="text-[#4fc3f7] text-[10px] sm:text-xs mb-8 uppercase text-glow">
                        REWARD: {game.xpRule}
                      </div>

                      <div className="w-full max-w-xs mx-auto mb-10 px-2">
                        <div className="flex flex-col gap-4">
                          {[1, 2, 3, 4, 5].map(level => {
                            const progress = gameProgress[game.id] || { unlockedLevel: 1, stars: {} };
                            const isLevelLocked = level > progress.unlockedLevel;
                            const stars = progress.stars[level] || 0;
                            
                            return (
                              <button
                                key={level}
                                disabled={isLevelLocked}
                                onClick={() => {
                                  onStartGame(game.id, level);
                                }}
                                className={`w-full py-4 px-4 border-4 uppercase text-[10px] sm:text-xs flex justify-between items-center transition-all ${
                                  isLevelLocked 
                                    ? 'bg-gray-800 border-gray-600 text-gray-600 shadow-[4px_4px_0_0_#555]' 
                                    : 'bg-blue-600 border-white text-white hover:bg-blue-500 cursor-pointer shadow-[4px_4px_0_0_#fff] active:shadow-none active:translate-y-1'
                                }`}
                              >
                                <span>LEVEL {level}</span>
                                <div className="flex gap-1.5">
                                  {[1, 2, 3].map(s => (
                                    <span key={s} className={`text-2xl leading-none ${s <= stars ? 'text-yellow-400 drop-shadow-[2px_2px_0_#d35400]' : 'text-gray-600 drop-shadow-[2px_2px_0_#000]'}`}>
                                      ★
                                    </span>
                                  ))}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="w-full max-w-md mx-auto px-2 mt-auto pb-8">
                        <Leaderboard gameId={game.id} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
