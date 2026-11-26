import React, { useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ResilientImage } from './ResilientMedia';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const AVATAR_PRESETS = [
  '/assets/aistudio/image_26bbeac6.png',
  '/assets/aistudio/image_8145de1b.png',
  '/assets/aistudio/image_6a8cb40f.png',
  '/assets/aistudio/image_55aee536.png',
  '/samples/avatar-kenji.svg',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ open, onClose }) => {
  const { currentUser, updateCurrentUserProfile } = useApp();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPresetUrl, setAvatarPresetUrl] = useState<string | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string>(
    currentUser?.avatarUrl || '/samples/avatar-you.svg'
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !currentUser) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file for your profile photo.');
      return;
    }
    setError(null);
    setAvatarFile(file);
    setAvatarPresetUrl(undefined);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSelectPreset = (url: string) => {
    setAvatarFile(null);
    setAvatarPresetUrl(url);
    setPreviewUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateCurrentUserProfile({
        displayName,
        username,
        bio,
        avatarFile,
        avatarPresetUrl,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#39243B]/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white border border-[#E5DCE9] shadow-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#E5DCE9]">
          <h2 id="edit-profile-title" className="font-display text-lg font-bold text-[#39243B]">
            Edit profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit profile"
            className="min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center text-[#68556B] hover:bg-[#F8F5FA]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <ResilientImage
              src={previewUrl}
              alt="Profile preview"
              className="w-16 h-16 rounded-full object-cover border border-[#E5DCE9] shrink-0"
            />
            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 min-h-[36px] px-3 rounded-xl bg-[#F8F5FA] hover:bg-[#EFE7F5] border border-[#E5DCE9] text-xs font-semibold text-[#39243B] cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#A74695]" aria-hidden="true" />
                <span>Upload photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              <div className="flex items-center gap-1.5">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    aria-label={`Use avatar preset ${idx + 1}`}
                    className={`w-7 h-7 rounded-full overflow-hidden border-2 ${
                      previewUrl === preset ? 'border-[#A74695]' : 'border-transparent'
                    }`}
                  >
                    <img src={preset} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-display-name"
              className="block text-xs font-semibold text-[#39243B] mb-1"
            >
              Display name
            </label>
            <input
              id="edit-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={60}
              className="w-full min-h-[42px] px-3.5 rounded-xl border border-[#E5DCE9] bg-[#FAF8FC] text-sm text-[#39243B]"
            />
          </div>

          <div>
            <label
              htmlFor="edit-username"
              className="block text-xs font-semibold text-[#39243B] mb-1"
            >
              Username
            </label>
            <input
              id="edit-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
              className="w-full min-h-[42px] px-3.5 rounded-xl border border-[#E5DCE9] bg-[#FAF8FC] text-sm text-[#39243B]"
            />
          </div>

          <div>
            <label htmlFor="edit-bio" className="block text-xs font-semibold text-[#39243B] mb-1">
              Bio
            </label>
            <textarea
              id="edit-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={240}
              className="w-full p-3 rounded-xl border border-[#E5DCE9] bg-[#FAF8FC] text-sm text-[#39243B] resize-none"
            />
            <p className="text-[11px] text-[#68556B] text-right mt-1 tabular-nums">
              {bio.length}/240
            </p>
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-[#B4234A] bg-[#FDF2F5] p-3 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 rounded-xl border border-[#E5DCE9] text-xs font-semibold text-[#39243B] hover:bg-[#F8F5FA]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[40px] px-5 rounded-xl bg-[#39243B] hover:bg-[#4E3351] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
              <span>Save changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
