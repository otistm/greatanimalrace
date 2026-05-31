import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

export interface LeaderboardEntry {
  userId: string;
  gameId: string;
  score: number;
  stars?: number;
  totalStars?: number;
  playerName: string;
  animalId: string;
  createdAt: any;
}

export function useLeaderboard(gameId: string | null) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameId || !auth.currentUser) {
      setEntries([]);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'leaderboards_v3', gameId, 'entries'),
      orderBy('totalStars', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: LeaderboardEntry[] = [];
      snapshot.forEach(doc => {
        data.push(doc.data() as LeaderboardEntry);
      });
      data.sort((a, b) => {
        const ta = a.totalStars ?? 0;
        const tb = b.totalStars ?? 0;
        if (tb !== ta) return tb - ta;
        return (b.score ?? 0) - (a.score ?? 0);
      });
      setEntries(data.slice(0, 3));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `leaderboards_v3/${gameId}/entries`, auth);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [gameId, auth.currentUser]);

  return { entries, loading };
}
