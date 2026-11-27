import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatRelativeTime, formatStoryExpiry } from '../utils/formatters';
import { ResilientImage } from './ResilientMedia';
import { SampleBadge } from './SampleBadge';

export const StoryViewerModal: React.FC = () => {
  const {
    stories,
    usersById,
    activeStoryAuthorId,
    setActiveStoryAuthorId,
    markStorySeen,
    openProfile,
  } = useApp();

  const authorStories = useMemo(() => {
    if (!activeStoryAuthorId) return [];
    return stories
      .filter((s) => s.authorId === activeStoryAuthorId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [stories, activeStoryAuthorId]);

  const orderedAuthors = useMemo(() => {
    const seenOrder: string[] = [];
    stories.forEach((s) => {
      if (!seenOrder.includes(s.authorId)) seenOrder.push(s.authorId);
    });
    return seenOrder;
  }, [stories]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [activeStoryAuthorId]);

  const currentStory = authorStories[index] || null;
  const author = currentStory ? usersById[currentStory.authorId] : null;

  useEffect(() => {
    if (currentStory) {
      markStorySeen(currentStory.id);
    }
  }, [currentStory, markStorySeen]);

  const goNext = () => {
    if (index < authorStories.length - 1) {
      setIndex((i) => i + 1);
      return;
    }
    if (activeStoryAuthorId) {
      const aIdx = orderedAuthors.indexOf(activeStoryAuthorId);
      if (aIdx >= 0 && aIdx < orderedAuthors.length - 1) {
        setActiveStoryAuthorId(orderedAuthors[aIdx + 1]);
        return;
      }
    }
    setActiveStoryAuthorId(null);
  };

  const goPrev = () => {
    if (index > 0) {
      setIndex((i) => i - 1);
      return;
    }
    if (activeStoryAuthorId) {
      const aIdx = orderedAuthors.indexOf(activeStoryAuthorId);
      if (aIdx > 0) {
        setActiveStoryAuthorId(orderedAuthors[aIdx - 1]);
        return;
      }
    }
  };

  useEffect(() => {
    if (!activeStoryAuthorId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveStoryAuthorId(null);
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  if (!activeStoryAuthorId || !currentStory || !author) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1F1321]/92 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${author.displayName}'s story`}
      onClick={() => setActiveStoryAuthorId(null)}
    >
      <div
        className="relative w-full max-w-[420px] h-[86vh] max-h-[760px] rounded-2xl overflow-hidden bg-[#2D1D2F] border border-white/15 shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Story media */}
        {currentStory.mediaType === 'video' ? (
          <video
            src={currentStory.mediaUrl}
            autoPlay
            muted
            playsInline
            loop
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <ResilientImage
            src={currentStory.mediaUrl}
            alt={currentStory.altText || currentStory.caption || 'Story'}
            objectPosition={currentStory.objectPosition}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Top & bottom contrast scrims */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 via-black/30 to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
          aria-hidden="true"
        />

        {/* Header with progress bars & creator identity */}
        <div className="relative z-10 p-3.5 space-y-3">
          <div className="flex items-center gap-1.5" aria-label="Story progress">
            {authorStories.map((s, i) => (
              <div
                key={s.id}
                className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden"
              >
                <div
                  className={`h-full transition-all ${
                    i <= index ? 'w-full bg-[#D57FC4]' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveStoryAuthorId(null);
                openProfile(author.uid);
              }}
              className="flex items-center gap-2.5 text-left min-w-0"
            >
              <ResilientImage
                src={author.avatarUrl}
                alt={author.displayName}
                objectPosition={author.avatarPosition}
                className="w-9 h-9 rounded-full object-cover border border-white/50 shrink-0"
              />
              <div className="min-w-0 text-white">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-sm font-semibold truncate">{author.username}</p>
                  {(currentStory.isSample || author.isSample) && <SampleBadge compact dark />}
                </div>
                <p className="text-xs text-white/80 flex items-center gap-1.5">
                  <span>{formatRelativeTime(currentStory.createdAt)}</span>
                  <span aria-hidden="true">&middot;</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {formatStoryExpiry(currentStory.expiresAt)}
                  </span>
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveStoryAuthorId(null)}
              aria-label="Close story viewer"
              className="min-h-[40px] min-w-[40px] rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Touch/click navigation zones */}
        <div className="relative z-10 flex-1 grid grid-cols-2">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous story"
            className="h-full w-full flex items-center justify-start px-2 text-white/0 hover:text-white/90 focus-visible:text-white transition-colors"
          >
            <span className="w-9 h-9 rounded-full bg-black/35 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </span>
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next story"
            className="h-full w-full flex items-center justify-end px-2 text-white/0 hover:text-white/90 focus-visible:text-white transition-colors"
          >
            <span className="w-9 h-9 rounded-full bg-black/35 flex items-center justify-center">
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </span>
          </button>
        </div>

        {/* Caption footer */}
        {currentStory.caption && (
          <div className="relative z-10 p-4 text-white text-sm leading-relaxed">
            {currentStory.caption}
          </div>
        )}
      </div>
    </div>
  );
};
