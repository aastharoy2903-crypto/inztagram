import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  BookOpen,
  Compass,
  Film,
  Gamepad2,
  Home,
  LogOut,
  MessageCircle,
  Moon,
  MoreHorizontal,
  PlusSquare,
  RotateCcw,
  Search,
  Settings,
  Sun,
  User,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { AppDestination } from '../types/inztagram';
import { BrandMark } from './BrandMark';
import { ResilientImage } from './ResilientMedia';
import { SampleBadge } from './SampleBadge';

export const Navigation: React.FC = () => {
  const {
    mode,
    theme,
    toggleTheme,
    currentUser,
    users,
    blockedUserIds,
    destination,
    setDestination,
    setExploreQuery,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [compactSearchOpen, setCompactSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const desktopSearchRef = useRef<HTMLDivElement | null>(null);
  const compactSearchRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!menuOpen && !desktopSearchOpen && !compactSearchOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuOpen && menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
      if (
        desktopSearchOpen &&
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(target)
      ) {
        setDesktopSearchOpen(false);
      }
      if (
        compactSearchOpen &&
        compactSearchRef.current &&
        !compactSearchRef.current.contains(target)
      ) {
        setCompactSearchOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [menuOpen, desktopSearchOpen, compactSearchOpen]);

  useEffect(() => {
    if (mobileSearchOpen) {
      mobileSearchInputRef.current?.focus();
    }
  }, [mobileSearchOpen]);

  const normalizedSearch = searchQuery.trim().toLowerCase().replace(/^@+/, '');

  const matchingProfiles = useMemo(() => {
    const searchable = users.filter((u) => !blockedUserIds.has(u.uid));
    if (!normalizedSearch) {
      return searchable.filter((u) => u.uid !== currentUser?.uid).slice(0, 6);
    }
    return searchable
      .filter(
        (u) =>
          u.username.toLowerCase().includes(normalizedSearch) ||
          u.displayName.toLowerCase().includes(normalizedSearch)
      )
      .slice(0, 8);
  }, [users, blockedUserIds, normalizedSearch, currentUser?.uid]);

  const handleSelectProfile = (uid: string) => {
    openProfile(uid);
    setDesktopSearchOpen(false);
    setCompactSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setDesktopSearchOpen(false);
      setCompactSearchOpen(false);
      setMobileSearchOpen(false);
      return;
    }
    if (e.key === 'Enter' && matchingProfiles.length > 0 && normalizedSearch) {
      e.preventDefault();
      handleSelectProfile(matchingProfiles[0].uid);
    }
  };

  const handleViewAllInExplore = () => {
    setExploreQuery(searchQuery.trim());
    setDestination('explore');
    setDesktopSearchOpen(false);
    setCompactSearchOpen(false);
    setMobileSearchOpen(false);
  };

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
    { id: 'game', label: 'Game', icon: Gamepad2 },
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

  const renderSearchResults = () => (
    <div className="space-y-1">
      <div className="px-2.5 pt-1 pb-0.5 flex items-center justify-between text-[11px] font-semibold text-[#68556B] dark:text-[#B7A6BD]">
        <span>{normalizedSearch ? 'Matching profiles' : 'Suggested profiles'}</span>
        {normalizedSearch && (
          <span className="tabular-nums">{matchingProfiles.length}</span>
        )}
      </div>
      {matchingProfiles.length === 0 ? (
        <div className="px-3 py-4 text-center space-y-2">
          <p className="text-xs text-[#68556B] dark:text-[#B7A6BD]">
            No profiles matching “{searchQuery.trim()}”.
          </p>
          <button
            type="button"
            onClick={handleViewAllInExplore}
            className="min-h-[32px] px-3 rounded-lg bg-[#F8F5FA] dark:bg-[#231C29] hover:bg-[#EFE7F5] dark:hover:bg-[#2E2436] border border-[#E5DCE9] dark:border-[#3A2D45] text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8]"
          >
            Search posts in Explore
          </button>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto divide-y divide-[#F6F1F8] dark:divide-[#261D2E]">
          {matchingProfiles.map((person) => (
            <button
              key={person.uid}
              type="button"
              onClick={() => handleSelectProfile(person.uid)}
              className="w-full px-2.5 py-2 rounded-xl hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] flex items-center gap-2.5 text-left transition-colors"
            >
              <ResilientImage
                src={person.avatarUrl}
                alt={person.displayName}
                objectPosition={person.avatarPosition}
                className="w-8 h-8 rounded-full object-cover border border-[#E5DCE9] dark:border-[#3A2D45] shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8] truncate">
                    {person.displayName}
                  </p>
                  {person.isSample && <SampleBadge compact />}
                </div>
                <p className="text-[11px] text-[#68556B] dark:text-[#B7A6BD] truncate">
                  @{person.username}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Left Navigation Rail */}
      <aside
        aria-label="Primary navigation"
        className="hidden md:flex flex-col justify-between w-20 lg:w-64 shrink-0 h-screen sticky top-0 bg-white dark:bg-[#18131D] border-r border-[#E5DCE9] dark:border-[#2E2436] px-3 lg:px-4 py-5 z-30 transition-colors"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleNav('home')}
              className="flex-1 flex items-center justify-center lg:justify-start px-2 py-1.5 rounded-xl hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] transition-colors"
              aria-label="Inztagram Home"
            >
              <span className="lg:hidden">
                <BrandMark size={28} />
              </span>
              <span className="hidden lg:inline-flex">
                <BrandMark size={28} showWordmark />
              </span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
              className="hidden lg:flex min-h-[36px] min-w-[36px] rounded-xl items-center justify-center text-[#68556B] dark:text-[#B7A6BD] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] hover:text-[#39243B] dark:hover:text-[#F6EFF8] transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#FF64AE]" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-[#A74695]" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Real-Time Profile Search (Expanded Desktop Sidebar) */}
          <div ref={desktopSearchRef} className="hidden lg:block relative">
            <div className="relative">
              <Search
                className="w-4 h-4 text-[#68556B] dark:text-[#B7A6BD] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onFocus={() => setDesktopSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setDesktopSearchOpen(true);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search profiles..."
                aria-label="Search profiles in real time"
                className="w-full min-h-[40px] pl-9 pr-8 py-1.5 rounded-xl bg-[#F8F5FA] dark:bg-[#231C29] border border-[#E5DCE9] dark:border-[#2E2436] text-xs text-[#39243B] dark:text-[#F6EFF8] placeholder:text-[#8E7B91] focus:bg-white dark:focus:bg-[#1E1824] focus:border-[#D57FC4] dark:focus:border-[#FF64AE] outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDesktopSearchOpen(true);
                  }}
                  aria-label="Clear profile search"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[28px] min-w-[28px] rounded-lg flex items-center justify-center text-[#68556B] dark:text-[#B7A6BD] hover:bg-[#EFE7F5] dark:hover:bg-[#2E2436]"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            {desktopSearchOpen && (
              <div
                role="region"
                aria-label="Profile search results"
                className="absolute left-0 right-0 mt-1.5 rounded-2xl bg-white dark:bg-[#1B1522] border border-[#E5DCE9] dark:border-[#2E2436] shadow-xl p-1.5 z-50"
              >
                {renderSearchResults()}
              </div>
            )}
          </div>

          {/* Compact Tablet Rail Search Popover Trigger */}
          <div ref={compactSearchRef} className="lg:hidden relative">
            <button
              type="button"
              onClick={() => setCompactSearchOpen((prev) => !prev)}
              aria-label="Search profiles"
              aria-expanded={compactSearchOpen}
              className={`w-full min-h-[44px] flex items-center justify-center px-3 py-2.5 rounded-xl transition-colors ${
                compactSearchOpen
                  ? 'bg-[#F3EEF7] dark:bg-[#261D2E] text-[#A74695] dark:text-[#FF64AE]'
                  : 'text-[#68556B] dark:text-[#B7A6BD] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] hover:text-[#39243B] dark:hover:text-[#F6EFF8]'
              }`}
            >
              <Search className="w-5 h-5" aria-hidden="true" />
            </button>

            {compactSearchOpen && (
              <div
                role="dialog"
                aria-label="Search profiles"
                className="absolute left-16 top-0 w-72 rounded-2xl bg-white dark:bg-[#1B1522] border border-[#E5DCE9] dark:border-[#2E2436] shadow-xl p-3 space-y-2.5 z-50"
              >
                <div className="relative">
                  <Search
                    className="w-4 h-4 text-[#68556B] dark:text-[#B7A6BD] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search @username or name..."
                    aria-label="Search profiles"
                    className="w-full min-h-[38px] pl-9 pr-8 rounded-xl bg-[#F8F5FA] dark:bg-[#231C29] border border-[#E5DCE9] dark:border-[#2E2436] text-xs text-[#39243B] dark:text-[#F6EFF8] placeholder:text-[#8E7B91] focus:bg-white dark:focus:bg-[#1E1824] outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear profile search"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[28px] min-w-[28px] rounded-lg flex items-center justify-center text-[#68556B] dark:text-[#B7A6BD] hover:bg-[#EFE7F5] dark:hover:bg-[#2E2436]"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
                {renderSearchResults()}
              </div>
            )}
          </div>

          {mode === 'demo' && (
            <div className="hidden lg:block rounded-xl bg-[#F8F5FA] dark:bg-[#231C29] border border-[#E5DCE9] dark:border-[#2E2436] px-3 py-2.5 text-xs text-[#68556B] dark:text-[#B7A6BD]">
              <p className="font-semibold text-[#39243B] dark:text-[#F6EFF8]">Demo prototype</p>
              <p className="mt-0.5 leading-snug">
                Saved in this browser.{' '}
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="underline text-[#A74695] dark:text-[#FF64AE] hover:text-[#39243B] dark:hover:text-[#F6EFF8] font-medium"
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
                      ? 'bg-[#F3EEF7] dark:bg-[#281E30] text-[#39243B] dark:text-[#F6EFF8] font-semibold'
                      : 'text-[#68556B] dark:text-[#B7A6BD] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] hover:text-[#39243B] dark:hover:text-[#F6EFF8] font-medium'
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    <span className="relative">
                      <Icon
                        className={`w-5 h-5 ${active ? 'text-[#A74695] dark:text-[#FF64AE]' : ''}`}
                        aria-hidden="true"
                      />
                      {item.badge && item.badge > 0 ? (
                        <span className="lg:hidden absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#A74695] dark:bg-[#FF64AE] text-white dark:text-[#111111] text-[10px] font-bold flex items-center justify-center tabular-nums">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      ) : null}
                    </span>
                    <span className="hidden lg:inline">{item.label}</span>
                  </span>
                  {item.badge && item.badge > 0 ? (
                    <span className="hidden lg:inline-flex text-xs font-semibold text-[#A74695] dark:text-[#FF64AE] tabular-nums">
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
              className="w-full min-h-[44px] flex items-center justify-center lg:justify-start gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#39243B] dark:text-[#F6EFF8] bg-[#F8F5FA] dark:bg-[#231C29] hover:bg-[#EFE7F5] dark:hover:bg-[#2E2436] border border-[#E5DCE9] dark:border-[#3A2D45] transition-colors mt-2 whitespace-nowrap"
            >
              <PlusSquare className="w-5 h-5 text-[#A74695] dark:text-[#FF64AE]" aria-hidden="true" />
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
                    ? 'bg-[#F3EEF7] dark:bg-[#281E30] text-[#39243B] dark:text-[#F6EFF8] font-semibold'
                    : 'text-[#68556B] dark:text-[#B7A6BD] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] hover:text-[#39243B] dark:hover:text-[#F6EFF8] font-medium'
                }`}
              >
                <ResilientImage
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  objectPosition={currentUser.avatarPosition}
                  className="w-6 h-6 rounded-full object-cover border border-[#E5DCE9] dark:border-[#3A2D45] shrink-0"
                />
                <span className="hidden lg:inline truncate">Profile</span>
              </button>
            )}
          </nav>
        </div>

        {/* Profile & Theme Footer */}
        <div className="space-y-1 relative" ref={menuRef}>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="lg:hidden w-full min-h-[44px] flex items-center justify-center px-3 py-2 rounded-xl text-[#68556B] dark:text-[#B7A6BD] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29]"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-[#FF64AE]" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5 text-[#A74695]" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Account menu"
            className="w-full min-h-[44px] flex items-center justify-center lg:justify-between px-3 py-2 rounded-xl text-sm text-[#68556B] dark:text-[#B7A6BD] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] hover:text-[#39243B] dark:hover:text-[#F6EFF8] transition-colors"
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
              className="absolute bottom-14 left-0 lg:w-60 w-56 rounded-2xl bg-white dark:bg-[#1B1522] border border-[#E5DCE9] dark:border-[#2E2436] shadow-lg p-1.5 z-50"
            >
              {currentUser && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    openProfile(currentUser.uid);
                  }}
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-sm font-medium text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] flex items-center gap-2.5"
                >
                  <User className="w-4 h-4 text-[#68556B] dark:text-[#B7A6BD]" aria-hidden="true" />
                  <span>View profile</span>
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  toggleTheme();
                }}
                className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-sm font-medium text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] flex items-center gap-2.5"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-[#FF64AE]" aria-hidden="true" />
                ) : (
                  <Moon className="w-4 h-4 text-[#A74695]" aria-hidden="true" />
                )}
                <span>{theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setSettingsOpen(true);
                }}
                className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-sm font-medium text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] flex items-center gap-2.5"
              >
                <Settings className="w-4 h-4 text-[#68556B] dark:text-[#B7A6BD]" aria-hidden="true" />
                <span>Settings</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setIsSetupGuideOpen(true);
                }}
                className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-sm font-medium text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] flex items-center gap-2.5"
              >
                <BookOpen className="w-4 h-4 text-[#68556B] dark:text-[#B7A6BD]" aria-hidden="true" />
                <span>Firebase setup</span>
              </button>
              <div className="my-1 border-t border-[#E5DCE9] dark:border-[#2E2436]" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="w-full min-h-[40px] px-3 py-2 rounded-xl text-left text-sm font-medium text-[#B4234A] dark:text-[#FF7B9C] hover:bg-[#FDF2F5] dark:hover:bg-[#2F1722] flex items-center gap-2.5"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>{mode === 'demo' ? 'Exit demo' : 'Sign out'}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Compact Top Header (52px) + Expandable Profile Search */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 dark:bg-[#18131D]/95 backdrop-blur-md border-b border-[#E5DCE9] dark:border-[#2E2436]">
        <div className="h-[52px] px-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleNav('home')}
            aria-label="Inztagram Home"
            className="flex items-center gap-2 min-h-[44px]"
          >
            <BrandMark size={24} showWordmark />
          </button>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="min-h-[44px] min-w-[40px] flex items-center justify-center rounded-xl text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29]"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-[#FF64AE]" aria-hidden="true" />
              ) : (
                <Moon className="w-5 h-5 text-[#A74695]" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
              aria-label="Search profiles"
              aria-expanded={mobileSearchOpen}
              className={`min-h-[44px] min-w-[40px] flex items-center justify-center rounded-xl transition-colors ${
                mobileSearchOpen
                  ? 'bg-[#F3EEF7] dark:bg-[#281E30] text-[#A74695] dark:text-[#FF64AE]'
                  : 'text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29]'
              }`}
            >
              <Search className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => openCreateModal('post')}
              aria-label="Create post"
              className="min-h-[44px] min-w-[40px] flex items-center justify-center rounded-xl text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29]"
            >
              <PlusSquare className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => handleNav('notifications')}
              aria-label="Notifications"
              className="relative min-h-[44px] min-w-[40px] flex items-center justify-center rounded-xl text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29]"
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#A74695] dark:bg-[#FF64AE] text-white dark:text-[#111111] text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings and account menu"
              className="min-h-[44px] min-w-[40px] flex items-center justify-center rounded-xl text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29]"
            >
              <Settings className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="px-4 pb-3 pt-1 border-t border-[#F1ECF5] dark:border-[#2E2436] space-y-2 bg-white dark:bg-[#18131D]">
            <div className="relative">
              <Search
                className="w-4 h-4 text-[#68556B] dark:text-[#B7A6BD] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={mobileSearchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search profiles by name or @username..."
                aria-label="Search profiles in real time"
                className="w-full min-h-[40px] pl-9 pr-9 rounded-xl bg-[#F8F5FA] dark:bg-[#231C29] border border-[#E5DCE9] dark:border-[#2E2436] text-sm text-[#39243B] dark:text-[#F6EFF8] placeholder:text-[#8E7B91] focus:bg-white dark:focus:bg-[#1E1824] outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (searchQuery) {
                    setSearchQuery('');
                  } else {
                    setMobileSearchOpen(false);
                  }
                }}
                aria-label={searchQuery ? 'Clear search' : 'Close search'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[32px] min-w-[32px] rounded-lg flex items-center justify-center text-[#68556B] dark:text-[#B7A6BD] hover:bg-[#EFE7F5] dark:hover:bg-[#2E2436]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="rounded-xl border border-[#E5DCE9] dark:border-[#2E2436] bg-[#FAF8FC] dark:bg-[#1E1824] p-1">
              {renderSearchResults()}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (56px) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-[56px] bg-white/95 dark:bg-[#18131D]/95 backdrop-blur-md border-t border-[#E5DCE9] dark:border-[#2E2436] grid grid-cols-6 items-center"
      >
        {(
          [
            { id: 'home', label: 'Home', icon: Home },
            { id: 'reels', label: 'Reels', icon: Film },
            { id: 'explore', label: 'Explore', icon: Compass },
            { id: 'game', label: 'Game', icon: Gamepad2 },
            {
              id: 'messages',
              label: 'Chat',
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
                active
                  ? 'text-[#A74695] dark:text-[#FF64AE]'
                  : 'text-[#68556B] dark:text-[#B7A6BD]'
              }`}
            >
              <span className="relative">
                {tab.id === 'profile' && currentUser ? (
                  <ResilientImage
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    objectPosition={currentUser.avatarPosition}
                    className={`w-6 h-6 rounded-full object-cover border-2 ${
                      active
                        ? 'border-[#A74695] dark:border-[#FF64AE]'
                        : 'border-transparent'
                    }`}
                  />
                ) : (
                  <Icon className="w-5 h-5" aria-hidden="true" />
                )}
                {'badge' in tab && tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-[#A74695] dark:bg-[#FF64AE] text-white dark:text-[#111111] text-[9px] font-bold flex items-center justify-center tabular-nums">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#39243B]/50 dark:bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] shadow-xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DCE9] dark:border-[#2E2436]">
              <h2 id="settings-modal-title" className="font-display text-lg font-bold text-[#39243B] dark:text-[#F6EFF8]">
                Account &amp; Settings
              </h2>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                aria-label="Close settings"
                className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[#68556B] dark:text-[#B7A6BD] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29]"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="rounded-xl bg-[#F8F5FA] dark:bg-[#231C29] border border-[#E5DCE9] dark:border-[#2E2436] p-3.5">
                <p className="font-semibold text-[#39243B] dark:text-[#F6EFF8]">
                  {mode === 'firebase'
                    ? 'Connected to Firebase (Spark plan)'
                    : 'Demo mode (local browser only)'}
                </p>
                <p className="text-xs text-[#68556B] dark:text-[#B7A6BD] mt-1 leading-relaxed">
                  {mode === 'firebase'
                    ? 'Your profile, posts, likes, comments, and follows sync to Cloud Firestore. Messages, Stories, notifications, and reports stay local to this browser.'
                    : 'Your edits stay in local browser storage and are never saved to a cloud account.'}
                </p>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5DCE9] dark:border-[#2E2436] text-left font-medium text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] flex items-center justify-between gap-2.5"
              >
                <span className="flex items-center gap-2.5">
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-[#FF64AE]" aria-hidden="true" />
                  ) : (
                    <Moon className="w-4 h-4 text-[#A74695]" aria-hidden="true" />
                  )}
                  <span>Appearance</span>
                </span>
                <span className="text-xs font-semibold text-[#A74695] dark:text-[#FF64AE]">
                  {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                </span>
              </button>

              {mode === 'demo' && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#A74695] dark:text-[#FF64AE]" aria-hidden="true" />
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
                            ? 'bg-[#F3EEF7] dark:bg-[#2A1D2D] border-[#D57FC4] dark:border-[#FF64AE] text-[#39243B] dark:text-[#F6EFF8]'
                            : 'bg-white dark:bg-[#1E1824] border-[#E5DCE9] dark:border-[#2E2436] text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29]'
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
                            <span className="text-xs text-[#68556B] dark:text-[#B7A6BD]">
                              @{u.username}
                            </span>
                          </span>
                        </span>
                        {currentUser?.uid === u.uid && (
                          <span className="text-xs font-semibold text-[#A74695] dark:text-[#FF64AE]">
                            Active
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-[#E5DCE9] dark:border-[#2E2436]">
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen(false);
                    setIsSetupGuideOpen(true);
                  }}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5DCE9] dark:border-[#2E2436] text-left font-medium text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] flex items-center gap-2.5"
                >
                  <BookOpen className="w-4 h-4 text-[#68556B] dark:text-[#B7A6BD]" aria-hidden="true" />
                  <span>Firebase setup &amp; security rules</span>
                </button>

                {mode === 'demo' && (
                  <button
                    type="button"
                    onClick={() => {
                      resetDemoData();
                      setSettingsOpen(false);
                    }}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5DCE9] dark:border-[#2E2436] text-left font-medium text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] flex items-center gap-2.5"
                  >
                    <RotateCcw className="w-4 h-4 text-[#68556B] dark:text-[#B7A6BD]" aria-hidden="true" />
                    <span>Reset demo data</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen(false);
                    signOut();
                  }}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#F5CBD6] dark:border-[#5D293F] bg-[#FDF2F5] dark:bg-[#2F1722] text-left font-semibold text-[#B4234A] dark:text-[#FF7B9C] hover:bg-[#FAE4EA] dark:hover:bg-[#3E1D2B] flex items-center gap-2.5"
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
