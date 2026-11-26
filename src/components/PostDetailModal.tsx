import React, { useEffect, useState } from 'react';
import { Bookmark, Heart, Send, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCompactCount, formatRelativeTime, shareContent } from '../utils/formatters';
import { ReelVideoPlayer, ResilientImage } from './ResilientMedia';

export const PostDetailModal: React.FC = () => {
  const {
    currentUser,
    posts,
    usersById,
    commentsByPost,
    likedPostIds,
    savedPostIds,
    selectedPostId,
    setSelectedPostId,
    toggleLike,
    addComment,
    toggleSavePost,
    deletePost,
    openProfile,
    openExploreWithTag,
    showToast,
  } = useApp();

  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const post = posts.find((p) => p.id === selectedPostId) || null;
  const author = post ? usersById[post.authorId] : null;
  const comments = post ? commentsByPost[post.id] || [] : [];

  useEffect(() => {
    if (!selectedPostId) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPostId(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedPostId, setSelectedPostId]);

  if (!post || !author) return null;

  const isLiked = likedPostIds.has(post.id);
  const isSaved = savedPostIds.has(post.id);
  const isOwner = currentUser?.uid === post.authorId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    if (!commentText.trim()) {
      setCommentError('Comment cannot be empty.');
      return;
    }
    setSubmitting(true);
    try {
      await addComment(post.id, commentText);
      setCommentText('');
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Could not post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/?post=${encodeURIComponent(post.id)}`;
    const result = await shareContent({
      title: `Post by @${author.username}`,
      text: post.caption || 'Shared from Inztagram',
      url,
    });
    if (result.method === 'clipboard') showToast('Link copied to clipboard.');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1F1321]/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Post by ${author.displayName}`}
      onClick={() => setSelectedPostId(null)}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white border border-[#E5DCE9] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media pane */}
        <div className="md:col-span-7 bg-[#241626] flex items-center justify-center max-h-[50vh] md:max-h-[90vh]">
          {post.mediaType === 'video' ? (
            <ReelVideoPlayer
              src={post.mediaUrl}
              posterUrl={post.posterUrl}
              altText={post.altText || post.caption}
              demoReelTheme={post.demoReelTheme}
              objectPosition={post.objectPosition}
              isActive
              className="w-full h-full min-h-[300px]"
            />
          ) : (
            <ResilientImage
              src={post.mediaUrl}
              alt={post.altText || post.caption}
              className="w-full h-full max-h-[85vh] object-contain"
            />
          )}
        </div>

        {/* Details & comments pane */}
        <div className="md:col-span-5 flex flex-col max-h-[45vh] md:max-h-[90vh]">
          <div className="px-4 py-3 border-b border-[#E5DCE9] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedPostId(null);
                openProfile(author.uid);
              }}
              className="flex items-center gap-2.5 text-left min-w-0"
            >
              <ResilientImage
                src={author.avatarUrl}
                alt={author.displayName}
                objectPosition={author.avatarPosition}
                className="w-9 h-9 rounded-full object-cover border border-[#E5DCE9]"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#39243B] truncate">
                  {author.displayName}
                </p>
                <p className="text-xs text-[#68556B] truncate">@{author.username}</p>
              </div>
            </button>

            <div className="flex items-center gap-1">
              {isOwner && (
                <button
                  type="button"
                  onClick={() => deletePost(post.id)}
                  aria-label="Delete post"
                  className="min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center text-[#B4234A] hover:bg-[#FDF2F5]"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedPostId(null)}
                aria-label="Close post viewer"
                className="min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center text-[#68556B] hover:bg-[#F8F5FA]"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {post.caption && (
              <div className="text-sm text-[#39243B] leading-relaxed">
                <span className="font-semibold mr-1.5">{author.username}</span>
                {post.caption.split(/(#[a-zA-Z0-9_]+)/g).map((part, idx) =>
                  /^#[a-zA-Z0-9_]+$/.test(part) ? (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedPostId(null);
                        openExploreWithTag(part);
                      }}
                      className="text-[#37689E] hover:underline font-medium"
                    >
                      {part}
                    </button>
                  ) : (
                    <React.Fragment key={idx}>{part}</React.Fragment>
                  )
                )}
                <p className="text-xs text-[#68556B] mt-1">
                  {formatRelativeTime(post.createdAt)}
                </p>
              </div>
            )}

            <div className="border-t border-[#F1ECF5] pt-3 space-y-2.5">
              {comments.length === 0 ? (
                <p className="text-xs text-[#68556B]">No comments yet.</p>
              ) : (
                comments.map((c) => {
                  const cAuthor = usersById[c.authorId];
                  return (
                    <div key={c.id} className="text-sm flex items-start justify-between gap-2">
                      <p className="text-[#39243B]">
                        <button
                          type="button"
                          onClick={() => {
                            if (cAuthor) {
                              setSelectedPostId(null);
                              openProfile(cAuthor.uid);
                            }
                          }}
                          className="font-semibold hover:underline mr-1.5"
                        >
                          {cAuthor?.username || 'member'}
                        </button>
                        <span>{c.text}</span>
                      </p>
                      <span className="text-[11px] text-[#68556B] shrink-0 tabular-nums">
                        {formatRelativeTime(c.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="border-t border-[#E5DCE9] p-3.5 space-y-3 bg-[#FAF8FC]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleLike(post.id)}
                  aria-pressed={isLiked}
                  aria-label={isLiked ? 'Unlike post' : 'Like post'}
                  className={`min-h-[38px] px-2.5 rounded-xl inline-flex items-center gap-1.5 text-sm font-medium ${
                    isLiked ? 'text-[#A74695] bg-[#FDF5FB]' : 'text-[#39243B] hover:bg-white'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${isLiked ? 'fill-[#D57FC4] text-[#A74695]' : ''}`}
                    aria-hidden="true"
                  />
                  <span className="tabular-nums">{formatCompactCount(post.likesCount)}</span>
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share post"
                  className="min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center text-[#39243B] hover:bg-white"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => toggleSavePost(post.id)}
                aria-pressed={isSaved}
                aria-label={isSaved ? 'Remove saved post' : 'Save post'}
                className={`min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center ${
                  isSaved ? 'text-[#37689E] bg-[#EEF6FF]' : 'text-[#39243B] hover:bg-white'
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${isSaved ? 'fill-[#B8D7FF] text-[#37689E]' : ''}`}
                  aria-hidden="true"
                />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => {
                    setCommentText(e.target.value);
                    if (commentError) setCommentError(null);
                  }}
                  placeholder="Write a comment..."
                  aria-label="Write a comment"
                  className="flex-1 min-h-[40px] px-3 rounded-xl border border-[#E5DCE9] bg-white text-sm text-[#39243B]"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[40px] px-3.5 rounded-xl bg-[#39243B] text-white text-xs font-semibold hover:bg-[#4E3351] disabled:opacity-50"
                >
                  Post
                </button>
              </div>
              {commentError && <p className="text-xs text-[#B4234A]">{commentError}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
