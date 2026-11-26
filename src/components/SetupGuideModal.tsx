import React from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { isFirebaseConfigured, isStorageConfigured } from '../lib/firebase';

interface SetupGuideModalProps {
  open: boolean;
  onClose: () => void;
}

const ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#39243B]/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-guide-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl bg-white border border-[#E5DCE9] shadow-xl p-6 text-[#39243B]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5DCE9]">
          <div>
            <h2 id="setup-guide-title" className="font-display text-xl font-bold">
              Firebase Setup & Demo Scope
            </h2>
            <p className="text-sm text-[#68556B] mt-1">
              Environment variables, security rules, and what runs locally in Demo Mode.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close setup guide"
            className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[#68556B] hover:bg-[#F8F5FA] hover:text-[#39243B] transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 pt-5 text-sm">
          {/* Current environment status */}
          <div className="rounded-xl bg-[#F8F5FA] border border-[#E5DCE9] p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              {isFirebaseConfigured ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#2F6F4E]" aria-hidden="true" />
                  <span>Firebase Auth & Firestore detected</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-[#A74695]" aria-hidden="true" />
                  <span>Running in Demo Mode (local browser storage only)</span>
                </>
              )}
            </div>
            <p className="text-[#68556B] leading-relaxed">
              {isFirebaseConfigured
                ? isStorageConfigured
                  ? 'All required Firebase Auth, Firestore, and Cloud Storage keys are configured.'
                  : 'Auth and Firestore are active. Add VITE_FIREBASE_STORAGE_BUCKET to enable photo/video file uploads.'
                : 'No Firebase client keys were found in the environment. Demo interactions are saved only in this browser and are never sent to a real account.'}
            </p>
          </div>

          {/* Required env vars */}
          <div>
            <h3 className="font-display font-semibold text-base mb-2">
              Required Environment Variables (.env)
            </h3>
            <div className="rounded-xl bg-[#FAF7FC] border border-[#E5DCE9] p-3.5 font-mono text-xs space-y-1 overflow-x-auto">
              {ENV_KEYS.map((key) => (
                <div key={key} className="text-[#39243B]">
                  {key}=<span className="text-[#68556B]">"..."</span>
                </div>
              ))}
            </div>
          </div>

          {/* Console steps */}
          <div>
            <h3 className="font-display font-semibold text-base mb-2">
              Firebase Console Checklist
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-[#68556B]">
              <li>
                Enable <strong className="text-[#39243B]">Email/Password</strong> in Authentication
                &rarr; Sign-in method.
              </li>
              <li>
                Create a Firestore database and deploy{' '}
                <code className="px-1.5 py-0.5 rounded bg-[#F1ECF5] text-[#39243B]">
                  firestore.rules
                </code>{' '}
                from the project root.
              </li>
              <li>
                Enable Cloud Storage and deploy{' '}
                <code className="px-1.5 py-0.5 rounded bg-[#F1ECF5] text-[#39243B]">
                  storage.rules
                </code>{' '}
                for photo, Reel, and Story media uploads.
              </li>
            </ol>
          </div>

          {/* Demo-only clarifications */}
          <div>
            <h3 className="font-display font-semibold text-base mb-2">
              Demo-Only Behavior Without Firebase
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-[#68556B]">
              <li>
                Email/password sign-up, login, and password reset emails require Firebase Auth.
              </li>
              <li>
                Uploaded photos/videos, likes, comments, follows, DMs, stories, and safety
                reports/blocks persist locally in browser storage in Demo Mode.
              </li>
              <li>
                Notifications are in-app only; browser push notifications are not configured.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
