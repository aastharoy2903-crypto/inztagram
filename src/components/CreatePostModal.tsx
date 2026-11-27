import React, { useEffect, useState } from 'react';
import { Clock, Film, Image, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ResilientImage, ResilientVideoThumbnail } from './ResilientMedia';

interface SamplePreset {
  label: string;
  url: string;
  posterUrl?: string;
  alt: string;
  mediaType: 'image' | 'video';
}

const IMAGE_PRESETS: SamplePreset[] = [
  {
    label: 'Bangles',
    url: '/assets/aistudio/image_00d3b7ab.png',
    alt: 'Warm pink-lit portrait framed by colorful glass and gold bangles',
    mediaType: 'image',
  },
  {
    label: 'Hillside',
    url: '/assets/aistudio/image_066b26fa.png',
    alt: 'Illustrated pastel pink, blue, and yellow hillside village with a white castle',
    mediaType: 'image',
  },
  {
    label: 'Lotus Swans',
    url: '/assets/aistudio/image_297e992c.png',
    alt: 'White and black swans on a deep burgundy lotus pond',
    mediaType: 'image',
  },
  {
    label: 'Iridescent',
    url: '/assets/aistudio/image_554a2b00.png',
    alt: 'Iridescent dark horse silhouette with coral and teal light streaks',
    mediaType: 'image',
  },
  {
    label: 'Clay Desk',
    url: '/assets/aistudio/image_a104967c.png',
    alt: 'Pastel blue and pink clay octopus figurines on a keyboard',
    mediaType: 'image',
  },
  {
    label: 'Dusk Studio',
    url: '/assets/aistudio/image_8145de1b.png',
    alt: 'Stylized painting of a woman in an armchair beside a spotted cheetah',
    mediaType: 'image',
  },
  {
    label: 'Hydrangeas',
    url: '/assets/aistudio/image_55aee536.png',
    alt: 'Pink and blue hydrangea blossoms framing color swatch cards',
    mediaType: 'image',
  },
  {
    label: 'Peonies',
    url: '/assets/aistudio/image_6a8cb40f.png',
    alt: 'Luminous soft pink peonies glowing against a dark studio backdrop',
    mediaType: 'image',
  },
];

const REEL_PRESETS: SamplePreset[] = [
  {
    label: 'Capybara',
    url: '/assets/aistudio/epicmemerush_ssspin.io_1795674894_2e406528.mp4',
    posterUrl: '/assets/aistudio/image_55aee536.png',
    alt: 'Capybara soaking in a fruit and ice bath nibbling fresh raspberries',
    mediaType: 'video',
  },
  {
    label: 'Eyelash Cat',
    url: '/assets/aistudio/polinakudrina135660_ssspin.io_1795674668_f6d31bce.mp4',
    posterUrl: '/assets/aistudio/image_251618e5.png',
    alt: 'Cat with expressive long eyelashes looking up inside a circular vignette',
    mediaType: 'video',
  },
  {
    label: 'Shower Cats',
    url: '/assets/aistudio/dullesglass_ssspin.io_1795674820_3a270b46.mp4',
    posterUrl: '/assets/aistudio/image_8145de1b.png',
    alt: 'Two cats wearing patterned shower caps dancing in a bathroom',
    mediaType: 'video',
  },
  {
    label: 'Cheese Hamster',
    url: '/assets/aistudio/Panda23333_ssspin.io_1795674759_ea0738ac.mp4',
    posterUrl: '/assets/aistudio/image_a104967c.png',
    alt: 'Fluffy hamster happily nibbling on a slice of Swiss cheese',
    mediaType: 'video',
  },
  {
    label: 'Sleepy Bird',
    url: '/assets/aistudio/iqraa8221_ssspin.io_1795674730_2fdb08d9.mp4',
    posterUrl: '/assets/aistudio/image_066b26fa.png',
    alt: 'Pastel lovebird tucked under a blanket tapping a phone before falling asleep',
    mediaType: 'video',
  },
];

export const CreatePostModal: React.FC = () => {
  const {
    mode,
    isCreateModalOpen,
    createDefaultKind,
    closeCreateModal,
    createMediaItem,
  } = useApp();

  const [kind, setKind] = useState<'post' | 'reel' | 'story'>(createDefaultKind);
  const [file, setFile] = useState<File | null>(null);
  const [presetUrl, setPresetUrl] = useState<string>('');
  const [posterUrl, setPosterUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [videoPreviewFailed, setVideoPreviewFailed] = useState(false);
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isCreateModalOpen) {
      setKind(createDefaultKind);
      setMediaType(createDefaultKind === 'reel' ? 'video' : 'image');
      setFile(null);
      setPresetUrl('');
      setPosterUrl('');
      setPreviewUrl('');
      setVideoPreviewFailed(false);
      setCaption('');
      setAltText('');
      setProgress(null);
      setError(null);
    }
  }, [isCreateModalOpen, createDefaultKind]);

  if (!isCreateModalOpen) return null;

  const activePresets = kind === 'reel' ? REEL_PRESETS : IMAGE_PRESETS;

  const handleKindChange = (nextKind: 'post' | 'reel' | 'story') => {
    setKind(nextKind);
    setError(null);
    setVideoPreviewFailed(false);
    if (!file) {
      setPresetUrl('');
      setPosterUrl('');
      setPreviewUrl('');
      setMediaType(nextKind === 'reel' ? 'video' : 'image');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setError(null);
    setVideoPreviewFailed(false);

    if (mode === 'firebase') {
      setError(
        'Uploaded media is not supported in this no-cost Spark setup. Please choose one of the bundled presets below.'
      );
      return;
    }

    const isVideo = selected.type.startsWith('video/');
    const isImage = selected.type.startsWith('image/');
    if (!isVideo && !isImage) {
      setError('Unsupported file format. Please choose an image or video file.');
      return;
    }
    if (kind === 'reel' && !isVideo) {
      setError('Reels require a short video file (or choose a video clip below).');
      return;
    }
    if (selected.size > 25 * 1024 * 1024) {
      setError('File size must be under 25 MB.');
      return;
    }

    setFile(selected);
    setPresetUrl('');
    setPosterUrl('');
    setMediaType(isVideo ? 'video' : 'image');
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleSelectPreset = (preset: SamplePreset) => {
    setError(null);
    setFile(null);
    setVideoPreviewFailed(false);
    setPresetUrl(preset.url);
    setPosterUrl(preset.posterUrl || '');
    setPreviewUrl(preset.url);
    setMediaType(preset.mediaType);
    if (!altText) setAltText(preset.alt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file && !presetUrl) {
      setError(
        mode === 'firebase'
          ? 'Please choose one of the bundled photos or Reel clips below.'
          : 'Please select a photo, video, or bundled preset to share.'
      );
      return;
    }

    if (mode === 'firebase' && file) {
      setError(
        'File uploads require Firebase Storage, which is disabled on the no-cost Spark plan. Choose a bundled preset below.'
      );
      return;
    }

    setSubmitting(true);
    setProgress(15);
    try {
      await createMediaItem({
        kind,
        mediaType,
        file,
        presetUrl: presetUrl || undefined,
        posterUrl: posterUrl || undefined,
        caption,
        altText,
        onProgress: (pct) => setProgress(pct),
      });
      closeCreateModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish right now.');
      setProgress(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#39243B]/55 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-modal-title"
      onClick={closeCreateModal}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] shadow-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#E5DCE9] dark:border-[#2E2436]">
          <h2
            id="create-modal-title"
            className="font-display text-lg font-bold text-[#39243B] dark:text-[#F6EFF8]"
          >
            Create on Inztagram
          </h2>
          <button
            type="button"
            onClick={closeCreateModal}
            aria-label="Close creator"
            className="min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center text-[#68556B] dark:text-[#B7A6BD] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Kind selector */}
        <div
          className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#F8F5FA] dark:bg-[#231C29] border border-[#E5DCE9] dark:border-[#2E2436]"
          role="tablist"
          aria-label="Content format"
        >
          {(
            [
              { id: 'post', label: 'Photo / Video', icon: Image },
              { id: 'reel', label: 'Reel Video', icon: Film },
              { id: 'story', label: '24h Story', icon: Clock },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={kind === item.id}
                onClick={() => handleKindChange(item.id)}
                className={`min-h-[38px] px-2 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                  kind === item.id
                    ? 'bg-white dark:bg-[#18131D] text-[#39243B] dark:text-[#F6EFF8] shadow-xs border border-[#E5DCE9] dark:border-[#3A2D45]'
                    : 'text-[#68556B] dark:text-[#B7A6BD] hover:text-[#39243B] dark:hover:text-[#F6EFF8]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-[#A74695] dark:text-[#FF78C8]" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {mode === 'firebase' && (
          <div className="rounded-xl bg-[#EEF6FF] dark:bg-[#1B2A42] border border-[#B8D7FF] dark:border-[#2D4469] px-3.5 py-2.5 text-xs text-[#2A5380] dark:text-[#9FC1FF] leading-relaxed">
            <span className="font-semibold">No-cost Spark setup:</span> Firebase Cloud Storage is not used, so custom file uploads are disabled. Choose a bundled photo or Reel clip below to publish its reference to Firestore.
            {kind === 'story' && ' (Note: 24h Stories are a Demo-only feature saved in this browser.)'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Media Preview or Picker */}
          {previewUrl ? (
            <div className="relative rounded-2xl overflow-hidden bg-[#F3EEF7] dark:bg-[#231C29] border border-[#E5DCE9] dark:border-[#2E2436] max-h-64 flex items-center justify-center">
              {mediaType === 'video' ? (
                videoPreviewFailed && posterUrl ? (
                  <div className="relative w-full h-64">
                    <ResilientImage
                      src={posterUrl}
                      alt={altText || 'Video poster preview'}
                      className="w-full h-64 object-cover"
                    />
                    <span className="absolute bottom-2 left-2 rounded-lg bg-[#39243B]/80 text-white text-[11px] px-2.5 py-1">
                      Video preview unavailable · Showing poster image
                    </span>
                  </div>
                ) : (
                  <video
                    src={previewUrl}
                    poster={posterUrl || undefined}
                    controls
                    muted
                    playsInline
                    preload="metadata"
                    onError={() => setVideoPreviewFailed(true)}
                    className="w-full max-h-64 object-contain bg-black"
                  />
                )
              ) : (
                <ResilientImage
                  src={previewUrl}
                  alt={altText || 'Selected media preview'}
                  className="w-full max-h-64 object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPresetUrl('');
                  setPosterUrl('');
                  setPreviewUrl('');
                  setVideoPreviewFailed(false);
                }}
                aria-label="Remove selected media"
                className="absolute top-2.5 right-2.5 min-h-[34px] min-w-[34px] rounded-full bg-[#39243B]/80 text-white flex items-center justify-center hover:bg-[#39243B]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ) : mode === 'demo' ? (
            <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#D9CCE0] dark:border-[#3A2D45] bg-[#FAF8FC] dark:bg-[#211A28] hover:bg-[#F3EEF7] dark:hover:bg-[#292032] p-6 text-center cursor-pointer transition-colors">
              <Upload className="w-6 h-6 text-[#A74695] dark:text-[#FF78C8]" aria-hidden="true" />
              <span className="text-sm font-semibold text-[#39243B] dark:text-[#F6EFF8]">
                {kind === 'reel'
                  ? 'Select a short video file (Demo Mode)'
                  : 'Choose a photo or video from your device'}
              </span>
              <span className="text-xs text-[#68556B] dark:text-[#B7A6BD]">
                {kind === 'reel'
                  ? 'MP4 or WebM · Stored in this browser only'
                  : 'PNG, JPG, WebP, or MP4 · Stored in this browser only'}
              </span>
              <input
                type="file"
                accept={kind === 'reel' ? 'video/*' : 'image/*,video/*'}
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          ) : (
            <div className="rounded-2xl border border-[#E5DCE9] dark:border-[#2E2436] bg-[#FAF8FC] dark:bg-[#211A28] p-4 flex items-center gap-3 text-xs text-[#68556B] dark:text-[#B7A6BD]">
              <div className="w-9 h-9 rounded-xl bg-[#F3EEF7] dark:bg-[#2D2236] text-[#A74695] dark:text-[#FF78C8] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-[#39243B] dark:text-[#F6EFF8]">
                  Select a bundled {kind === 'reel' ? 'Reel clip' : 'artwork or photo'} below
                </p>
                <p className="mt-0.5">
                  Media stays bundled locally in the app while your post, caption, and #hashtags sync to Firestore.
                </p>
              </div>
            </div>
          )}

          {/* Bundled presets */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[#68556B] dark:text-[#B7A6BD]">
              {kind === 'reel'
                ? 'Bundled Reel clips:'
                : mode === 'firebase'
                  ? 'Bundled photos & illustrations:'
                  : 'Or start with a bundled visual:'}
            </p>
            <div className={`grid gap-2 ${kind === 'reel' ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-4'}`}>
              {activePresets.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`rounded-xl overflow-hidden border-2 text-left transition-colors bg-white dark:bg-[#211A28] ${
                    presetUrl === preset.url
                      ? 'border-[#A74695] dark:border-[#FF78C8]'
                      : 'border-[#E5DCE9] dark:border-[#2E2436]'
                  }`}
                >
                  {preset.mediaType === 'video' ? (
                    <ResilientVideoThumbnail
                      src={preset.url}
                      posterUrl={preset.posterUrl}
                      alt={preset.alt}
                      className="w-full h-14 object-cover bg-[#241626]"
                    />
                  ) : (
                    <ResilientImage
                      src={preset.url}
                      alt={preset.alt}
                      className="w-full h-14 object-cover"
                    />
                  )}
                  <span className="block px-1.5 py-1 text-[11px] font-medium text-[#39243B] dark:text-[#F6EFF8] truncate">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="create-caption"
              className="block text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8] mb-1"
            >
              Caption
            </label>
            <textarea
              id="create-caption"
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={
                kind === 'story'
                  ? 'Add a brief story note (expires in 24h)...'
                  : 'Write a caption and add #hashtags...'
              }
              maxLength={kind === 'story' ? 200 : 1000}
              className="w-full p-3 rounded-xl border border-[#E5DCE9] dark:border-[#3A2D45] bg-[#FAF8FC] dark:bg-[#211A28] text-sm text-[#39243B] dark:text-[#F6EFF8] placeholder:text-[#68556B] dark:placeholder:text-[#96839D] resize-none focus:bg-white dark:focus:bg-[#1B1522]"
            />
          </div>

          <div>
            <label
              htmlFor="create-alt"
              className="block text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8] mb-1"
            >
              Alt text (optional, helps screen readers)
            </label>
            <input
              id="create-alt"
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe what appears in the photo or video..."
              maxLength={300}
              className="w-full min-h-[40px] px-3.5 rounded-xl border border-[#E5DCE9] dark:border-[#3A2D45] bg-[#FAF8FC] dark:bg-[#211A28] text-sm text-[#39243B] dark:text-[#F6EFF8] placeholder:text-[#68556B] dark:placeholder:text-[#96839D] focus:bg-white dark:focus:bg-[#1B1522]"
            />
          </div>

          {progress !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[#68556B] dark:text-[#B7A6BD] tabular-nums">
                <span>Saving...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#F1ECF5] dark:bg-[#2E2436] overflow-hidden">
                <div
                  className="h-full bg-[#D57FC4] transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-[#FDF2F5] dark:bg-[#2F1722] border border-[#F5CBD6] dark:border-[#5D293B] p-3 text-xs font-medium text-[#B4234A] dark:text-[#FF7B9C]"
            >
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeCreateModal}
              className="min-h-[42px] px-4 rounded-xl border border-[#E5DCE9] dark:border-[#3A2D45] text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[42px] px-5 rounded-xl bg-[#A74695] hover:bg-[#913980] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              <span>
                {kind === 'story' ? 'Share story' : kind === 'reel' ? 'Publish Reel' : 'Share post'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
