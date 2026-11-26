# Inztagram

A calm, responsive social photo and short-video sharing web application built with React, TypeScript, Tailwind CSS, and optional Firebase (Authentication, Firestore, and Cloud Storage).

## Features

- **Home Feed & Stories**: Chronological feed of followed accounts, 24-hour expiring Stories viewer (keyboard + touch navigation), likes, comments, bookmarks, and native Web Share / copy-link sharing.
- **Reels**: Vertical short-video feed with muted-by-default playback, play/pause, mute/unmute, keyboard navigation, and accessible video fallbacks.
- **Explore & Search**: Real-time search across users (username/display name) and `#hashtags`, plus a discovery media grid.
- **Direct Messages**: Conversation list and two-pane chat view with timestamps, unread tracking, and real-time Firestore sync when configured.
- **Notifications**: In-app notifications for likes, comments, follows, and messages with mark-as-read actions.
- **Profiles & Post Creation**: Profile grids, follow/unfollow, owner-only profile editing, and photo/video/story publishing with upload progress and alt text.
- **Demo Mode**: Works immediately with realistic local sample data if Firebase environment variables are not set, clearly labeled as browser-only demo storage.

## Running Locally

```bash
npm install
npm run dev
```

The development server runs on `http://localhost:3000`.

## Environment Variables (Firebase Setup)

Copy `.env.example` to `.env` and fill in your Firebase Web App credentials to switch from Demo Mode to live Firebase persistence:

| Variable | Description |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain (e.g. `your-project.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Cloud Storage bucket (e.g. `your-project.appspot.com`) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID |

## Firebase Console Checklist

1. **Authentication**: Enable **Email/Password** sign-in provider in Firebase Console -> Authentication -> Sign-in method.
2. **Firestore Database**: Create a Firestore database and deploy `firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```
3. **Cloud Storage**: Enable Firebase Storage and deploy `storage.rules` for photo, video, and story uploads:
   ```bash
   firebase deploy --only storage
   ```

## Data Model

- `users/{uid}`: `{ uid, username, displayName, bio, avatarUrl, postsCount, followersCount, followingCount, createdAt }`
- `posts/{postId}`: `{ authorId, mediaType, mediaUrl, caption, altText, hashtags, likesCount, commentsCount, createdAt }`
  - `posts/{postId}/likes/{uid}`: `{ userId, createdAt }`
  - `posts/{postId}/comments/{commentId}`: `{ authorId, text, createdAt }`
- `follows/{followerId_followingId}`: `{ followerId, followingId, createdAt }`
- `stories/{storyId}`: `{ authorId, mediaType, mediaUrl, caption, altText, createdAt, expiresAt }`
- `conversations/{conversationId}`: `{ participants, lastMessageText, lastMessageAt, updatedAt }`
  - `conversations/{conversationId}/messages/{messageId}`: `{ senderId, text, createdAt }`
- `notifications/{notificationId}`: `{ recipientId, actorId, type, postId?, previewText?, read, createdAt }`
- `reports/{reportId}` & `blocks/{blockerId_blockedUserId}`: User-owned safety records.
