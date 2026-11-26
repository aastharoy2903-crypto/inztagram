import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import {
  auth,
  db,
  isFirebaseConfigured,
  isStorageConfigured,
  mapFirebaseAuthError,
  storage,
} from '../lib/firebase';
import {
  DEMO_COMMENTS,
  DEMO_CONVERSATIONS,
  DEMO_CURRENT_UID,
  DEMO_FOLLOWING_IDS,
  DEMO_MESSAGES,
  DEMO_NOTIFICATIONS,
  DEMO_POSTS,
  DEMO_STORIES,
  DEMO_USERS,
} from '../data/demoSeed';
import type {
  AppDestination,
  Conversation,
  DirectMessage,
  MediaType,
  NotificationItem,
  Post,
  PostComment,
  SafetyReport,
  Story,
  UserProfile,
} from '../types/inztagram';
import { extractHashtags, normalizeUsername, validateUsername } from '../utils/formatters';

const DEMO_STORAGE_KEY = 'inztagram_demo_state_v2';

interface DemoPersistedState {
  currentUid: string;
  users: UserProfile[];
  posts: Post[];
  comments: PostComment[];
  likedPostIds: string[];
  savedPostIds: string[];
  followingIds: string[];
  stories: Story[];
  seenStoryIds: string[];
  conversations: Conversation[];
  messages: DirectMessage[];
  notifications: NotificationItem[];
  blockedUserIds: string[];
  reports: SafetyReport[];
}

function loadDemoState(): DemoPersistedState {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DemoPersistedState>;
      if (Array.isArray(parsed.users) && Array.isArray(parsed.posts)) {
        return {
          currentUid: parsed.currentUid || DEMO_CURRENT_UID,
          users: parsed.users,
          posts: parsed.posts,
          comments: parsed.comments || DEMO_COMMENTS,
          likedPostIds: parsed.likedPostIds || ['post_hydrangea_palette'],
          savedPostIds: parsed.savedPostIds || ['post_hydrangea_palette'],
          followingIds: parsed.followingIds || DEMO_FOLLOWING_IDS,
          stories: (parsed.stories || DEMO_STORIES).filter((s) => s.expiresAt > Date.now()),
          seenStoryIds: parsed.seenStoryIds || [],
          conversations: parsed.conversations || DEMO_CONVERSATIONS,
          messages: parsed.messages || DEMO_MESSAGES,
          notifications: parsed.notifications || DEMO_NOTIFICATIONS,
          blockedUserIds: parsed.blockedUserIds || [],
          reports: parsed.reports || [],
        };
      }
    }
  } catch {
    // Ignore corrupt localStorage and re-seed cleanly
  }

  return {
    currentUid: DEMO_CURRENT_UID,
    users: DEMO_USERS,
    posts: DEMO_POSTS,
    comments: DEMO_COMMENTS,
    likedPostIds: ['post_hydrangea_palette'],
    savedPostIds: ['post_hydrangea_palette'],
    followingIds: DEMO_FOLLOWING_IDS,
    stories: DEMO_STORIES,
    seenStoryIds: [],
    conversations: DEMO_CONVERSATIONS,
    messages: DEMO_MESSAGES,
    notifications: DEMO_NOTIFICATIONS,
    blockedUserIds: [],
    reports: [],
  };
}

function toMillis(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value instanceof Timestamp) return value.toMillis();
  if (
    typeof value === 'object' &&
    value !== null &&
    'toMillis' in value &&
    typeof (value as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

async function compressImageForDemoStorage(file: File): Promise<string> {
  const rawUrl = await readFileAsDataUrl(file);
  if (file.size <= 350 * 1024) {
    return rawUrl;
  }
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const maxDim = 960;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve(rawUrl);
    img.src = rawUrl;
  });
}

export interface CreateMediaInput {
  kind: 'post' | 'reel' | 'story';
  mediaType: MediaType;
  file?: File | null;
  presetUrl?: string;
  caption: string;
  altText: string;
  onProgress?: (pct: number) => void;
}

interface AppContextValue {
  mode: 'firebase' | 'demo';
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isLoadingData: boolean;
  dataError: string | null;
  currentUser: UserProfile | null;
  users: UserProfile[];
  usersById: Record<string, UserProfile>;
  posts: Post[];
  commentsByPost: Record<string, PostComment[]>;
  likedPostIds: Set<string>;
  savedPostIds: Set<string>;
  followingIds: Set<string>;
  blockedUserIds: Set<string>;
  stories: Story[];
  seenStoryIds: Set<string>;
  conversations: Conversation[];
  messagesByConversation: Record<string, DirectMessage[]>;
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  unreadMessagesCount: number;

  // Navigation & UI state
  destination: AppDestination;
  setDestination: (dest: AppDestination) => void;
  viewedProfileUid: string | null;
  openProfile: (uid: string) => void;
  exploreQuery: string;
  setExploreQuery: (q: string) => void;
  openExploreWithTag: (tag: string) => void;
  selectedPostId: string | null;
  setSelectedPostId: (id: string | null) => void;
  activeStoryAuthorId: string | null;
  setActiveStoryAuthorId: (uid: string | null) => void;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  isCreateModalOpen: boolean;
  createDefaultKind: 'post' | 'reel' | 'story';
  openCreateModal: (kind?: 'post' | 'reel' | 'story') => void;
  closeCreateModal: () => void;
  isSetupGuideOpen: boolean;
  setIsSetupGuideOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Auth actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: {
    email: string;
    password: string;
    username: string;
    displayName: string;
  }) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  enterDemoMode: () => void;
  switchDemoUser: (uid: string) => void;
  resetDemoData: () => void;
  signOut: () => Promise<void>;

  // Core actions
  updateCurrentUserProfile: (params: {
    displayName: string;
    username: string;
    bio: string;
    avatarFile?: File | null;
    avatarPresetUrl?: string;
  }) => Promise<void>;
  createMediaItem: (input: CreateMediaInput) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  toggleFollow: (targetUid: string) => Promise<void>;
  toggleSavePost: (postId: string) => void;
  markStorySeen: (storyId: string) => void;
  startConversation: (otherUid: string) => Promise<string>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  reportContent: (params: {
    targetType: 'post' | 'user';
    targetId: string;
    reason: string;
  }) => Promise<void>;
  toggleBlockUser: (targetUid: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Determine initial mode
  const [inDemoSession, setInDemoSession] = useState<boolean>(() => !isFirebaseConfigured);
  const mode: 'firebase' | 'demo' =
    isFirebaseConfigured && !inDemoSession ? 'firebase' : 'demo';

  // Demo state — immediately active when Firebase credentials are not configured
  const [demoState, setDemoState] = useState<DemoPersistedState>(() => loadDemoState());
  const [demoSignedIn, setDemoSignedIn] = useState<boolean>(() => !isFirebaseConfigured);

  // Firebase state
  const [fbAuthUid, setFbAuthUid] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(isFirebaseConfigured);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [fbUsers, setFbUsers] = useState<UserProfile[]>([]);
  const [fbPosts, setFbPosts] = useState<Post[]>([]);
  const [fbCommentsByPost, setFbCommentsByPost] = useState<Record<string, PostComment[]>>({});
  const [fbLikedPostIds, setFbLikedPostIds] = useState<string[]>([]);
  const [fbSavedPostIds, setFbSavedPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('inztagram_fb_saved');
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [fbFollowingIds, setFbFollowingIds] = useState<string[]>([]);
  const [fbBlockedUserIds, setFbBlockedUserIds] = useState<string[]>([]);
  const [fbStories, setFbStories] = useState<Story[]>([]);
  const [fbSeenStoryIds, setFbSeenStoryIds] = useState<string[]>([]);
  const [fbConversations, setFbConversations] = useState<Conversation[]>([]);
  const [fbMessagesByConv, setFbMessagesByConv] = useState<Record<string, DirectMessage[]>>({});
  const [fbNotifications, setFbNotifications] = useState<NotificationItem[]>([]);

  // Navigation & UI state
  const [destination, setDestination] = useState<AppDestination>('home');
  const [viewedProfileUid, setViewedProfileUid] = useState<string | null>(null);
  const [exploreQuery, setExploreQuery] = useState<string>('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [activeStoryAuthorId, setActiveStoryAuthorId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createDefaultKind, setCreateDefaultKind] = useState<'post' | 'reel' | 'story'>('post');
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // Persist demo state locally when in demo mode
  useEffect(() => {
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoState));
    } catch {
      // Ignore quota errors on large local files
    }
  }, [demoState]);

  // Firebase Auth listener
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setIsLoadingAuth(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFbAuthUid(user ? user.uid : null);
      if (user) {
        setInDemoSession(false);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Firebase Firestore real-time subscriptions when authenticated
  useEffect(() => {
    if (mode !== 'firebase' || !db || !fbAuthUid) {
      return;
    }

    setIsLoadingData(true);
    setDataError(null);

    const unsubscribers: Array<() => void> = [];

    // Users
    unsubscribers.push(
      onSnapshot(
        collection(db, 'users'),
        (snap) => {
          const list: UserProfile[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              uid: d.id,
              username: String(data.username || 'user'),
              displayName: String(data.displayName || 'Inztagram Member'),
              bio: String(data.bio || ''),
              avatarUrl: String(data.avatarUrl || '/samples/avatar-you.svg'),
              followersCount: Number(data.followersCount || 0),
              followingCount: Number(data.followingCount || 0),
              postsCount: Number(data.postsCount || 0),
              createdAt: toMillis(data.createdAt),
            };
          });
          setFbUsers(list);
          setIsLoadingData(false);
        },
        (err) => {
          setDataError(err.message);
          setIsLoadingData(false);
        }
      )
    );

    // Posts
    unsubscribers.push(
      onSnapshot(
        query(collection(db, 'posts'), orderBy('createdAt', 'desc')),
        async (snap) => {
          const list: Post[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              authorId: String(data.authorId || ''),
              mediaType: data.mediaType === 'video' ? 'video' : 'image',
              mediaUrl: String(data.mediaUrl || ''),
              aspectRatio: data.aspectRatio || 'square',
              caption: String(data.caption || ''),
              altText: String(data.altText || ''),
              hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
              likesCount: Number(data.likesCount || 0),
              commentsCount: Number(data.commentsCount || 0),
              createdAt: toMillis(data.createdAt),
            };
          });
          setFbPosts(list);

          // Check likes for current user across visible posts
          const likedIds: string[] = [];
          await Promise.all(
            list.slice(0, 40).map(async (p) => {
              if (!db) return;
              const likeSnap = await getDoc(doc(db, 'posts', p.id, 'likes', fbAuthUid));
              if (likeSnap.exists()) likedIds.push(p.id);
            })
          );
          setFbLikedPostIds(likedIds);
        },
        (err) => setDataError(err.message)
      )
    );

    // Follows
    unsubscribers.push(
      onSnapshot(
        query(collection(db, 'follows'), where('followerId', '==', fbAuthUid)),
        (snap) => {
          setFbFollowingIds(snap.docs.map((d) => String(d.data().followingId)));
        }
      )
    );

    // Blocks
    unsubscribers.push(
      onSnapshot(
        query(collection(db, 'blocks'), where('blockerId', '==', fbAuthUid)),
        (snap) => {
          setFbBlockedUserIds(snap.docs.map((d) => String(d.data().blockedUserId)));
        }
      )
    );

    // Stories (active 24h)
    unsubscribers.push(
      onSnapshot(
        query(
          collection(db, 'stories'),
          where('expiresAt', '>', Timestamp.fromMillis(Date.now()))
        ),
        (snap) => {
          const list: Story[] = snap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                authorId: String(data.authorId || ''),
                mediaType: (data.mediaType === 'video' ? 'video' : 'image') as MediaType,
                mediaUrl: String(data.mediaUrl || ''),
                caption: String(data.caption || ''),
                altText: String(data.altText || ''),
                createdAt: toMillis(data.createdAt),
                expiresAt: toMillis(data.expiresAt),
              };
            })
            .filter((s) => s.expiresAt > Date.now())
            .sort((a, b) => a.createdAt - b.createdAt);
          setFbStories(list);
        }
      )
    );

    // Conversations
    unsubscribers.push(
      onSnapshot(
        query(
          collection(db, 'conversations'),
          where('participants', 'array-contains', fbAuthUid)
        ),
        (snap) => {
          const list: Conversation[] = snap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                participants: Array.isArray(data.participants) ? data.participants : [],
                lastMessageText: String(data.lastMessageText || ''),
                lastMessageAt: toMillis(data.lastMessageAt),
                unreadBy: Array.isArray(data.unreadBy) ? data.unreadBy : [],
              };
            })
            .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
          setFbConversations(list);
        }
      )
    );

    // Notifications
    unsubscribers.push(
      onSnapshot(
        query(
          collection(db, 'notifications'),
          where('recipientId', '==', fbAuthUid),
          orderBy('createdAt', 'desc')
        ),
        (snap) => {
          const list: NotificationItem[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              recipientId: String(data.recipientId || ''),
              actorId: String(data.actorId || ''),
              type: data.type || 'like',
              postId: data.postId ? String(data.postId) : undefined,
              conversationId: data.conversationId ? String(data.conversationId) : undefined,
              previewText: data.previewText ? String(data.previewText) : undefined,
              read: Boolean(data.read),
              createdAt: toMillis(data.createdAt),
            };
          });
          setFbNotifications(list);
        }
      )
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [mode, fbAuthUid]);

  // Subscribe to comments of selected post in Firebase mode
  useEffect(() => {
    if (mode !== 'firebase' || !db || !selectedPostId) return;
    const unsub = onSnapshot(
      query(collection(db, 'posts', selectedPostId, 'comments'), orderBy('createdAt', 'asc')),
      (snap) => {
        const list: PostComment[] = snap.docs.map((d) => ({
          id: d.id,
          postId: selectedPostId,
          authorId: String(d.data().authorId || ''),
          text: String(d.data().text || ''),
          createdAt: toMillis(d.data().createdAt),
        }));
        setFbCommentsByPost((prev) => ({ ...prev, [selectedPostId]: list }));
      }
    );
    return () => unsub();
  }, [mode, selectedPostId]);

  // Subscribe to messages of active conversation in Firebase mode
  useEffect(() => {
    if (mode !== 'firebase' || !db || !activeConversationId) return;
    const unsub = onSnapshot(
      query(
        collection(db, 'conversations', activeConversationId, 'messages'),
        orderBy('createdAt', 'asc')
      ),
      (snap) => {
        const list: DirectMessage[] = snap.docs.map((d) => ({
          id: d.id,
          conversationId: activeConversationId,
          senderId: String(d.data().senderId || ''),
          text: String(d.data().text || ''),
          createdAt: toMillis(d.data().createdAt),
        }));
        setFbMessagesByConv((prev) => ({ ...prev, [activeConversationId]: list }));
      }
    );
    return () => unsub();
  }, [mode, activeConversationId]);

  // Resolved active collections
  const users = mode === 'firebase' ? fbUsers : demoState.users;
  const usersById = useMemo(() => {
    const map: Record<string, UserProfile> = {};
    users.forEach((u) => {
      map[u.uid] = u;
    });
    return map;
  }, [users]);

  const currentUser = useMemo(() => {
    if (mode === 'firebase') {
      return fbAuthUid ? usersById[fbAuthUid] || null : null;
    }
    return demoSignedIn ? usersById[demoState.currentUid] || demoState.users[0] : null;
  }, [mode, fbAuthUid, usersById, demoSignedIn, demoState.currentUid, demoState.users]);

  const isAuthenticated = Boolean(currentUser);

  const blockedUserIds = useMemo(
    () => new Set(mode === 'firebase' ? fbBlockedUserIds : demoState.blockedUserIds),
    [mode, fbBlockedUserIds, demoState.blockedUserIds]
  );

  const posts = useMemo(() => {
    const raw = mode === 'firebase' ? fbPosts : demoState.posts;
    return raw
      .filter((p) => !blockedUserIds.has(p.authorId))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [mode, fbPosts, demoState.posts, blockedUserIds]);

  const commentsByPost = useMemo(() => {
    if (mode === 'firebase') return fbCommentsByPost;
    const map: Record<string, PostComment[]> = {};
    demoState.comments.forEach((c) => {
      if (!map[c.postId]) map[c.postId] = [];
      map[c.postId].push(c);
    });
    return map;
  }, [mode, fbCommentsByPost, demoState.comments]);

  const likedPostIds = useMemo(
    () => new Set(mode === 'firebase' ? fbLikedPostIds : demoState.likedPostIds),
    [mode, fbLikedPostIds, demoState.likedPostIds]
  );

  const savedPostIds = useMemo(
    () => new Set(mode === 'firebase' ? fbSavedPostIds : demoState.savedPostIds),
    [mode, fbSavedPostIds, demoState.savedPostIds]
  );

  const followingIds = useMemo(
    () => new Set(mode === 'firebase' ? fbFollowingIds : demoState.followingIds),
    [mode, fbFollowingIds, demoState.followingIds]
  );

  const stories = useMemo(() => {
    const raw = mode === 'firebase' ? fbStories : demoState.stories;
    const nowMs = Date.now();
    return raw.filter((s) => s.expiresAt > nowMs && !blockedUserIds.has(s.authorId));
  }, [mode, fbStories, demoState.stories, blockedUserIds]);

  const seenStoryIds = useMemo(
    () => new Set(mode === 'firebase' ? fbSeenStoryIds : demoState.seenStoryIds),
    [mode, fbSeenStoryIds, demoState.seenStoryIds]
  );

  const conversations = useMemo(() => {
    const raw = mode === 'firebase' ? fbConversations : demoState.conversations;
    if (!currentUser) return [];
    return raw
      .filter((c) => c.participants.includes(currentUser.uid))
      .filter((c) => {
        const other = c.participants.find((id) => id !== currentUser.uid);
        return !other || !blockedUserIds.has(other);
      })
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  }, [mode, fbConversations, demoState.conversations, currentUser, blockedUserIds]);

  const messagesByConversation = useMemo(() => {
    if (mode === 'firebase') return fbMessagesByConv;
    const map: Record<string, DirectMessage[]> = {};
    demoState.messages.forEach((m) => {
      if (!map[m.conversationId]) map[m.conversationId] = [];
      map[m.conversationId].push(m);
    });
    return map;
  }, [mode, fbMessagesByConv, demoState.messages]);

  const notifications = useMemo(() => {
    const raw = mode === 'firebase' ? fbNotifications : demoState.notifications;
    if (!currentUser) return [];
    return raw
      .filter((n) => n.recipientId === currentUser.uid && !blockedUserIds.has(n.actorId))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [mode, fbNotifications, demoState.notifications, currentUser, blockedUserIds]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const unreadMessagesCount = useMemo(() => {
    if (!currentUser) return 0;
    return conversations.filter((c) => c.unreadBy.includes(currentUser.uid)).length;
  }, [conversations, currentUser]);

  // Navigation helpers
  const openProfile = useCallback((uid: string) => {
    setViewedProfileUid(uid);
    setDestination('profile');
  }, []);

  const openExploreWithTag = useCallback((tag: string) => {
    setExploreQuery(`#${tag.replace(/^#/, '')}`);
    setDestination('explore');
  }, []);

  const openCreateModal = useCallback((kind: 'post' | 'reel' | 'story' = 'post') => {
    setCreateDefaultKind(kind);
    setIsCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  // Auth actions
  const signIn = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        'Firebase credentials are not configured. Click "Explore demo" below or add VITE_FIREBASE_* keys.'
      );
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setInDemoSession(false);
    } catch (err) {
      throw new Error(mapFirebaseAuthError(err));
    }
  }, []);

  const signUp = useCallback(
    async ({
      email,
      password,
      username,
      displayName,
    }: {
      email: string;
      password: string;
      username: string;
      displayName: string;
    }) => {
      if (!isFirebaseConfigured || !auth || !db) {
        throw new Error(
          'Firebase credentials are not configured. Click "Explore demo" below or add VITE_FIREBASE_* keys.'
        );
      }
      const cleanUser = normalizeUsername(username);
      const userErr = validateUsername(cleanUser);
      if (userErr) throw new Error(userErr);

      const cleanDisplay = displayName.trim();
      if (cleanDisplay.length < 2) {
        throw new Error('Display name must be at least 2 characters.');
      }

      try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          username: cleanUser,
          displayName: cleanDisplay.slice(0, 60),
          bio: 'New on Inztagram.',
          avatarUrl: '/samples/avatar-you.svg',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          createdAt: serverTimestamp(),
        });
        setInDemoSession(false);
      } catch (err) {
        throw new Error(mapFirebaseAuthError(err));
      }
    },
    []
  );

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        'Password reset emails require Firebase Auth configuration. Use "Explore demo" to test the app locally.'
      );
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      throw new Error(mapFirebaseAuthError(err));
    }
  }, []);

  const enterDemoMode = useCallback(() => {
    setInDemoSession(true);
    setDemoSignedIn(true);
    setDestination('home');
    showToast('Entered Demo Mode — changes stay in this browser.');
  }, [showToast]);

  const switchDemoUser = useCallback(
    (uid: string) => {
      if (mode !== 'demo') return;
      setDemoState((prev) => ({ ...prev, currentUid: uid }));
      setViewedProfileUid(uid);
      const target = demoState.users.find((u) => u.uid === uid);
      if (target) showToast(`Switched demo account to @${target.username}`);
    },
    [mode, demoState.users, showToast]
  );

  const resetDemoData = useCallback(() => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    const fresh = loadDemoState();
    setDemoState(fresh);
    setViewedProfileUid(fresh.currentUid);
    showToast('Demo data reset to sample state.');
  }, [showToast]);

  const signOut = useCallback(async () => {
    if (mode === 'firebase' && auth) {
      await firebaseSignOut(auth);
      setFbAuthUid(null);
    } else {
      setDemoSignedIn(false);
    }
    setViewedProfileUid(null);
    setSelectedPostId(null);
    setActiveStoryAuthorId(null);
    setActiveConversationId(null);
    setDestination('home');
  }, [mode]);

  // Upload helper (Firebase Storage or local Data URL)
  const uploadOrResolveMedia = useCallback(
    async (
      folder: 'media' | 'avatars',
      uid: string,
      file?: File | null,
      presetUrl?: string,
      onProgress?: (pct: number) => void
    ): Promise<string> => {
      if (presetUrl) {
        onProgress?.(100);
        return presetUrl;
      }
      if (!file) {
        throw new Error('Please choose a file or sample asset.');
      }

      if (mode === 'firebase') {
        if (!isStorageConfigured || !storage) {
          throw new Error(
            'Cloud Storage is not configured (missing VITE_FIREBASE_STORAGE_BUCKET). Configure Storage or choose a sample preset.'
          );
        }
        const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const storageRef = ref(storage, `${folder}/${uid}/${safeName}`);
        return await new Promise<string>((resolve, reject) => {
          const task = uploadBytesResumable(storageRef, file);
          task.on(
            'state_changed',
            (snap) => {
              const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
              onProgress?.(pct);
            },
            (err) => reject(err),
            async () => {
              const url = await getDownloadURL(task.snapshot.ref);
              resolve(url);
            }
          );
        });
      }

      // Demo mode local conversion with gentle progress feedback
      onProgress?.(35);
      if (file.type.startsWith('video/')) {
        // Object URL plays reliably in-session without overflowing localStorage
        const objectUrl = URL.createObjectURL(file);
        onProgress?.(100);
        return objectUrl;
      }
      const dataUrl = await compressImageForDemoStorage(file);
      onProgress?.(100);
      return dataUrl;
    },
    [mode]
  );

  const updateCurrentUserProfile = useCallback(
    async ({
      displayName,
      username,
      bio,
      avatarFile,
      avatarPresetUrl,
    }: {
      displayName: string;
      username: string;
      bio: string;
      avatarFile?: File | null;
      avatarPresetUrl?: string;
    }) => {
      if (!currentUser) throw new Error('You must be signed in.');
      const cleanUsername = normalizeUsername(username);
      const uErr = validateUsername(cleanUsername);
      if (uErr) throw new Error(uErr);
      const cleanDisplay = displayName.trim();
      if (cleanDisplay.length < 2 || cleanDisplay.length > 60) {
        throw new Error('Display name must be between 2 and 60 characters.');
      }
      const cleanBio = bio.trim().slice(0, 240);

      // Prevent duplicate usernames in active user list
      const conflict = users.find(
        (u) => u.uid !== currentUser.uid && u.username.toLowerCase() === cleanUsername
      );
      if (conflict) {
        throw new Error(`@${cleanUsername} is already taken.`);
      }

      let nextAvatar = currentUser.avatarUrl;
      if (avatarFile || avatarPresetUrl) {
        nextAvatar = await uploadOrResolveMedia(
          'avatars',
          currentUser.uid,
          avatarFile,
          avatarPresetUrl
        );
      }

      if (mode === 'firebase' && db) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          displayName: cleanDisplay,
          username: cleanUsername,
          bio: cleanBio,
          avatarUrl: nextAvatar,
        });
      } else {
        setDemoState((prev) => ({
          ...prev,
          users: prev.users.map((u) =>
            u.uid === prev.currentUid
              ? {
                  ...u,
                  displayName: cleanDisplay,
                  username: cleanUsername,
                  bio: cleanBio,
                  avatarUrl: nextAvatar,
                }
              : u
          ),
        }));
      }
      showToast('Profile updated.');
    },
    [currentUser, users, mode, uploadOrResolveMedia, showToast]
  );

  const createMediaItem = useCallback(
    async (input: CreateMediaInput) => {
      if (!currentUser) throw new Error('Please sign in first.');
      const cleanCaption = input.caption.trim().slice(0, 1000);
      const cleanAlt = input.altText.trim().slice(0, 300);
      const mediaUrl = await uploadOrResolveMedia(
        'media',
        currentUser.uid,
        input.file,
        input.presetUrl,
        input.onProgress
      );

      if (input.kind === 'story') {
        const nowMs = Date.now();
        const expiresAtMs = nowMs + 24 * 60 * 60 * 1000;
        if (mode === 'firebase' && db) {
          await addDoc(collection(db, 'stories'), {
            authorId: currentUser.uid,
            mediaType: input.mediaType,
            mediaUrl,
            caption: cleanCaption.slice(0, 200),
            altText: cleanAlt || `${currentUser.displayName}'s story`,
            createdAt: serverTimestamp(),
            expiresAt: Timestamp.fromMillis(expiresAtMs),
          });
        } else {
          const newStory: Story = {
            id: `story_${nowMs}`,
            authorId: currentUser.uid,
            mediaType: input.mediaType,
            mediaUrl,
            caption: cleanCaption.slice(0, 200),
            altText: cleanAlt || `${currentUser.displayName}'s story`,
            createdAt: nowMs,
            expiresAt: expiresAtMs,
          };
          setDemoState((prev) => ({
            ...prev,
            stories: [...prev.stories, newStory],
          }));
        }
        showToast('Story published (expires in 24h).');
        return;
      }

      const hashtags = extractHashtags(cleanCaption);
      if (input.kind === 'reel' && !hashtags.includes('reels')) {
        hashtags.push('reels');
      }

      if (mode === 'firebase' && db) {
        await addDoc(collection(db, 'posts'), {
          authorId: currentUser.uid,
          mediaType: input.mediaType,
          mediaUrl,
          aspectRatio: input.kind === 'reel' ? 'portrait' : 'square',
          caption: cleanCaption,
          altText: cleanAlt || `${currentUser.displayName}'s ${input.mediaType}`,
          hashtags,
          likesCount: 0,
          commentsCount: 0,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'users', currentUser.uid), {
          postsCount: increment(1),
        });
      } else {
        const nowMs = Date.now();
        const newPost: Post = {
          id: `post_${nowMs}`,
          authorId: currentUser.uid,
          mediaType: input.mediaType,
          mediaUrl,
          posterUrl: input.mediaType === 'video' && input.presetUrl ? input.presetUrl : undefined,
          aspectRatio: input.kind === 'reel' ? 'portrait' : 'square',
          caption: cleanCaption,
          altText: cleanAlt || `${currentUser.displayName}'s ${input.mediaType}`,
          hashtags,
          likesCount: 0,
          commentsCount: 0,
          createdAt: nowMs,
          demoReelTheme: input.mediaType === 'video' ? 'petal' : undefined,
        };
        setDemoState((prev) => ({
          ...prev,
          posts: [newPost, ...prev.posts],
          users: prev.users.map((u) =>
            u.uid === currentUser.uid ? { ...u, postsCount: u.postsCount + 1 } : u
          ),
        }));
      }

      showToast(input.kind === 'reel' ? 'Reel shared!' : 'Post published!');
    },
    [currentUser, mode, uploadOrResolveMedia, showToast]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      if (!currentUser) return;
      const target = posts.find((p) => p.id === postId);
      if (!target || target.authorId !== currentUser.uid) {
        showToast('You can only delete your own posts.');
        return;
      }

      if (mode === 'firebase' && db) {
        await deleteDoc(doc(db, 'posts', postId));
        await updateDoc(doc(db, 'users', currentUser.uid), {
          postsCount: increment(-1),
        });
      } else {
        setDemoState((prev) => ({
          ...prev,
          posts: prev.posts.filter((p) => p.id !== postId),
          comments: prev.comments.filter((c) => c.postId !== postId),
          users: prev.users.map((u) =>
            u.uid === currentUser.uid
              ? { ...u, postsCount: Math.max(0, u.postsCount - 1) }
              : u
          ),
        }));
      }
      if (selectedPostId === postId) setSelectedPostId(null);
      showToast('Post removed.');
    },
    [currentUser, posts, mode, selectedPostId, showToast]
  );

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!currentUser) return;
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      const isLiked = likedPostIds.has(postId);

      if (mode === 'firebase' && db) {
        // Optimistic update
        setFbLikedPostIds((prev) =>
          isLiked ? prev.filter((id) => id !== postId) : [...prev, postId]
        );
        const likeRef = doc(db, 'posts', postId, 'likes', currentUser.uid);
        const postRef = doc(db, 'posts', postId);
        if (isLiked) {
          await deleteDoc(likeRef);
          await updateDoc(postRef, { likesCount: increment(-1) });
        } else {
          await setDoc(likeRef, { userId: currentUser.uid, createdAt: serverTimestamp() });
          await updateDoc(postRef, { likesCount: increment(1) });
          if (post.authorId !== currentUser.uid) {
            await addDoc(collection(db, 'notifications'), {
              recipientId: post.authorId,
              actorId: currentUser.uid,
              type: 'like',
              postId,
              read: false,
              createdAt: serverTimestamp(),
            });
          }
        }
        return;
      }

      setDemoState((prev) => ({
        ...prev,
        likedPostIds: isLiked
          ? prev.likedPostIds.filter((id) => id !== postId)
          : [...prev.likedPostIds, postId],
        posts: prev.posts.map((p) =>
          p.id === postId
            ? { ...p, likesCount: Math.max(0, p.likesCount + (isLiked ? -1 : 1)) }
            : p
        ),
        notifications:
          !isLiked && post.authorId !== currentUser.uid
            ? [
                {
                  id: `n_${Date.now()}`,
                  recipientId: post.authorId,
                  actorId: currentUser.uid,
                  type: 'like',
                  postId,
                  read: false,
                  createdAt: Date.now(),
                },
                ...prev.notifications,
              ]
            : prev.notifications,
      }));
    },
    [currentUser, posts, likedPostIds, mode]
  );

  const addComment = useCallback(
    async (postId: string, text: string) => {
      if (!currentUser) return;
      const clean = text.trim();
      if (!clean) throw new Error('Comment cannot be empty.');
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      if (mode === 'firebase' && db) {
        await addDoc(collection(db, 'posts', postId, 'comments'), {
          authorId: currentUser.uid,
          text: clean.slice(0, 500),
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });
        if (post.authorId !== currentUser.uid) {
          await addDoc(collection(db, 'notifications'), {
            recipientId: post.authorId,
            actorId: currentUser.uid,
            type: 'comment',
            postId,
            previewText: clean.slice(0, 120),
            read: false,
            createdAt: serverTimestamp(),
          });
        }
        return;
      }

      const nowMs = Date.now();
      const newComment: PostComment = {
        id: `c_${nowMs}`,
        postId,
        authorId: currentUser.uid,
        text: clean.slice(0, 500),
        createdAt: nowMs,
      };
      setDemoState((prev) => ({
        ...prev,
        comments: [...prev.comments, newComment],
        posts: prev.posts.map((p) =>
          p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
        ),
        notifications:
          post.authorId !== currentUser.uid
            ? [
                {
                  id: `n_${nowMs}`,
                  recipientId: post.authorId,
                  actorId: currentUser.uid,
                  type: 'comment',
                  postId,
                  previewText: clean.slice(0, 120),
                  read: false,
                  createdAt: nowMs,
                },
                ...prev.notifications,
              ]
            : prev.notifications,
      }));
    },
    [currentUser, posts, mode]
  );

  const toggleFollow = useCallback(
    async (targetUid: string) => {
      if (!currentUser || targetUid === currentUser.uid) return;
      const isFollowing = followingIds.has(targetUid);

      if (mode === 'firebase' && db) {
        const followId = `${currentUser.uid}_${targetUid}`;
        const followRef = doc(db, 'follows', followId);
        if (isFollowing) {
          await deleteDoc(followRef);
          await updateDoc(doc(db, 'users', currentUser.uid), {
            followingCount: increment(-1),
          });
          await updateDoc(doc(db, 'users', targetUid), {
            followersCount: increment(-1),
          });
        } else {
          await setDoc(followRef, {
            followerId: currentUser.uid,
            followingId: targetUid,
            createdAt: serverTimestamp(),
          });
          await updateDoc(doc(db, 'users', currentUser.uid), {
            followingCount: increment(1),
          });
          await updateDoc(doc(db, 'users', targetUid), {
            followersCount: increment(1),
          });
          await addDoc(collection(db, 'notifications'), {
            recipientId: targetUid,
            actorId: currentUser.uid,
            type: 'follow',
            read: false,
            createdAt: serverTimestamp(),
          });
        }
        return;
      }

      setDemoState((prev) => ({
        ...prev,
        followingIds: isFollowing
          ? prev.followingIds.filter((id) => id !== targetUid)
          : [...prev.followingIds, targetUid],
        users: prev.users.map((u) => {
          if (u.uid === currentUser.uid) {
            return {
              ...u,
              followingCount: Math.max(0, u.followingCount + (isFollowing ? -1 : 1)),
            };
          }
          if (u.uid === targetUid) {
            return {
              ...u,
              followersCount: Math.max(0, u.followersCount + (isFollowing ? -1 : 1)),
            };
          }
          return u;
        }),
        notifications: !isFollowing
          ? [
              {
                id: `n_${Date.now()}`,
                recipientId: targetUid,
                actorId: currentUser.uid,
                type: 'follow',
                read: false,
                createdAt: Date.now(),
              },
              ...prev.notifications,
            ]
          : prev.notifications,
      }));
    },
    [currentUser, followingIds, mode]
  );

  const toggleSavePost = useCallback(
    (postId: string) => {
      if (mode === 'firebase') {
        setFbSavedPostIds((prev) => {
          const next = prev.includes(postId)
            ? prev.filter((id) => id !== postId)
            : [...prev, postId];
          try {
            localStorage.setItem('inztagram_fb_saved', JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
      } else {
        setDemoState((prev) => ({
          ...prev,
          savedPostIds: prev.savedPostIds.includes(postId)
            ? prev.savedPostIds.filter((id) => id !== postId)
            : [...prev.savedPostIds, postId],
        }));
      }
      showToast(savedPostIds.has(postId) ? 'Removed from saved' : 'Saved to profile');
    },
    [mode, savedPostIds, showToast]
  );

  const markStorySeen = useCallback(
    (storyId: string) => {
      if (mode === 'firebase') {
        setFbSeenStoryIds((prev) => (prev.includes(storyId) ? prev : [...prev, storyId]));
      } else {
        setDemoState((prev) =>
          prev.seenStoryIds.includes(storyId)
            ? prev
            : { ...prev, seenStoryIds: [...prev.seenStoryIds, storyId] }
        );
      }
    },
    [mode]
  );

  const startConversation = useCallback(
    async (otherUid: string): Promise<string> => {
      if (!currentUser) throw new Error('Sign in to send messages.');
      const existing = conversations.find(
        (c) => c.participants.includes(currentUser.uid) && c.participants.includes(otherUid)
      );
      if (existing) {
        setActiveConversationId(existing.id);
        setDestination('messages');
        return existing.id;
      }

      if (mode === 'firebase' && db) {
        const sorted = [currentUser.uid, otherUid].sort();
        const convId = `${sorted[0]}_${sorted[1]}`;
        await setDoc(doc(db, 'conversations', convId), {
          participants: sorted,
          lastMessageText: '',
          lastMessageAt: serverTimestamp(),
          unreadBy: [],
        });
        setActiveConversationId(convId);
        setDestination('messages');
        return convId;
      }

      const convId = `conv_${Date.now()}`;
      const newConv: Conversation = {
        id: convId,
        participants: [currentUser.uid, otherUid],
        lastMessageText: '',
        lastMessageAt: Date.now(),
        unreadBy: [],
      };
      setDemoState((prev) => ({
        ...prev,
        conversations: [newConv, ...prev.conversations],
      }));
      setActiveConversationId(convId);
      setDestination('messages');
      return convId;
    },
    [currentUser, conversations, mode]
  );

  const sendMessage = useCallback(
    async (conversationId: string, text: string) => {
      if (!currentUser) return;
      const clean = text.trim();
      if (!clean) throw new Error('Message cannot be empty.');
      const conv = conversations.find((c) => c.id === conversationId);
      if (!conv) throw new Error('Conversation not found.');
      const otherUid = conv.participants.find((id) => id !== currentUser.uid) || '';

      if (mode === 'firebase' && db) {
        await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
          senderId: currentUser.uid,
          text: clean.slice(0, 1000),
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'conversations', conversationId), {
          lastMessageText: clean.slice(0, 140),
          lastMessageAt: serverTimestamp(),
          unreadBy: otherUid ? [otherUid] : [],
        });
        if (otherUid) {
          await addDoc(collection(db, 'notifications'), {
            recipientId: otherUid,
            actorId: currentUser.uid,
            type: 'message',
            conversationId,
            previewText: clean.slice(0, 100),
            read: false,
            createdAt: serverTimestamp(),
          });
        }
        return;
      }

      const nowMs = Date.now();
      const newMsg: DirectMessage = {
        id: `m_${nowMs}`,
        conversationId,
        senderId: currentUser.uid,
        text: clean.slice(0, 1000),
        createdAt: nowMs,
      };
      setDemoState((prev) => ({
        ...prev,
        messages: [...prev.messages, newMsg],
        conversations: prev.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessageText: clean.slice(0, 140),
                lastMessageAt: nowMs,
                unreadBy: otherUid ? [otherUid] : [],
              }
            : c
        ),
        notifications: otherUid
          ? [
              {
                id: `n_${nowMs}`,
                recipientId: otherUid,
                actorId: currentUser.uid,
                type: 'message',
                conversationId,
                previewText: clean.slice(0, 100),
                read: false,
                createdAt: nowMs,
              },
              ...prev.notifications,
            ]
          : prev.notifications,
      }));
    },
    [currentUser, conversations, mode]
  );

  const markConversationRead = useCallback(
    async (conversationId: string) => {
      if (!currentUser) return;
      const conv = conversations.find((c) => c.id === conversationId);
      if (!conv || !conv.unreadBy.includes(currentUser.uid)) return;

      if (mode === 'firebase' && db) {
        await updateDoc(doc(db, 'conversations', conversationId), {
          unreadBy: conv.unreadBy.filter((id) => id !== currentUser.uid),
        });
      } else {
        setDemoState((prev) => ({
          ...prev,
          conversations: prev.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, unreadBy: c.unreadBy.filter((id) => id !== currentUser.uid) }
              : c
          ),
        }));
      }
    },
    [currentUser, conversations, mode]
  );

  const markNotificationRead = useCallback(
    async (notificationId: string) => {
      if (mode === 'firebase' && db) {
        await updateDoc(doc(db, 'notifications', notificationId), { read: true });
      } else {
        setDemoState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }));
      }
    },
    [mode]
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (!currentUser) return;
    if (mode === 'firebase' && db) {
      const batch = writeBatch(db);
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', currentUser.uid),
        where('read', '==', false)
      );
      const snap = await getDocs(q);
      snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
      await batch.commit();
    } else {
      setDemoState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.recipientId === currentUser.uid ? { ...n, read: true } : n
        ),
      }));
    }
    showToast('All notifications marked as read.');
  }, [currentUser, mode, showToast]);

  const reportContent = useCallback(
    async ({
      targetType,
      targetId,
      reason,
    }: {
      targetType: 'post' | 'user';
      targetId: string;
      reason: string;
    }) => {
      if (!currentUser) return;
      const cleanReason = reason.trim() || 'Inappropriate content';
      if (mode === 'firebase' && db) {
        await addDoc(collection(db, 'reports'), {
          reporterId: currentUser.uid,
          targetType,
          targetId,
          reason: cleanReason.slice(0, 200),
          createdAt: serverTimestamp(),
        });
        showToast('Report submitted. Thank you for helping keep Inztagram safe.');
      } else {
        setDemoState((prev) => ({
          ...prev,
          reports: [
            ...prev.reports,
            {
              id: `rep_${Date.now()}`,
              targetType,
              targetId,
              reason: cleanReason,
              createdAt: Date.now(),
            },
          ],
        }));
        showToast('Report saved locally (Demo only).');
      }
    },
    [currentUser, mode, showToast]
  );

  const toggleBlockUser = useCallback(
    async (targetUid: string) => {
      if (!currentUser || targetUid === currentUser.uid) return;
      const isBlocked = blockedUserIds.has(targetUid);
      if (mode === 'firebase' && db) {
        const blockId = `${currentUser.uid}_${targetUid}`;
        if (isBlocked) {
          await deleteDoc(doc(db, 'blocks', blockId));
        } else {
          await setDoc(doc(db, 'blocks', blockId), {
            blockerId: currentUser.uid,
            blockedUserId: targetUid,
            createdAt: serverTimestamp(),
          });
        }
        showToast(isBlocked ? 'Account unblocked.' : 'Account blocked.');
      } else {
        setDemoState((prev) => ({
          ...prev,
          blockedUserIds: isBlocked
            ? prev.blockedUserIds.filter((id) => id !== targetUid)
            : [...prev.blockedUserIds, targetUid],
        }));
        showToast(
          isBlocked
            ? 'Account unblocked (Demo only).'
            : 'Account blocked in this browser (Demo only).'
        );
      }
    },
    [currentUser, blockedUserIds, mode, showToast]
  );

  const value: AppContextValue = {
    mode,
    isAuthenticated,
    isLoadingAuth,
    isLoadingData,
    dataError,
    currentUser,
    users,
    usersById,
    posts,
    commentsByPost,
    likedPostIds,
    savedPostIds,
    followingIds,
    blockedUserIds,
    stories,
    seenStoryIds,
    conversations,
    messagesByConversation,
    notifications,
    unreadNotificationsCount,
    unreadMessagesCount,

    destination,
    setDestination,
    viewedProfileUid,
    openProfile,
    exploreQuery,
    setExploreQuery,
    openExploreWithTag,
    selectedPostId,
    setSelectedPostId,
    activeStoryAuthorId,
    setActiveStoryAuthorId,
    activeConversationId,
    setActiveConversationId,
    isCreateModalOpen,
    createDefaultKind,
    openCreateModal,
    closeCreateModal,
    isSetupGuideOpen,
    setIsSetupGuideOpen,
    toastMessage,
    showToast,

    signIn,
    signUp,
    sendPasswordReset,
    enterDemoMode,
    switchDemoUser,
    resetDemoData,
    signOut,

    updateCurrentUserProfile,
    createMediaItem,
    deletePost,
    toggleLike,
    addComment,
    toggleFollow,
    toggleSavePost,
    markStorySeen,
    startConversation,
    sendMessage,
    markConversationRead,
    markNotificationRead,
    markAllNotificationsRead,
    reportContent,
    toggleBlockUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
