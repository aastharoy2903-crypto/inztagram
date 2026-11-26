export function formatRelativeTime(timestamp: number): string {
  const diffMs = Math.max(0, Date.now() - timestamp);
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 45) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function formatTimeClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatStoryExpiry(expiresAt: number): string {
  const remainingMs = expiresAt - Date.now();
  if (remainingMs <= 0) return 'Expired';
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 1) {
    return `Expires in ${hours}h`;
  }
  return `Expires in ${Math.max(1, minutes)}m`;
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[a-zA-Z0-9_]+/g) || [];
  return Array.from(new Set(matches.map((tag) => tag.slice(1).toLowerCase())));
}

export function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9._]/g, '');
}

export function validateUsername(username: string): string | null {
  if (!username) return 'Username is required.';
  if (username.length < 3 || username.length > 30) {
    return 'Username must be between 3 and 30 characters.';
  }
  if (!/^[a-z0-9._]+$/.test(username)) {
    return 'Use only lowercase letters, numbers, periods, or underscores.';
  }
  return null;
}

export function formatCompactCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (count >= 10_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return count.toLocaleString();
}

export async function shareContent(options: {
  title: string;
  text: string;
  url: string;
}): Promise<{ method: 'native' | 'clipboard' | 'failed' }> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(options);
      return { method: 'native' };
    } catch (err) {
      // If user dismissed native share sheet, don't overwrite clipboard unless AbortError wasn't cancellation
      if (err instanceof Error && err.name === 'AbortError') {
        return { method: 'failed' };
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(options.url);
      return { method: 'clipboard' };
    } catch {
      return { method: 'failed' };
    }
  }

  return { method: 'failed' };
}
