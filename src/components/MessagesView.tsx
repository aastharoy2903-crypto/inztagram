import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  MessageCircle,
  Plus,
  Send,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatRelativeTime, formatTimeClock } from '../utils/formatters';
import { ResilientImage } from './ResilientMedia';

export const MessagesView: React.FC = () => {
  const {
    mode,
    currentUser,
    users,
    usersById,
    blockedUserIds,
    conversations,
    messagesByConversation,
    activeConversationId,
    setActiveConversationId,
    startConversation,
    sendMessage,
    markConversationRead,
    openProfile,
  } = useApp();

  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);

  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const activeConv =
    conversations.find((c) => c.id === activeConversationId) || null;
  const activeMessages = activeConv
    ? messagesByConversation[activeConv.id] || []
    : [];

  const otherUser = useMemo(() => {
    if (!activeConv || !currentUser) return null;
    const otherUid = activeConv.participants.find((id) => id !== currentUser.uid);
    return otherUid ? usersById[otherUid] || null : null;
  }, [activeConv, currentUser, usersById]);

  useEffect(() => {
    if (activeConv) {
      markConversationRead(activeConv.id);
    }
  }, [activeConv, activeMessages.length, markConversationRead]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, activeConversationId]);

  const availableContacts = useMemo(() => {
    return users.filter(
      (u) => u.uid !== currentUser?.uid && !blockedUserIds.has(u.uid)
    );
  }, [users, currentUser, blockedUserIds]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv) return;
    setSendError(null);
    if (!draft.trim()) {
      setSendError('Please enter a message before sending.');
      return;
    }
    setSending(true);
    try {
      await sendMessage(activeConv.id, draft);
      setDraft('');
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4">
      <div className="rounded-2xl bg-white border border-[#E5DCE9] overflow-hidden h-[calc(100vh-145px)] md:h-[calc(100vh-48px)] min-h-[480px] grid grid-cols-1 md:grid-cols-12">
        {/* Conversation List */}
        <section
          aria-label="Conversations"
          className={`md:col-span-5 lg:col-span-4 border-r border-[#E5DCE9] flex flex-col ${
            activeConv ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="px-4 py-3.5 border-b border-[#E5DCE9] flex items-center justify-between gap-2">
            <div>
              <h1 className="font-display text-base font-bold text-[#39243B]">
                Messages
              </h1>
              <p className="text-[11px] text-[#68556B]">
                {mode === 'firebase' ? 'Real-time direct chat' : 'Demo mode · Local browser only'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNewChatOpen(true)}
              aria-label="Start new conversation"
              className="min-h-[38px] px-3 rounded-xl bg-[#F8F5FA] hover:bg-[#EFE7F5] border border-[#E5DCE9] text-xs font-semibold text-[#39243B] inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4 text-[#A74695]" aria-hidden="true" />
              <span>New</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#F1ECF5]">
            {conversations.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <MessageCircle className="w-8 h-8 text-[#A74695] mx-auto" aria-hidden="true" />
                <p className="text-sm font-semibold text-[#39243B]">No conversations yet</p>
                <p className="text-xs text-[#68556B]">
                  Start a direct message with someone you follow.
                </p>
                <button
                  type="button"
                  onClick={() => setNewChatOpen(true)}
                  className="min-h-[38px] px-4 rounded-xl bg-[#39243B] text-white text-xs font-semibold"
                >
                  New message
                </button>
              </div>
            ) : (
              conversations.map((conv) => {
                const partnerUid = conv.participants.find(
                  (id) => id !== currentUser?.uid
                );
                const partner = partnerUid ? usersById[partnerUid] : null;
                if (!partner) return null;
                const unread =
                  currentUser && conv.unreadBy.includes(currentUser.uid);
                const active = conv.id === activeConversationId;

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`w-full px-4 py-3.5 text-left flex items-center gap-3 transition-colors ${
                      active ? 'bg-[#F3EEF7]' : 'hover:bg-[#FAF8FC]'
                    }`}
                  >
                    <ResilientImage
                      src={partner.avatarUrl}
                      alt={partner.displayName}
                      objectPosition={partner.avatarPosition}
                      className="w-11 h-11 rounded-full object-cover border border-[#E5DCE9] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#39243B] truncate">
                          {partner.displayName}
                        </p>
                        <span className="text-[11px] text-[#68556B] shrink-0 tabular-nums">
                          {formatRelativeTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <p
                        className={`text-xs truncate mt-0.5 ${
                          unread
                            ? 'font-semibold text-[#39243B]'
                            : 'text-[#68556B]'
                        }`}
                      >
                        {conv.lastMessageText || 'No messages yet'}
                      </p>
                    </div>
                    {unread && (
                      <span
                        className="w-2.5 h-2.5 rounded-full bg-[#D57FC4] shrink-0"
                        aria-label="Unread message"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Active Chat Thread */}
        <section
          aria-label="Message thread"
          className={`md:col-span-7 lg:col-span-8 flex flex-col bg-[#FAF8FC] ${
            activeConv ? 'flex' : 'hidden md:flex'
          }`}
        >
          {!activeConv || !otherUser ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5DCE9] flex items-center justify-center text-[#A74695]">
                <MessageCircle className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1 max-w-xs">
                <h2 className="font-display text-base font-bold text-[#39243B]">
                  Select a conversation
                </h2>
                <p className="text-xs text-[#68556B]">
                  Choose a thread from the left or start a new direct message.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewChatOpen(true)}
                className="min-h-[40px] px-4 rounded-xl bg-[#39243B] text-white text-xs font-semibold hover:bg-[#4E3351]"
              >
                Start a chat
              </button>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="px-4 py-3 bg-white border-b border-[#E5DCE9] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveConversationId(null)}
                    aria-label="Back to conversations"
                    className="md:hidden min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[#39243B] hover:bg-[#F8F5FA]"
                  >
                    <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openProfile(otherUser.uid)}
                    className="flex items-center gap-2.5 min-w-0 text-left group"
                  >
                    <ResilientImage
                      src={otherUser.avatarUrl}
                      alt={otherUser.displayName}
                      objectPosition={otherUser.avatarPosition}
                      className="w-9 h-9 rounded-full object-cover border border-[#E5DCE9] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#39243B] group-hover:underline truncate">
                        {otherUser.displayName}
                      </p>
                      <p className="text-xs text-[#68556B] truncate">
                        @{otherUser.username}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeMessages.length === 0 ? (
                  <p className="text-xs text-center text-[#68556B] py-10">
                    Say hello to {otherUser.displayName}. Messages appear here with timestamps.
                  </p>
                ) : (
                  activeMessages.map((msg) => {
                    const isMine = msg.senderId === currentUser?.uid;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isMine ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                            isMine
                              ? 'bg-[#39243B] text-white'
                              : 'bg-white border border-[#E5DCE9] text-[#39243B]'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[11px] text-[#68556B] mt-1 px-1 tabular-nums">
                          {formatTimeClock(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={threadEndRef} />
              </div>

              {/* Message Composer */}
              <form
                onSubmit={handleSend}
                className="p-3 bg-white border-t border-[#E5DCE9] space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      if (sendError) setSendError(null);
                    }}
                    placeholder={`Message ${otherUser.displayName}...`}
                    aria-label="Message text"
                    maxLength={1000}
                    className="flex-1 min-h-[42px] px-3.5 rounded-xl border border-[#E5DCE9] bg-[#FAF8FC] text-sm text-[#39243B] focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    aria-label="Send message"
                    className="min-h-[42px] px-4 rounded-xl bg-[#A74695] hover:bg-[#913980] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
                {sendError && (
                  <p role="alert" className="text-xs text-[#B4234A]">
                    {sendError}
                  </p>
                )}
              </form>
            </>
          )}
        </section>
      </div>

      {/* New Message Picker Modal */}
      {newChatOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#39243B]/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="New direct message"
          onClick={() => setNewChatOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white border border-[#E5DCE9] shadow-xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E5DCE9]">
              <h2 className="font-display text-base font-bold text-[#39243B]">
                New message
              </h2>
              <button
                type="button"
                onClick={() => setNewChatOpen(false)}
                aria-label="Close"
                className="min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center text-[#68556B] hover:bg-[#F8F5FA]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {availableContacts.length === 0 ? (
                <p className="text-xs text-[#68556B] py-4 text-center">
                  No other users available to message.
                </p>
              ) : (
                availableContacts.map((person) => (
                  <button
                    key={person.uid}
                    type="button"
                    onClick={() => {
                      setNewChatOpen(false);
                      startConversation(person.uid);
                    }}
                    className="w-full min-h-[48px] px-3 py-2 rounded-xl hover:bg-[#F8F5FA] flex items-center gap-3 text-left transition-colors"
                  >
                    <ResilientImage
                      src={person.avatarUrl}
                      alt={person.displayName}
                      objectPosition={person.avatarPosition}
                      className="w-9 h-9 rounded-full object-cover border border-[#E5DCE9]"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#39243B] truncate">
                        {person.displayName}
                      </p>
                      <p className="text-xs text-[#68556B] truncate">@{person.username}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
