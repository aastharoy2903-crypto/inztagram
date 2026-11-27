import React, { useMemo, useState } from 'react';
import { Compass, Loader2, PlusSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PostCard } from './PostCard';
import { ResilientImage } from './ResilientMedia';
import { SampleBadge } from './SampleBadge';
import { StoriesBar } from './StoriesBar';
import { TrendingCard } from './TrendingCard';

export const HomeFeedView: React.FC = () => {
  const {
    mode,
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

  const [feedScope, setFeedScope] = useState<'feed' | 'following'>('feed');

  const visiblePosts = useMemo(() => {
    if (feedScope === 'feed') {
      // Show followed accounts + own posts + clearly labeled sample posts so new accounts never land on an empty feed
      return posts.filter(
        (p) =>
          p.isSample ||
          followingIds.has(p.authorId) ||
          p.authorId === currentUser?.uid
      );
    }
    return posts.filter(
      (p) => followingIds.has(p.authorId) || p.authorId === currentUser?.uid
    );
  }, [posts, feedScope, followingIds, currentUser]);

  const suggestedCreators = useMemo(() => {
    return users
      .filter((u) => u.uid !== currentUser?.uid && !followingIds.has(u.uid))
      .slice(0, 4);
  }, [users, currentUser, followingIds]);

  const hasFollowedOrPosted = useMemo(() => {
    return (
      followingIds.size > 0 ||
      posts.some((p) => !p.isSample && p.authorId === currentUser?.uid)
    );
  }, [followingIds.size, posts, currentUser?.uid]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
      {/* Main Feed Column */}
      <div className="lg:col-span-8 space-y-5">
        <StoriesBar />

        {/* Feed Scope Toggle */}
        <div className="flex items-center justify-between gap-3">
          <div
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436]"
            role="tablist"
            aria-label="Feed filter"
          >
            <button
              type="button"
              role="tab"
              aria-selected={feedScope === 'feed'}
              onClick={() => setFeedScope('feed')}
              className={`min-h-[36px] px-3.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                feedScope === 'feed'
                  ? 'bg-[#39243B] dark:bg-[#FF64AE] text-white dark:text-[#111111]'
                  : 'text-[#68556B] dark:text-[#B7A6BD] hover:text-[#39243B] dark:hover:text-[#F6EFF8]'
              }`}
            >
              For you
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={feedScope === 'following'}
              onClick={() => setFeedScope('following')}
              className={`min-h-[36px] px-3.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                feedScope === 'following'
                  ? 'bg-[#39243B] dark:bg-[#FF64AE] text-white dark:text-[#111111]'
                  : 'text-[#68556B] dark:text-[#B7A6BD] hover:text-[#39243B] dark:hover:text-[#F6EFF8]'
              }`}
            >
              Following
            </button>
          </div>

          <button
            type="button"
            onClick={() => openCreateModal('post')}
            className="min-h-[38px] px-3.5 rounded-xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] hover:bg-[#F3EEF7] dark:hover:bg-[#231C29] text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <PlusSquare className="w-4 h-4 text-[#A74695] dark:text-[#FF64AE]" aria-hidden="true" />
            <span>New post</span>
          </button>
        </div>

        {mode === 'firebase' && feedScope === 'feed' && !hasFollowedOrPosted && (
          <div className="rounded-2xl bg-[#EEF6FF] dark:bg-[#162235] border border-[#B8D7FF] dark:border-[#2C476D] px-4 py-3 text-xs text-[#2A5380] dark:text-[#B7D1FF] flex flex-wrap items-center justify-between gap-2">
            <span>
              Showing clearly labeled <strong className="font-semibold">Sample</strong> creators alongside accounts you follow so your feed stays populated.
            </span>
            <button
              type="button"
              onClick={() => openCreateModal('post')}
              className="font-semibold underline hover:text-[#1D3E63] dark:hover:text-white shrink-0"
            >
              Create your first post
            </button>
          </div>
        )}

        {dataError && (
          <div
            role="alert"
            className="rounded-2xl bg-[#FDF2F5] dark:bg-[#2F1722] border border-[#F5CBD6] dark:border-[#5D293F] p-4 text-sm text-[#B4234A] dark:text-[#FF7B9C]"
          >
            Unable to load feed: {dataError}
          </div>
        )}

        {isLoadingData ? (
          <div className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] p-12 flex flex-col items-center justify-center gap-3 text-sm text-[#68556B] dark:text-[#B7A6BD]">
            <Loader2 className="w-6 h-6 animate-spin text-[#A74695] dark:text-[#FF64AE]" aria-hidden="true" />
            <span>Loading your feed...</span>
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F3EEF7] dark:bg-[#281E30] text-[#A74695] dark:text-[#FF64AE] flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h2 className="font-display text-base font-bold text-[#39243B] dark:text-[#F6EFF8]">
                {feedScope === 'following'
                  ? 'You are not following anyone yet'
                  : 'No posts yet'}
              </h2>
              <p className="text-sm text-[#68556B] dark:text-[#B7A6BD]">
                {feedScope === 'following'
                  ? 'Follow creators in Explore, switch to For you to browse sample posts, or share your own photo or Reel.'
                  : 'Publish your first photo or short video on Inztagram.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDestination('explore')}
                className="min-h-[40px] px-4 rounded-xl bg-[#39243B] dark:bg-[#231C29] text-white dark:text-[#F6EFF8] text-xs font-semibold hover:bg-[#4E3351] dark:hover:bg-[#2E2436]"
              >
                Explore creators
              </button>
              <button
                type="button"
                onClick={() => openCreateModal('post')}
                className="min-h-[40px] px-4 rounded-xl bg-[#A74695] dark:bg-[#FF64AE] text-white dark:text-[#111111] text-xs font-semibold hover:bg-[#913980] dark:hover:bg-[#ff7abb]"
              >
                Create your first post
              </button>
              {feedScope === 'following' && (
                <button
                  type="button"
                  onClick={() => setFeedScope('feed')}
                  className="min-h-[40px] px-4 rounded-xl border border-[#E5DCE9] dark:border-[#2E2436] bg-[#F8F5FA] dark:bg-[#231C29] text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#EFE7F5] dark:hover:bg-[#2E2436]"
                >
                  Browse For you
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {visiblePosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Mobile/Tablet Trending Section */}
        <div className="lg:hidden">
          <TrendingCard maxItems={5} />
        </div>
      </div>

      {/* Desktop Right Rail */}
      <aside className="hidden lg:block lg:col-span-4 space-y-5 sticky top-6">
        {currentUser && (
          <div className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] p-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => openProfile(currentUser.uid)}
              className="flex items-center gap-3 min-w-0 text-left group"
            >
              <ResilientImage
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                objectPosition={currentUser.avatarPosition}
                className="w-11 h-11 rounded-full object-cover border border-[#E5DCE9] dark:border-[#3A2D45] shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-sm font-semibold text-[#39243B] dark:text-[#F6EFF8] group-hover:underline truncate">
                    {currentUser.displayName}
                  </p>
                  {currentUser.isSample && <SampleBadge compact />}
                </div>
                <p className="text-xs text-[#68556B] dark:text-[#B7A6BD] truncate">
                  @{currentUser.username}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => openProfile(currentUser.uid)}
              className="text-xs font-semibold text-[#A74695] dark:text-[#FF64AE] hover:underline shrink-0"
            >
              Profile
            </button>
          </div>
        )}

        <TrendingCard maxItems={5} />

        <div className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-[#39243B] dark:text-[#F6EFF8]">
              Creators to follow
            </h2>
            <button
              type="button"
              onClick={() => setDestination('explore')}
              className="text-xs font-semibold text-[#37689E] dark:text-[#7AA6FF] hover:underline"
            >
              See all
            </button>
          </div>

          {suggestedCreators.length === 0 ? (
            <p className="text-xs text-[#68556B] dark:text-[#B7A6BD]">
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
                      className="w-9 h-9 rounded-full object-cover border border-[#E5DCE9] dark:border-[#3A2D45] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8] group-hover:underline truncate">
                          {creator.displayName}
                        </p>
                        {creator.isSample && <SampleBadge compact />}
                      </div>
                      <p className="text-xs text-[#68556B] dark:text-[#B7A6BD] truncate">
                        @{creator.username}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFollow(creator.uid)}
                    className="min-h-[32px] px-3 rounded-lg bg-[#EEF6FF] dark:bg-[#1B2A42] hover:bg-[#DCEBFF] dark:hover:bg-[#243757] text-[#2A5380] dark:text-[#9FC1FF] text-xs font-semibold transition-colors shrink-0"
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
