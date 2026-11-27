import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Film,
  Flag,
  Grid,
  MessageCircle,
  MoreHorizontal,
  PlusSquare,
  ShieldBan,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCompactCount } from '../utils/formatters';
import { EditProfileModal } from './EditProfileModal';
import { ResilientImage, ResilientVideoThumbnail } from './ResilientMedia';
import { SampleBadge } from './SampleBadge';

export const ProfileView: React.FC = () => {
  const {
    mode,
    currentUser,
    usersById,
    posts,
    followingIds,
    savedPostIds,
    blockedUserIds,
    viewedProfileUid,
    setSelectedPostId,
    toggleFollow,
    startConversation,
    openCreateModal,
    setDestination,
    reportContent,
    toggleBlockUser,
  } = useApp();

  const targetUid = viewedProfileUid || currentUser?.uid || '';
  const profileUser = usersById[targetUid] || currentUser;

  const [tab, setTab] = useState<'posts' | 'reels' | 'saved'>('posts');
  const [editOpen, setEditOpen] = useState(false);
  const [safetyMenuOpen, setSafetyMenuOpen] = useState(false);

  const isOwnProfile = Boolean(currentUser && profileUser && currentUser.uid === profileUser.uid);
  const isFollowing = profileUser ? followingIds.has(profileUser.uid) : false;
  const isBlocked = profileUser ? blockedUserIds.has(profileUser.uid) : false;

  const userPosts = useMemo(() => {
    if (!profileUser) return [];
    return posts.filter((p) => p.authorId === profileUser.uid);
  }, [posts, profileUser]);

  const userReels = useMemo(
    () => userPosts.filter((p) => p.mediaType === 'video'),
    [userPosts]
  );

  const savedPosts = useMemo(
    () => posts.filter((p) => savedPostIds.has(p.id)),
    [posts, savedPostIds]
  );

  if (!profileUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-14 text-center text-sm text-[#68556B] dark:text-[#B7A6BD]">
        Profile unavailable.
      </div>
    );
  }

  const displayedGrid =
    tab === 'reels' ? userReels : tab === 'saved' && isOwnProfile ? savedPosts : userPosts;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Profile Header Card */}
      <section className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <ResilientImage
            src={profileUser.avatarUrl}
            alt={profileUser.displayName}
            objectPosition={profileUser.avatarPosition}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-[#E5DCE9] dark:border-[#3A2D45] shrink-0"
          />

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-[#39243B] dark:text-[#F6EFF8] truncate">
                    {profileUser.displayName}
                  </h1>
                  {profileUser.isSample && <SampleBadge label="Sample creator" />}
                </div>
                <p className="text-sm text-[#68556B] dark:text-[#B7A6BD] truncate">
                  @{profileUser.username}
                </p>
              </div>

              {/* Action buttons strictly respecting profile ownership */}
              <div className="flex items-center gap-2">
                {isOwnProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditOpen(true)}
                      className="min-h-[40px] px-4 rounded-xl bg-[#F8F5FA] dark:bg-[#231C29] hover:bg-[#EFE7F5] dark:hover:bg-[#2E2436] border border-[#E5DCE9] dark:border-[#3A2D45] text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8] transition-colors whitespace-nowrap"
                    >
                      Edit profile
                    </button>
                    <button
                      type="button"
                      onClick={() => openCreateModal('post')}
                      className="min-h-[40px] px-4 rounded-xl bg-[#39243B] dark:bg-[#A74695] hover:bg-[#4E3351] dark:hover:bg-[#913980] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <PlusSquare className="w-4 h-4" aria-hidden="true" />
                      <span>Create</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleFollow(profileUser.uid)}
                      className={`min-h-[40px] px-4 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                        isFollowing
                          ? 'bg-[#F8F5FA] dark:bg-[#231C29] border border-[#E5DCE9] dark:border-[#3A2D45] text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#EFE7F5] dark:hover:bg-[#2E2436]'
                          : 'bg-[#A74695] hover:bg-[#913980] text-white'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button
                      type="button"
                      onClick={() => startConversation(profileUser.uid)}
                      className="min-h-[40px] px-4 rounded-xl bg-[#EEF6FF] dark:bg-[#1B2A42] hover:bg-[#DCEBFF] dark:hover:bg-[#243757] text-[#2A5380] dark:text-[#9FC1FF] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      <span>Message</span>
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSafetyMenuOpen((prev) => !prev)}
                        aria-label="User safety options"
                        className="min-h-[40px] min-w-[40px] rounded-xl border border-[#E5DCE9] dark:border-[#3A2D45] flex items-center justify-center text-[#68556B] dark:text-[#B7A6BD] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29]"
                      >
                        <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
                      </button>

                      {safetyMenuOpen && (
                        <div
                          role="menu"
                          className="absolute right-0 mt-1 w-48 rounded-xl bg-white dark:bg-[#1B1522] border border-[#E5DCE9] dark:border-[#2E2436] shadow-lg p-1.5 z-20"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setSafetyMenuOpen(false);
                              reportContent({
                                targetType: 'user',
                                targetId: profileUser.uid,
                                reason: 'Reported user profile',
                              });
                            }}
                            className="w-full min-h-[38px] px-3 rounded-lg text-left text-xs font-medium text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] flex items-center gap-2"
                          >
                            <Flag className="w-3.5 h-3.5 text-[#68556B] dark:text-[#B7A6BD]" aria-hidden="true" />
                            <span>Report {mode === 'demo' ? '(Demo only)' : ''}</span>
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setSafetyMenuOpen(false);
                              toggleBlockUser(profileUser.uid);
                            }}
                            className="w-full min-h-[38px] px-3 rounded-lg text-left text-xs font-semibold text-[#B4234A] dark:text-[#FF7B9C] hover:bg-[#FDF2F5] dark:hover:bg-[#2F1722] flex items-center gap-2"
                          >
                            <ShieldBan className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>
                              {isBlocked ? 'Unblock' : 'Block'} {mode === 'demo' ? '(Demo)' : ''}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {profileUser.bio && (
              <p className="text-sm text-[#39243B] dark:text-[#EADEE9] leading-relaxed max-w-xl">
                {profileUser.bio}
              </p>
            )}

            {/* Counts */}
            <div className="flex flex-wrap items-center gap-6 pt-1 text-sm">
              <div>
                <span className="font-bold text-[#39243B] dark:text-[#F6EFF8] tabular-nums">
                  {formatCompactCount(userPosts.length)}
                </span>{' '}
                <span className="text-[#68556B] dark:text-[#B7A6BD]">
                  {userPosts.length === 1 ? 'post' : 'posts'}
                </span>
              </div>
              <div>
                <span className="font-bold text-[#39243B] dark:text-[#F6EFF8] tabular-nums">
                  {formatCompactCount(profileUser.followersCount)}
                </span>{' '}
                <span className="text-[#68556B] dark:text-[#B7A6BD]">followers</span>
              </div>
              <div>
                <span className="font-bold text-[#39243B] dark:text-[#F6EFF8] tabular-nums">
                  {formatCompactCount(profileUser.followingCount)}
                </span>{' '}
                <span className="text-[#68556B] dark:text-[#B7A6BD]">following</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Tabs */}
      <div className="space-y-4">
        <div
          className="flex items-center gap-1 border-b border-[#E5DCE9] dark:border-[#2E2436]"
          role="tablist"
          aria-label="Profile media sections"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'posts'}
            onClick={() => setTab('posts')}
            className={`min-h-[42px] px-4 text-xs font-semibold inline-flex items-center gap-1.5 border-b-2 transition-colors ${
              tab === 'posts'
                ? 'border-[#A74695] dark:border-[#FF78C8] text-[#39243B] dark:text-[#F6EFF8]'
                : 'border-transparent text-[#68556B] dark:text-[#B7A6BD] hover:text-[#39243B] dark:hover:text-[#F6EFF8]'
            }`}
          >
            <Grid className="w-4 h-4" aria-hidden="true" />
            <span>Posts</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === 'reels'}
            onClick={() => setTab('reels')}
            className={`min-h-[42px] px-4 text-xs font-semibold inline-flex items-center gap-1.5 border-b-2 transition-colors ${
              tab === 'reels'
                ? 'border-[#A74695] dark:border-[#FF78C8] text-[#39243B] dark:text-[#F6EFF8]'
                : 'border-transparent text-[#68556B] dark:text-[#B7A6BD] hover:text-[#39243B] dark:hover:text-[#F6EFF8]'
            }`}
          >
            <Film className="w-4 h-4" aria-hidden="true" />
            <span>Reels</span>
          </button>

          {isOwnProfile && (
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'saved'}
              onClick={() => setTab('saved')}
              className={`min-h-[42px] px-4 text-xs font-semibold inline-flex items-center gap-1.5 border-b-2 transition-colors ${
                tab === 'saved'
                  ? 'border-[#A74695] dark:border-[#FF78C8] text-[#39243B] dark:text-[#F6EFF8]'
                  : 'border-transparent text-[#68556B] dark:text-[#B7A6BD] hover:text-[#39243B] dark:hover:text-[#F6EFF8]'
              }`}
            >
              <Bookmark className="w-4 h-4" aria-hidden="true" />
              <span>Saved</span>
            </button>
          )}
        </div>

        {isBlocked ? (
          <div className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] p-10 text-center space-y-2">
            <p className="font-display text-base font-bold text-[#39243B] dark:text-[#F6EFF8]">
              You blocked @{profileUser.username}
            </p>
            <p className="text-xs text-[#68556B] dark:text-[#B7A6BD]">
              Posts from this account are hidden. Unblock from the menu above if you change your mind.
            </p>
          </div>
        ) : displayedGrid.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] p-10 text-center space-y-3">
            <p className="font-display text-base font-bold text-[#39243B] dark:text-[#F6EFF8]">
              {tab === 'saved'
                ? 'No saved posts yet'
                : tab === 'reels'
                  ? 'No Reels posted yet'
                  : 'No posts yet'}
            </p>
            <p className="text-sm text-[#68556B] dark:text-[#B7A6BD]">
              {isOwnProfile && tab === 'posts'
                ? 'Share your first photo or short video to fill your grid.'
                : 'Nothing to show in this tab right now.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {isOwnProfile && tab !== 'saved' && (
                <button
                  type="button"
                  onClick={() => openCreateModal(tab === 'reels' ? 'reel' : 'post')}
                  className="min-h-[40px] px-4 rounded-xl bg-[#39243B] dark:bg-[#A74695] text-white text-xs font-semibold hover:bg-[#4E3351] dark:hover:bg-[#913980] transition-colors"
                >
                  {tab === 'reels' ? 'Create Reel' : 'Create your first post'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setDestination('explore')}
                className="min-h-[40px] px-4 rounded-xl border border-[#E5DCE9] dark:border-[#3A2D45] bg-[#F8F5FA] dark:bg-[#231C29] text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8] hover:bg-[#EFE7F5] dark:hover:bg-[#2E2436] transition-colors"
              >
                Explore creators
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
            {displayedGrid.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedPostId(item.id)}
                aria-label={`Open ${item.mediaType === 'video' ? 'Reel' : 'post'}: ${
                  item.altText || item.caption || 'grid item'
                }`}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-[#F3EEF7] dark:bg-[#231C29] border border-[#E5DCE9] dark:border-[#2E2436]"
              >
                {item.mediaType === 'video' ? (
                  <ResilientVideoThumbnail
                    src={item.mediaUrl}
                    posterUrl={item.posterUrl}
                    alt={item.altText || item.caption || 'Reel thumbnail'}
                    objectPosition={item.objectPosition}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                  />
                ) : (
                  <ResilientImage
                    src={item.mediaUrl}
                    alt={item.altText || item.caption || 'Post thumbnail'}
                    objectPosition={item.objectPosition}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                  />
                )}
                {item.mediaType === 'video' && (
                  <span className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-[#39243B]/75 text-white flex items-center justify-center">
                    <Film className="w-4 h-4" aria-hidden="true" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {isOwnProfile && (
        <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
      )}
    </div>
  );
};
