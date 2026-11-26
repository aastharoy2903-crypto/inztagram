import React, { useMemo, useState } from 'react';
import { Compass, Loader2, PlusSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PostCard } from './PostCard';
import { ResilientImage } from './ResilientMedia';
import { StoriesBar } from './StoriesBar';

export const HomeFeedView: React.FC = () => {
  const {
    currentUser,
    users,
    posts,
    followingIds,
    isLoadingData,
    dataError,
    setDestination,
    openCreateModal,
    openProfile,
    toggleFollow,
  } = useApp();

  const [feedScope, setFeedScope] = useState<'following' | 'all'>('following');

  const visiblePosts = useMemo(() => {
    if (feedScope === 'all') return posts;
    const followed = posts.filter(
      (p) => followingIds.has(p.authorId) || p.authorId === currentUser?.uid
    );
    return followed;
  }, [posts, feedScope, followingIds, currentUser]);

  const suggestedCreators = useMemo(() => {
    return users
      .filter((u) => u.uid !== currentUser?.uid && !followingIds.has(u.uid))
      .slice(0, 4);
  }, [users, currentUser, followingIds]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
      {/* Main Feed Column */}
      <div className="lg:col-span-8 space-y-5">
        <StoriesBar />

        {/* Feed Scope Toggle */}
        <div className="flex items-center justify-between gap-3">
          <div
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-white border border-[#E5DCE9]"
            role="tablist"
            aria-label="Feed filter"
          >
            <button
              type="button"
              role="tab"
              aria-selected={feedScope === 'following'}
              onClick={() => setFeedScope('following')}
              className={`min-h-[36px] px-3.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                feedScope === 'following'
                  ? 'bg-[#39243B] text-white'
                  : 'text-[#68556B] hover:text-[#39243B]'
              }`}
            >
              Following
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={feedScope === 'all'}
              onClick={() => setFeedScope('all')}
              className={`min-h-[36px] px-3.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                feedScope === 'all'
                  ? 'bg-[#39243B] text-white'
                  : 'text-[#68556B] hover:text-[#39243B]'
              }`}
            >
              All posts
            </button>
          </div>

          <button
            type="button"
            onClick={() => openCreateModal('post')}
            className="min-h-[38px] px-3.5 rounded-xl bg-white border border-[#E5DCE9] hover:bg-[#F3EEF7] text-xs font-semibold text-[#39243B] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <PlusSquare className="w-4 h-4 text-[#A74695]" aria-hidden="true" />
            <span>New post</span>
          </button>
        </div>

        {dataError && (
          <div
            role="alert"
            className="rounded-2xl bg-[#FDF2F5] border border-[#F5CBD6] p-4 text-sm text-[#B4234A]"
          >
            Unable to load feed: {dataError}
          </div>
        )}

        {isLoadingData ? (
          <div className="rounded-2xl bg-white border border-[#E5DCE9] p-12 flex flex-col items-center justify-center gap-3 text-sm text-[#68556B]">
            <Loader2 className="w-6 h-6 animate-spin text-[#A74695]" aria-hidden="true" />
            <span>Loading your feed...</span>
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E5DCE9] p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F3EEF7] text-[#A74695] flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h2 className="font-display text-base font-bold text-[#39243B]">
                {feedScope === 'following'
                  ? 'Your following feed is quiet'
                  : 'No posts yet'}
              </h2>
              <p className="text-sm text-[#68556B]">
                {feedScope === 'following'
                  ? 'Follow creators in Explore or switch to All posts to see the latest moments.'
                  : 'Publish the first photo or short video on Inztagram.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {feedScope === 'following' && (
                <button
                  type="button"
                  onClick={() => setFeedScope('all')}
                  className="min-h-[40px] px-4 rounded-xl bg-[#39243B] text-white text-xs font-semibold hover:bg-[#4E3351]"
                >
                  Show all posts
                </button>
              )}
              <button
                type="button"
                onClick={() => setDestination('explore')}
                className="min-h-[40px] px-4 rounded-xl border border-[#E5DCE9] bg-[#F8F5FA] text-xs font-semibold text-[#39243B] hover:bg-[#EFE7F5]"
              >
                Explore creators
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {visiblePosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Right Rail: Current profile summary & creators to follow */}
      <aside className="hidden lg:block lg:col-span-4 space-y-5 sticky top-6">
        {currentUser && (
          <div className="rounded-2xl bg-white border border-[#E5DCE9] p-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => openProfile(currentUser.uid)}
              className="flex items-center gap-3 min-w-0 text-left group"
            >
              <ResilientImage
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                objectPosition={currentUser.avatarPosition}
                className="w-11 h-11 rounded-full object-cover border border-[#E5DCE9] shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#39243B] group-hover:underline truncate">
                  {currentUser.displayName}
                </p>
                <p className="text-xs text-[#68556B] truncate">@{currentUser.username}</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => openProfile(currentUser.uid)}
              className="text-xs font-semibold text-[#A74695] hover:underline shrink-0"
            >
              Profile
            </button>
          </div>
        )}

        <div className="rounded-2xl bg-white border border-[#E5DCE9] p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-[#39243B]">
              Creators to follow
            </h2>
            <button
              type="button"
              onClick={() => setDestination('explore')}
              className="text-xs font-semibold text-[#37689E] hover:underline"
            >
              See all
            </button>
          </div>

          {suggestedCreators.length === 0 ? (
            <p className="text-xs text-[#68556B]">
              You’re following everyone currently listed.
            </p>
          ) : (
            <div className="space-y-3">
              {suggestedCreators.map((creator) => (
                <div key={creator.uid} className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => openProfile(creator.uid)}
                    className="flex items-center gap-2.5 min-w-0 text-left group"
                  >
                    <ResilientImage
                      src={creator.avatarUrl}
                      alt={creator.displayName}
                      objectPosition={creator.avatarPosition}
                      className="w-9 h-9 rounded-full object-cover border border-[#E5DCE9] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#39243B] group-hover:underline truncate">
                        {creator.displayName}
                      </p>
                      <p className="text-xs text-[#68556B] truncate">@{creator.username}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFollow(creator.uid)}
                    className="min-h-[32px] px-3 rounded-lg bg-[#EEF6FF] hover:bg-[#DCEBFF] text-[#2A5380] text-xs font-semibold transition-colors shrink-0"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
