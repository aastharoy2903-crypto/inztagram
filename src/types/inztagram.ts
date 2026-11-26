export type AppDestination =
  | 'home'
  | 'reels'
  | 'explore'
  | 'messages'
  | 'notifications'
  | 'profile';

export type MediaType = 'image' | 'video';

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  avatarPosition?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: number;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: number;
}

export interface Post {
  id: string;
  authorId: string;
  mediaType: MediaType;
  mediaUrl: string;
  posterUrl?: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  objectPosition?: string;
  caption: string;
  altText: string;
  hashtags: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: number;
  /** Optional demo scene identifier for graceful Reel animation fallback */
  demoReelTheme?: 'petal' | 'hydrangea' | 'twilight' | 'studio';
}

export interface Story {
  id: string;
  authorId: string;
  mediaType: MediaType;
  mediaUrl: string;
  objectPosition?: string;
  caption: string;
  altText: string;
  createdAt: number;
  expiresAt: number;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessageText: string;
  lastMessageAt: number;
  unreadBy: string[];
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: number;
}

export type NotificationType = 'like' | 'comment' | 'follow' | 'message';

export interface NotificationItem {
  id: string;
  recipientId: string;
  actorId: string;
  type: NotificationType;
  postId?: string;
  conversationId?: string;
  previewText?: string;
  read: boolean;
  createdAt: number;
}

export interface SafetyReport {
  id: string;
  targetType: 'post' | 'user';
  targetId: string;
  reason: string;
  createdAt: number;
}
