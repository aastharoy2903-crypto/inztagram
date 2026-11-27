import React from 'react';

interface BrandMarkProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  variant?: 'auto' | 'light' | 'dark';
}

export const LOGO_ASSET_PATH = '/assets/aistudio/image_25e96cc2.png';

export const BrandMark: React.FC<BrandMarkProps> = ({
  size = 28,
  showWordmark = false,
  className = '',
  variant = 'auto',
}) => {
  const radius = Math.max(6, Math.round(size * 0.25));

  const renderCroppedLogo = (mode: 'light' | 'dark', extraClass = '') => (
    <span
      className={`relative inline-block overflow-hidden shrink-0 border ${
        mode === 'dark'
          ? 'bg-[#111111] border-[#2E2436]'
          : 'bg-white border-[#E5DCE9]'
      } ${extraClass}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
      }}
      aria-hidden="true"
    >
      <img
        src={LOGO_ASSET_PATH}
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          height: '188%',
          width: 'auto',
          maxWidth: 'none',
          transform:
            mode === 'dark'
              ? 'translate(-75.2%, -50%)'
              : 'translate(-24.8%, -50%)',
        }}
      />
    </span>
  );

  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {variant === 'auto' ? (
        <>
          {renderCroppedLogo('light', 'dark:hidden')}
          {renderCroppedLogo('dark', 'hidden dark:inline-block')}
        </>
      ) : (
        renderCroppedLogo(variant)
      )}
      {showWordmark && (
        <span className="font-display text-lg font-bold tracking-tight text-[#39243B] dark:text-[#F6EFF8] whitespace-nowrap shrink-0">
          Inztagram
        </span>
      )}
    </span>
  );
};
