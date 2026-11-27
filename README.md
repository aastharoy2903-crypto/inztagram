# Inztagram

A calm, responsive social photo and short-video portfolio demo built with React, TypeScript, Tailwind CSS, and optional no-cost **Firebase Spark** integration (Firebase Authentication + Cloud Firestore).

## Features

- **Populated Feed & Sample Distinction**: Works immediately in **Demo Mode** (`localStorage`) without any environment variables, and merges clearly labeled **Sample** creators, posts, Reels, and Stories into newly signed-in Firebase accounts so no user lands on an empty feed.
- **Real-Time Profile Search**: Instant search in the Navigation bar filters across user handles and display names, with direct click-through to profiles.
- **Trending on Inztagram**: Calculated strictly from `#hashtags` in posts available inside this app over the last 24 hours (labeled **Demo trends** when running in Demo Mode).
- **Reels & Resilient Media Fallbacks**: Vertical short-video feed with muted-by-default playback, play/pause, mute/unmute, keyboard navigation, and automatic poster-image fallbacks if a video preview cannot decode.
- **Firebase Spark Persistence (when configured)**:
  - **Firebase Authentication**: Email/password sign-up, sign-in, and password reset.
  - **Cloud Firestore**: Persists user profiles (`/users/{uid}`), posts & Reels (`/posts/{postId}` referencing bundled `/assets/aistudio/*` media), likes (`/posts/{postId}/likes/{uid}`), comments (`/posts/{postId}/comments/{commentId}`), and follows (`/follows/{followerId_followingId}`).
- **Browser-Local Demo Features**: Direct Messages, Notifications, 24h Stories, Saved bookmarks, and Safety reports/blocks run locally in browser storage (`localStorage`) with clear demo labeling.

## No-Cost Spark Plan Notice (No Firebase Storage)

This project intentionally does **not** use Firebase Cloud Storage, Cloud Functions, or any billable GCP services:
- Uploaded media files are **not** supported when connected to Firebase.
- Instead, users create posts, Reels, and profile avatars using the bundled local images and `.mp4` clips under `/public/assets/aistudio/`, saving only safe relative media paths (`/assets/aistudio/...`) in Firestore.
- When running in unconfigured Demo Mode, local file previews are supported inside the browser only.

## Running Locally

```bash
npm install
npm run dev
```

The development server runs on `http://localhost:3000`.

## Environment Variables (Firebase Setup)

Copy `.env.example` to `.env` and fill in your Firebase Web App credentials to enable live Firebase Auth & Firestore alongside the populated sample feed:

| Variable | Description |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain (e.g. `your-project.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID |

## Firebase Console Checklist

1. **Authentication**: Enable the **Email/Password** sign-in provider in Firebase Console &rarr; Authentication &rarr; Sign-in method.
2. **Cloud Firestore**: Create a Firestore database on the **Spark (no-cost)** plan and deploy the hardened owner-restricted security rules in `firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Firestore Data Model & Security Rules

- `users/{uid}`: Owner-only writes (`isOwner(uid)`), public read for signed-in users, strict schema & media reference validation.
- `posts/{postId}`: Author-only creation and deletion (`authorId == request.auth.uid`), owner-only caption/alt edits, and atomic batch updates for `likesCount` / `commentsCount`.
  - `posts/{postId}/likes/{uid}`: Owner-only like/unlike validated via atomic batch (`existsAfter` / `!existsAfter`).
  - `posts/{postId}/comments/{commentId}`: Signed-in author-validated comments.
- `follows/{followerId_followingId}`: Deterministic ID validated to `followerId == request.auth.uid`.
