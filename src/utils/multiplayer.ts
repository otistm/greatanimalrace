import {
  ref,
  set,
  get,
  onDisconnect,
  serverTimestamp,
} from 'firebase/database';
import { rtdb } from '../firebase';
import { getTerrainHeight } from './terrain';

// ---------------------------------------------------------------------------
// Phase 1 multiplayer transport.
//
// Two RTDB paths are used (only `/presence` is written from Phase 1; positions
// will be wired in Phase 2):
//   /presence/{uid} = { online, lastSeen, petName, animalId, equippedCosmetics }
//   /positions/{uid} = { x, y, z, yaw, action, t }
//
// All shape constraints below MUST stay in sync with
// [`database.rules.json`](../database.rules.json) in the repo root.
// ---------------------------------------------------------------------------

export const MAX_CONCURRENT = 10;
export const PRESENCE_STALE_MS = 30_000;

// Match the rule-side length caps so a malformed local string never causes a
// server-side validation failure.
const MAX_PET_NAME = 40;
const MAX_ANIMAL_ID = 40;
const MAX_COSMETIC_LEN = 64;
const MAX_COSMETICS = 16;

function clampString(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max);
}

function sanitizeCosmetics(cosmetics: string[]): string[] {
  return cosmetics
    .filter(c => typeof c === 'string' && c.length > 0)
    .map(c => clampString(c, MAX_COSMETIC_LEN))
    .slice(0, MAX_COSMETICS);
}

export interface PresencePayload {
  petName: string;
  animalId: string;
  equippedCosmetics: string[];
}

export interface PresenceRecord extends PresencePayload {
  online: boolean;
  lastSeen: number;
}

// ---------------------------------------------------------------------------
// Presence (Phase 1)
// ---------------------------------------------------------------------------

export async function publishPresence(
  uid: string,
  { petName, animalId, equippedCosmetics }: PresencePayload,
): Promise<void> {
  const node = ref(rtdb, `presence/${uid}`);
  // Best-effort: register the disconnect cleanup BEFORE the initial write so
  // a tab that crashes between set() and onDisconnect() registration still
  // gets cleaned up by the staleness filter.
  try {
    await onDisconnect(node).remove();
  } catch (e) {
    console.warn('[multiplayer] onDisconnect setup failed', e);
  }

  await set(node, {
    online: true,
    lastSeen: serverTimestamp(),
    petName: clampString(petName || 'Anonymous', MAX_PET_NAME),
    animalId: clampString(animalId || 'bunny', MAX_ANIMAL_ID),
    equippedCosmetics: sanitizeCosmetics(equippedCosmetics || []),
  });
}

export async function clearPresence(uid: string): Promise<void> {
  try {
    await set(ref(rtdb, `presence/${uid}`), null);
  } catch (e) {
    // The disconnect handler will eventually clear it anyway.
    console.warn('[multiplayer] clearPresence failed', e);
  }
}

// ---------------------------------------------------------------------------
// Concurrency cap
// ---------------------------------------------------------------------------

/**
 * One-shot read of /presence. Returns true if the caller is allowed to join
 * (either there's an open slot, or this uid is already counted). Returns
 * false if the world is at MAX_CONCURRENT and this uid isn't already in.
 *
 * NOTE: This is best-effort, not race-free. RTDB rules can't enforce a
 * sibling count, so two new clients reading simultaneously could both pass.
 * That's acceptable at our scale — the cap is a budget guardrail, not a
 * security boundary.
 */
export async function tryClaimSlot(
  uid: string,
  max: number = MAX_CONCURRENT,
): Promise<boolean> {
  try {
    const snap = await get(ref(rtdb, 'presence'));
    if (!snap.exists()) return true;
    const all = snap.val() as Record<string, PresenceRecord> | null;
    if (!all) return true;

    const now = Date.now();
    let live = 0;
    let alreadyIn = false;
    for (const [k, v] of Object.entries(all)) {
      if (k === uid) {
        alreadyIn = true;
        continue;
      }
      if (!v) continue;
      const lastSeen = typeof v.lastSeen === 'number' ? v.lastSeen : 0;
      if (now - lastSeen > PRESENCE_STALE_MS) continue;
      live += 1;
    }
    if (alreadyIn) return true;
    return live < max;
  } catch (e) {
    console.warn('[multiplayer] tryClaimSlot failed; allowing join', e);
    // Fail-open so a transient RTDB error doesn't lock everyone out. Worst
    // case we exceed the cap by 1 for a moment.
    return true;
  }
}

// ---------------------------------------------------------------------------
// Deterministic spawn placement (Phase 1)
//
// In Phase 1 there is no live position data, so we hash each remote uid to a
// fixed point on a ring around the world origin. Different uids land on
// different angles so multiple players don't stack on top of each other.
// Phase 2 will overlay live /positions data on top of this fallback.
// ---------------------------------------------------------------------------

const SPAWN_RADIUS_MIN = 4;
const SPAWN_RADIUS_MAX = 9;

// FNV-1a 32-bit. Same hash family used elsewhere in the project (terrain.ts).
function hashUid(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface SpawnPoint {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export function spawnPositionFor(uid: string): SpawnPoint {
  const h = hashUid(uid);
  // Two independent normalised values from the 32-bit hash.
  const u = (h & 0xffff) / 0xffff;
  const v = ((h >>> 16) & 0xffff) / 0xffff;

  const angle = u * Math.PI * 2;
  const radius = SPAWN_RADIUS_MIN + v * (SPAWN_RADIUS_MAX - SPAWN_RADIUS_MIN);
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = getTerrainHeight(x, z);
  // Face roughly toward the origin so spawned avatars feel "looking inward".
  const yaw = Math.atan2(-x, -z);

  return { x, y, z, yaw };
}
