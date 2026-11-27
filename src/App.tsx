import React from 'react';
import { Loader2 } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthGate } from './components/AuthGate';
import { CreatePostModal } from './components/CreatePostModal';
import { ExploreView } from './components/ExploreView';
import { GameView } from './components/GameView';
import { HeartBubblesOverlay } from './components/HeartBubblesOverlay';
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
      <div className="min-h-screen bg-[#F8F5FA] dark:bg-[#0F0C12] flex flex-col items-center justify-center gap-3 text-sm text-[#68556B] dark:text-[#B7A6BD]">
        <Loader2 className="w-7 h-7 animate-spin text-[#A74695] dark:text-[#FF64AE]" aria-hidden="true" />
        <span>Loading Inztagram...</span>
      </div>
    );
  }

  return (
    <>
      {!isAuthenticated ? (
        <AuthGate />
      ) : (
        <div className="min-h-screen bg-[#F8F5FA] dark:bg-[#0F0C12] text-[#39243B] dark:text-[#F6EFF8] flex flex-col md:flex-row transition-colors">
          <Navigation />
          <main className="flex-1 min-w-0 pb-20 md:pb-8">
            {destination === 'home' && <HomeFeedView />}
            {destination === 'reels' && <ReelsView />}
            {destination === 'explore' && <ExploreView />}
            {destination === 'game' && <GameView />}
            {destination === 'messages' && <MessagesView />}
            {destination === 'notifications' && <NotificationsView />}
            {destination === 'profile' && <ProfileView />}
          </main>

          <StoryViewerModal />
          <PostDetailModal />
          <CreatePostModal />
          <HeartBubblesOverlay />
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
          <div className="rounded-xl bg-[#39243B] dark:bg-[#231C29] text-white dark:text-[#F6EFF8] text-xs font-medium px-4 py-2.5 shadow-lg border border-white/10 dark:border-[#3A2D45]">
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
