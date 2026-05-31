import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
  collection as subcollection,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  ChatReads,
  loadReads,
  timestampToMs,
} from '../utils/messaging';

export interface WorldMessage {
  id: string;
  userId: string;
  petName: string;
  animalId: string;
  text: string;
  createdAt: Timestamp | null;
}

export interface DmMessage {
  id: string;
  userId: string;
  text: string;
  createdAt: Timestamp | null;
}

export interface ConversationSummary {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantAnimals: Record<string, string>;
  lastMessage: string;
  lastMessageAt: Timestamp | null;
  lastMessageBy: string;
}

const WORLD_LIMIT = 100;
const DM_LIMIT = 200;

// ---------------------------------------------------------------------------
// World chat
// ---------------------------------------------------------------------------

export function useWorldChat(active: boolean) {
  const [messages, setMessages] = useState<WorldMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'chat_world'),
      orderBy('createdAt', 'desc'),
      limit(WORLD_LIMIT),
    );

    const unsub = onSnapshot(
      q,
      snap => {
        const next: WorldMessage[] = snap.docs.map(d => {
          const data = d.data() as any;
          return {
            id: d.id,
            userId: data.userId ?? '',
            petName: data.petName ?? 'Anonymous',
            animalId: data.animalId ?? '',
            text: data.text ?? '',
            createdAt: data.createdAt ?? null,
          };
        });
        // Reverse so oldest -> newest for natural top-to-bottom display.
        next.reverse();
        setMessages(next);
        setLoading(false);
      },
      err => {
        console.error('useWorldChat error', err);
        setError('Failed to load chat.');
        setLoading(false);
      },
    );

    return () => unsub();
  }, [active]);

  return { messages, loading, error };
}

// ---------------------------------------------------------------------------
// Conversation list (the user's DM threads)
// ---------------------------------------------------------------------------

export function useConversations(active: boolean) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active || !user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // We deliberately avoid a server-side `orderBy('lastMessageAt')` here
    // because pairing it with the `array-contains` filter would require a
    // composite index. The conversation list per user is small enough to
    // sort on the client.
    const q = query(
      collection(db, 'chat_dms'),
      where('participants', 'array-contains', user.uid),
    );

    const unsub = onSnapshot(
      q,
      snap => {
        const next: ConversationSummary[] = snap.docs.map(d => {
          const data = d.data() as any;
          return {
            id: d.id,
            participants: data.participants ?? [],
            participantNames: data.participantNames ?? {},
            participantAnimals: data.participantAnimals ?? {},
            lastMessage: data.lastMessage ?? '',
            lastMessageAt: data.lastMessageAt ?? null,
            lastMessageBy: data.lastMessageBy ?? '',
          };
        });
        next.sort((a, b) => timestampToMs(b.lastMessageAt) - timestampToMs(a.lastMessageAt));
        setConversations(next);
        setLoading(false);
      },
      err => {
        console.error('useConversations error', err);
        setError('Failed to load conversations.');
        setLoading(false);
      },
    );

    return () => unsub();
  }, [active, user]);

  return { conversations, loading, error };
}

// ---------------------------------------------------------------------------
// Single DM thread
// ---------------------------------------------------------------------------

export function useDmThread(conversationId: string | null) {
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const convRef = doc(db, 'chat_dms', conversationId);
    const q = query(
      subcollection(convRef, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(DM_LIMIT),
    );

    const unsub = onSnapshot(
      q,
      snap => {
        const next: DmMessage[] = snap.docs.map(d => {
          const data = d.data() as any;
          return {
            id: d.id,
            userId: data.userId ?? '',
            text: data.text ?? '',
            createdAt: data.createdAt ?? null,
          };
        });
        next.reverse();
        setMessages(next);
        setLoading(false);
      },
      err => {
        console.error('useDmThread error', err);
        setError('Failed to load messages.');
        setLoading(false);
      },
    );

    return () => unsub();
  }, [conversationId]);

  return { messages, loading, error };
}

// ---------------------------------------------------------------------------
// Unread counts driven by localStorage `chat_reads_v1`. We snapshot the
// world room and the user's conversation list in the background so the
// chat button can show a badge even when the overlay is closed.
// ---------------------------------------------------------------------------

export interface UnreadCounts {
  world: number;
  dms: Record<string, number>; // conversationId -> 0/1 (we don't count individual messages)
  total: number; // world (capped at 1 visually) + number of unread DM threads
}

function useReadsState(): ChatReads {
  const [reads, setReads] = useState<ChatReads>(() => loadReads());
  useEffect(() => {
    const handler = () => setReads(loadReads());
    window.addEventListener('chat-reads-changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('chat-reads-changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);
  return reads;
}

export function useUnreadCounts(): UnreadCounts {
  const { user } = useAuth();
  const reads = useReadsState();
  const [latestWorld, setLatestWorld] = useState<number>(0);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  // Track the most recent world message timestamp.
  useEffect(() => {
    const q = query(
      collection(db, 'chat_world'),
      orderBy('createdAt', 'desc'),
      limit(1),
    );
    const unsub = onSnapshot(
      q,
      snap => {
        const first = snap.docs[0];
        if (!first) {
          setLatestWorld(0);
          return;
        }
        const data = first.data() as any;
        setLatestWorld(timestampToMs(data.createdAt));
      },
      err => {
        console.warn('useUnreadCounts world error', err);
      },
    );
    return () => unsub();
  }, []);

  // Track the user's conversation list (lightweight — we only use the
  // summary docs, not the message subcollections).
  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }
    const q = query(
      collection(db, 'chat_dms'),
      where('participants', 'array-contains', user.uid),
    );
    const unsub = onSnapshot(
      q,
      snap => {
        setConversations(
          snap.docs.map(d => {
            const data = d.data() as any;
            return {
              id: d.id,
              participants: data.participants ?? [],
              participantNames: data.participantNames ?? {},
              participantAnimals: data.participantAnimals ?? {},
              lastMessage: data.lastMessage ?? '',
              lastMessageAt: data.lastMessageAt ?? null,
              lastMessageBy: data.lastMessageBy ?? '',
            };
          }),
        );
      },
      err => {
        console.warn('useUnreadCounts dms error', err);
      },
    );
    return () => unsub();
  }, [user]);

  return useMemo<UnreadCounts>(() => {
    const worldRead = reads.world ?? 0;
    const worldUnread = latestWorld > worldRead ? 1 : 0;

    const dmUnread: Record<string, number> = {};
    let dmUnreadTotal = 0;
    for (const c of conversations) {
      if (c.lastMessageBy === user?.uid) continue; // don't badge our own messages
      const lastMs = timestampToMs(c.lastMessageAt);
      const readMs = reads.dms[c.id] ?? 0;
      if (lastMs > readMs) {
        dmUnread[c.id] = 1;
        dmUnreadTotal += 1;
      }
    }

    return {
      world: worldUnread,
      dms: dmUnread,
      total: worldUnread + dmUnreadTotal,
    };
  }, [conversations, latestWorld, reads, user]);
}
