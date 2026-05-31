import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, MessageCircle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { ConversationSummary } from '../hooks/useChat';
import { getSpeciesConfig } from '../utils/petSpecies';

interface Props {
  conversations: ConversationSummary[];
  loading: boolean;
  error?: string | null;
  myUserId: string;
  unreadDms: Record<string, number>;
  onOpenConversation: (conversationId: string) => void;
}

function formatRelative(ts: Timestamp | null): string {
  if (!ts) return '';
  const d = ts.toDate();
  const diffMs = Date.now() - d.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function ConversationList({
  conversations,
  loading,
  error,
  myUserId,
  unreadDms,
  onOpenConversation,
}: Props) {
  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-zinc-400 py-20 min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p className="font-bold tracking-wide">Loading messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center text-red-400 p-8 text-center font-medium min-h-[300px]">
        <p>{error}</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center text-zinc-400 font-medium min-h-[300px] gap-3">
        <MessageCircle className="w-10 h-10 text-zinc-300" />
        <p>No conversations yet.</p>
        <p className="text-xs text-zinc-400 max-w-[240px]">
          Start one from the World tab or the Global Rankings list by tapping a player's name.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      {conversations.map((c, i) => {
        const otherUid = c.participants.find(uid => uid !== myUserId) || '';
        const otherName = c.participantNames[otherUid] || 'Anonymous';
        const otherAnimal = c.participantAnimals[otherUid] || '';
        const emoji = otherAnimal ? getSpeciesConfig(otherAnimal).emoji : '🐾';
        const unread = !!unreadDms[c.id];
        const preview = c.lastMessageBy === myUserId
          ? `You: ${c.lastMessage}`
          : c.lastMessage;

        return (
          <motion.button
            key={c.id}
            type="button"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onOpenConversation(c.id)}
            className={`text-left w-full p-3 rounded-2xl border flex items-center gap-3 group transition-all ${
              unread
                ? 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                : 'bg-white border-zinc-100 hover:bg-zinc-50 hover:border-zinc-200'
            }`}
          >
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-2xl">
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold text-zinc-800 text-sm capitalize truncate">
                  {otherName}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 shrink-0">
                  {formatRelative(c.lastMessageAt)}
                </span>
              </div>
              <p className={`text-xs truncate mt-0.5 ${unread ? 'text-zinc-700 font-semibold' : 'text-zinc-500'}`}>
                {preview || 'Say hi!'}
              </p>
            </div>
            {unread && (
              <span
                className="shrink-0 w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"
                aria-label="Unread"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
