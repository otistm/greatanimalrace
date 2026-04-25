import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Loader2 } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface LeaderboardEntry {
  id: string;
  petName: string;
  age: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalLeaderboardsOverlay({ isOpen, onClose }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, 'users_v3'),
          orderBy('progression.age', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const fetchedEntries = snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              petName: data.petName || 'Anonymous',
              age: data.progression?.age || 0
            };
          })
          .filter(entry => entry.age > 0); // Only show pets that have aged

        setEntries(fetchedEntries);
      } catch (err: any) {
        console.error("Failed to fetch leaderboard", err);
        setError("Failed to load leaderboards. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[110] p-4 pointer-events-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl w-full max-w-lg h-[600px] max-h-[85dvh] flex flex-col shadow-2xl overflow-hidden relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-6 text-white relative shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Trophy className="w-8 h-8 text-yellow-200" fill="currentColor" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-wide">Global Rankings</h2>
                <p className="text-amber-100 font-medium opacity-90">Oldest creatures in the world</p>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar relative bg-zinc-50">
            {loading ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-zinc-400 py-20 min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="font-bold tracking-wide">Loading leaders...</p>
              </div>
            ) : error ? (
              <div className="h-full w-full flex items-center justify-center text-red-400 p-8 text-center font-medium min-h-[300px]">
                <p>{error}</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center p-8 text-center text-zinc-400 font-medium min-h-[300px]">
                No pets have aged up yet. Be the first!
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-4">
                {entries.map((entry, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={entry.id}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between group hover:shadow-md hover:border-amber-200 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                        index === 0 ? 'bg-amber-100 text-amber-600' :
                        index === 1 ? 'bg-zinc-200 text-zinc-600' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-zinc-50 text-zinc-400'
                      }`}>
                        #{index + 1}
                      </div>
                      <span className="font-bold text-zinc-800 text-lg capitalize">{entry.petName}</span>
                    </div>
                    <div className="bg-zinc-100 px-4 py-1.5 rounded-full border border-zinc-200 group-hover:bg-amber-50 group-hover:border-amber-100 group-hover:text-amber-700 transition-colors">
                      <span className="font-black">{entry.age}</span>
                      <span className="text-sm font-bold opacity-70 ml-1">months</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
