import React, { useMemo } from 'react';
import { Film, Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ResilientImage, ResilientVideoThumbnail } from './ResilientMedia';
import { SampleBadge } from './SampleBadge';
import { TrendingCard } from './TrendingCard';

export const ExploreView: React.FC = () => {
  const {
    currentUser,
    users,
    posts,
    followingIds,
    blockedUserIds,
    exploreQuery,
    setExploreQuery,
    openProfile,
    toggleFollow,
    setSelectedPostId,
  } = useApp();

  const normalizedQuery = exploreQuery.trim().toLowerCase();
  const cleanTagQuery = normalizedQuery.startsWith('#')
    ? normalizedQuery.slice(1)
    : normalizedQuery;

  const availableHashtags = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((p) => {
      p.hashtags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [posts]);

  const matchingUsers = useMemo(() => {
    const base = users.filter((u) => !blockedUserIds.has(u.uid));
    if (!normalizedQuery || normalizedQuery.startsWith('#')) {
      return normalizedQuery ? [] : base.filter((u) => u.uid !== currentUser?.uid);
    }
    return base.filter(
      (u) =>
        u.username.toLowerCase().includes(normalizedQuery) ||
        u.displayName.toLowerCase().includes(normalizedQuery)
    );
  }, [users, blockedUserIds, normalizedQuery, currentUser]);

  const matchingPosts = useMemo(() => {
    if (!normalizedQuery) return posts;
    return posts.filter((p) => {
      const matchesCaption = p.caption.toLowerCase().includes(normalizedQuery);
      const matchesTag = p.hashtags.some((tag) => tag.includes(cleanTagQuery));
      return matchesCaption || matchesTag;
    });
  }, [posts, normalizedQuery, cleanTagQuery]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-6">
      {/* Search Header */}
      <div className="space-y-3">
        <h1 className="font-display text-xl font-bold text-[#39243B] dark:text-[#F6EFF8]">
          Explore &amp; Search
        </h1>

        <div className="relative">
          <Search
            className="w-4 h-4 text-[#68556B] dark:text-[#B7A6BD] absolute left-3.5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={exploreQuery}
            onChange={(e) => setExploreQuery(e.target.value)}
            placeholder="Search people by name or @username, or filter #hashtags..."
            aria-label="Search users and hashtags"
            className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] text-sm text-[#39243B] dark:text-[#F6EFF8] placeholder:text-[#8E7B91]"
          />
          {exploreQuery && (
            <button
              type="button"
              onClick={() => setExploreQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center text-[#68556B] dark:text-[#B7A6BD] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29]"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Interactive Hashtag Filter Buttons */}
        {availableHashtags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setExploreQuery('')}
              className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 border ${
                !exploreQuery
                  ? 'bg-[#39243B] dark:bg-[#FF64AE] text-white dark:text-[#111111] border-[#39243B] dark:border-[#FF64AE]'
                  : 'bg-white dark:bg-[#18131D] text-[#68556B] dark:text-[#B7A6BD] border-[#E5DCE9] dark:border-[#2E2436] hover:text-[#39243B] dark:hover:text-[#F6EFF8]'
              }`}
            >
              All
            </button>
            {availableHashtags.map((tag) => {
              const tagFilter = `#${tag}`;
              const active = normalizedQuery === tagFilter;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setExploreQuery(active ? '' : tagFilter)}
                  className={`min-h-[34px] px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 border ${
                    active
                      ? 'bg-[#F3EEF7] dark:bg-[#2A1D2D] text-[#39243B] dark:text-[#F6EFF8] border-[#D57FC4] dark:border-[#FF64AE] font-semibold'
                      : 'bg-white dark:bg-[#18131D] text-[#68556B] dark:text-[#B7A6BD] border-[#E5DCE9] dark:border-[#2E2436] hover:text-[#39243B] dark:hover:text-[#F6EFF8]'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Trending on Inztagram (Last 24h) */}
      {!normalizedQuery && <TrendingCard maxItems={6} />}

      {/* Matching People */}
      {matchingUsers.length > 0 && (
        <section aria-label="People" className="space-y-3">
          <h2 className="font-display text-sm font-bold text-[#39243B] dark:text-[#F6EFF8]">
            People
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {matchingUsers.map((person) => {
              const isSelf = person.uid === currentUser?.uid;
              const isFollowing = followingIds.has(person.uid);
              return (
                <div
                  key={person.uid}
                  className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] p-3.5 flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => openProfile(person.uid)}
                    className="flex items-center gap-3 min-w-0 text-left group"
                  >
                    <ResilientImage
                      src={person.avatarUrl}
                      alt={person.displayName}
                      objectPosition={person.avatarPosition}
                      className="w-11 h-11 rounded-full object-cover border border-[#E5DCE9] dark:border-[#3A2D45] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-sm font-semibold text-[#39243B] dark:text-[#F6EFF8] group-hover:underline truncate">
                          {person.displayName}
                        </p>
                        {person.isSample && <SampleBadge compact />}
                      </div>
                      <p className="text-xs text-[#68556B] dark:text-[#B7A6BD] truncate">
                        @{person.username}
                      </p>
                    </div>
                  </button>
                  {!isSelf && (
                    <button
                      type="button"
                      onClick={() => toggleFollow(person.uid)}
                      className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                        isFollowing
                          ? 'bg-[#F8F5FA] dark:bg-[#231C29] border border-[#E5DCE9] dark:border-[#2E2436] text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#EFE7F5] dark:hover:bg-[#2E2436]'
                          : 'bg-[#EEF6FF] dark:bg-[#1B2A42] text-[#2A5380] dark:text-[#9FC1FF] hover:bg-[#DCEBFF] dark:hover:bg-[#243757]'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Explore Posts & Reels Grid */}
      <section aria-label="Explore posts" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-[#39243B] dark:text-[#F6EFF8]">
            {normalizedQuery ? `Results for "${exploreQuery.trim()}"` : 'Recent posts & Reels'}
          </h2>
          <span className="text-xs text-[#68556B] dark:text-[#B7A6BD] tabular-nums">
            {matchingPosts.length} {matchingPosts.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {matchingPosts.length === 0 && matchingUsers.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] p-10 text-center space-y-3">
            <p className="font-display text-base font-bold text-[#39243B] dark:text-[#F6EFF8]">
              No matching users or posts
            </p>
            <p className="text-sm text-[#68556B] dark:text-[#B7A6BD]">
              Try a different username, display name, or hashtag.
            </p>
            <button
              type="button"
              onClick={() => setExploreQuery('')}
              className="min-h-[40px] px-4 rounded-xl bg-[#39243B] dark:bg-[#FF64AE] text-white dark:text-[#111111] text-xs font-semibold hover:bg-[#4E3351] dark:hover:bg-[#ff7abb]"
            >
              Clear search
            </button>
          </div>
        ) : matchingPosts.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] p-8 text-center text-sm text-[#68556B] dark:text-[#B7A6BD]">
            No posts matched that query, though matching profiles are shown above.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
            {matchingPosts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setSelectedPostId(post.id)}
                aria-label={`Open ${post.mediaType === 'video' ? 'Reel' : 'post'}: ${
                  post.altText || post.caption || 'media item'
                }`}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-[#F3EEF7] dark:bg-[#231C29] border border-[#E5DCE9] dark:border-[#2E2436] text-left"
              >
                {post.mediaType === 'video' ? (
                  <ResilientVideoThumbnail
                    src={post.mediaUrl}
                    posterUrl={post.posterUrl}
                    alt={post.altText || post.caption || 'Explore Reel'}
                    objectPosition={post.objectPosition}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                  />
                ) : (
                  <ResilientImage
                    src={post.mediaUrl}
                    alt={post.altText || post.caption || 'Explore post'}
                    objectPosition={post.objectPosition}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                  />
                )}
                {post.isSample && (
                  <span className="absolute top-2.5 left-2.5">
                    <SampleBadge compact dark />
                  </span>
                )}
                {post.mediaType === 'video' && (
                  <span className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-[#39243B]/75 text-white flex items-center justify-center backdrop-blur-xs">
                    <Film className="w-4 h-4" aria-hidden="true" />
                  </span>
                )}
                <div className="pointer-events-none absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
