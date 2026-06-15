import type { CSSProperties } from 'react'

type MotifVariant = 'growth' | 'balance' | 'network'

interface BrandMotifProps {
  variant?: MotifVariant
  className?: string
  style?: CSSProperties
}

/**
 * Abstract line-art evoking psychology themes — growth, balance, connection —
 * without being literal. Uses `currentColor` for the stroke so callers control
 * the tone via text color (keep it within the locked brand palette) and opacity.
 * Decorative only: pointer-events-none, aria-hidden.
 */
export default function BrandMotif({
  variant = 'growth',
  className = '',
  style,
}: BrandMotifProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
      style={style}
    >
      {variant === 'growth' && (
        // Branching growth — a stem dividing into thought-paths
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M100 190 L100 110" />
          <path d="M100 110 C100 80, 70 78, 58 56" />
          <path d="M100 110 C100 80, 130 78, 142 56" />
          <path d="M100 140 C100 124, 80 122, 70 104" />
          <path d="M100 140 C100 124, 120 122, 130 104" />
          <circle cx="58" cy="56" r="6" />
          <circle cx="142" cy="56" r="6" />
          <circle cx="70" cy="104" r="4.5" />
          <circle cx="130" cy="104" r="4.5" />
          <circle cx="100" cy="40" r="8" />
          <path d="M100 110 L100 48" />
        </g>
      )}

      {variant === 'balance' && (
        // Concentric equilibrium — calm, centered arcs
        <g stroke="currentColor" strokeWidth="1.5" fill="none">
          <circle cx="100" cy="100" r="20" />
          <circle cx="100" cy="100" r="44" strokeDasharray="3 8" />
          <circle cx="100" cy="100" r="70" strokeDasharray="3 10" />
          <path d="M100 30 L100 170" strokeWidth="1" opacity="0.6" />
          <path d="M30 100 L170 100" strokeWidth="1" opacity="0.6" />
          <circle cx="100" cy="56" r="3.5" fill="currentColor" stroke="none" />
          <circle cx="144" cy="100" r="3.5" fill="currentColor" stroke="none" />
        </g>
      )}

      {variant === 'network' && (
        // Connected nodes — relationship / interconnection
        <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
          <path d="M40 60 L100 40 L160 70 M100 40 L90 110 M160 70 L150 140 M40 60 L60 130 M90 110 L150 140 M60 130 L90 110 M60 130 L150 140" />
          <circle cx="40" cy="60" r="5" fill="currentColor" stroke="none" />
          <circle cx="100" cy="40" r="6.5" fill="currentColor" stroke="none" />
          <circle cx="160" cy="70" r="5" fill="currentColor" stroke="none" />
          <circle cx="90" cy="110" r="5.5" fill="currentColor" stroke="none" />
          <circle cx="150" cy="140" r="5" fill="currentColor" stroke="none" />
          <circle cx="60" cy="130" r="4.5" fill="currentColor" stroke="none" />
        </g>
      )}
    </svg>
  )
}
