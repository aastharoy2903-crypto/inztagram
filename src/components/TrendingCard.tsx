import React, { useMemo } from 'react';
import { Hash, PlusSquare, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { extractHashtags } from '../utils/formatters';

interface TrendingCardProps {
  maxItems?: number;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export const TrendingCard: React.FC<TrendingCardProps> = ({ maxItems = 5 }) => {
  const { mode, posts, openExploreWithTag, openCreateModal } = useApp();

  const { trends, recentPostCount, includesSample } = useMemo(() => {
    const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;
    const recentPosts = posts.filter((p) => p.createdAt >= cutoff);
    const stats = new Map<string, { count: number; latestAt: number }>();

    let hasSample = false;
    recentPosts.forEach((post) => {
      if (post.isSample) hasSample = true;
      const postTags = new Set<string>([
        ...post.hashtags.map((t) => t.replace(/^#/, '').toLowerCase()),
        ...extractHashtags(post.caption),
      ]);
      postTags.forEach((tag) => {
        if (!tag) return;
        const prev = stats.get(tag);
        if (prev) {
          prev.count += 1;
          prev.latestAt = Math.max(prev.latestAt, post.createdAt);
        } else {
          stats.set(tag, { count: 1, latestAt: post.createdAt });
        }
      });
    });

    const sorted = Array.from(stats.entries())
      .map(([tag, info]) => ({ tag, count: info.count, latestAt: info.latestAt }))
      .sort((a, b) => b.count - a.count || b.latestAt - a.latestAt)
      .slice(0, maxItems);

    return {
      trends: sorted,
      recentPostCount: recentPosts.length,
      includesSample: hasSample,
    };
  }, [posts, maxItems]);

  return (
    <section
      aria-label="Trending on Inztagram"
      className="rounded-2xl bg-white dark:bg-[#18131D] border border-[#E5DCE9] dark:border-[#2E2436] p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-sm font-bold text-[#39243B] dark:text-[#F6EFF8] flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#A74695] dark:text-[#FF64AE] shrink-0" aria-hidden="true" />
            <span>Trending on Inztagram</span>
          </h2>
          <p className="text-[11px] text-[#68556B] dark:text-[#B7A6BD] mt-0.5">
            {mode === 'demo'
              ? `Demo trends · Last 24h (${recentPostCount} local ${recentPostCount === 1 ? 'post' : 'posts'})`
              : `Last 24h from in-app posts${includesSample ? ' (includes sample posts)' : ''}`}
          </p>
        </div>
      </div>

      {trends.length === 0 ? (
        <div className="rounded-xl bg-[#FAF8FC] dark:bg-[#231C29] border border-[#E5DCE9] dark:border-[#2E2436] p-3.5 text-center space-y-2">
          <p className="text-xs text-[#68556B] dark:text-[#B7A6BD]">
            No hashtags posted in the last 24 hours.
          </p>
          <button
            type="button"
            onClick={() => openCreateModal('post')}
            className="min-h-[34px] px-3 rounded-lg bg-[#39243B] dark:bg-[#FF64AE] text-white dark:text-[#111111] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#4E3351] dark:hover:bg-[#ff7abb]"
          >
            <PlusSquare className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Create your first post</span>
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {trends.map((item, idx) => (
            <button
              key={item.tag}
              type="button"
              onClick={() => openExploreWithTag(item.tag)}
              className="w-full min-h-[38px] px-2.5 py-1.5 rounded-xl hover:bg-[#F8F5FA] dark:hover:bg-[#231C29] flex items-center justify-between gap-2 text-left transition-colors group"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] font-semibold text-[#8E7B91] tabular-nums w-4 shrink-0">
                  {idx + 1}.
                </span>
                <Hash className="w-3.5 h-3.5 text-[#A74695] dark:text-[#FF64AE] shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold text-[#39243B] dark:text-[#F6EFF8] group-hover:text-[#A74695] dark:group-hover:text-[#FF64AE] truncate">
                  {item.tag}
                </span>
              </span>
              <span className="text-[11px] text-[#68556B] dark:text-[#B7A6BD] tabular-nums shrink-0">
                {item.count} {item.count === 1 ? 'post' : 'posts'}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
