import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export function useUserHighScores(gameIds: string[]) {
  const [highScores, setHighScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!auth.currentUser) {
      setHighScores({});
      return;
    }

    const unsubscribes = gameIds.map(gameId => {
      const entryRef = doc(db, 'leaderboards_v3', gameId, 'entries', auth.currentUser!.uid);
      return onSnapshot(entryRef, (snapshot) => {
        if (snapshot.exists()) {
          setHighScores(prev => ({ ...prev, [gameId]: snapshot.data().score }));
        }
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [gameIds.join(','), auth.currentUser]);

  return highScores;
}
