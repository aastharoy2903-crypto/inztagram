import React from 'react';
import { Bell, CheckCheck, Heart, MessageCircle, Send, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { NotificationItem } from '../types/inztagram';
import { formatRelativeTime } from '../utils/formatters';
import { ResilientImage } from './ResilientMedia';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    unreadNotificationsCount,
    usersById,
    markNotificationRead,
    markAllNotificationsRead,
    setSelectedPostId,
    openProfile,
    setActiveConversationId,
    setDestination,
  } = useApp();

  const handleOpenNotification = async (item: NotificationItem) => {
    if (!item.read) {
      await markNotificationRead(item.id);
    }
    if (item.postId) {
      setSelectedPostId(item.postId);
      return;
    }
    if (item.conversationId) {
      setActiveConversationId(item.conversationId);
      setDestination('messages');
      return;
    }
    openProfile(item.actorId);
  };

  const describeAction = (item: NotificationItem) => {
    switch (item.type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      case 'message':
        return 'sent you a direct message';
    }
  };

  const renderTypeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-[#A74695] dark:text-[#FF78C8]" aria-hidden="true" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-[#37689E] dark:text-[#7AA6FF]" aria-hidden="true" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-[#39243B] dark:text-[#F6EFF8]" aria-hidden="true" />;
      case 'message':
        return <Send className="w-4 h-4 text-[#A74695] dark:text-[#FF78C8]" aria-hidden="true" />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-[#39243B] dark:text-[#F6EFF8]">
            Notifications
          </h1>
          <p className="text-xs text-[#68556B] dark:text-[#B7A6BD]">
            Demo activity · Stored in this browser only (no push notifications)
          </p>
        </div>

        {unreadNotificationsCount > 0 && (
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="min-h-[38px] px-3.5 rounded-xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] hover:bg-[#F3EEF7] dark:hover:bg-[#231C29] text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8] inline-flex items-center gap-1.5 transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-[#A74695] dark:text-[#FF78C8]" aria-hidden="true" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F3EEF7] dark:bg-[#231C29] text-[#A74695] dark:text-[#FF78C8] flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="font-display text-base font-bold text-[#39243B] dark:text-[#F6EFF8]">
            You’re all caught up
          </h2>
          <p className="text-sm text-[#68556B] dark:text-[#B7A6BD] max-w-xs mx-auto">
            Likes, comments, new followers, and messages will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] divide-y divide-[#F1ECF5] dark:divide-[#2E2436] overflow-hidden">
          {notifications.map((item) => {
            const actor = usersById[item.actorId];
            if (!actor) return null;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleOpenNotification(item)}
                className={`w-full px-4 py-3.5 text-left flex items-start gap-3 transition-colors ${
                  item.read
                    ? 'bg-white dark:bg-[#18131D] hover:bg-[#FAF8FC] dark:hover:bg-[#211A28]'
                    : 'bg-[#FDF8FC] dark:bg-[#241928] hover:bg-[#F7EDF6] dark:hover:bg-[#2C1F31]'
                }`}
              >
                <ResilientImage
                  src={actor.avatarUrl}
                  alt={actor.displayName}
                  objectPosition={actor.avatarPosition}
                  className="w-10 h-10 rounded-full object-cover border border-[#E5DCE9] dark:border-[#3A2D45] shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-sm text-[#39243B] dark:text-[#F6EFF8] leading-snug">
                    <span className="font-semibold">{actor.username}</span>{' '}
                    <span>{describeAction(item)}</span>
                    <span className="text-xs text-[#68556B] dark:text-[#B7A6BD] ml-2 tabular-nums">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </p>
                  {item.previewText && (
                    <p className="text-xs text-[#68556B] dark:text-[#B7A6BD] truncate">
                      “{item.previewText}”
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 pt-1">
                  {renderTypeIcon(item.type)}
                  {!item.read && (
                    <span
                      className="w-2 h-2 rounded-full bg-[#D57FC4] dark:bg-[#FF78C8]"
                      aria-label="Unread notification"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
