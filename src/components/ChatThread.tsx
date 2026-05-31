import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Timestamp } from 'firebase/firestore';
import {
  MAX_MESSAGE_LENGTH,
  validateMessage,
} from '../utils/messaging';
import { getSpeciesConfig } from '../utils/petSpecies';

export interface ChatThreadMessage {
  id: string;
  userId: string;
  text: string;
  createdAt: Timestamp | null;
  // Only used by the world room for showing each sender.
  petName?: string;
  animalId?: string;
}

interface Props {
  messages: ChatThreadMessage[];
  loading: boolean;
  error?: string | null;
  myUserId: string;
  // World mode shows the sender header on every bubble and lets the
  // viewer click a sender to start a DM.
  mode: 'world' | 'dm';
  // For DM mode: how to label messages from the other side.
  otherName?: string;
  otherAnimalId?: string;
  onSend: (text: string) => Promise<void>;
  onStartDmWith?: (userId: string, petName: string, animalId: string) => void;
  emptyHint?: string;
  composerPlaceholder?: string;
  disabled?: boolean;
}

const SEND_COOLDOWN_MS = 1500;

function formatTime(ts: Timestamp | null): string {
  if (!ts) return '';
  const d = ts.toDate();
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return time;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
}

export function ChatThread({
  messages,
  loading,
  error,
  myUserId,
  mode,
  otherName,
  otherAnimalId,
  onSend,
  onStartDmWith,
  emptyHint,
  composerPlaceholder,
  disabled,
}: Props) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change. We only scroll if the
  // user is already near the bottom so reading old messages isn't
  // disrupted by new arrivals.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 120) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

  // Always scroll to bottom on initial load of a new thread.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && !loading) {
      el.scrollTop = el.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, mode, otherName]);

  const cooldownActive = Date.now() < cooldownUntil;
  const trimmed = draft.trim();
  const canSend = trimmed.length > 0 && !sending && !cooldownActive && !disabled;

  const charCount = draft.length;
  const overLimit = charCount > MAX_MESSAGE_LENGTH;

  const handleSend = async () => {
    if (!canSend) return;
    const result = validateMessage(draft);
    if (!result.ok) {
      setValidationError(result.reason);
      return;
    }
    setValidationError(null);
    setSending(true);
    try {
      await onSend(result.text);
      setDraft('');
      setCooldownUntil(Date.now() + SEND_COOLDOWN_MS);
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to send. Try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const placeholder =
    composerPlaceholder ||
    (mode === 'world' ? 'Say hi to the world...' : `Message ${otherName ?? ''}...`);

  const grouped = useMemo(() => {
    // No grouping right now beyond per-message bubbles, but keeping
    // this hook in case we want to coalesce consecutive messages from
    // the same sender later.
    return messages;
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-50 px-4 py-3 min-h-0"
      >
        {loading ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-zinc-400 py-20 min-h-[200px]">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="font-bold tracking-wide">Loading messages...</p>
          </div>
        ) : error ? (
          <div className="h-full w-full flex items-center justify-center text-red-400 p-8 text-center font-medium min-h-[200px]">
            <p>{error}</p>
          </div>
        ) : grouped.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-zinc-400 p-8 text-center font-medium min-h-[200px]">
            {emptyHint || (mode === 'world' ? 'Be the first to say hi!' : 'No messages yet. Send the first one!')}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {grouped.map(msg => {
              const isMine = msg.userId === myUserId;
              const senderName = isMine
                ? 'You'
                : (msg.petName || (mode === 'dm' ? otherName : 'Anonymous')) || 'Anonymous';
              const senderAnimal = isMine
                ? null
                : msg.animalId || (mode === 'dm' ? otherAnimalId : null);
              const emoji = senderAnimal ? getSpeciesConfig(senderAnimal).emoji : '';

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender header — shown on every bubble in world mode,
                      hidden for our own bubbles in DM mode (it's redundant). */}
                  {(mode === 'world' || (!isMine && mode === 'dm')) && (
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      {emoji && <span className="text-base leading-none">{emoji}</span>}
                      {!isMine && mode === 'world' && onStartDmWith ? (
                        <button
                          type="button"
                          onClick={() => onStartDmWith(msg.userId, msg.petName || 'Anonymous', msg.animalId || '')}
                          className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline tracking-wide"
                        >
                          {senderName}
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-zinc-600 tracking-wide">
                          {senderName}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-400 font-medium">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl break-words whitespace-pre-wrap ${
                      isMine
                        ? 'bg-amber-500 text-white rounded-br-sm'
                        : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm leading-snug">{msg.text}</p>
                  </div>
                  {isMine && (
                    <span className="text-[10px] text-zinc-400 mt-0.5 mr-1">
                      {formatTime(msg.createdAt)}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-zinc-200 bg-white p-3">
        {validationError && (
          <div className="mb-2 text-xs font-bold text-red-500 px-1">{validationError}</div>
        )}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={draft}
              onChange={e => {
                setDraft(e.target.value);
                if (validationError) setValidationError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH + 50}
              disabled={disabled || sending}
              className={`w-full resize-none rounded-2xl border px-4 py-2.5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:bg-zinc-100 disabled:text-zinc-400 ${
                overLimit ? 'border-red-400' : 'border-zinc-200'
              }`}
              style={{ maxHeight: '120px' }}
            />
            <span
              className={`absolute bottom-1.5 right-3 text-[10px] font-bold pointer-events-none ${
                overLimit ? 'text-red-500' : charCount > MAX_MESSAGE_LENGTH * 0.8 ? 'text-amber-500' : 'text-zinc-300'
              }`}
            >
              {charCount}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="shrink-0 h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md hover:bg-amber-600 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none transition-colors"
            aria-label="Send message"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
