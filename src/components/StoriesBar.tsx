import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ResilientImage } from './ResilientMedia';

export const StoriesBar: React.FC = () => {
  const {
    currentUser,
    stories,
    usersById,
    seenStoryIds,
    setActiveStoryAuthorId,
    openCreateModal,
  } = useApp();

  const groupedAuthors = useMemo(() => {
    const map = new Map<string, { unseen: boolean; latestAt: number }>();
    stories.forEach((s) => {
      const existing = map.get(s.authorId);
      const isUnseen = !seenStoryIds.has(s.id);
      if (!existing) {
        map.set(s.authorId, { unseen: isUnseen, latestAt: s.createdAt });
      } else {
        map.set(s.authorId, {
          unseen: existing.unseen || isUnseen,
          latestAt: Math.max(existing.latestAt, s.createdAt),
        });
      }
    });

    return Array.from(map.entries())
      .map(([authorId, meta]) => ({
        authorId,
        user: usersById[authorId],
        ...meta,
      }))
      .filter((item) => Boolean(item.user))
      .sort((a, b) => {
        if (a.authorId === currentUser?.uid) return -1;
        if (b.authorId === currentUser?.uid) return 1;
        if (a.unseen !== b.unseen) return a.unseen ? -1 : 1;
        return b.latestAt - a.latestAt;
      });
  }, [stories, usersById, seenStoryIds, currentUser]);

  return (
    <section
      aria-label="24-hour stories"
      className="rounded-2xl bg-white border border-[#E5DCE9] px-4 py-3.5"
    >
      <div className="flex items-center gap-4 overflow-x-auto scrollbar-thin pb-1">
        {/* Add story button */}
        <button
          type="button"
          onClick={() => openCreateModal('story')}
          className="flex flex-col items-center gap-1.5 shrink-0 group focus-visible:outline-offset-4"
        >
          <span className="w-16 h-16 rounded-full p-[2.5px] bg-[#E5DCE9] group-hover:bg-[#D57FC4] transition-colors relative flex items-center justify-center">
            <span className="w-full h-full rounded-full bg-white p-0.5 block overflow-hidden">
              <ResilientImage
                src={currentUser?.avatarUrl || '/samples/avatar-you.svg'}
                alt="Your story"
                objectPosition={currentUser?.avatarPosition}
                className="w-full h-full rounded-full object-cover"
              />
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-[#39243B] text-white border-2 border-white flex items-center justify-center">
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          </span>
          <span className="text-xs text-[#39243B] font-medium max-w-[68px] truncate">
            Your story
          </span>
        </button>

        {groupedAuthors.map(({ authorId, user, unseen }) => (
          <button
            key={authorId}
            type="button"
            onClick={() => setActiveStoryAuthorId(authorId)}
            aria-label={`View ${user.displayName}'s story`}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus-visible:outline-offset-4"
          >
            <span
              className={`w-16 h-16 rounded-full p-[2.5px] transition-transform group-hover:scale-[1.03] ${
                unseen ? 'story-ring-unseen' : 'story-ring-seen'
              }`}
            >
              <span className="w-full h-full rounded-full bg-white p-[2px] block overflow-hidden">
                <ResilientImage
                  src={user.avatarUrl}
                  alt={user.displayName}
                  objectPosition={user.avatarPosition}
                  className="w-full h-full rounded-full object-cover"
                />
              </span>
            </span>
            <span className="text-xs text-[#39243B] font-medium max-w-[68px] truncate">
              {authorId === currentUser?.uid ? 'You' : user.username}
            </span>
          </button>
        ))}

        {groupedAuthors.length === 0 && (
          <p className="text-xs text-[#68556B] py-2">
            No active stories right now. Share a 24-hour moment!
          </p>
        )}
      </div>
    </section>
  );
};
