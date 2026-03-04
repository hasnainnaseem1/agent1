import React from 'react';

/**
 * Sellsera Logo — Icon mark + optional wordmark.
 *
 * The icon is a stylised "S" stroke inside a purple rounded square,
 * rendered as inline SVG so it scales crisply at any size.
 *
 * Props
 * ─────
 * size      — icon width/height in px  (default 32)
 * showText  — render "Sellsera" next to the mark  (default true)
 * darkBg    — flip text to white for dark surfaces  (default false)
 * className — extra classes for the outer wrapper
 */
const SellseraLogo = ({ size = 32, showText = true, darkBg = false, className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 flex-shrink-0 ${className}`}>
    {/* ── Icon mark ─────────────────────────────────────────────── */}
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
      role="img"
      aria-label="Sellsera"
    >
      {/* Purple rounded-square background */}
      <rect width="40" height="40" rx="10" fill="#7c3aed" />

      {/* Stylised "S" – thick, rounded caps, well-centred */}
      <path
        d="M25 12.5
           C23.5 10.5 21.5 8.5 18.5 8.5
           C14.5 8.5 12 10.8 12 13.5
           C12 17 14.8 18.2 18.5 19.5
           C22.2 20.8 26 22 26 26
           C26 29.2 23.2 31.5 19 31.5
           C15.8 31.5 13.2 29.2 12 28"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Small accent spark — adds a premium touch */}
      <circle cx="28" cy="9" r="2" fill="white" opacity="0.55" />
    </svg>

    {/* ── Wordmark ─────────────────────────────────────────────── */}
    {showText && (
      <span
        className={`text-lg font-bold tracking-tight leading-none ${
          darkBg ? 'text-white' : 'text-gray-900'
        }`}
      >
        Sellsera
      </span>
    )}
  </span>
);

export default SellseraLogo;
