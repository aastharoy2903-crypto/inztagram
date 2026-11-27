import React from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { isFirebaseConfigured } from '../lib/firebase';

interface SetupGuideModalProps {
  open: boolean;
  onClose: () => void;
}

const ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#39243B]/50 dark:bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-guide-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] shadow-xl p-6 text-[#39243B] dark:text-[#F6EFF8]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5DCE9] dark:border-[#2E2436]">
          <div>
            <h2 id="setup-guide-title" className="font-display text-xl font-bold">
              Firebase Setup &amp; Demo Scope
            </h2>
            <p className="text-sm text-[#68556B] dark:text-[#B7A6BD] mt-1">
              No-cost Spark plan setup (Auth + Firestore only) and browser-local Demo features.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close setup guide"
            className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[#68556B] dark:text-[#B7A6BD] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] hover:text-[#39243B] dark:hover:text-[#F6EFF8] transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 pt-5 text-sm">
          {/* Current environment status */}
          <div className="rounded-xl bg-[#F8F5FA] dark:bg-[#211A28] border border-[#E5DCE9] dark:border-[#2E2436] p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              {isFirebaseConfigured ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#2F6F4E] dark:text-[#5EE09F]" aria-hidden="true" />
                  <span>Firebase Auth &amp; Firestore configured (Spark plan)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-[#A74695] dark:text-[#FF78C8]" aria-hidden="true" />
                  <span>Running in Demo Mode (local browser storage only)</span>
                </>
              )}
            </div>
            <p className="text-[#68556B] dark:text-[#B7A6BD] leading-relaxed">
              {isFirebaseConfigured
                ? 'Firebase Authentication and Cloud Firestore are active. No Firebase Cloud Storage is used—posts and Reels reference bundled local images and videos.'
                : 'No Firebase client keys were found in the environment. You can browse and interact in Demo Mode immediately; all demo state stays in this browser.'}
            </p>
          </div>

          {/* Required env vars */}
          <div>
            <h3 className="font-display font-semibold text-base mb-2">
              Required Environment Variables (.env)
            </h3>
            <div className="rounded-xl bg-[#FAF7FC] dark:bg-[#211A28] border border-[#E5DCE9] dark:border-[#2E2436] p-3.5 font-mono text-xs space-y-1 overflow-x-auto">
              {ENV_KEYS.map((key) => (
                <div key={key} className="text-[#39243B] dark:text-[#F6EFF8]">
                  {key}=<span className="text-[#68556B] dark:text-[#B7A6BD]">&quot;...&quot;</span>
                </div>
              ))}
            </div>
          </div>

          {/* Console steps */}
          <div>
            <h3 className="font-display font-semibold text-base mb-2">
              Firebase Spark Plan Checklist (No Billing Required)
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-[#68556B] dark:text-[#B7A6BD]">
              <li>
                Enable <strong className="text-[#39243B] dark:text-[#F6EFF8]">Email/Password</strong> in Authentication
                &rarr; Sign-in method.
              </li>
              <li>
                Create a <strong className="text-[#39243B] dark:text-[#F6EFF8]">Cloud Firestore</strong> database and deploy{' '}
                <code className="px-1.5 py-0.5 rounded bg-[#F1ECF5] dark:bg-[#292032] text-[#39243B] dark:text-[#F6EFF8]">
                  firestore.rules
                </code>{' '}
                using{' '}
                <code className="px-1.5 py-0.5 rounded bg-[#F1ECF5] dark:bg-[#292032] text-[#39243B] dark:text-[#F6EFF8]">
                  firebase deploy --only firestore:rules
                </code>
                .
              </li>
              <li>
                <strong className="text-[#39243B] dark:text-[#F6EFF8]">No Firebase Storage required:</strong> Uploaded
                media files are not supported in this no-cost Spark setup; users pick from bundled
                local images and video clips.
              </li>
            </ol>
          </div>

          {/* Feature scope */}
          <div>
            <h3 className="font-display font-semibold text-base mb-2">
              What Syncs to Firebase vs. What Stays in Demo Mode
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-[#68556B] dark:text-[#B7A6BD]">
              <li>
                <strong className="text-[#39243B] dark:text-[#F6EFF8]">Synced with Firebase (when configured):</strong>{' '}
                Email/password sign-up, login, password reset, user profiles, posts &amp; Reels
                (referencing bundled media), likes, comments, and follows.
              </li>
              <li>
                <strong className="text-[#39243B] dark:text-[#F6EFF8]">Populated sample feed:</strong> Sample creators
                (marked with a <span className="font-semibold text-[#37689E] dark:text-[#7AA6FF]">Sample</span> badge)
                always populate new accounts alongside real user content.
              </li>
              <li>
                <strong className="text-[#39243B] dark:text-[#F6EFF8]">Demo-only (stored in this browser):</strong>{' '}
                Direct Messages, Notifications, 24h Stories, Saved bookmarks, Safety reports/blocks,
                and local device file previews in Demo Mode.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
