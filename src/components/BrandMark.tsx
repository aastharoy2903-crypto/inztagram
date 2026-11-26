import React from 'react';

interface BrandMarkProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  size = 28,
  showWordmark = false,
  className = '',
}) => {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="2"
          y="2"
          width="32"
          height="32"
          rx="10"
          fill="#FFFFFF"
          stroke="#39243B"
          strokeWidth="2.2"
        />
        <path
          d="M18 8.5C15.8 8.5 14 10.7 14 13.5C14 14.3 14.15 15.05 14.4 15.7C11.9 15.3 9.5 16.9 9.1 19.2C8.7 21.5 10.5 23.6 13.1 24C14.1 24.15 15.05 24 15.85 23.65C15.9 25.95 16.85 27.6 18 27.6C19.15 27.6 20.1 25.95 20.15 23.65C20.95 24 21.9 24.15 22.9 24C25.5 23.6 27.3 21.5 26.9 19.2C26.5 16.9 24.1 15.3 21.6 15.7C21.85 15.05 22 14.3 22 13.5C22 10.7 20.2 8.5 18 8.5Z"
          fill="#F5E6F3"
          stroke="#39243B"
          strokeWidth="1.5"
        />
        <circle cx="15.2" cy="14.8" r="3.4" fill="#D57FC4" opacity="0.85" />
        <circle cx="20.8" cy="15.2" r="3.4" fill="#B8D7FF" opacity="0.9" />
        <circle cx="18" cy="18.2" r="3.2" fill="#FFFFFF" stroke="#39243B" strokeWidth="1.6" />
        <circle cx="26.5" cy="9.5" r="1.7" fill="#39243B" />
      </svg>
      {showWordmark && (
        <span className="font-display text-lg font-bold tracking-tight text-[#39243B] whitespace-nowrap shrink-0">
          Inztagram
        </span>
      )}
    </span>
  );
};
