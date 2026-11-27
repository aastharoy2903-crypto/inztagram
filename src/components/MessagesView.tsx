import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  MessageCircle,
  Palette,
  Plus,
  Send,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ChatThemeId } from '../types/inztagram';
import { formatRelativeTime, formatTimeClock } from '../utils/formatters';
import { ResilientImage } from './ResilientMedia';

interface ChatThemeOption {
  id: ChatThemeId;
  label: string;
  swatchClass: string;
  threadBgClass: string;
  myBubbleClass: string;
  otherBubbleClass: string;
  timeTextClass: string;
  emptyTextClass: string;
}

const CHAT_THEMES: ChatThemeOption[] = [
  {
    id: 'default',
    label: 'Classic Lavender',
    swatchClass: 'bg-gradient-to-br from-[#F8F5FA] to-[#39243B]',
    threadBgClass: 'bg-[#FAF8FC] dark:bg-[#130F17]',
    myBubbleClass: 'bg-[#39243B] text-white dark:bg-[#FF64AE] dark:text-[#111111]',
    otherBubbleClass:
      'bg-white dark:bg-[#1E1824] border border-[#E5DCE9] dark:border-[#2E2436] text-[#39243B] dark:text-[#F6EFF8]',
    timeTextClass: 'text-[#68556B] dark:text-[#B7A6BD]',
    emptyTextClass: 'text-[#68556B] dark:text-[#B7A6BD]',
  },
  {
    id: 'rose',
    label: 'Petal Rose',
    swatchClass: 'bg-gradient-to-br from-[#FFE4F0] to-[#C80B69]',
    threadBgClass:
      'bg-gradient-to-b from-[#FFF3F8] via-[#FCEAF3] to-[#FFF7FA] dark:from-[#24131E] dark:via-[#1C1018] dark:to-[#22121B]',
    myBubbleClass: 'bg-[#C80B69] text-white dark:bg-[#FF64AE] dark:text-[#111111]',
    otherBubbleClass:
      'bg-white/95 dark:bg-[#2B1A24] border border-[#F5CBE0] dark:border-[#49283B] text-[#39243B] dark:text-[#FBEAF2]',
    timeTextClass: 'text-[#7F4A65] dark:text-[#D5A3BD]',
    emptyTextClass: 'text-[#7F4A65] dark:text-[#D5A3BD]',
  },
  {
    id: 'ocean',
    label: 'Hydrangea Sky',
    swatchClass: 'bg-gradient-to-br from-[#DCEBFF] to-[#24569E]',
    threadBgClass:
      'bg-gradient-to-b from-[#EFF6FF] via-[#E5F0FF] to-[#F4F9FF] dark:from-[#101928] dark:via-[#0E1522] dark:to-[#131D2D]',
    myBubbleClass: 'bg-[#24569E] text-white dark:bg-[#6C95FF] dark:text-[#0B1220]',
    otherBubbleClass:
      'bg-white/95 dark:bg-[#1A2436] border border-[#C6DCFA] dark:border-[#2B3D5B] text-[#1D3557] dark:text-[#EDF4FF]',
    timeTextClass: 'text-[#486588] dark:text-[#9BB5DA]',
    emptyTextClass: 'text-[#486588] dark:text-[#9BB5DA]',
  },
  {
    id: 'emerald',
    label: 'Botanical Sage',
    swatchClass: 'bg-gradient-to-br from-[#DDF5E8] to-[#1F6B4B]',
    threadBgClass:
      'bg-gradient-to-b from-[#F1FAF5] via-[#E6F5EC] to-[#F4FBF7] dark:from-[#101F18] dark:via-[#0D1914] dark:to-[#12221B]',
    myBubbleClass: 'bg-[#1F6B4B] text-white dark:bg-[#4ADE9B] dark:text-[#081F15]',
    otherBubbleClass:
      'bg-white/95 dark:bg-[#182B22] border border-[#C4E7D4] dark:border-[#294739] text-[#173B2B] dark:text-[#E7F9F0]',
    timeTextClass: 'text-[#3F6B56] dark:text-[#95C4AD]',
    emptyTextClass: 'text-[#3F6B56] dark:text-[#95C4AD]',
  },
  {
    id: 'sunset',
    label: 'Peach Dusk',
    swatchClass: 'bg-gradient-to-br from-[#FFEAD9] to-[#B4435C]',
    threadBgClass:
      'bg-gradient-to-b from-[#FFF5EC] via-[#FFEADE] to-[#FFF2EB] dark:from-[#261614] dark:via-[#1F1212] dark:to-[#241418]',
    myBubbleClass: 'bg-[#B4435C] text-white dark:bg-[#FF8C7A] dark:text-[#230E0C]',
    otherBubbleClass:
      'bg-white/95 dark:bg-[#2F1D1B] border border-[#F4D0BF] dark:border-[#4D302C] text-[#432320] dark:text-[#FCEEEB]',
    timeTextClass: 'text-[#7F524B] dark:text-[#D5ABA2]',
    emptyTextClass: 'text-[#7F524B] dark:text-[#D5ABA2]',
  },
  {
    id: 'midnight',
    label: 'Starlight Ink',
    swatchClass: 'bg-gradient-to-br from-[#2B2040] to-[#FF64AE]',
    threadBgClass:
      'bg-gradient-to-b from-[#1A1329] via-[#130E20] to-[#1D1430]',
    myBubbleClass: 'bg-[#FF64AE] text-[#140B18] font-medium',
    otherBubbleClass:
      'bg-[#281F3D] border border-[#3E315C] text-[#F5EEFF]',
    timeTextClass: 'text-[#B5A6D4]',
    emptyTextClass: 'text-[#C4B5E3]',
  },
];

export const MessagesView: React.FC = () => {
  const {
    currentUser,
    users,
    usersById,
    blockedUserIds,
    conversations,
    messagesByConversation,
    chatThemesByConv,
    activeConversationId,
    setActiveConversationId,
    startConversation,
    sendMessage,
    markConversationRead,
    setConversationTheme,
    openProfile,
  } = useApp();

  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);

  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const activeConv =
    conversations.find((c) => c.id === activeConversationId) || null;
  const activeMessages = activeConv
    ? messagesByConversation[activeConv.id] || []
    : [];

  const activeThemeId: ChatThemeId = activeConv
    ? chatThemesByConv[activeConv.id] || 'default'
    : 'default';
  const activeTheme =
    CHAT_THEMES.find((t) => t.id === activeThemeId) || CHAT_THEMES[0];

  const otherUser = useMemo(() => {
    if (!activeConv || !currentUser) return null;
    const otherUid = activeConv.participants.find((id) => id !== currentUser.uid);
    return otherUid ? usersById[otherUid] || null : null;
  }, [activeConv, currentUser, usersById]);

  useEffect(() => {
    setThemePickerOpen(false);
  }, [activeConversationId]);

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
      <div className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] overflow-hidden h-[calc(100vh-145px)] md:h-[calc(100vh-48px)] min-h-[480px] grid grid-cols-1 md:grid-cols-12">
        {/* Conversation List */}
        <section
          aria-label="Conversations"
          className={`md:col-span-5 lg:col-span-4 border-r border-[#E5DCE9] dark:border-[#2E2436] flex flex-col ${
            activeConv ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="px-4 py-3.5 border-b border-[#E5DCE9] dark:border-[#2E2436] flex items-center justify-between gap-2">
            <div>
              <h1 className="font-display text-base font-bold text-[#39243B] dark:text-[#F6EFF8]">
                Messages
              </h1>
              <p className="text-[11px] text-[#68556B] dark:text-[#B7A6BD]">
                Demo messages · Stored in this browser only
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNewChatOpen(true)}
              aria-label="Start new conversation"
              className="min-h-[38px] px-3 rounded-xl bg-[#F8F5FA] dark:bg-[#231C29] hover:bg-[#EFE7F5] dark:hover:bg-[#2E2436] border border-[#E5DCE9] dark:border-[#2E2436] text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8] inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4 text-[#A74695] dark:text-[#FF64AE]" aria-hidden="true" />
              <span>New</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#F1ECF5] dark:divide-[#261D2E]">
            {conversations.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <MessageCircle className="w-8 h-8 text-[#A74695] dark:text-[#FF64AE] mx-auto" aria-hidden="true" />
                <p className="text-sm font-semibold text-[#39243B] dark:text-[#F6EFF8]">
                  No conversations yet
                </p>
                <p className="text-xs text-[#68556B] dark:text-[#B7A6BD]">
                  Start a direct message with someone you follow.
                </p>
                <button
                  type="button"
                  onClick={() => setNewChatOpen(true)}
                  className="min-h-[38px] px-4 rounded-xl bg-[#39243B] dark:bg-[#FF64AE] text-white dark:text-[#111111] text-xs font-semibold"
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
                      active
                        ? 'bg-[#F3EEF7] dark:bg-[#261D2E]'
                        : 'hover:bg-[#FAF8FC] dark:hover:bg-[#201927]'
                    }`}
                  >
                    <ResilientImage
                      src={partner.avatarUrl}
                      alt={partner.displayName}
                      objectPosition={partner.avatarPosition}
                      className="w-11 h-11 rounded-full object-cover border border-[#E5DCE9] dark:border-[#3A2D45] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#39243B] dark:text-[#F6EFF8] truncate">
                          {partner.displayName}
                        </p>
                        <span className="text-[11px] text-[#68556B] dark:text-[#B7A6BD] shrink-0 tabular-nums">
                          {formatRelativeTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <p
                        className={`text-xs truncate mt-0.5 ${
                          unread
                            ? 'font-semibold text-[#39243B] dark:text-[#F6EFF8]'
                            : 'text-[#68556B] dark:text-[#B7A6BD]'
                        }`}
                      >
                        {conv.lastMessageText || 'No messages yet'}
                      </p>
                    </div>
                    {unread && (
                      <span
                        className="w-2.5 h-2.5 rounded-full bg-[#D57FC4] dark:bg-[#FF64AE] shrink-0"
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
          className={`md:col-span-7 lg:col-span-8 flex flex-col ${activeTheme.threadBgClass} ${
            activeConv ? 'flex' : 'hidden md:flex'
          }`}
        >
          {!activeConv || !otherUser ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-[#FAF8FC] dark:bg-[#130F17]">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1E1824] border border-[#E5DCE9] dark:border-[#2E2436] flex items-center justify-center text-[#A74695] dark:text-[#FF64AE]">
                <MessageCircle className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1 max-w-xs">
                <h2 className="font-display text-base font-bold text-[#39243B] dark:text-[#F6EFF8]">
                  Select a conversation
                </h2>
                <p className="text-xs text-[#68556B] dark:text-[#B7A6BD]">
                  Choose a thread from the left or start a new direct message.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewChatOpen(true)}
                className="min-h-[40px] px-4 rounded-xl bg-[#39243B] dark:bg-[#FF64AE] text-white dark:text-[#111111] text-xs font-semibold hover:bg-[#4E3351] dark:hover:bg-[#ff7abb]"
              >
                Start a chat
              </button>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="px-4 py-3 bg-white/95 dark:bg-[#18131D]/95 backdrop-blur-sm border-b border-[#E5DCE9] dark:border-[#2E2436] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveConversationId(null)}
                    aria-label="Back to conversations"
                    className="md:hidden min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29]"
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
                      className="w-9 h-9 rounded-full object-cover border border-[#E5DCE9] dark:border-[#3A2D45] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#39243B] dark:text-[#F6EFF8] group-hover:underline truncate">
                        {otherUser.displayName}
                      </p>
                      <p className="text-xs text-[#68556B] dark:text-[#B7A6BD] truncate">
                        @{otherUser.username} · {activeTheme.label}
                      </p>
                    </div>
                  </button>
                </div>

                {/* Chat Theme Picker Toggle */}
                <button
                  type="button"
                  onClick={() => setThemePickerOpen((prev) => !prev)}
                  aria-expanded={themePickerOpen}
                  aria-label="Select chat theme"
                  className={`min-h-[36px] px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 ${
                    themePickerOpen
                      ? 'bg-[#FDF5FB] dark:bg-[#2F1D2C] border-[#A74695] dark:border-[#FF64AE] text-[#A74695] dark:text-[#FF64AE]'
                      : 'bg-[#F8F5FA] dark:bg-[#231C29] border-[#E5DCE9] dark:border-[#2E2436] text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#EFE7F5] dark:hover:bg-[#2E2436]'
                  }`}
                >
                  <Palette className="w-4 h-4" aria-hidden="true" />
                  <span>Theme</span>
                </button>
              </div>

              {/* Chat Theme Selector Strip */}
              {themePickerOpen && (
                <div
                  role="region"
                  aria-label="Choose chat theme"
                  className="px-4 py-3 bg-white dark:bg-[#1B1522] border-b border-[#E5DCE9] dark:border-[#2E2436] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8]">
                      Chat theme
                    </span>
                    <button
                      type="button"
                      onClick={() => setThemePickerOpen(false)}
                      aria-label="Close chat themes"
                      className="text-xs text-[#68556B] dark:text-[#B7A6BD] hover:text-[#39243B] dark:hover:text-[#F6EFF8]"
                    >
                      Done
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CHAT_THEMES.map((opt) => {
                      const selected = opt.id === activeTheme.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setConversationTheme(activeConv.id, opt.id);
                          }}
                          className={`min-h-[38px] px-2.5 py-1.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-colors ${
                            selected
                              ? 'border-[#A74695] dark:border-[#FF64AE] bg-[#FDF5FB] dark:bg-[#2C1E2E]'
                              : 'border-[#E5DCE9] dark:border-[#2E2436] bg-[#FAF8FC] dark:bg-[#231C29] hover:border-[#D57FC4]'
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-4 h-4 rounded-full border border-black/15 shrink-0 ${opt.swatchClass}`}
                              aria-hidden="true"
                            />
                            <span className="text-xs font-medium text-[#39243B] dark:text-[#F6EFF8] truncate">
                              {opt.label}
                            </span>
                          </span>
                          {selected && (
                            <Check
                              className="w-3.5 h-3.5 text-[#A74695] dark:text-[#FF64AE] shrink-0"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeMessages.length === 0 ? (
                  <p className={`text-xs text-center py-10 ${activeTheme.emptyTextClass}`}>
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
                              ? activeTheme.myBubbleClass
                              : activeTheme.otherBubbleClass
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span
                          className={`text-[11px] mt-1 px-1 tabular-nums ${activeTheme.timeTextClass}`}
                        >
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
                className="p-3 bg-white/95 dark:bg-[#18131D]/95 backdrop-blur-sm border-t border-[#E5DCE9] dark:border-[#2E2436] space-y-1.5"
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
                    className="flex-1 min-h-[42px] px-3.5 rounded-xl border border-[#E5DCE9] dark:border-[#2E2436] bg-[#FAF8FC] dark:bg-[#231C29] text-sm text-[#39243B] dark:text-[#F6EFF8] placeholder:text-[#8E7B91] focus:bg-white dark:focus:bg-[#1E1824]"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    aria-label="Send message"
                    className="min-h-[42px] px-4 rounded-xl bg-[#A74695] hover:bg-[#913980] dark:bg-[#FF64AE] dark:hover:bg-[#ff7abb] disabled:opacity-50 text-white dark:text-[#111111] text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
                {sendError && (
                  <p role="alert" className="text-xs text-[#B4234A] dark:text-[#FF7B9C]">
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
          className="fixed inset-0 z-50 bg-[#39243B]/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="New direct message"
          onClick={() => setNewChatOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] shadow-xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E5DCE9] dark:border-[#2E2436]">
              <h2 className="font-display text-base font-bold text-[#39243B] dark:text-[#F6EFF8]">
                New message
              </h2>
              <button
                type="button"
                onClick={() => setNewChatOpen(false)}
                aria-label="Close"
                className="min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center text-[#68556B] dark:text-[#B7A6BD] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {availableContacts.length === 0 ? (
                <p className="text-xs text-[#68556B] dark:text-[#B7A6BD] py-4 text-center">
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
                    className="w-full min-h-[48px] px-3 py-2 rounded-xl hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] flex items-center gap-3 text-left transition-colors"
                  >
                    <ResilientImage
                      src={person.avatarUrl}
                      alt={person.displayName}
                      objectPosition={person.avatarPosition}
                      className="w-9 h-9 rounded-full object-cover border border-[#E5DCE9] dark:border-[#3A2D45]"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#39243B] dark:text-[#F6EFF8] truncate">
                        {person.displayName}
                      </p>
                      <p className="text-xs text-[#68556B] dark:text-[#B7A6BD] truncate">
                        @{person.username}
                      </p>
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
