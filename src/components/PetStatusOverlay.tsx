import React, { useState } from 'react';
import { X, Lock, Unlock, Star, Trophy, LogOut, CheckCircle, Edit2, Check, Package, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useUserHighScores } from '../hooks/useUserHighScores';
import { useGlobalRank } from '../hooks/useGlobalRank';
import { useUnreadCounts } from '../hooks/useChat';
import { GAMES } from '../games/registry';

interface GameProgress {
  unlockedLevel: number;
  stars: Record<number, number>;
}

interface Props {
  ageInMonths: number;
  currentXp: number;
  requiredXp: number;
  onClose: () => void;
  animalName: string;
  onNameChange: (newName: string) => void;
  onResetGame: () => void;
  onOpenLeaderboard: () => void;
  onOpenMessages: () => void;
  onSelectGame: (gameId: string) => void;
  gameProgress?: Record<string, GameProgress>;
  chestsOpened?: number;
  chestsTotal?: number;
}

export function PetStatusOverlay({ ageInMonths, currentXp, requiredXp, onClose, animalName, onNameChange, onResetGame, onOpenLeaderboard, onOpenMessages, onSelectGame, gameProgress = {}, chestsOpened = 0, chestsTotal = 0 }: Props) {
  const progressPercent = Math.min(100, (currentXp / requiredXp) * 100);
  const { user } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(animalName);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const unlockedGameIds = GAMES.filter(g => ageInMonths >= g.unlockMonth).map(g => g.id);
  const highScores = useUserHighScores(unlockedGameIds);
  const { rank, loading: rankLoading } = useGlobalRank(ageInMonths);
  const unread = useUnreadCounts();

  const handleSaveName = () => {
    if (editNameValue.trim() !== '') {
      onNameChange(editNameValue.trim());
    } else {
      setEditNameValue(animalName);
    }
    setIsEditingName(false);
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110] p-2 sm:p-4 pointer-events-auto"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 w-[95vw] sm:w-[85vw] md:w-[75vw] lg:max-w-2xl max-h-[85dvh] flex flex-col shadow-2xl relative overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="absolute top-0 left-0 w-full h-2 sm:h-3 bg-gradient-to-r from-pink-400 via-purple-400 to-sky-400 shrink-0" />
          
          <div className="flex justify-end mb-4 sm:mb-6 mt-1 sm:mt-2 shrink-0">
            <button 
              onClick={onClose} 
              className="text-zinc-400 hover:text-zinc-800 transition-colors bg-zinc-100 hover:bg-zinc-200 p-1.5 sm:p-2 rounded-full shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="flex justify-center items-center mb-4 sm:mb-6 md:mb-8 shrink-0 relative">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={20}
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') {
                      setIsEditingName(false);
                      setEditNameValue(animalName);
                    }
                  }}
                  autoFocus
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-zinc-800 bg-zinc-100 border-2 border-pink-400 rounded-xl px-4 py-1 w-48 sm:w-64 text-center focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
                <button
                  onClick={handleSaveName}
                  className="bg-pink-500 hover:bg-pink-600 text-white p-2 rounded-full transition-colors shadow-md"
                >
                  <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-zinc-800 capitalize">{animalName}</h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-zinc-400 hover:text-pink-500 transition-colors p-2 rounded-full hover:bg-pink-50"
                  aria-label="Edit pet name"
                >
                  <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="overflow-y-auto min-h-0 custom-scrollbar flex-1 pr-1 sm:pr-2">
            <div className="mb-4 sm:mb-6 md:mb-8 shrink-0 flex flex-col gap-2">
              <button 
                onClick={onOpenLeaderboard}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold text-sm sm:text-base transition-all hover:shadow-md flex items-center justify-center gap-2 shadow-sm"
              >
                <Trophy className="w-5 h-5 text-amber-100" />
                View Global Leaderboard 
                {rankLoading ? <span className="opacity-75 font-medium ml-1">...</span> : rank ? <span className="opacity-90 font-medium ml-1">(Rank #{rank})</span> : ''}
              </button>
              <button
                onClick={onOpenMessages}
                className="relative w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-sm sm:text-base transition-all hover:shadow-md flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-5 h-5 text-sky-100" />
                Messages
                {(unread.world > 0 || Object.keys(unread.dms).length > 0) && (
                  <span className="ml-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center justify-center shadow-sm border border-white/40">
                    {(() => {
                      const n = unread.world + Object.keys(unread.dms).length;
                      return n > 9 ? '9+' : n;
                    })()}
                  </span>
                )}
              </button>
            </div>

            {chestsTotal > 0 && (
              <div className="mb-4 sm:mb-6 md:mb-8 shrink-0">
                <div className="bg-amber-50 rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 border-2 border-amber-100">
                  <div className="flex justify-between items-center mb-1 sm:mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" strokeWidth={2.5} />
                      <span className="text-[10px] sm:text-xs md:text-sm font-bold text-amber-700 uppercase tracking-wider">Chests Opened</span>
                    </div>
                    <span className="text-[10px] sm:text-xs md:text-sm font-black text-amber-600">{chestsOpened} / {chestsTotal}</span>
                  </div>
                  <div className="h-2 sm:h-3 bg-amber-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(chestsOpened / chestsTotal) * 100}%` }}
                      className="h-full bg-amber-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-[#FF6B6B] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8 shadow-lg shrink-0">
              <div className="flex justify-between items-end mb-2 sm:mb-4">
                <div>
                  <p className="text-[10px] sm:text-xs text-white/80 font-bold uppercase tracking-widest mb-0.5 sm:mb-1">Age</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white">{ageInMonths}</span>
                    <span className="text-sm sm:text-lg md:text-xl font-bold text-white/90">mo</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] sm:text-xs text-white/80 font-bold uppercase tracking-widest mb-0.5 sm:mb-1">Next Month</p>
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-xl sm:text-2xl md:text-3xl font-black text-white">{currentXp}</span>
                    <span className="text-xs sm:text-sm font-bold text-white/80">/ {requiredXp} XP</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 sm:h-3 bg-black/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-white rounded-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5 px-1 sm:px-2 shrink-0">
              <Trophy className="text-[#FFD166] w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-zinc-800 tracking-wide">Games</h3>
            </div>

            <div className="space-y-2 sm:space-y-3 pb-2">
              {GAMES.map((game, i) => {
                const isUnlocked = ageInMonths >= game.unlockMonth;
                const topScore = highScores[game.id];
                const progress = gameProgress[game.id];
                const totalStars = progress
                  ? [1, 2, 3, 4, 5].reduce((sum, lv) => sum + (progress.stars[lv] || 0), 0)
                  : 0;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (isUnlocked && onSelectGame) {
                        onSelectGame(game.id);
                      }
                    }}
                    disabled={!isUnlocked}
                    className={`w-full flex items-center justify-between p-2.5 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl transition-all ${
                      isUnlocked 
                        ? 'bg-[#8B80F9] hover:bg-[#7A6FE5] text-white shadow-md cursor-pointer focus:scale-[0.98] active:scale-[0.98] hover:scale-[0.98]' 
                        : 'bg-zinc-50 text-zinc-400 border border-zinc-100 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
                      <div className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg sm:rounded-xl shrink-0 ${isUnlocked ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                        {isUnlocked ? <Unlock className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} /> : <Lock className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />}
                      </div>
                      <div className="flex flex-col items-start min-w-0">
                        <span className={`font-bold text-sm sm:text-base md:text-lg tracking-wide truncate ${isUnlocked ? 'text-white' : 'text-zinc-500'}`}>
                          {game.name}
                        </span>
                        {isUnlocked && (
                          <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-white/90 leading-none mt-1">
                            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-300" fill="currentColor" strokeWidth={0} />
                            <span>{totalStars}/15</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {isUnlocked ? (
                      <div className="flex flex-col items-end shrink-0 ml-2">
                        <span className="text-[10px] sm:text-xs text-white/80 font-bold uppercase tracking-widest leading-none mb-1">Top Score</span>
                        <span className="text-sm sm:text-base md:text-lg font-black text-white leading-none">
                          {topScore !== undefined ? topScore.toLocaleString() : '-'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] sm:text-xs font-bold text-zinc-400 bg-zinc-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap">
                        Month {game.unlockMonth}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 pt-6 border-t border-zinc-100 shrink-0 space-y-3">
              {showResetConfirm ? (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
                  <span className="text-red-700 font-bold text-xs sm:text-sm pr-2">Delete save data?</span>
                  <div className="flex gap-2">
                    <button onClick={() => setShowResetConfirm(false)} className="px-3 py-1.5 bg-white text-zinc-600 rounded-lg text-xs sm:text-sm font-bold shadow-sm hover:bg-zinc-50 border border-zinc-200 transition-colors">Cancel</button>
                    <button onClick={() => { setShowResetConfirm(false); onResetGame(); }} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm hover:bg-red-600 transition-colors">Yes, Reset</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full py-3 rounded-xl bg-zinc-50 hover:bg-red-50 text-zinc-500 hover:text-red-600 font-bold text-sm transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-red-100"
                >
                  <Trophy className="w-4 h-4 opacity-0 hidden sm:block" />
                  Erase Data & Restart
                </button>
              )}
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
