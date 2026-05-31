import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Users, X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorldChat, useConversations, useDmThread, useUnreadCounts } from '../hooks/useChat';
import { ChatThread, ChatThreadMessage } from './ChatThread';
import { ConversationList } from './ConversationList';
import {
  ParticipantSummary,
  getOrCreateConversation,
  markConversationRead,
  markWorldRead,
  sendDirectMessage,
  sendWorldMessage,
} from '../utils/messaging';
import { getSpeciesConfig } from '../utils/petSpecies';

export interface PendingDmTarget {
  uid: string;
  petName: string;
  animalId: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  myPetName: string;
  myAnimalId: string;
  // When set, the overlay opens directly into a DM with this person
  // (creating the conversation if it doesn't exist yet).
  openDmWith?: PendingDmTarget | null;
  onDmTargetConsumed?: () => void;
}

type Tab = 'world' | 'dms';

export function MessagesOverlay({
  isOpen,
  onClose,
  myPetName,
  myAnimalId,
  openDmWith,
  onDmTargetConsumed,
}: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('world');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeOther, setActiveOther] = useState<ParticipantSummary | null>(null);
  const [openingDm, setOpeningDm] = useState(false);
  const [openDmError, setOpenDmError] = useState<string | null>(null);

  const myUid = user?.uid || '';
  const me: ParticipantSummary = useMemo(
    () => ({ uid: myUid, petName: myPetName || 'Anonymous', animalId: myAnimalId || 'bunny' }),
    [myUid, myPetName, myAnimalId],
  );

  const unread = useUnreadCounts();
  const world = useWorldChat(isOpen && tab === 'world');
  const conversations = useConversations(isOpen && tab === 'dms');
  const dm = useDmThread(isOpen && tab === 'dms' ? activeConversationId : null);

  // Honor an external request to open a DM (e.g. clicked from the
  // leaderboard or from a name in world chat).
  useEffect(() => {
    if (!isOpen || !openDmWith || !user) return;
    let cancelled = false;
    (async () => {
      setOpeningDm(true);
      setOpenDmError(null);
      try {
        const id = await getOrCreateConversation(me, openDmWith);
        if (cancelled) return;
        setTab('dms');
        setActiveConversationId(id);
        setActiveOther({
          uid: openDmWith.uid,
          petName: openDmWith.petName,
          animalId: openDmWith.animalId,
        });
        markConversationRead(id);
      } catch (err: any) {
        if (!cancelled) setOpenDmError(err?.message || 'Could not open conversation.');
      } finally {
        if (!cancelled) setOpeningDm(false);
        onDmTargetConsumed?.();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, openDmWith, user]);

  // Reset transient state when the overlay closes.
  useEffect(() => {
    if (!isOpen) {
      setOpenDmError(null);
    }
  }, [isOpen]);

  // Whenever the world tab is opened, mark everything read.
  useEffect(() => {
    if (isOpen && tab === 'world') {
      markWorldRead();
    }
  }, [isOpen, tab, world.messages.length]);

  // When a DM thread is opened, mark it read and refresh whenever
  // new messages arrive while the user is viewing it.
  useEffect(() => {
    if (isOpen && tab === 'dms' && activeConversationId) {
      markConversationRead(activeConversationId);
    }
  }, [isOpen, tab, activeConversationId, dm.messages.length]);

  if (!isOpen) return null;

  const worldMessages: ChatThreadMessage[] = world.messages.map(m => ({
    id: m.id,
    userId: m.userId,
    text: m.text,
    createdAt: m.createdAt,
    petName: m.petName,
    animalId: m.animalId,
  }));

  const dmMessages: ChatThreadMessage[] = dm.messages.map(m => ({
    id: m.id,
    userId: m.userId,
    text: m.text,
    createdAt: m.createdAt,
  }));

  const handleStartDmFromWorld = async (uid: string, petName: string, animalId: string) => {
    if (!myUid || uid === myUid) return;
    setOpeningDm(true);
    setOpenDmError(null);
    try {
      const id = await getOrCreateConversation(me, { uid, petName, animalId });
      setTab('dms');
      setActiveConversationId(id);
      setActiveOther({ uid, petName, animalId });
      markConversationRead(id);
    } catch (err: any) {
      setOpenDmError(err?.message || 'Could not open conversation.');
    } finally {
      setOpeningDm(false);
    }
  };

  const handleOpenConversation = (id: string) => {
    setActiveConversationId(id);
    const conv = conversations.conversations.find(c => c.id === id);
    if (conv) {
      const otherUid = conv.participants.find(uid => uid !== myUid) || '';
      setActiveOther({
        uid: otherUid,
        petName: conv.participantNames[otherUid] || 'Anonymous',
        animalId: conv.participantAnimals[otherUid] || '',
      });
    }
    markConversationRead(id);
  };

  const handleBackToList = () => {
    setActiveConversationId(null);
    setActiveOther(null);
  };

  const otherEmoji = activeOther?.animalId ? getSpeciesConfig(activeOther.animalId).emoji : '🐾';
  const showingDmThread = tab === 'dms' && activeConversationId !== null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[110] p-4 pointer-events-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl w-full max-w-lg h-[640px] max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-5 text-white relative shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              {showingDmThread ? (
                <button
                  onClick={handleBackToList}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <MessageCircle className="w-7 h-7 text-amber-50" />
                </div>
              )}
              <div className="min-w-0">
                {showingDmThread ? (
                  <>
                    <h2 className="text-xl font-black tracking-wide flex items-center gap-2 truncate">
                      <span className="text-2xl">{otherEmoji}</span>
                      <span className="truncate capitalize">{activeOther?.petName || 'Conversation'}</span>
                    </h2>
                    <p className="text-amber-100 text-xs font-medium opacity-90">Direct message</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-black tracking-wide">Messages</h2>
                    <p className="text-amber-100 text-xs font-medium opacity-90">
                      Chat with players around the world
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tabs (hidden inside a DM thread) */}
          {!showingDmThread && (
            <div className="shrink-0 flex border-b border-zinc-200 bg-white">
              <TabButton
                active={tab === 'world'}
                onClick={() => setTab('world')}
                icon={<Users className="w-4 h-4" />}
                label="World"
                badge={tab === 'world' ? 0 : unread.world}
              />
              <TabButton
                active={tab === 'dms'}
                onClick={() => setTab('dms')}
                icon={<MessageCircle className="w-4 h-4" />}
                label="Direct"
                badge={tab === 'dms' && !activeConversationId ? 0 : Object.keys(unread.dms).length}
              />
            </div>
          )}

          {openDmError && (
            <div className="shrink-0 px-4 py-2 bg-red-50 border-b border-red-100 text-xs font-bold text-red-600">
              {openDmError}
            </div>
          )}

          {/* Body */}
          <div className="flex-1 flex flex-col min-h-0 bg-zinc-50">
            {tab === 'world' && (
              <ChatThread
                messages={worldMessages}
                loading={world.loading}
                error={world.error}
                myUserId={myUid}
                mode="world"
                onSend={async text => {
                  await sendWorldMessage({
                    userId: myUid,
                    petName: me.petName,
                    animalId: me.animalId,
                    text,
                  });
                }}
                onStartDmWith={handleStartDmFromWorld}
                disabled={!myUid || openingDm}
              />
            )}

            {tab === 'dms' && !activeConversationId && (
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                <ConversationList
                  conversations={conversations.conversations}
                  loading={conversations.loading}
                  error={conversations.error}
                  myUserId={myUid}
                  unreadDms={unread.dms}
                  onOpenConversation={handleOpenConversation}
                />
              </div>
            )}

            {tab === 'dms' && activeConversationId && activeOther && (
              <ChatThread
                messages={dmMessages}
                loading={dm.loading}
                error={dm.error}
                myUserId={myUid}
                mode="dm"
                otherName={activeOther.petName}
                otherAnimalId={activeOther.animalId}
                onSend={async text => {
                  await sendDirectMessage({
                    conversationId: activeConversationId,
                    me,
                    text,
                  });
                }}
                disabled={!myUid}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold tracking-wide transition-colors ${
        active
          ? 'text-amber-600 border-b-2 border-amber-500 -mb-px bg-amber-50'
          : 'text-zinc-500 hover:text-zinc-700'
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge > 0 && (
        <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
