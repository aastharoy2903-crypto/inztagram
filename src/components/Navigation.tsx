import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  BookOpen,
  Compass,
  Film,
  Home,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  PlusSquare,
  RotateCcw,
  Settings,
  User,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { AppDestination } from '../types/inztagram';
import { BrandMark } from './BrandMark';
import { ResilientImage } from './ResilientMedia';

export const Navigation: React.FC = () => {
  const {
    mode,
    currentUser,
    users,
    destination,
    setDestination,
    openProfile,
    openCreateModal,
    unreadNotificationsCount,
    unreadMessagesCount,
    setIsSetupGuideOpen,
    switchDemoUser,
    resetDemoData,
    signOut,
  } = useApp();

  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleNav = (dest: AppDestination) => {
    if (dest === 'profile' && currentUser) {
      openProfile(currentUser.uid);
      return;
    }
    setDestination(dest);
  };

  const navItems: Array<{
    id: AppDestination;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'reels', label: 'Reels', icon: Film },
    { id: 'explore', label: 'Explore', icon: Compass },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageCircle,
      badge: unreadMessagesCount,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotificationsCount,
    },
  ];

  const isOwnProfileActive = destination === 'profile';

  return (
    <>
      {/* Desktop Left Navigation Rail */}
      <aside
        aria-label="Primary navigation"
        className="hidden md:flex flex-col justify-between w-20 lg:w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-[#E5DCE9] px-3 lg:px-4 py-5 z-30"
      >
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => handleNav('home')}
            className="w-full flex items-center justify-center lg:justify-start px-2 py-1.5 rounded-xl hover:bg-[#F8F5FA] transition-colors"
            aria-label="Inztagram Home"
          >
            <span className="lg:hidden">
              <BrandMark size={28} />
            </span>
            <span className="hidden lg:inline-flex">
              <BrandMark size={28} showWordmark />
            </span>
          </button>

          {mode === 'demo' && (
            <div className="hidden lg:block rounded-xl bg-[#F8F5FA] border border-[#E5DCE9] px-3 py-2.5 text-xs text-[#68556B]">
              <p className="font-semibold text-[#39243B]">Demo prototype</p>
              <p className="mt-0.5 leading-snug">
                Saved in this browser.{' '}
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="underline text-[#A74695] hover:text-[#39243B] font-medium"
                >
                  Options
                </button>
              </p>
            </div>
          )}

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = destination === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  aria-current={active ? 'page' : undefined}
                  aria-label={item.label}
                  className={`w-full min-h-[44px] flex items-center justify-center lg:justify-between px-3 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#F3EEF7] text-[#39243B] font-semibold'
                      : 'text-[#68556B] hover:bg-[#F8F5FA] hover:text-[#39243B] font-medium'
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    <span className="relative">
                      <Icon
                        className={`w-5 h-5 ${active ? 'text-[#A74695]' : ''}`}
                        aria-hidden="true"
                      />
                      {item.badge && item.badge > 0 ? (
                        <span className="lg:hidden absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#A74695] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      ) : null}
                    </span>
                    <span className="hidden lg:inline">{item.label}</span>
                  </span>
                  {item.badge && item.badge > 0 ? (
                    <span className="hidden lg:inline-flex text-xs font-semibold text-[#A74695] tabular-nums">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => openCreateModal('post')}
              aria-label="Create post"
              className="w-full min-h-[44px] flex items-center justify-center lg:justify-start gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#39243B] bg-[#F8F5FA] hover:bg-[#EFE7F5] border border-[#E5DCE9] transition-colors mt-2 whitespace-nowrap"
            >
              <PlusSquare className="w-5 h-5 text-[#A74695]" aria-hidden="true" />
              <span className="hidden lg:inline">Create post</span>
            </button>

            {currentUser && (
              <button
                type="button"
                onClick={() => handleNav('profile')}
                aria-current={isOwnProfileActive ? 'page' : undefined}
                aria-label="Profile"
                className={`w-full min-h-[44px] flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap ${
                  isOwnProfileActive
                    ? 'bg-[#F3EEF7] text-[#39243B] font-semibold'
                    : 'text-[#68556B] hover:bg-[#F8F5FA] hover:text-[#39243B] font-medium'
                }`}
              >
                <ResilientImage
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  objectPosition={currentUser.avatarPosition}
                  className="w-6 h-6 rounded-full object-cover border border-[#E5DCE9] shrink-0"
                />
                <span className="hidden lg:inline truncate">Profile</span>
              </button>
            )}
          </nav>
        </div>

        {/* Profile Menu at Bottom */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Account menu"
            className="w-full min-h-[44px] flex items-center justify-center lg:justify-between px-3 py-2 rounded-xl text-sm text-[#68556B] hover:bg-[#F8F5FA] hover:text-[#39243B] transition-colors"
          >
            <span className="flex items-center gap-3 min-w-0">
              <MoreHorizontal className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline font-medium truncate">
                {currentUser ? `@${currentUser.username}` : 'Menu'}
              </span>
            </span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute bottom-14 left-0 lg:w-60 w-56 rounded-2xl bg-white border border-[#E5DCE9] shadow-lg p-1.5 z-50"
            >
              {currentUser && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    openProfile(currentUser.uid);
                  }}
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-sm font-medium text-[#39243B] hover:bg-[#F8F5FA] flex items-center gap-2.5"
                >
                  <User className="w-4 h-4 text-[#68556B]" aria-hidden="true" />
                  <span>View profile</span>
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setSettingsOpen(true);
                }}
                className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-sm font-medium text-[#39243B] hover:bg-[#F8F5FA] flex items-center gap-2.5"
              >
                <Settings className="w-4 h-4 text-[#68556B]" aria-hidden="true" />
                <span>Settings</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setIsSetupGuideOpen(true);
                }}
                className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-sm font-medium text-[#39243B] hover:bg-[#F8F5FA] flex items-center gap-2.5"
              >
                <BookOpen className="w-4 h-4 text-[#68556B]" aria-hidden="true" />
                <span>Firebase setup</span>
              </button>
              <div className="my-1 border-t border-[#E5DCE9]" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-sm font-medium text-[#B4234A] hover:bg-[#FDF2F5] flex items-center gap-2.5"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>{mode === 'demo' ? 'Exit demo' : 'Sign out'}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Compact Top Header (52px) */}
      <header className="md:hidden sticky top-0 z-30 h-[52px] bg-white/95 backdrop-blur-md border-b border-[#E5DCE9] px-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => handleNav('home')}
          aria-label="Inztagram Home"
          className="flex items-center gap-2 min-h-[44px]"
        >
          <BrandMark size={24} showWordmark />
        </button>

        <div className="flex items-center gap-1">
          {mode === 'demo' && (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="text-xs font-medium text-[#A74695] px-2 py-1 rounded-lg hover:bg-[#F8F5FA] whitespace-nowrap"
            >
              Demo
            </button>
          )}
          <button
            type="button"
            onClick={() => openCreateModal('post')}
            aria-label="Create post"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#39243B] hover:bg-[#F8F5FA]"
          >
            <PlusSquare className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => handleNav('notifications')}
            aria-label="Notifications"
            className="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#39243B] hover:bg-[#F8F5FA]"
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#A74695] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings and account menu"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#39243B] hover:bg-[#F8F5FA]"
          >
            <Settings className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (56px) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-[56px] bg-white/95 backdrop-blur-md border-t border-[#E5DCE9] grid grid-cols-5 items-center"
      >
        {(
          [
            { id: 'home', label: 'Home', icon: Home },
            { id: 'reels', label: 'Reels', icon: Film },
            { id: 'explore', label: 'Explore', icon: Compass },
            {
              id: 'messages',
              label: 'Messages',
              icon: MessageCircle,
              badge: unreadMessagesCount,
            },
            { id: 'profile', label: 'Profile', icon: User },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = destination === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleNav(tab.id)}
              aria-current={active ? 'page' : undefined}
              aria-label={tab.label}
              className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? 'text-[#A74695]' : 'text-[#68556B]'
              }`}
            >
              <span className="relative">
                {tab.id === 'profile' && currentUser ? (
                  <ResilientImage
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    objectPosition={currentUser.avatarPosition}
                    className={`w-6 h-6 rounded-full object-cover border-2 ${
                      active ? 'border-[#A74695]' : 'border-transparent'
                    }`}
                  />
                ) : (
                  <Icon className="w-5 h-5" aria-hidden="true" />
                )}
                {'badge' in tab && tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-[#A74695] text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                ) : null}
              </span>
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings & Account Switcher Modal */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#39243B]/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white border border-[#E5DCE9] shadow-xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DCE9]">
              <h2 id="settings-modal-title" className="font-display text-lg font-bold text-[#39243B]">
                Account &amp; Settings
              </h2>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                aria-label="Close settings"
                className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[#68556B] hover:bg-[#F8F5FA]"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="rounded-xl bg-[#F8F5FA] border border-[#E5DCE9] p-3.5">
                <p className="font-semibold text-[#39243B]">
                  {mode === 'firebase' ? 'Connected to Firebase' : 'Demo mode (local browser only)'}
                </p>
                <p className="text-xs text-[#68556B] mt-1 leading-relaxed">
                  {mode === 'firebase'
                    ? 'Your posts, profile, follows, messages, and notifications sync through Firebase.'
                    : 'Your edits stay in local browser storage and are never saved to a cloud account.'}
                </p>
              </div>

              {mode === 'demo' && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#39243B] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#A74695]" aria-hidden="true" />
                    Switch demo persona
                  </p>
                  <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto">
                    {users.map((u) => (
                      <button
                        key={u.uid}
                        type="button"
                        onClick={() => {
                          switchDemoUser(u.uid);
                          setSettingsOpen(false);
                        }}
                        className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-colors ${
                          currentUser?.uid === u.uid
                            ? 'bg-[#F3EEF7] border-[#D57FC4] text-[#39243B]'
                            : 'bg-white border-[#E5DCE9] text-[#39243B] hover:bg-[#F8F5FA]'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <ResilientImage
                            src={u.avatarUrl}
                            alt={u.displayName}
                            objectPosition={u.avatarPosition}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                          <span className="truncate">
                            <span className="font-semibold">{u.displayName}</span>{' '}
                            <span className="text-xs text-[#68556B]">@{u.username}</span>
                          </span>
                        </span>
                        {currentUser?.uid === u.uid && (
                          <span className="text-xs font-semibold text-[#A74695]">Active</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-[#E5DCE9]">
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen(false);
                    setIsSetupGuideOpen(true);
                  }}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5DCE9] text-left font-medium text-[#39243B] hover:bg-[#F8F5FA] flex items-center gap-2.5"
                >
                  <BookOpen className="w-4 h-4 text-[#68556B]" aria-hidden="true" />
                  <span>Firebase setup &amp; security rules</span>
                </button>

                {mode === 'demo' && (
                  <button
                    type="button"
                    onClick={() => {
                      resetDemoData();
                      setSettingsOpen(false);
                    }}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5DCE9] text-left font-medium text-[#39243B] hover:bg-[#F8F5FA] flex items-center gap-2.5"
                  >
                    <RotateCcw className="w-4 h-4 text-[#68556B]" aria-hidden="true" />
                    <span>Reset demo data</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen(false);
                    signOut();
                  }}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#F5CBD6] bg-[#FDF2F5] text-left font-semibold text-[#B4234A] hover:bg-[#FAE4EA] flex items-center gap-2.5"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>{mode === 'demo' ? 'Exit demo to sign-in screen' : 'Sign out'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
