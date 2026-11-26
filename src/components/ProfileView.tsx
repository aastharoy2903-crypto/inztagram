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
import { ResilientImage } from './ResilientMedia';

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
      <div className="max-w-3xl mx-auto px-4 py-14 text-center text-sm text-[#68556B]">
        Profile unavailable.
      </div>
    );
  }

  const displayedGrid =
    tab === 'reels' ? userReels : tab === 'saved' && isOwnProfile ? savedPosts : userPosts;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Profile Header Card */}
      <section className="rounded-2xl bg-white border border-[#E5DCE9] p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <ResilientImage
            src={profileUser.avatarUrl}
            alt={profileUser.displayName}
            objectPosition={profileUser.avatarPosition}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-[#E5DCE9] shrink-0"
          />

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-[#39243B] truncate">
                  {profileUser.displayName}
                </h1>
                <p className="text-sm text-[#68556B] truncate">@{profileUser.username}</p>
              </div>

              {/* Action buttons strictly respecting profile ownership */}
              <div className="flex items-center gap-2">
                {isOwnProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditOpen(true)}
                      className="min-h-[40px] px-4 rounded-xl bg-[#F8F5FA] hover:bg-[#EFE7F5] border border-[#E5DCE9] text-xs font-semibold text-[#39243B] transition-colors whitespace-nowrap"
                    >
                      Edit profile
                    </button>
                    <button
                      type="button"
                      onClick={() => openCreateModal('post')}
                      className="min-h-[40px] px-4 rounded-xl bg-[#39243B] hover:bg-[#4E3351] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
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
                          ? 'bg-[#F8F5FA] border border-[#E5DCE9] text-[#39243B] hover:bg-[#EFE7F5]'
                          : 'bg-[#A74695] hover:bg-[#913980] text-white'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button
                      type="button"
                      onClick={() => startConversation(profileUser.uid)}
                      className="min-h-[40px] px-4 rounded-xl bg-[#EEF6FF] hover:bg-[#DCEBFF] text-[#2A5380] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      <span>Message</span>
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSafetyMenuOpen((prev) => !prev)}
                        aria-label="User safety options"
                        className="min-h-[40px] min-w-[40px] rounded-xl border border-[#E5DCE9] flex items-center justify-center text-[#68556B] hover:bg-[#F8F5FA]"
                      >
                        <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
                      </button>

                      {safetyMenuOpen && (
                        <div
                          role="menu"
                          className="absolute right-0 mt-1 w-48 rounded-xl bg-white border border-[#E5DCE9] shadow-lg p-1.5 z-20"
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
                            className="w-full min-h-[38px] px-3 rounded-lg text-left text-xs font-medium text-[#39243B] hover:bg-[#F8F5FA] flex items-center gap-2"
                          >
                            <Flag className="w-3.5 h-3.5 text-[#68556B]" aria-hidden="true" />
                            <span>Report {mode === 'demo' ? '(Demo only)' : ''}</span>
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setSafetyMenuOpen(false);
                              toggleBlockUser(profileUser.uid);
                            }}
                            className="w-full min-h-[38px] px-3 rounded-lg text-left text-xs font-semibold text-[#B4234A] hover:bg-[#FDF2F5] flex items-center gap-2"
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
              <p className="text-sm text-[#39243B] leading-relaxed max-w-xl">
                {profileUser.bio}
              </p>
            )}

            {/* Counts */}
            <div className="flex flex-wrap items-center gap-6 pt-1 text-sm">
              <div>
                <span className="font-bold text-[#39243B] tabular-nums">
                  {formatCompactCount(userPosts.length)}
                </span>{' '}
                <span className="text-[#68556B]">
                  {userPosts.length === 1 ? 'post' : 'posts'}
                </span>
              </div>
              <div>
                <span className="font-bold text-[#39243B] tabular-nums">
                  {formatCompactCount(profileUser.followersCount)}
                </span>{' '}
                <span className="text-[#68556B]">followers</span>
              </div>
              <div>
                <span className="font-bold text-[#39243B] tabular-nums">
                  {formatCompactCount(profileUser.followingCount)}
                </span>{' '}
                <span className="text-[#68556B]">following</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Tabs */}
      <div className="space-y-4">
        <div
          className="flex items-center gap-1 border-b border-[#E5DCE9]"
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
                ? 'border-[#A74695] text-[#39243B]'
                : 'border-transparent text-[#68556B] hover:text-[#39243B]'
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
                ? 'border-[#A74695] text-[#39243B]'
                : 'border-transparent text-[#68556B] hover:text-[#39243B]'
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
                  ? 'border-[#A74695] text-[#39243B]'
                  : 'border-transparent text-[#68556B] hover:text-[#39243B]'
              }`}
            >
              <Bookmark className="w-4 h-4" aria-hidden="true" />
              <span>Saved</span>
            </button>
          )}
        </div>

        {isBlocked ? (
          <div className="rounded-2xl bg-white border border-[#E5DCE9] p-10 text-center space-y-2">
            <p className="font-display text-base font-bold text-[#39243B]">
              You blocked @{profileUser.username}
            </p>
            <p className="text-xs text-[#68556B]">
              Posts from this account are hidden. Unblock from the menu above if you change your mind.
            </p>
          </div>
        ) : displayedGrid.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E5DCE9] p-10 text-center space-y-3">
            <p className="font-display text-base font-bold text-[#39243B]">
              {tab === 'saved'
                ? 'No saved posts yet'
                : tab === 'reels'
                  ? 'No Reels posted yet'
                  : 'No posts yet'}
            </p>
            <p className="text-sm text-[#68556B]">
              {isOwnProfile && tab === 'posts'
                ? 'Share your first photo or short video to fill your grid.'
                : 'Nothing to show in this tab right now.'}
            </p>
            {isOwnProfile && tab !== 'saved' && (
              <button
                type="button"
                onClick={() => openCreateModal(tab === 'reels' ? 'reel' : 'post')}
                className="min-h-[40px] px-4 rounded-xl bg-[#39243B] text-white text-xs font-semibold hover:bg-[#4E3351]"
              >
                {tab === 'reels' ? 'Create Reel' : 'Create Post'}
              </button>
            )}
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
                className="group relative aspect-square rounded-2xl overflow-hidden bg-[#F3EEF7] border border-[#E5DCE9]"
              >
                <ResilientImage
                  src={item.mediaType === 'video' ? item.posterUrl || item.mediaUrl : item.mediaUrl}
                  alt={item.altText || item.caption || 'Post thumbnail'}
                  objectPosition={item.objectPosition}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                />
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
