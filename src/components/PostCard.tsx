import React, { useState } from 'react';
import {
  Bookmark,
  Flag,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  ShieldBan,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Post } from '../types/inztagram';
import { formatCompactCount, formatRelativeTime, shareContent } from '../utils/formatters';
import { ReelVideoPlayer, ResilientImage } from './ResilientMedia';
import { SampleBadge } from './SampleBadge';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const {
    mode,
    currentUser,
    usersById,
    commentsByPost,
    likedPostIds,
    savedPostIds,
    followingIds,
    toggleLike,
    loadCommentsForPost,
    addComment,
    toggleFollow,
    toggleSavePost,
    deletePost,
    openProfile,
    openExploreWithTag,
    setSelectedPostId,
    reportContent,
    toggleBlockUser,
    showToast,
  } = useApp();

  const author = usersById[post.authorId];
  const comments = commentsByPost[post.id] || [];
  const isLiked = likedPostIds.has(post.id);
  const isSaved = savedPostIds.has(post.id);
  const isOwner = currentUser?.uid === post.authorId;
  const isFollowing = followingIds.has(post.authorId);

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!author) return null;

  const handleShare = async () => {
    const url = `${window.location.origin}/?post=${encodeURIComponent(post.id)}`;
    const result = await shareContent({
      title: `Post by @${author.username} on Inztagram`,
      text: post.caption || `View ${author.displayName}'s post on Inztagram`,
      url,
    });
    if (result.method === 'clipboard') {
      showToast('Post link copied to clipboard.');
    } else if (result.method === 'failed') {
      showToast('Share dismissed.');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    if (!commentText.trim()) {
      setCommentError('Please write a comment before posting.');
      return;
    }
    setSubmittingComment(true);
    try {
      await addComment(post.id, commentText);
      setCommentText('');
      setShowComments(true);
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Unable to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const renderCaptionWithHashtags = (caption: string) => {
    const parts = caption.split(/(#[a-zA-Z0-9_]+)/g);
    return parts.map((part, idx) => {
      if (/^#[a-zA-Z0-9_]+$/.test(part)) {
        return (
          <button
            key={`${part}-${idx}`}
            type="button"
            onClick={() => openExploreWithTag(part)}
            className="text-[#37689E] dark:text-[#7AA6FF] hover:underline font-medium"
          >
            {part}
          </button>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  return (
    <article className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => openProfile(author.uid)}
          className="flex items-center gap-3 min-w-0 text-left group"
        >
          <ResilientImage
            src={author.avatarUrl}
            alt={author.displayName}
            objectPosition={author.avatarPosition}
            className="w-10 h-10 rounded-full object-cover border border-[#E5DCE9] dark:border-[#3A2D45] shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-sm font-semibold text-[#39243B] dark:text-[#F6EFF8] group-hover:underline truncate">
                {author.displayName}
              </p>
              {(post.isSample || author.isSample) && <SampleBadge compact />}
            </div>
            <p className="text-xs text-[#68556B] dark:text-[#B7A6BD] flex items-center gap-1.5 truncate">
              <span>@{author.username}</span>
              <span aria-hidden="true">&middot;</span>
              <time dateTime={new Date(post.createdAt).toISOString()}>
                {formatRelativeTime(post.createdAt)}
              </time>
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isOwner && (
            <button
              type="button"
              onClick={() => toggleFollow(author.uid)}
              className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                isFollowing
                  ? 'bg-[#F8F5FA] dark:bg-[#231C29] border border-[#E5DCE9] dark:border-[#2E2436] text-[#68556B] dark:text-[#B7A6BD] hover:text-[#39243B] dark:hover:text-[#F6EFF8]'
                  : 'bg-[#EEF6FF] dark:bg-[#1B2A42] hover:bg-[#DCEBFF] dark:hover:bg-[#243757] text-[#2A5380] dark:text-[#9FC1FF]'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Post options"
              aria-expanded={menuOpen}
              className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[#68556B] dark:text-[#B7A6BD] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] hover:text-[#39243B] dark:hover:text-[#F6EFF8] transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-1 w-52 rounded-xl bg-white dark:bg-[#1B1522] border border-[#E5DCE9] dark:border-[#2E2436] shadow-lg p-1.5 z-20"
              >
                {isOwner ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      deletePost(post.id);
                    }}
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg text-left text-xs font-semibold text-[#B4234A] dark:text-[#FF7B9C] hover:bg-[#FDF2F5] dark:hover:bg-[#2F1722] flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span>Delete post</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        reportContent({
                          targetType: 'post',
                          targetId: post.id,
                          reason: 'Reported from feed',
                        });
                      }}
                      className="w-full min-h-[40px] px-3 py-2 rounded-lg text-left text-xs font-medium text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] flex items-center gap-2"
                    >
                      <Flag className="w-4 h-4 text-[#68556B] dark:text-[#B7A6BD]" aria-hidden="true" />
                      <span>
                        Report post {mode === 'demo' ? '(Demo only)' : ''}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        toggleBlockUser(author.uid);
                      }}
                      className="w-full min-h-[40px] px-3 py-2 rounded-lg text-left text-xs font-semibold text-[#B4234A] dark:text-[#FF7B9C] hover:bg-[#FDF2F5] dark:hover:bg-[#2F1722] flex items-center gap-2"
                    >
                      <ShieldBan className="w-4 h-4" aria-hidden="true" />
                      <span>
                        Block @{author.username} {mode === 'demo' ? '(Demo)' : ''}
                      </span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media container */}
      <div className="bg-[#F3EEF7] dark:bg-[#130F17]">
        {post.mediaType === 'video' ? (
          <ReelVideoPlayer
            src={post.mediaUrl}
            posterUrl={post.posterUrl}
            altText={post.altText || post.caption}
            demoReelTheme={post.demoReelTheme}
            objectPosition={post.objectPosition}
            isActive={false}
            compact
            className="w-full aspect-[4/5] max-h-[540px]"
          />
        ) : (
          <button
            type="button"
            onClick={() => setSelectedPostId(post.id)}
            aria-label={`Open post by ${author.displayName}`}
            className="w-full block focus-visible:outline-offset-[-3px]"
          >
            <ResilientImage
              src={post.mediaUrl}
              alt={post.altText || post.caption || `Photo by ${author.displayName}`}
              objectPosition={post.objectPosition}
              className={`w-full object-cover ${
                post.aspectRatio === 'square'
                  ? 'aspect-square'
                  : post.aspectRatio === 'landscape'
                    ? 'aspect-[4/3]'
                    : 'aspect-[4/5]'
              }`}
            />
          </button>
        )}
      </div>

      {/* Action bar & copy */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => toggleLike(post.id)}
              aria-pressed={isLiked}
              aria-label={isLiked ? 'Unlike post' : 'Like post'}
              className={`min-h-[40px] px-2.5 rounded-xl inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                isLiked
                  ? 'text-[#A74695] dark:text-[#FF64AE] bg-[#FDF5FB] dark:bg-[#2F1D2C]'
                  : 'text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29]'
              }`}
            >
              <Heart
                className={`w-5 h-5 ${
                  isLiked
                    ? 'fill-[#D57FC4] dark:fill-[#FF64AE] text-[#A74695] dark:text-[#FF64AE]'
                    : ''
                }`}
                aria-hidden="true"
              />
              <span className="tabular-nums">{formatCompactCount(post.likesCount)}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !showComments;
                setShowComments(next);
                if (next) void loadCommentsForPost(post.id);
              }}
              aria-expanded={showComments}
              aria-label="Comments"
              className="min-h-[40px] px-2.5 rounded-xl inline-flex items-center gap-1.5 text-sm font-medium text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] transition-colors"
            >
              <MessageCircle className="w-5 h-5" aria-hidden="true" />
              <span className="tabular-nums">{formatCompactCount(post.commentsCount)}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              aria-label="Share post"
              className="min-h-[40px] min-w-[40px] rounded-xl inline-flex items-center justify-center text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] transition-colors"
            >
              <Send className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => toggleSavePost(post.id)}
            aria-pressed={isSaved}
            aria-label={isSaved ? 'Remove bookmark' : 'Save post'}
            className={`min-h-[40px] min-w-[40px] rounded-xl inline-flex items-center justify-center transition-colors ${
              isSaved
                ? 'text-[#37689E] dark:text-[#7AA6FF] bg-[#EEF6FF] dark:bg-[#1B2A42]'
                : 'text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29]'
            }`}
          >
            <Bookmark
              className={`w-5 h-5 ${
                isSaved
                  ? 'fill-[#B8D7FF] dark:fill-[#7AA6FF] text-[#37689E] dark:text-[#7AA6FF]'
                  : ''
              }`}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-[#39243B] dark:text-[#E9DDF0] leading-relaxed">
            <button
              type="button"
              onClick={() => openProfile(author.uid)}
              className="font-semibold text-[#39243B] dark:text-[#F6EFF8] hover:underline mr-1.5"
            >
              {author.username}
            </button>
            {renderCaptionWithHashtags(post.caption)}
          </p>
        )}

        {/* Comment toggle preview */}
        {comments.length > 0 && !showComments && (
          <button
            type="button"
            onClick={() => {
              setShowComments(true);
              void loadCommentsForPost(post.id);
            }}
            className="text-xs font-medium text-[#68556B] dark:text-[#B7A6BD] hover:text-[#39243B] dark:hover:text-[#F6EFF8]"
          >
            View all {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </button>
        )}

        {/* Comments list */}
        {showComments && (
          <div className="space-y-2 pt-1 border-t border-[#F1ECF5] dark:border-[#2E2436]">
            {comments.length === 0 ? (
              <p className="text-xs text-[#68556B] dark:text-[#B7A6BD] py-1">
                No comments yet. Start the conversation.
              </p>
            ) : (
              comments.map((comment) => {
                const cAuthor = usersById[comment.authorId];
                return (
                  <div key={comment.id} className="text-sm flex items-start justify-between gap-2">
                    <p className="text-[#39243B] dark:text-[#E9DDF0] leading-snug">
                      <button
                        type="button"
                        onClick={() => cAuthor && openProfile(cAuthor.uid)}
                        className="font-semibold text-[#39243B] dark:text-[#F6EFF8] hover:underline mr-1.5"
                      >
                        {cAuthor?.username || 'member'}
                      </button>
                      <span>{comment.text}</span>
                    </p>
                    <span className="text-[11px] text-[#68556B] dark:text-[#B7A6BD] shrink-0 tabular-nums">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Inline comment form */}
        <form onSubmit={handleCommentSubmit} className="pt-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <label htmlFor={`comment-${post.id}`} className="sr-only">
              Add a comment
            </label>
            <input
              id={`comment-${post.id}`}
              type="text"
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);
                if (commentError) setCommentError(null);
              }}
              placeholder="Add a comment..."
              maxLength={500}
              className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E5DCE9] dark:border-[#2E2436] bg-[#FAF8FC] dark:bg-[#231C29] text-sm text-[#39243B] dark:text-[#F6EFF8] placeholder:text-[#8E7B91] focus:bg-white dark:focus:bg-[#1E1824]"
            />
            <button
              type="submit"
              disabled={submittingComment}
              className="min-h-[40px] px-3.5 rounded-xl bg-[#39243B] dark:bg-[#FF64AE] hover:bg-[#4E3351] dark:hover:bg-[#ff7abb] disabled:opacity-50 text-white dark:text-[#111111] text-xs font-semibold transition-colors whitespace-nowrap"
            >
              Post
            </button>
          </div>
          {commentError && (
            <p role="alert" className="text-xs text-[#B4234A] dark:text-[#FF7B9C]">
              {commentError}
            </p>
          )}
        </form>
      </div>
    </article>
  );
};
