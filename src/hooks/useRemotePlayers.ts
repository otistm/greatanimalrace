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
      console.log('[useRemotePlayers] compute called, presence data:', all);
      if (!all) {
        setPlayers([]);
        return;
      }
      const now = Date.now();
      const nextPlayers: RemotePlayer[] = [];

      for (const [uid, record] of Object.entries(all)) {
        if (uid === user.uid) continue; // Drop self
        if (!record || !record.online) {
          console.log('[useRemotePlayers] dropping explicitly offline uid:', uid);
          continue;
        }
        
        const lastSeen = typeof record.lastSeen === 'number' ? record.lastSeen : 0;
        if (now - lastSeen > PRESENCE_STALE_MS) {
          console.log('[useRemotePlayers] dropping stale uid:', uid, 'lastSeen:', lastSeen, 'age ms:', now - lastSeen);
          continue;
        }

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
          action: 'idle', // Phase 1 is static
        });
      }

      console.log('[useRemotePlayers] final visible players:', nextPlayers);
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

    // Run a periodic sweep to drop stale players even if no new RTDB updates arrive
    const interval = setInterval(compute, 5000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [user, maxVisible]);

  return players;
}
