import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, setDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
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
    // Pull top-N by score then re-sort client-side by (totalStars desc, score desc)
    // so legacy rows without totalStars (treated as 0) still render.
    const q = query(
      collection(db, 'leaderboards_v3', gameId, 'entries'),
      orderBy('score', 'desc'),
      limit(25)
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
      handleFirestoreError(error, OperationType.GET, `leaderboards/${gameId}/entries`, auth);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [gameId, auth.currentUser]); // re-run if auth state changes

  const submitScore = async (score: number, animalId: string, stars: number = 0) => {
    if (!gameId || !auth.currentUser) return;

    try {
      const entryRef = doc(db, 'leaderboards_v3', gameId, 'entries', auth.currentUser.uid);
      const entrySnap = await getDoc(entryRef);

      const currentHighScore = entrySnap.exists() ? entrySnap.data().score : -1;

      if (score > currentHighScore) {
        await setDoc(entryRef, {
          userId: auth.currentUser.uid,
          gameId: gameId,
          score: score,
          stars: stars,
          playerName: auth.currentUser.displayName || 'Anonymous Player',
          animalId: animalId,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `leaderboards/${gameId}/entries/${auth.currentUser?.uid}`, auth);
    }
  };

  return { entries, loading, submitScore };
}
