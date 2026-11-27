import React, { useEffect, useRef, useState } from 'react';
import { Film, ImageOff, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { generateDemoReelBlobUrl } from '../utils/proceduralVideo';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  objectPosition?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = '',
  objectPosition = 'center',
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt || 'Image unavailable'}
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#F3E7F4] via-[#F8F5FA] to-[#E3EEFF] dark:from-[#261C2C] dark:via-[#1C1521] dark:to-[#182132] text-[#68556B] dark:text-[#B7A6BD] p-6 text-center ${className}`}
      >
        <ImageOff className="w-6 h-6 text-[#A74695] dark:text-[#FF64AE]" aria-hidden="true" />
        <span className="text-xs font-medium max-w-[22ch] line-clamp-2">
          {alt || 'Media preview unavailable'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ objectPosition }}
      className={className}
    />
  );
};

interface ResilientVideoThumbnailProps {
  src: string;
  posterUrl?: string;
  alt: string;
  className?: string;
  objectPosition?: string;
}

export const ResilientVideoThumbnail: React.FC<ResilientVideoThumbnailProps> = ({
  src,
  posterUrl,
  alt,
  className = '',
  objectPosition = 'center',
}) => {
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    setVideoFailed(false);
  }, [src]);

  if ((!src || videoFailed) && posterUrl) {
    return (
      <ResilientImage
        src={posterUrl}
        alt={alt}
        objectPosition={objectPosition}
        className={className}
      />
    );
  }

  if (!src || videoFailed) {
    return (
      <div
        role="img"
        aria-label={alt || 'Video reel'}
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#E5DCE9] via-[#39243B] to-[#241626] text-white p-4 text-center ${className}`}
      >
        <Film className="w-6 h-6 text-[#D57FC4]" aria-hidden="true" />
        <span className="text-xs font-medium max-w-[20ch] line-clamp-2">
          {alt || 'Reel clip'}
        </span>
      </div>
    );
  }

  const previewSrc =
    src.startsWith('blob:') || src.includes('#') ? src : `${src}#t=0.1`;

  return (
    <video
      src={previewSrc}
      poster={posterUrl}
      muted
      playsInline
      preload="metadata"
      aria-label={alt}
      onError={() => setVideoFailed(true)}
      style={{ objectPosition }}
      className={className}
    />
  );
};

interface ReelVideoPlayerProps {
  src: string;
  posterUrl?: string;
  altText: string;
  demoReelTheme?: 'petal' | 'hydrangea' | 'twilight' | 'studio';
  isActive?: boolean;
  compact?: boolean;
  className?: string;
  objectPosition?: string;
}

export const ReelVideoPlayer: React.FC<ReelVideoPlayerProps> = ({
  src,
  posterUrl,
  altText,
  demoReelTheme,
  isActive = true,
  compact = false,
  className = '',
  objectPosition = 'center',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [resolvedSrc, setResolvedSrc] = useState<string>(src);
  const [videoFailed, setVideoFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Never autoplay sound
  const [progress, setProgress] = useState(0);

  const hasDirectVideoSrc = Boolean(src);

  useEffect(() => {
    setPosterFailed(false);
  }, [posterUrl]);

  useEffect(() => {
    let mounted = true;
    setVideoFailed(false);

    if (src) {
      setResolvedSrc(src);
      return;
    }

    if (demoReelTheme) {
      generateDemoReelBlobUrl(demoReelTheme, altText).then((blobUrl) => {
        if (!mounted) return;
        if (blobUrl) {
          setResolvedSrc(blobUrl);
        } else {
          setVideoFailed(true);
        }
      });
    } else {
      setVideoFailed(true);
    }

    return () => {
      mounted = false;
    };
  }, [src, demoReelTheme, altText]);

  // Pause when scrolled out of active view
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive && !videoFailed && resolvedSrc) {
      el.muted = true; // Enforce muted start
      const playPromise = el.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, [isActive, videoFailed, resolvedSrc]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = videoRef.current;
    if (!el || videoFailed) {
      setIsPlaying((prev) => !prev);
      return;
    }
    if (el.paused) {
      el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    setProgress(Math.min(100, (el.currentTime / el.duration) * 100));
  };

  // Fallback animation loop when native video cannot load
  useEffect(() => {
    if (!videoFailed || !isPlaying || !isActive) return;
    const id = window.setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 100);
    return () => window.clearInterval(id);
  }, [videoFailed, isPlaying, isActive]);

  const showPosterLayer = Boolean(posterUrl && !posterFailed && (!hasDirectVideoSrc || videoFailed));
  const useTranslucentOverlay = !hasDirectVideoSrc && Boolean(posterUrl && !posterFailed);

  return (
    <div
      className={`relative overflow-hidden bg-[#241626] select-none ${className}`}
      onClick={togglePlay}
    >
      {showPosterLayer && posterUrl && (
        <img
          src={posterUrl}
          alt={altText}
          onError={() => setPosterFailed(true)}
          style={{ objectPosition }}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
            isPlaying && isActive ? 'scale-[1.03]' : 'scale-100'
          }`}
        />
      )}

      {!videoFailed && resolvedSrc ? (
        <video
          ref={videoRef}
          src={resolvedSrc}
          poster={!posterFailed ? posterUrl : undefined}
          preload="auto"
          playsInline
          loop
          muted={isMuted}
          aria-label={altText}
          onTimeUpdate={handleTimeUpdate}
          onError={() => setVideoFailed(true)}
          style={{ objectPosition }}
          className={`relative w-full h-full object-cover ${
            useTranslucentOverlay ? 'opacity-35 mix-blend-screen' : 'opacity-100'
          }`}
        />
      ) : posterUrl && !posterFailed ? (
        <div className="relative w-full h-full pointer-events-none">
          <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#39243B]/80 backdrop-blur-sm text-white text-[11px] font-medium border border-white/15">
            <Film className="w-3.5 h-3.5 text-[#D57FC4]" aria-hidden="true" />
            <span>Video unavailable · Showing poster preview</span>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-[#E5DCE9] to-[#39243B]">
          <div className="p-6 text-center text-white/90 text-sm">
            <Film className="w-7 h-7 text-[#D57FC4] mx-auto mb-2" aria-hidden="true" />
            <p className="font-medium">Video playback unavailable</p>
            <p className="text-xs text-white/70 mt-1 max-w-[28ch] mx-auto">{altText}</p>
          </div>
        </div>
      )}

      {/* Center play/pause indicator when paused */}
      {!isPlaying && !videoFailed && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
          <span className="w-12 h-12 rounded-full bg-[#39243B]/75 backdrop-blur-sm text-white flex items-center justify-center shadow-md">
            <Play className="w-5 h-5 translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      )}

      {/* Accessible top/bottom playback controls */}
      <div
        className={`absolute ${
          compact ? 'bottom-3 right-3' : 'top-3 right-3'
        } flex items-center gap-2 z-10`}
      >
        {!videoFailed && (
          <>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
              className="min-h-[40px] min-w-[40px] rounded-full bg-[#39243B]/70 hover:bg-[#39243B]/90 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Play className="w-4 h-4 translate-x-0.5" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              className="min-h-[40px] min-w-[40px] rounded-full bg-[#39243B]/70 hover:bg-[#39243B]/90 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Volume2 className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </>
        )}
      </div>

      {/* Subtle progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/25" aria-hidden="true">
        <div
          className="h-full bg-[#D57FC4] transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
