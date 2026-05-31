import { useEffect, useState, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { spawnPositionFor, PRESENCE_STALE_MS, PresenceRecord } from '../utils/multiplayer';

export interface RemotePlayer {
  uid: string;
  petName: string;
  animalId: string;
  equippedCosmetics: string[];
  x: number;
  y: number;
  z: number;
  yaw: number;
  action: string;
}

export function useRemotePlayers(maxVisible = 10) {
  const { user } = useAuth();
  const [players, setPlayers] = useState<RemotePlayer[]>([]);
  const latestDataRef = useRef<Record<string, PresenceRecord> | null>(null);

  useEffect(() => {
    if (!user) {
      setPlayers([]);
      latestDataRef.current = null;
      return;
    }

    const compute = () => {
      const all = latestDataRef.current;
      if (!all) {
        setPlayers([]);
        return;
      }
      const now = Date.now();
      const nextPlayers: RemotePlayer[] = [];

      for (const [uid, record] of Object.entries(all)) {
        if (uid === user.uid) continue;
        if (!record || !record.online) continue;

        const lastSeen = typeof record.lastSeen === 'number' ? record.lastSeen : 0;
        if (now - lastSeen > PRESENCE_STALE_MS) continue;

        const spawn = spawnPositionFor(uid);

        nextPlayers.push({
          uid,
          petName: record.petName || 'Anonymous',
          animalId: record.animalId || 'bunny',
          equippedCosmetics: record.equippedCosmetics || [],
          x: spawn.x,
          y: spawn.y,
          z: spawn.z,
          yaw: spawn.yaw,
          action: 'idle',
        });
      }

      setPlayers(nextPlayers.slice(0, maxVisible));
    };

    const presenceRef = ref(rtdb, 'presence');
    const unsub = onValue(presenceRef, (snap) => {
      if (!snap.exists()) {
        latestDataRef.current = null;
      } else {
        latestDataRef.current = snap.val();
      }
      compute();
    });

    const interval = setInterval(compute, 5000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [user, maxVisible]);

  return players;
}
