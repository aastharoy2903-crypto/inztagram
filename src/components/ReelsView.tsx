import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Film,
  Heart,
  MessageCircle,
  PlusSquare,
  Send,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCompactCount, formatRelativeTime, shareContent } from '../utils/formatters';
import { ReelVideoPlayer, ResilientImage } from './ResilientMedia';
import { SampleBadge } from './SampleBadge';

export const ReelsView: React.FC = () => {
  const {
    currentUser,
    posts,
    usersById,
    commentsByPost,
    likedPostIds,
    followingIds,
    toggleLike,
    addComment,
    toggleFollow,
    openProfile,
    openCreateModal,
    showToast,
  } = useApp();

  const reels = useMemo(
    () => posts.filter((p) => p.mediaType === 'video'),
    [posts]
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentDrawerReelId, setCommentDrawerReelId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    if (activeIndex >= reels.length && reels.length > 0) {
      setActiveIndex(reels.length - 1);
    }
  }, [reels.length, activeIndex]);

  const scrollToReel = (nextIdx: number) => {
    const clamped = Math.max(0, Math.min(reels.length - 1, nextIdx));
    setActiveIndex(clamped);
    const container = containerRef.current;
    if (!container) return;
    const child = container.children[clamped] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container || container.clientHeight === 0) return;
    const idx = Math.round(container.scrollTop / container.clientHeight);
    if (idx !== activeIndex && idx >= 0 && idx < reels.length) {
      setActiveIndex(idx);
    }
  };

  const handleShare = async (reelId: string, authorUsername: string) => {
    const url = `${window.location.origin}/?reel=${encodeURIComponent(reelId)}`;
    const res = await shareContent({
      title: `Reel by @${authorUsername} on Inztagram`,
      text: 'Watch this short video on Inztagram',
      url,
    });
    if (res.method === 'clipboard') showToast('Reel link copied to clipboard.');
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentDrawerReelId) return;
    setCommentError(null);
    if (!commentText.trim()) {
      setCommentError('Please enter a comment.');
      return;
    }
    try {
      await addComment(commentDrawerReelId, commentText);
      setCommentText('');
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Unable to post comment.');
    }
  };

  if (reels.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-14 text-center">
        <div className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] p-10 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F3EEF7] dark:bg-[#281E30] text-[#A74695] dark:text-[#FF64AE] flex items-center justify-center mx-auto">
            <Film className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="font-display text-lg font-bold text-[#39243B] dark:text-[#F6EFF8]">
            No Reels yet
          </h1>
          <p className="text-sm text-[#68556B] dark:text-[#B7A6BD] max-w-sm mx-auto">
            Short vertical videos appear here in chronological order. Choose a clip to share the first Reel.
          </p>
          <button
            type="button"
            onClick={() => openCreateModal('reel')}
            className="min-h-[42px] px-4 rounded-xl bg-[#39243B] dark:bg-[#FF64AE] text-white dark:text-[#111111] text-xs font-semibold hover:bg-[#4E3351] dark:hover:bg-[#ff7abb] inline-flex items-center gap-2"
          >
            <PlusSquare className="w-4 h-4" aria-hidden="true" />
            <span>Create Reel</span>
          </button>
        </div>
      </div>
    );
  }

  const drawerComments = commentDrawerReelId
    ? commentsByPost[commentDrawerReelId] || []
    : [];

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 flex flex-col items-center">
      {/* Top context bar */}
      <div className="w-full max-w-[440px] flex items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="font-display text-lg font-bold text-[#39243B] dark:text-[#F6EFF8]">
            Reels
          </h1>
          <p className="text-xs text-[#68556B] dark:text-[#B7A6BD]">
            Chronological short videos · Muted by default
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreateModal('reel')}
          className="min-h-[38px] px-3.5 rounded-xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] hover:bg-[#F3EEF7] dark:hover:bg-[#231C29] text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8] inline-flex items-center gap-1.5 whitespace-nowrap"
        >
          <PlusSquare className="w-4 h-4 text-[#A74695] dark:text-[#FF64AE]" aria-hidden="true" />
          <span>New Reel</span>
        </button>
      </div>

      {/* Vertical Reel Stage + Desktop Arrow Controls */}
      <div className="flex items-center justify-center gap-4 w-full">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="w-full max-w-[420px] h-[calc(100vh-195px)] md:h-[calc(100vh-110px)] min-h-[480px] max-h-[760px] overflow-y-scroll snap-y snap-mandatory rounded-2xl border border-[#E5DCE9] dark:border-[#2E2436] bg-[#241626] dark:bg-[#0B090D] shadow-md scrollbar-thin"
          aria-label="Vertical short video feed"
        >
          {reels.map((reel, idx) => {
            const author = usersById[reel.authorId];
            if (!author) return null;
            const isLiked = likedPostIds.has(reel.id);
            const isFollowing = followingIds.has(author.uid);
            const isOwn = currentUser?.uid === author.uid;

            return (
              <section
                key={reel.id}
                aria-label={`Reel by ${author.displayName}`}
                className="relative w-full h-full snap-start shrink-0 overflow-hidden"
              >
                <ReelVideoPlayer
                  src={reel.mediaUrl}
                  posterUrl={reel.posterUrl}
                  altText={reel.altText || reel.caption}
                  demoReelTheme={reel.demoReelTheme}
                  objectPosition={reel.objectPosition}
                  isActive={idx === activeIndex}
                  className="w-full h-full"
                />

                {/* Bottom contrast scrim */}
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
                  aria-hidden="true"
                />

                {/* Bottom-left Creator & Caption */}
                <div className="absolute bottom-5 left-4 right-16 z-10 text-white space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => openProfile(author.uid)}
                      className="flex items-center gap-2 text-left min-w-0"
                    >
                      <ResilientImage
                        src={author.avatarUrl}
                        alt={author.displayName}
                        objectPosition={author.avatarPosition}
                        className="w-9 h-9 rounded-full object-cover border border-white/60 shrink-0"
                      />
                      <span className="text-sm font-semibold truncate hover:underline">
                        @{author.username}
                      </span>
                    </button>
                    {(reel.isSample || author.isSample) && <SampleBadge compact dark />}

                    {!isOwn && (
                      <button
                        type="button"
                        onClick={() => toggleFollow(author.uid)}
                        className={`min-h-[30px] px-3 rounded-lg text-xs font-semibold border transition-colors ${
                          isFollowing
                            ? 'bg-white/15 border-white/40 text-white'
                            : 'bg-white text-[#39243B] border-white'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>

                  {reel.caption && (
                    <p className="text-sm text-white/95 leading-snug line-clamp-3">
                      {reel.caption}
                    </p>
                  )}
                  <p className="text-[11px] text-white/70">
                    {formatRelativeTime(reel.createdAt)}
                  </p>
                </div>

                {/* Bottom-right Interaction Rail */}
                <div className="absolute bottom-5 right-3 z-10 flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleLike(reel.id)}
                    aria-pressed={isLiked}
                    aria-label={isLiked ? 'Unlike reel' : 'Like reel'}
                    className="flex flex-col items-center gap-1 text-white"
                  >
                    <span
                      className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${
                        isLiked ? 'bg-[#D57FC4]/90' : 'bg-black/40 hover:bg-black/60'
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="text-xs font-semibold tabular-nums">
                      {formatCompactCount(reel.likesCount)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCommentError(null);
                      setCommentDrawerReelId(reel.id);
                    }}
                    aria-label="Open reel comments"
                    className="flex flex-col items-center gap-1 text-white"
                  >
                    <span className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center backdrop-blur-sm transition-colors">
                      <MessageCircle className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold tabular-nums">
                      {formatCompactCount(reel.commentsCount)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShare(reel.id, author.username)}
                    aria-label="Share reel"
                    className="flex flex-col items-center gap-1 text-white"
                  >
                    <span className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center backdrop-blur-sm transition-colors">
                      <Send className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-medium">Share</span>
                  </button>
                </div>
              </section>
            );
          })}
        </div>

        {/* Desktop Previous / Next Video Controls */}
        <div className="hidden sm:flex flex-col gap-2">
          <button
            type="button"
            disabled={activeIndex === 0}
            onClick={() => scrollToReel(activeIndex - 1)}
            aria-label="Previous reel"
            className="min-h-[44px] min-w-[44px] rounded-full bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F3EEF7] dark:hover:bg-[#231C29] disabled:opacity-40 flex items-center justify-center shadow-xs transition-colors"
          >
            <ChevronUp className="w-5 h-5" aria-hidden="true" />
          </button>
          <span className="text-xs text-center text-[#68556B] dark:text-[#B7A6BD] font-medium tabular-nums">
            {activeIndex + 1}/{reels.length}
          </span>
          <button
            type="button"
            disabled={activeIndex >= reels.length - 1}
            onClick={() => scrollToReel(activeIndex + 1)}
            aria-label="Next reel"
            className="min-h-[44px] min-w-[44px] rounded-full bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F3EEF7] dark:hover:bg-[#231C29] disabled:opacity-40 flex items-center justify-center shadow-xs transition-colors"
          >
            <ChevronDown className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Reel Comments Drawer */}
      {commentDrawerReelId && (
        <div
          className="fixed inset-0 z-50 bg-[#1F1321]/50 dark:bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Reel comments"
          onClick={() => setCommentDrawerReelId(null)}
        >
          <div
            className="w-full sm:max-w-md max-h-[75vh] rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-[#E5DCE9] dark:border-[#2E2436] flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-[#39243B] dark:text-[#F6EFF8]">
                Comments ({drawerComments.length})
              </h2>
              <button
                type="button"
                onClick={() => setCommentDrawerReelId(null)}
                aria-label="Close comments"
                className="min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center text-[#68556B] dark:text-[#B7A6BD] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {drawerComments.length === 0 ? (
                <p className="text-sm text-[#68556B] dark:text-[#B7A6BD] text-center py-6">
                  No comments yet. Add the first note below.
                </p>
              ) : (
                drawerComments.map((c) => {
                  const cAuthor = usersById[c.authorId];
                  return (
                    <div key={c.id} className="flex items-start gap-2.5 text-sm">
                      <ResilientImage
                        src={cAuthor?.avatarUrl || '/assets/aistudio/image_251618e5.png'}
                        alt={cAuthor?.displayName || 'Member'}
                        objectPosition={cAuthor?.avatarPosition}
                        className="w-8 h-8 rounded-full object-cover border border-[#E5DCE9] dark:border-[#3A2D45] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[#39243B] dark:text-[#E9DDF0]">
                          <span className="font-semibold text-[#39243B] dark:text-[#F6EFF8] mr-1.5">
                            {cAuthor?.username || 'member'}
                          </span>
                          <span>{c.text}</span>
                        </p>
                        <p className="text-[11px] text-[#68556B] dark:text-[#B7A6BD] mt-0.5 tabular-nums">
                          {formatRelativeTime(c.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={handleCommentSubmit}
              className="p-3.5 border-t border-[#E5DCE9] dark:border-[#2E2436] space-y-1"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => {
                    setCommentText(e.target.value);
                    if (commentError) setCommentError(null);
                  }}
                  placeholder="Add a comment..."
                  aria-label="Add a comment"
                  className="flex-1 min-h-[42px] px-3 rounded-xl border border-[#E5DCE9] dark:border-[#2E2436] bg-[#FAF8FC] dark:bg-[#231C29] text-sm text-[#39243B] dark:text-[#F6EFF8] placeholder:text-[#8E7B91]"
                />
                <button
                  type="submit"
                  className="min-h-[42px] px-4 rounded-xl bg-[#39243B] dark:bg-[#FF64AE] text-white dark:text-[#111111] text-xs font-semibold hover:bg-[#4E3351] dark:hover:bg-[#ff7abb]"
                >
                  Post
                </button>
              </div>
              {commentError && (
                <p className="text-xs text-[#B4234A] dark:text-[#FF7B9C]">{commentError}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
