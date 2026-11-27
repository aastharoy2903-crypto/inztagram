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
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  isFirebaseConfigured,
  mapFirebaseAuthError,
  OperationType,
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
  ChatThemeId,
  Conversation,
  DirectMessage,
  MediaType,
  NotificationItem,
  Post,
  PostComment,
  SafetyReport,
  Story,
  ThemeMode,
  UserProfile,
} from '../types/inztagram';
import { extractHashtags, normalizeUsername, validateUsername } from '../utils/formatters';

const DEMO_STORAGE_KEY = 'inztagram_demo_state_v4';
const FB_LOCAL_OVERLAY_PREFIX = 'inztagram_fb_local_v1_';
const THEME_STORAGE_KEY = 'inztagram_theme_v1';

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
  chatThemes?: Record<string, ChatThemeId>;
}

interface FbLocalOverlayState {
  sampleLikedPostIds: string[];
  sampleComments: PostComment[];
  sampleFollowingIds: string[];
  savedPostIds: string[];
  seenStoryIds: string[];
  localStories: Story[];
  conversations: Conversation[];
  messages: DirectMessage[];
  notifications: NotificationItem[];
  blockedUserIds: string[];
  reports: SafetyReport[];
  chatThemes?: Record<string, ChatThemeId>;
}

function getFreshSampleStories(): Story[] {
  const nowMs = Date.now();
  return DEMO_STORIES.map((s, idx) => ({
    ...s,
    createdAt: nowMs - (idx + 1) * 60 * 60 * 1000,
    expiresAt: nowMs + (23 - idx) * 60 * 60 * 1000,
  }));
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
          stories: (parsed.stories || getFreshSampleStories()).filter(
            (s) => s.expiresAt > Date.now()
          ),
          seenStoryIds: parsed.seenStoryIds || [],
          conversations: parsed.conversations || DEMO_CONVERSATIONS,
          messages: parsed.messages || DEMO_MESSAGES,
          notifications: parsed.notifications || DEMO_NOTIFICATIONS,
          blockedUserIds: parsed.blockedUserIds || [],
          reports: parsed.reports || [],
          chatThemes: parsed.chatThemes || {},
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
    stories: getFreshSampleStories(),
    seenStoryIds: [],
    conversations: DEMO_CONVERSATIONS,
    messages: DEMO_MESSAGES,
    notifications: DEMO_NOTIFICATIONS,
    blockedUserIds: [],
    reports: [],
    chatThemes: {},
  };
}

function defaultFbLocalOverlay(uid: string): FbLocalOverlayState {
  const nowMs = Date.now();
  return {
    sampleLikedPostIds: [],
    sampleComments: [],
    sampleFollowingIds: [],
    savedPostIds: [],
    seenStoryIds: [],
    localStories: [],
    conversations: [
      {
        id: `conv_welcome_${uid}`,
        participants: [uid, 'demo_claire'],
        lastMessageText: 'Welcome to Inztagram! Sample DMs run locally in this browser.',
        lastMessageAt: nowMs - 20 * 60 * 1000,
        unreadBy: [uid],
      },
    ],
    messages: [
      {
        id: `m_welcome_${uid}`,
        conversationId: `conv_welcome_${uid}`,
        senderId: 'demo_claire',
        text: 'Welcome to Inztagram! Sample DMs run locally in this browser.',
        createdAt: nowMs - 20 * 60 * 1000,
      },
    ],
    notifications: [
      {
        id: `n_welcome_${uid}`,
        recipientId: uid,
        actorId: 'demo_elena',
        type: 'follow',
        previewText: 'Sample activity preview (stored in this browser only)',
        read: false,
        createdAt: nowMs - 15 * 60 * 1000,
      },
    ],
    blockedUserIds: [],
    reports: [],
    chatThemes: {},
  };
}

function loadFbLocalOverlay(uid: string): FbLocalOverlayState {
  try {
    const raw = localStorage.getItem(`${FB_LOCAL_OVERLAY_PREFIX}${uid}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FbLocalOverlayState>;
      const base = defaultFbLocalOverlay(uid);
      return {
        sampleLikedPostIds: parsed.sampleLikedPostIds || base.sampleLikedPostIds,
        sampleComments: parsed.sampleComments || base.sampleComments,
        sampleFollowingIds: parsed.sampleFollowingIds || base.sampleFollowingIds,
        savedPostIds: parsed.savedPostIds || base.savedPostIds,
        seenStoryIds: parsed.seenStoryIds || base.seenStoryIds,
        localStories: (parsed.localStories || []).filter((s) => s.expiresAt > Date.now()),
        conversations: parsed.conversations || base.conversations,
        messages: parsed.messages || base.messages,
        notifications: parsed.notifications || base.notifications,
        blockedUserIds: parsed.blockedUserIds || base.blockedUserIds,
        reports: parsed.reports || base.reports,
        chatThemes: parsed.chatThemes || {},
      };
    }
  } catch {
    // ignore corrupt localStorage
  }
  return defaultFbLocalOverlay(uid);
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
  posterUrl?: string;
  caption: string;
  altText: string;
  onProgress?: (pct: number) => void;
}

interface FollowDoc {
  id: string;
  followerId: string;
  followingId: string;
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
  chatThemesByConv: Record<string, ChatThemeId>;
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  unreadMessagesCount: number;

  // Theme & Visual FX
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  heartBurstTick: number;
  triggerHeartBurst: () => void;

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
  loadCommentsForPost: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  toggleFollow: (targetUid: string) => Promise<void>;
  toggleSavePost: (postId: string) => void;
  markStorySeen: (storyId: string) => void;
  startConversation: (otherUid: string) => Promise<string>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
  setConversationTheme: (conversationId: string, themeId: ChatThemeId) => void;
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

  // Firebase Auth & Firestore state
  const [fbAuthUid, setFbAuthUid] = useState<string | null>(null);
  const [fbAuthEmail, setFbAuthEmail] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(isFirebaseConfigured);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [fbUsers, setFbUsers] = useState<UserProfile[]>([]);
  const [fbPosts, setFbPosts] = useState<Post[]>([]);
  const [fbCommentsByPost, setFbCommentsByPost] = useState<Record<string, PostComment[]>>({});
  const [fbLikedPostIds, setFbLikedPostIds] = useState<string[]>([]);
  const [fbFollowDocs, setFbFollowDocs] = useState<FollowDoc[]>([]);
  const [fbLocalOverlay, setFbLocalOverlay] = useState<FbLocalOverlayState>(() =>
    defaultFbLocalOverlay('guest')
  );

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

  // Light / Dark theme synced to <html> class & localStorage
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
      if (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        return 'dark';
      }
    } catch {
      // ignore localStorage read errors
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore localStorage write errors
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Small heart bubbles trigger
  const [heartBurstTick, setHeartBurstTick] = useState<number>(0);
  const triggerHeartBurst = useCallback(() => {
    setHeartBurstTick((prev) => prev + 1);
  }, []);

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

  // Persist Firebase local overlay (saved bookmarks, sample interactions, local DMs/notifications)
  useEffect(() => {
    if (!fbAuthUid) return;
    try {
      localStorage.setItem(
        `${FB_LOCAL_OVERLAY_PREFIX}${fbAuthUid}`,
        JSON.stringify(fbLocalOverlay)
      );
    } catch {
      // Ignore quota errors
    }
  }, [fbAuthUid, fbLocalOverlay]);

  // Firebase Auth listener
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setIsLoadingAuth(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFbAuthUid(user.uid);
        setFbAuthEmail(user.email || null);
        setFbLocalOverlay(loadFbLocalOverlay(user.uid));
        setInDemoSession(false);
      } else {
        setFbAuthUid(null);
        setFbAuthEmail(null);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Ensure an authenticated Firebase user always has a Firestore /users/{uid} profile doc
  useEffect(() => {
    if (mode !== 'firebase' || !db || !fbAuthUid) return;
    let cancelled = false;
    void (async () => {
      try {
        const userRef = doc(db, 'users', fbAuthUid);
        const snap = await getDoc(userRef);
        if (!snap.exists() && !cancelled) {
          const emailPrefix = (fbAuthEmail || 'member').split('@')[0];
          const baseUsername = normalizeUsername(emailPrefix) || 'member';
          const safeUsername =
            baseUsername.length >= 3
              ? `${baseUsername.slice(0, 24)}_${fbAuthUid.slice(0, 4).toLowerCase()}`.slice(0, 30)
              : `member_${fbAuthUid.slice(0, 6).toLowerCase()}`;
          await setDoc(userRef, {
            uid: fbAuthUid,
            username: safeUsername,
            displayName: emailPrefix.slice(0, 60) || 'Inztagram Member',
            bio: 'New on Inztagram.',
            avatarUrl: '/assets/aistudio/image_251618e5.png',
            avatarPosition: '50% 35%',
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            createdAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.warn(
          'Profile hydration check failed:',
          err instanceof Error ? err.message : String(err)
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, fbAuthUid, fbAuthEmail]);

  // Firebase Firestore real-time subscriptions when authenticated (users, posts, follows)
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
              avatarUrl: String(data.avatarUrl || '/assets/aistudio/image_251618e5.png'),
              avatarPosition: data.avatarPosition ? String(data.avatarPosition) : undefined,
              followersCount: Number(data.followersCount || 0),
              followingCount: Number(data.followingCount || 0),
              postsCount: Number(data.postsCount || 0),
              createdAt: toMillis(data.createdAt),
              isSample: false,
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
              posterUrl: data.posterUrl ? String(data.posterUrl) : undefined,
              aspectRatio: data.aspectRatio || 'square',
              objectPosition: data.objectPosition ? String(data.objectPosition) : undefined,
              caption: String(data.caption || ''),
              altText: String(data.altText || ''),
              hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
              likesCount: Number(data.likesCount || 0),
              commentsCount: Number(data.commentsCount || 0),
              createdAt: toMillis(data.createdAt),
              isSample: false,
            };
          });
          setFbPosts(list);

          // Check likes for current user across visible Firestore posts
          const likedIds: string[] = [];
          await Promise.all(
            list.slice(0, 40).map(async (p) => {
              if (!db) return;
              try {
                const likeSnap = await getDoc(doc(db, 'posts', p.id, 'likes', fbAuthUid));
                if (likeSnap.exists()) likedIds.push(p.id);
              } catch {
                // Ignore individual read error
              }
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
        collection(db, 'follows'),
        (snap) => {
          setFbFollowDocs(
            snap.docs.map((d) => ({
              id: d.id,
              followerId: String(d.data().followerId || ''),
              followingId: String(d.data().followingId || ''),
            }))
          );
        },
        (err) => {
          console.warn('Follows listener error:', err.message);
        }
      )
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [mode, fbAuthUid]);

  // Subscribe to comments of selected post in Firebase mode (for non-sample Firestore posts)
  useEffect(() => {
    if (mode !== 'firebase' || !db || !selectedPostId) return;
    if (DEMO_POSTS.some((p) => p.id === selectedPostId)) return;

    const unsub = onSnapshot(
      query(collection(db, 'posts', selectedPostId, 'comments'), orderBy('createdAt', 'asc')),
      (snap) => {
        const list: PostComment[] = snap.docs.map((d) => ({
          id: d.id,
          postId: selectedPostId,
          authorId: String(d.data().authorId || ''),
          text: String(d.data().text || ''),
          createdAt: toMillis(d.data().createdAt),
          isSample: false,
        }));
        setFbCommentsByPost((prev) => ({ ...prev, [selectedPostId]: list }));
      },
      (err) => {
        console.warn('Comments listener error:', err.message);
      }
    );
    return () => unsub();
  }, [mode, selectedPostId]);

  const loadCommentsForPost = useCallback(
    async (postId: string) => {
      if (mode !== 'firebase' || !db) return;
      if (DEMO_POSTS.some((p) => p.id === postId)) return;
      const path = `posts/${postId}/comments`;
      try {
        const snap = await getDocs(
          query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'))
        );
        const list: PostComment[] = snap.docs.map((d) => ({
          id: d.id,
          postId,
          authorId: String(d.data().authorId || ''),
          text: String(d.data().text || ''),
          createdAt: toMillis(d.data().createdAt),
          isSample: false,
        }));
        setFbCommentsByPost((prev) => ({ ...prev, [postId]: list }));
      } catch (err) {
        console.warn('Unable to load comments:', err instanceof Error ? err.message : err);
        handleFirestoreError(err, OperationType.LIST, path);
      }
    },
    [mode]
  );

  // Derive live follower/following counts for Firebase users from follows docs
  const fbFollowerCountMap = useMemo(() => {
    const followers = new Map<string, number>();
    const following = new Map<string, number>();
    fbFollowDocs.forEach((f) => {
      followers.set(f.followingId, (followers.get(f.followingId) || 0) + 1);
      following.set(f.followerId, (following.get(f.followerId) || 0) + 1);
    });
    return { followers, following };
  }, [fbFollowDocs]);

  const fbFollowingIds = useMemo(() => {
    if (!fbAuthUid) return [];
    const realFollowing = fbFollowDocs
      .filter((f) => f.followerId === fbAuthUid)
      .map((f) => f.followingId);
    return Array.from(new Set([...realFollowing, ...fbLocalOverlay.sampleFollowingIds]));
  }, [fbFollowDocs, fbAuthUid, fbLocalOverlay.sampleFollowingIds]);

  // Resolved active collections (in Firebase mode, merge real Firestore users/posts with clearly labeled Sample content)
  const users = useMemo(() => {
    if (mode === 'demo') return demoState.users;

    const realIds = new Set(fbUsers.map((u) => u.uid));
    const hydratedRealUsers = fbUsers.map((u) => {
      const baseFollowing = fbFollowerCountMap.following.get(u.uid) || 0;
      const sampleFollowingBonus =
        u.uid === fbAuthUid ? fbLocalOverlay.sampleFollowingIds.length : 0;
      return {
        ...u,
        followersCount: fbFollowerCountMap.followers.get(u.uid) ?? u.followersCount,
        followingCount: baseFollowing + sampleFollowingBonus,
      };
    });

    const sampleUsers = DEMO_USERS.filter((su) => !realIds.has(su.uid)).map((su) => {
      const isFollowedLocally = fbLocalOverlay.sampleFollowingIds.includes(su.uid);
      return {
        ...su,
        followersCount: su.followersCount + (isFollowedLocally ? 1 : 0),
        isSample: true,
      };
    });

    return [...hydratedRealUsers, ...sampleUsers];
  }, [mode, demoState.users, fbUsers, fbFollowerCountMap, fbAuthUid, fbLocalOverlay.sampleFollowingIds]);

  const usersById = useMemo(() => {
    const map: Record<string, UserProfile> = {};
    users.forEach((u) => {
      map[u.uid] = u;
    });
    return map;
  }, [users]);

  const currentUser = useMemo(() => {
    if (mode === 'firebase') {
      if (!fbAuthUid) return null;
      if (usersById[fbAuthUid]) return usersById[fbAuthUid];
      const fallbackName = (fbAuthEmail || 'member').split('@')[0] || 'Member';
      return {
        uid: fbAuthUid,
        username: normalizeUsername(fallbackName) || 'member',
        displayName: fallbackName,
        bio: 'New on Inztagram.',
        avatarUrl: '/assets/aistudio/image_251618e5.png',
        avatarPosition: '50% 35%',
        followersCount: 0,
        followingCount: fbLocalOverlay.sampleFollowingIds.length,
        postsCount: 0,
        createdAt: Date.now(),
        isSample: false,
      };
    }
    return demoSignedIn ? usersById[demoState.currentUid] || demoState.users[0] : null;
  }, [
    mode,
    fbAuthUid,
    fbAuthEmail,
    usersById,
    fbLocalOverlay.sampleFollowingIds.length,
    demoSignedIn,
    demoState.currentUid,
    demoState.users,
  ]);

  const isAuthenticated = Boolean(currentUser);

  const blockedUserIds = useMemo(
    () =>
      new Set(
        mode === 'firebase' ? fbLocalOverlay.blockedUserIds : demoState.blockedUserIds
      ),
    [mode, fbLocalOverlay.blockedUserIds, demoState.blockedUserIds]
  );

  const posts = useMemo(() => {
    if (mode === 'demo') {
      return demoState.posts
        .filter((p) => !blockedUserIds.has(p.authorId))
        .sort((a, b) => b.createdAt - a.createdAt);
    }

    const sampleCommentsCountMap = new Map<string, number>();
    fbLocalOverlay.sampleComments.forEach((c) => {
      sampleCommentsCountMap.set(
        c.postId,
        (sampleCommentsCountMap.get(c.postId) || 0) + 1
      );
    });

    const samplePostsHydrated = DEMO_POSTS.map((p) => {
      const likedLocally = fbLocalOverlay.sampleLikedPostIds.includes(p.id);
      const extraComments = sampleCommentsCountMap.get(p.id) || 0;
      return {
        ...p,
        likesCount: p.likesCount + (likedLocally ? 1 : 0),
        commentsCount: p.commentsCount + extraComments,
        isSample: true,
      };
    });

    const realIds = new Set(fbPosts.map((p) => p.id));
    const combined = [
      ...fbPosts,
      ...samplePostsHydrated.filter((sp) => !realIds.has(sp.id)),
    ];

    return combined
      .filter((p) => !blockedUserIds.has(p.authorId))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [
    mode,
    demoState.posts,
    fbPosts,
    fbLocalOverlay.sampleLikedPostIds,
    fbLocalOverlay.sampleComments,
    blockedUserIds,
  ]);

  const commentsByPost = useMemo(() => {
    const map: Record<string, PostComment[]> = {};
    if (mode === 'demo') {
      demoState.comments.forEach((c) => {
        if (!map[c.postId]) map[c.postId] = [];
        map[c.postId].push(c);
      });
      return map;
    }

    // Seed sample comments + any local comments on sample posts + Firestore comments on real posts
    DEMO_COMMENTS.forEach((c) => {
      if (!map[c.postId]) map[c.postId] = [];
      map[c.postId].push(c);
    });
    fbLocalOverlay.sampleComments.forEach((c) => {
      if (!map[c.postId]) map[c.postId] = [];
      map[c.postId].push(c);
    });
    Object.entries(fbCommentsByPost).forEach(([postId, list]) => {
      map[postId] = list;
    });
    return map;
  }, [mode, demoState.comments, fbLocalOverlay.sampleComments, fbCommentsByPost]);

  const likedPostIds = useMemo(
    () =>
      new Set(
        mode === 'firebase'
          ? [...fbLikedPostIds, ...fbLocalOverlay.sampleLikedPostIds]
          : demoState.likedPostIds
      ),
    [mode, fbLikedPostIds, fbLocalOverlay.sampleLikedPostIds, demoState.likedPostIds]
  );

  const savedPostIds = useMemo(
    () =>
      new Set(
        mode === 'firebase' ? fbLocalOverlay.savedPostIds : demoState.savedPostIds
      ),
    [mode, fbLocalOverlay.savedPostIds, demoState.savedPostIds]
  );

  const followingIds = useMemo(
    () => new Set(mode === 'firebase' ? fbFollowingIds : demoState.followingIds),
    [mode, fbFollowingIds, demoState.followingIds]
  );

  const stories = useMemo(() => {
    const nowMs = Date.now();
    if (mode === 'demo') {
      return demoState.stories.filter(
        (s) => s.expiresAt > nowMs && !blockedUserIds.has(s.authorId)
      );
    }
    const freshSamples = getFreshSampleStories();
    const combined = [...freshSamples, ...fbLocalOverlay.localStories];
    return combined.filter(
      (s) => s.expiresAt > nowMs && !blockedUserIds.has(s.authorId)
    );
  }, [mode, demoState.stories, fbLocalOverlay.localStories, blockedUserIds]);

  const seenStoryIds = useMemo(
    () =>
      new Set(
        mode === 'firebase' ? fbLocalOverlay.seenStoryIds : demoState.seenStoryIds
      ),
    [mode, fbLocalOverlay.seenStoryIds, demoState.seenStoryIds]
  );

  const conversations = useMemo(() => {
    const raw =
      mode === 'firebase' ? fbLocalOverlay.conversations : demoState.conversations;
    if (!currentUser) return [];
    return raw
      .filter((c) => c.participants.includes(currentUser.uid))
      .filter((c) => {
        const other = c.participants.find((id) => id !== currentUser.uid);
        return !other || !blockedUserIds.has(other);
      })
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  }, [mode, fbLocalOverlay.conversations, demoState.conversations, currentUser, blockedUserIds]);

  const messagesByConversation = useMemo(() => {
    const raw = mode === 'firebase' ? fbLocalOverlay.messages : demoState.messages;
    const map: Record<string, DirectMessage[]> = {};
    raw.forEach((m) => {
      if (!map[m.conversationId]) map[m.conversationId] = [];
      map[m.conversationId].push(m);
    });
    return map;
  }, [mode, fbLocalOverlay.messages, demoState.messages]);

  const chatThemesByConv = useMemo(
    () =>
      (mode === 'firebase' ? fbLocalOverlay.chatThemes : demoState.chatThemes) || {},
    [mode, fbLocalOverlay.chatThemes, demoState.chatThemes]
  );

  const notifications = useMemo(() => {
    const raw =
      mode === 'firebase' ? fbLocalOverlay.notifications : demoState.notifications;
    if (!currentUser) return [];
    return raw
      .filter((n) => n.recipientId === currentUser.uid && !blockedUserIds.has(n.actorId))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [mode, fbLocalOverlay.notifications, demoState.notifications, currentUser, blockedUserIds]);

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
        const path = `users/${cred.user.uid}`;
        try {
          await setDoc(doc(db, 'users', cred.user.uid), {
            uid: cred.user.uid,
            username: cleanUser,
            displayName: cleanDisplay.slice(0, 60),
            bio: 'New on Inztagram.',
            avatarUrl: '/assets/aistudio/image_251618e5.png',
            avatarPosition: '50% 35%',
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            createdAt: serverTimestamp(),
          });
        } catch (fsErr) {
          handleFirestoreError(fsErr, OperationType.CREATE, path);
        }
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

  // Media resolution (no Firebase Storage on no-cost Spark plan; bundled asset paths in Firebase mode)
  const resolveMediaRef = useCallback(
    async (
      file?: File | null,
      presetUrl?: string,
      onProgress?: (pct: number) => void
    ): Promise<string> => {
      if (presetUrl) {
        onProgress?.(100);
        return presetUrl;
      }
      if (!file) {
        throw new Error('Please choose a bundled photo/video preset.');
      }

      if (mode === 'firebase') {
        throw new Error(
          'Media file uploads are disabled in this no-cost Spark setup (no Firebase Storage). Choose a bundled photo or Reel clip.'
        );
      }

      onProgress?.(35);
      if (file.type.startsWith('video/')) {
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
        nextAvatar = await resolveMediaRef(avatarFile, avatarPresetUrl);
      }

      if (mode === 'firebase' && db) {
        const path = `users/${currentUser.uid}`;
        try {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            displayName: cleanDisplay,
            username: cleanUsername,
            bio: cleanBio,
            avatarUrl: nextAvatar,
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
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
    [currentUser, users, mode, resolveMediaRef, showToast]
  );

  const createMediaItem = useCallback(
    async (input: CreateMediaInput) => {
      if (!currentUser) throw new Error('Please sign in first.');
      const cleanCaption = input.caption.trim().slice(0, 1000);
      const cleanAlt = input.altText.trim().slice(0, 300);
      const mediaUrl = await resolveMediaRef(
        input.file,
        input.presetUrl,
        input.onProgress
      );

      if (input.kind === 'story') {
        const nowMs = Date.now();
        const expiresAtMs = nowMs + 24 * 60 * 60 * 1000;
        const newStory: Story = {
          id: `story_${nowMs}`,
          authorId: currentUser.uid,
          mediaType: input.mediaType,
          mediaUrl,
          caption: cleanCaption.slice(0, 200),
          altText: cleanAlt || `${currentUser.displayName}'s story`,
          createdAt: nowMs,
          expiresAt: expiresAtMs,
          isSample: false,
        };
        if (mode === 'firebase') {
          setFbLocalOverlay((prev) => ({
            ...prev,
            localStories: [...prev.localStories, newStory],
          }));
          showToast('Story published in this browser (Demo-only feature).');
        } else {
          setDemoState((prev) => ({
            ...prev,
            stories: [...prev.stories, newStory],
          }));
          showToast('Story published (expires in 24h).');
        }
        return;
      }

      const hashtags = extractHashtags(cleanCaption);
      if (input.kind === 'reel' && !hashtags.includes('reels')) {
        hashtags.push('reels');
      }

      const isVideoPreset =
        input.mediaType === 'video' &&
        Boolean(input.presetUrl) &&
        /\.(mp4|webm|mov)(\?|$)/i.test(input.presetUrl || '');
      const isImagePosterForReel =
        input.mediaType === 'video' && Boolean(input.presetUrl) && !isVideoPreset;

      if (mode === 'firebase' && db) {
        if (isImagePosterForReel) {
          throw new Error('Please choose a video clip preset for Reels.');
        }
        const postRef = doc(collection(db, 'posts'));
        const path = `posts/${postRef.id}`;
        try {
          const batch = writeBatch(db);
          batch.set(postRef, {
            authorId: currentUser.uid,
            mediaType: input.mediaType,
            mediaUrl,
            ...(input.posterUrl ? { posterUrl: input.posterUrl } : {}),
            aspectRatio: input.kind === 'reel' ? 'portrait' : 'square',
            caption: cleanCaption,
            altText: cleanAlt || `${currentUser.displayName}'s ${input.mediaType}`,
            hashtags,
            likesCount: 0,
            commentsCount: 0,
            createdAt: serverTimestamp(),
          });
          batch.update(doc(db, 'users', currentUser.uid), {
            postsCount: increment(1),
          });
          await batch.commit();
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      } else {
        const nowMs = Date.now();
        const newPost: Post = {
          id: `post_${nowMs}`,
          authorId: currentUser.uid,
          mediaType: input.mediaType,
          mediaUrl: isImagePosterForReel ? '' : mediaUrl,
          posterUrl: isImagePosterForReel ? input.presetUrl : input.posterUrl,
          aspectRatio: input.kind === 'reel' ? 'portrait' : 'square',
          caption: cleanCaption,
          altText: cleanAlt || `${currentUser.displayName}'s ${input.mediaType}`,
          hashtags,
          likesCount: 0,
          commentsCount: 0,
          createdAt: nowMs,
          isSample: false,
          demoReelTheme: isImagePosterForReel ? 'petal' : undefined,
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
    [currentUser, mode, resolveMediaRef, showToast]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      if (!currentUser) return;
      const target = posts.find((p) => p.id === postId);
      if (!target || target.authorId !== currentUser.uid) {
        showToast('You can only delete your own posts.');
        return;
      }

      if (mode === 'firebase' && db && !target.isSample) {
        const path = `posts/${postId}`;
        try {
          const batch = writeBatch(db);
          batch.delete(doc(db, 'posts', postId));
          batch.update(doc(db, 'users', currentUser.uid), {
            postsCount: increment(-1),
          });
          await batch.commit();
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, path);
        }
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

      if (!isLiked) {
        triggerHeartBurst();
      }

      if (mode === 'firebase' && db) {
        if (post.isSample) {
          setFbLocalOverlay((prev) => ({
            ...prev,
            sampleLikedPostIds: isLiked
              ? prev.sampleLikedPostIds.filter((id) => id !== postId)
              : [...prev.sampleLikedPostIds, postId],
          }));
          return;
        }

        // Optimistic update + atomic Firestore batch matching existsAfter rules
        setFbLikedPostIds((prev) =>
          isLiked ? prev.filter((id) => id !== postId) : [...prev, postId]
        );
        const likeRef = doc(db, 'posts', postId, 'likes', currentUser.uid);
        const postRef = doc(db, 'posts', postId);
        const path = `posts/${postId}/likes/${currentUser.uid}`;
        try {
          const batch = writeBatch(db);
          if (isLiked) {
            batch.delete(likeRef);
            batch.update(postRef, { likesCount: increment(-1) });
          } else {
            batch.set(likeRef, { userId: currentUser.uid, createdAt: serverTimestamp() });
            batch.update(postRef, { likesCount: increment(1) });
          }
          await batch.commit();
        } catch (err) {
          // Revert optimistic state
          setFbLikedPostIds((prev) =>
            isLiked ? [...prev, postId] : prev.filter((id) => id !== postId)
          );
          handleFirestoreError(err, OperationType.WRITE, path);
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
    [currentUser, posts, likedPostIds, mode, triggerHeartBurst]
  );

  const addComment = useCallback(
    async (postId: string, text: string) => {
      if (!currentUser) return;
      const clean = text.trim();
      if (!clean) throw new Error('Comment cannot be empty.');
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      if (mode === 'firebase' && db) {
        if (post.isSample) {
          const nowMs = Date.now();
          const newComment: PostComment = {
            id: `c_local_${nowMs}`,
            postId,
            authorId: currentUser.uid,
            text: clean.slice(0, 500),
            createdAt: nowMs,
            isSample: false,
          };
          setFbLocalOverlay((prev) => ({
            ...prev,
            sampleComments: [...prev.sampleComments, newComment],
          }));
          return;
        }

        const commentRef = doc(collection(db, 'posts', postId, 'comments'));
        const path = `posts/${postId}/comments/${commentRef.id}`;
        try {
          const batch = writeBatch(db);
          batch.set(commentRef, {
            authorId: currentUser.uid,
            text: clean.slice(0, 500),
            createdAt: serverTimestamp(),
          });
          batch.update(doc(db, 'posts', postId), { commentsCount: increment(1) });
          await batch.commit();
          // Refresh comments immediately if not already subscribed via modal
          await loadCommentsForPost(postId);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
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
        isSample: false,
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
    [currentUser, posts, mode, loadCommentsForPost]
  );

  const toggleFollow = useCallback(
    async (targetUid: string) => {
      if (!currentUser || targetUid === currentUser.uid) return;
      const isFollowing = followingIds.has(targetUid);
      const targetUser = usersById[targetUid];

      if (mode === 'firebase' && db) {
        if (targetUser?.isSample) {
          setFbLocalOverlay((prev) => ({
            ...prev,
            sampleFollowingIds: isFollowing
              ? prev.sampleFollowingIds.filter((id) => id !== targetUid)
              : [...prev.sampleFollowingIds, targetUid],
          }));
          return;
        }

        const followId = `${currentUser.uid}_${targetUid}`;
        const followRef = doc(db, 'follows', followId);
        const path = `follows/${followId}`;
        try {
          const batch = writeBatch(db);
          if (isFollowing) {
            batch.delete(followRef);
            batch.update(doc(db, 'users', currentUser.uid), {
              followingCount: increment(-1),
            });
          } else {
            batch.set(followRef, {
              followerId: currentUser.uid,
              followingId: targetUid,
              createdAt: serverTimestamp(),
            });
            batch.update(doc(db, 'users', currentUser.uid), {
              followingCount: increment(1),
            });
          }
          await batch.commit();
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
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
    [currentUser, followingIds, usersById, mode]
  );

  const toggleSavePost = useCallback(
    (postId: string) => {
      if (mode === 'firebase') {
        setFbLocalOverlay((prev) => ({
          ...prev,
          savedPostIds: prev.savedPostIds.includes(postId)
            ? prev.savedPostIds.filter((id) => id !== postId)
            : [...prev.savedPostIds, postId],
        }));
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
        setFbLocalOverlay((prev) =>
          prev.seenStoryIds.includes(storyId)
            ? prev
            : { ...prev, seenStoryIds: [...prev.seenStoryIds, storyId] }
        );
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

  // Direct Messages remain browser-local Demo Mode (no Cloud Functions/chat server on Spark)
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

      const convId = `conv_${Date.now()}`;
      const newConv: Conversation = {
        id: convId,
        participants: [currentUser.uid, otherUid],
        lastMessageText: '',
        lastMessageAt: Date.now(),
        unreadBy: [],
      };
      if (mode === 'firebase') {
        setFbLocalOverlay((prev) => ({
          ...prev,
          conversations: [newConv, ...prev.conversations],
        }));
      } else {
        setDemoState((prev) => ({
          ...prev,
          conversations: [newConv, ...prev.conversations],
        }));
      }
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

      const nowMs = Date.now();
      const newMsg: DirectMessage = {
        id: `m_${nowMs}`,
        conversationId,
        senderId: currentUser.uid,
        text: clean.slice(0, 1000),
        createdAt: nowMs,
      };

      if (mode === 'firebase') {
        setFbLocalOverlay((prev) => ({
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
        }));
        return;
      }

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

      if (mode === 'firebase') {
        setFbLocalOverlay((prev) => ({
          ...prev,
          conversations: prev.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, unreadBy: c.unreadBy.filter((id) => id !== currentUser.uid) }
              : c
          ),
        }));
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

  const setConversationTheme = useCallback(
    (conversationId: string, themeId: ChatThemeId) => {
      if (mode === 'firebase') {
        setFbLocalOverlay((prev) => ({
          ...prev,
          chatThemes: { ...(prev.chatThemes || {}), [conversationId]: themeId },
        }));
      } else {
        setDemoState((prev) => ({
          ...prev,
          chatThemes: { ...(prev.chatThemes || {}), [conversationId]: themeId },
        }));
      }
    },
    [mode]
  );

  const markNotificationRead = useCallback(
    async (notificationId: string) => {
      if (mode === 'firebase') {
        setFbLocalOverlay((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }));
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
    if (mode === 'firebase') {
      setFbLocalOverlay((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.recipientId === currentUser.uid ? { ...n, read: true } : n
        ),
      }));
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

  // Safety reports & blocks remain browser-local Demo Mode (no backend moderation queue)
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
      const entry: SafetyReport = {
        id: `rep_${Date.now()}`,
        targetType,
        targetId,
        reason: cleanReason,
        createdAt: Date.now(),
      };
      if (mode === 'firebase') {
        setFbLocalOverlay((prev) => ({
          ...prev,
          reports: [...prev.reports, entry],
        }));
      } else {
        setDemoState((prev) => ({
          ...prev,
          reports: [...prev.reports, entry],
        }));
      }
      showToast('Report saved locally (Demo only — no live moderation queue).');
    },
    [currentUser, mode, showToast]
  );

  const toggleBlockUser = useCallback(
    async (targetUid: string) => {
      if (!currentUser || targetUid === currentUser.uid) return;
      const isBlocked = blockedUserIds.has(targetUid);
      if (mode === 'firebase') {
        setFbLocalOverlay((prev) => ({
          ...prev,
          blockedUserIds: isBlocked
            ? prev.blockedUserIds.filter((id) => id !== targetUid)
            : [...prev.blockedUserIds, targetUid],
        }));
      } else {
        setDemoState((prev) => ({
          ...prev,
          blockedUserIds: isBlocked
            ? prev.blockedUserIds.filter((id) => id !== targetUid)
            : [...prev.blockedUserIds, targetUid],
        }));
      }
      showToast(
        isBlocked
          ? 'Account unblocked in this browser (Demo only).'
          : 'Account blocked in this browser (Demo only).'
      );
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
    chatThemesByConv,
    notifications,
    unreadNotificationsCount,
    unreadMessagesCount,

    theme,
    setTheme,
    toggleTheme,
    heartBurstTick,
    triggerHeartBurst,

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
    loadCommentsForPost,
    addComment,
    toggleFollow,
    toggleSavePost,
    markStorySeen,
    startConversation,
    sendMessage,
    markConversationRead,
    setConversationTheme,
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
