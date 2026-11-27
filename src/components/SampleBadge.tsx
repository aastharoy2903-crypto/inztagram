import React from 'react';

interface SampleBadgeProps {
  label?: string;
  compact?: boolean;
  dark?: boolean;
}

export const SampleBadge: React.FC<SampleBadgeProps> = ({
  label = 'Sample',
  compact = false,
  dark = false,
}) => {
  return (
    <span
      title="Sample portfolio content — not created by a live app user"
      className={`inline-flex items-center rounded-md font-semibold uppercase tracking-wide shrink-0 ${
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-1.5 py-0.5 text-[10px]'
      } ${
        dark
          ? 'bg-white/15 text-white border border-white/25'
          : 'bg-[#F3EEF7] dark:bg-[#2A2031] text-[#68556B] dark:text-[#C5B3CC] border border-[#E5DCE9] dark:border-[#3B2E45]'
      }`}
    >
      {label}
    </span>
  );
};
