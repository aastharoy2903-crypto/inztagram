import React from 'react';
import { Loader2 } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthGate } from './components/AuthGate';
import { CreatePostModal } from './components/CreatePostModal';
import { ExploreView } from './components/ExploreView';
import { HomeFeedView } from './components/HomeFeedView';
import { MessagesView } from './components/MessagesView';
import { Navigation } from './components/Navigation';
import { NotificationsView } from './components/NotificationsView';
import { PostDetailModal } from './components/PostDetailModal';
import { ProfileView } from './components/ProfileView';
import { ReelsView } from './components/ReelsView';
import { SetupGuideModal } from './components/SetupGuideModal';
import { StoryViewerModal } from './components/StoryViewerModal';

const AppShell: React.FC = () => {
  const {
    isAuthenticated,
    isLoadingAuth,
    destination,
    isSetupGuideOpen,
    setIsSetupGuideOpen,
    toastMessage,
  } = useApp();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#F8F5FA] flex flex-col items-center justify-center gap-3 text-sm text-[#68556B]">
        <Loader2 className="w-7 h-7 animate-spin text-[#A74695]" aria-hidden="true" />
        <span>Loading Inztagram...</span>
      </div>
    );
  }

  return (
    <>
      {!isAuthenticated ? (
        <AuthGate />
      ) : (
        <div className="min-h-screen bg-[#F8F5FA] text-[#39243B] flex flex-col md:flex-row">
          <Navigation />
          <main className="flex-1 min-w-0 pb-20 md:pb-8">
            {destination === 'home' && <HomeFeedView />}
            {destination === 'reels' && <ReelsView />}
            {destination === 'explore' && <ExploreView />}
            {destination === 'messages' && <MessagesView />}
            {destination === 'notifications' && <NotificationsView />}
            {destination === 'profile' && <ProfileView />}
          </main>

          <StoryViewerModal />
          <PostDetailModal />
          <CreatePostModal />
        </div>
      )}

      <SetupGuideModal
        open={isSetupGuideOpen}
        onClose={() => setIsSetupGuideOpen(false)}
      />

      {/* Accessible toast notification */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4"
      >
        {toastMessage && (
          <div className="rounded-xl bg-[#39243B] text-white text-xs font-medium px-4 py-2.5 shadow-lg border border-white/10">
            {toastMessage}
          </div>
        )}
      </div>
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
