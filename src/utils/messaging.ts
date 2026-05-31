import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

export const MAX_MESSAGE_LENGTH = 200;

// Hand-rolled list of obvious words to block. Intentionally short and
// not exhaustive — real moderation should run server-side. We do a
// case-insensitive whole-word match so e.g. "class" doesn't trigger.
const PROFANITY: string[] = [
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'cunt', 'pussy', 'nigger',
  'nigga', 'faggot', 'fag', 'retard', 'whore', 'slut', 'bastard', 'cock',
  'twat', 'wank', 'piss',
];

const PROFANITY_REGEX = new RegExp(
  `\\b(${PROFANITY.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'i',
);

export type ValidationResult =
  | { ok: true; text: string }
  | { ok: false; reason: string };

export function validateMessage(raw: string): ValidationResult {
  const text = raw.trim();
  if (text.length === 0) {
    return { ok: false, reason: 'Type something first.' };
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, reason: `Keep it under ${MAX_MESSAGE_LENGTH} characters.` };
  }
  if (PROFANITY_REGEX.test(text)) {
    return { ok: false, reason: 'Please keep it kind.' };
  }
  return { ok: true, text };
}

// Deterministic conversation id so both participants resolve to the
// same document regardless of who initiates.
export function conversationIdFor(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

// ---------------------------------------------------------------------------
// World chat
// ---------------------------------------------------------------------------

export interface SendWorldMessageArgs {
  userId: string;
  petName: string;
  animalId: string;
  text: string;
}

export async function sendWorldMessage(args: SendWorldMessageArgs): Promise<void> {
  const result = validateMessage(args.text);
  if (!result.ok) throw new Error(result.reason);

  await addDoc(collection(db, 'chat_world'), {
    userId: args.userId,
    petName: args.petName,
    animalId: args.animalId,
    text: result.text,
    createdAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// DMs
// ---------------------------------------------------------------------------

export interface ParticipantSummary {
  uid: string;
  petName: string;
  animalId: string;
}

// Ensure a conversation document exists between the two participants.
// If it already exists, we leave it alone. If not, we create it with a
// placeholder lastMessage that satisfies the security rules' minimum
// length requirement.
export async function getOrCreateConversation(
  me: ParticipantSummary,
  other: ParticipantSummary,
): Promise<string> {
  if (me.uid === other.uid) {
    throw new Error("You can't message yourself.");
  }
  const id = conversationIdFor(me.uid, other.uid);
  const ref = doc(db, 'chat_dms', id);
  const snap = await getDoc(ref);
  if (snap.exists()) return id;

  await setDoc(ref, {
    participants: [me.uid, other.uid].sort(),
    participantNames: {
      [me.uid]: me.petName,
      [other.uid]: other.petName,
    },
    participantAnimals: {
      [me.uid]: me.animalId,
      [other.uid]: other.animalId,
    },
    lastMessage: 'Say hi!',
    lastMessageAt: serverTimestamp(),
    lastMessageBy: me.uid,
  });
  return id;
}

export interface SendDirectMessageArgs {
  conversationId: string;
  me: ParticipantSummary;
  text: string;
}

export async function sendDirectMessage(args: SendDirectMessageArgs): Promise<void> {
  const result = validateMessage(args.text);
  if (!result.ok) throw new Error(result.reason);

  const convRef = doc(db, 'chat_dms', args.conversationId);
  const messagesRef = collection(convRef, 'messages');

  await addDoc(messagesRef, {
    userId: args.me.uid,
    text: result.text,
    createdAt: serverTimestamp(),
  });

  // Update the conversation summary so the other side sees an unread
  // preview and the conversation list resorts. We intentionally keep
  // the participant maps unchanged here.
  await updateDoc(convRef, {
    lastMessage: result.text,
    lastMessageAt: serverTimestamp(),
    lastMessageBy: args.me.uid,
  });
}

// ---------------------------------------------------------------------------
// Read tracking (localStorage). Kept here so the hooks and overlays share
// the same key + shape.
// ---------------------------------------------------------------------------

const READS_KEY = 'chat_reads_v1';

export interface ChatReads {
  world?: number; // ms epoch
  dms: Record<string, number>; // conversationId -> ms epoch
}

export function loadReads(): ChatReads {
  if (typeof window === 'undefined') return { dms: {} };
  try {
    const raw = window.localStorage.getItem(READS_KEY);
    if (!raw) return { dms: {} };
    const parsed = JSON.parse(raw);
    return {
      world: typeof parsed.world === 'number' ? parsed.world : undefined,
      dms: parsed.dms && typeof parsed.dms === 'object' ? parsed.dms : {},
    };
  } catch {
    return { dms: {} };
  }
}

export function saveReads(reads: ChatReads): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(READS_KEY, JSON.stringify(reads));
    window.dispatchEvent(new CustomEvent('chat-reads-changed'));
  } catch {
    // Ignore quota / privacy-mode failures — unread badges aren't critical.
  }
}

export function markWorldRead(): void {
  const reads = loadReads();
  reads.world = Date.now();
  saveReads(reads);
}

export function markConversationRead(conversationId: string): void {
  const reads = loadReads();
  reads.dms[conversationId] = Date.now();
  saveReads(reads);
}

export function timestampToMs(ts: Timestamp | { seconds: number; nanoseconds: number } | null | undefined): number {
  if (!ts) return 0;
  if (ts instanceof Timestamp) return ts.toMillis();
  if (typeof (ts as any).seconds === 'number') {
    return (ts as any).seconds * 1000 + Math.floor(((ts as any).nanoseconds || 0) / 1e6);
  }
  return 0;
}
