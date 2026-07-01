// Inline brand SVGs from the Learnable design system.
// Geometry (logo path, seal check) is reproduced exactly from the spec.

export function LogoMark({ size = 30, className = '', gradientId = 'lb-logo' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Learnable"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="96" height="96" rx="29" fill={`url(#${gradientId})`} />
      <path
        d="M37 26 L37 62 L51 74 L77 38"
        fill="none"
        stroke="#fff"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Wordmark({ children = 'Learnable', className = '' }) {
  return (
    <span
      className={`font-display font-extrabold tracking-[-0.02em] text-ink-navy ${className}`}
    >
      {children}
    </span>
  )
}

export function Logo({ size = 30, wordmarkClass = 'text-xl', className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <Wordmark className={wordmarkClass} />
    </div>
  )
}

export function GoldSeal({ size = 56, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Gold credential seal"
    >
      <circle cx="50" cy="50" r="48" fill="#F4B740" />
      <path
        d="M30 50 L45 65 L72 32"
        fill="none"
        stroke="#0B1F3A"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
