import React from 'react';

export default function Logo({ size = 'default', light = false }) {
  const containerSizes = {
    sm: 'w-7 h-7 rounded-lg',
    default: 'w-9 h-9 rounded-xl',
    lg: 'w-11 h-11 rounded-2xl',
  };

  const svgSizes = {
    sm: 'w-4 h-4',
    default: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const textSizes = {
    sm: 'text-lg',
    default: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-2.5 select-none group">
      {/* Container with website Emerald-Teal theme gradient */}
      <div
        className={`${containerSizes[size] || containerSizes.default} bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0 transition-transform duration-200 group-hover:scale-105`}
      >
        {/* Same exact icon as Favicon: Circle Dollar Sign with stroke */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${svgSizes[size] || svgSizes.default} text-white`}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
          <path d="M12 18V6" />
        </svg>
      </div>

      <span
        className={`${textSizes[size] || textSizes.default} font-black tracking-tight ${
          light ? 'text-white' : 'text-slate-900'
        }`}
      >
        Finance<span className="text-emerald-500">X</span>
      </span>
    </div>
  );
}
