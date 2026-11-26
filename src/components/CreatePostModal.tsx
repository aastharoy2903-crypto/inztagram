import React, { useEffect, useState } from 'react';
import { Clock, Film, Image, Loader2, Upload, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isStorageConfigured } from '../lib/firebase';
import { ResilientImage } from './ResilientMedia';

const SAMPLE_PRESETS = [
  {
    label: 'Octopuses',
    url: '/assets/aistudio/image_a104967c.png',
    alt: 'Handmade pastel blue and pink clay octopuses on a keyboard',
  },
  {
    label: 'Peonies',
    url: '/assets/aistudio/image_6a8cb40f.png',
    alt: 'Luminous glowing pink peonies against a dark backdrop',
  },
  {
    label: 'Meadow',
    url: '/assets/aistudio/image_26bbeac6.png',
    alt: 'Impasto painting of a pink flower meadow and white swan',
  },
  {
    label: 'Hydrangeas',
    url: '/assets/aistudio/image_55aee536.png',
    alt: 'Pink and blue hydrangea blossoms',
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
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
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
      setPreviewUrl('');
      setCaption('');
      setAltText('');
      setProgress(null);
      setError(null);
    }
  }, [isCreateModalOpen, createDefaultKind]);

  if (!isCreateModalOpen) return null;

  const handleKindChange = (nextKind: 'post' | 'reel' | 'story') => {
    setKind(nextKind);
    setError(null);
    if (nextKind === 'reel') {
      setMediaType('video');
      if (presetUrl && !file) {
        // Preset images act as poster fallback for demo reels
      }
    } else if (!file) {
      setMediaType('image');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setError(null);

    const isVideo = selected.type.startsWith('video/');
    const isImage = selected.type.startsWith('image/');
    if (!isVideo && !isImage) {
      setError('Unsupported file format. Please choose an image or video file.');
      return;
    }
    if (kind === 'reel' && !isVideo) {
      setError('Reels require a short video file (or choose a demo sample below).');
      return;
    }
    if (selected.size > 25 * 1024 * 1024) {
      setError('File size must be under 25 MB.');
      return;
    }

    setFile(selected);
    setPresetUrl('');
    setMediaType(isVideo ? 'video' : 'image');
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleSelectPreset = (preset: (typeof SAMPLE_PRESETS)[number]) => {
    setError(null);
    setFile(null);
    setPresetUrl(preset.url);
    setPreviewUrl(preset.url);
    setMediaType(kind === 'reel' ? 'video' : 'image');
    if (!altText) setAltText(preset.alt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file && !presetUrl) {
      setError('Please select a photo, video, or sample preset to share.');
      return;
    }

    if (mode === 'firebase' && file && !isStorageConfigured) {
      setError(
        'Cloud Storage is not configured in .env (VITE_FIREBASE_STORAGE_BUCKET). Choose a sample preset or configure Storage.'
      );
      return;
    }

    setSubmitting(true);
    setProgress(10);
    try {
      await createMediaItem({
        kind,
        mediaType,
        file,
        presetUrl: presetUrl || undefined,
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
      className="fixed inset-0 z-50 bg-[#39243B]/55 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-modal-title"
      onClick={closeCreateModal}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white border border-[#E5DCE9] shadow-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#E5DCE9]">
          <h2 id="create-modal-title" className="font-display text-lg font-bold text-[#39243B]">
            Create on Inztagram
          </h2>
          <button
            type="button"
            onClick={closeCreateModal}
            aria-label="Close creator"
            className="min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center text-[#68556B] hover:bg-[#F8F5FA]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Kind selector */}
        <div
          className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#F8F5FA] border border-[#E5DCE9]"
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
                    ? 'bg-white text-[#39243B] shadow-xs border border-[#E5DCE9]'
                    : 'text-[#68556B] hover:text-[#39243B]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-[#A74695]" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {mode === 'firebase' && !isStorageConfigured && (
          <p className="rounded-xl bg-[#EEF6FF] border border-[#B8D7FF] px-3.5 py-2.5 text-xs text-[#2A5380]">
            Cloud Storage bucket is not configured; file uploads are disabled, but sample presets below can be published.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Media Preview or Picker */}
          {previewUrl ? (
            <div className="relative rounded-2xl overflow-hidden bg-[#F3EEF7] border border-[#E5DCE9] max-h-64 flex items-center justify-center">
              {file && mediaType === 'video' ? (
                <video
                  src={previewUrl}
                  controls
                  muted
                  playsInline
                  className="w-full max-h-64 object-contain bg-black"
                />
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
                  setPreviewUrl('');
                }}
                aria-label="Remove selected media"
                className="absolute top-2.5 right-2.5 min-h-[34px] min-w-[34px] rounded-full bg-[#39243B]/80 text-white flex items-center justify-center hover:bg-[#39243B]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#D9CCE0] bg-[#FAF8FC] hover:bg-[#F3EEF7] p-7 text-center cursor-pointer transition-colors">
              <Upload className="w-7 h-7 text-[#A74695]" aria-hidden="true" />
              <span className="text-sm font-semibold text-[#39243B]">
                {kind === 'reel'
                  ? 'Select a short video file'
                  : 'Choose a photo or video from your device'}
              </span>
              <span className="text-xs text-[#68556B]">
                {kind === 'reel' ? 'MP4 or WebM up to 25 MB' : 'PNG, JPG, WebP, or MP4 up to 25 MB'}
              </span>
              <input
                type="file"
                accept={kind === 'reel' ? 'video/*' : 'image/*,video/*'}
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          )}

          {/* Quick sample presets */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[#68556B]">Or start with a sample visual:</p>
            <div className="grid grid-cols-4 gap-2">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`rounded-xl overflow-hidden border-2 text-left transition-colors ${
                    presetUrl === preset.url ? 'border-[#A74695]' : 'border-[#E5DCE9]'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.alt}
                    className="w-full h-14 object-cover"
                  />
                  <span className="block px-1.5 py-1 text-[11px] font-medium text-[#39243B] truncate">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="create-caption" className="block text-xs font-semibold text-[#39243B] mb-1">
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
              className="w-full p-3 rounded-xl border border-[#E5DCE9] bg-[#FAF8FC] text-sm text-[#39243B] resize-none focus:bg-white"
            />
          </div>

          <div>
            <label htmlFor="create-alt" className="block text-xs font-semibold text-[#39243B] mb-1">
              Alt text (optional, helps screen readers)
            </label>
            <input
              id="create-alt"
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe what appears in the photo or video..."
              maxLength={300}
              className="w-full min-h-[40px] px-3.5 rounded-xl border border-[#E5DCE9] bg-[#FAF8FC] text-sm text-[#39243B] focus:bg-white"
            />
          </div>

          {progress !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[#68556B] tabular-nums">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#F1ECF5] overflow-hidden">
                <div
                  className="h-full bg-[#D57FC4] transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-[#FDF2F5] border border-[#F5CBD6] p-3 text-xs font-medium text-[#B4234A]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeCreateModal}
              className="min-h-[42px] px-4 rounded-xl border border-[#E5DCE9] text-xs font-semibold text-[#39243B] hover:bg-[#F8F5FA]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[42px] px-5 rounded-xl bg-[#A74695] hover:bg-[#913980] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-2"
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
