import React, { useId } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 24 }) => {
  const gradId = `logo_grad_${useId().replace(/:/g, '')}`;

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(129,140,248,0.4)]"
      >
        {/* Background Chat Bubble - More proportional curve */}
        <path 
          d="M21 11C21 15.4183 17.4183 19 13 19C11.8322 19 10.7302 18.7497 9.74238 18.299L5 20L6.61367 15.654C5.58988 14.3722 5 12.757 5 11C5 6.58172 8.58172 3 13 3C17.4183 3 21 6.58172 21 11Z" 
          stroke={`url(#${gradId})`}
          strokeWidth="2.2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        {/* Store Icon - Larger & More centered */}
        <path 
          d="M8.5 12.5L13 9L17.5 12.5V16.5H8.5V12.5Z" 
          stroke={`url(#${gradId})`}
          strokeWidth="1.8" 
          strokeLinejoin="round"
        />
        <path 
          d="M8 12.5H18" 
          stroke={`url(#${gradId})`}
          strokeWidth="1.8" 
          strokeLinecap="round"
        />
        <path 
          d="M11.5 16.5V14.5H14.5V16.5" 
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
        />
        
        {/* Sparkle - Properly scaled */}
        <path 
          d="M13 5.5L13.4 6.6L14.5 7L13.4 7.4L13 8.5L12.6 7.4L11.5 7L12.6 6.6L13 5.5Z" 
          fill="white" 
          className="animate-pulse"
        />

        <defs>
          <linearGradient id={gradId} x1="5" y1="3" x2="21" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#818cf8" />
            <stop offset="1" stopColor="#c084fc" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default Logo;
