'use client'

import { Star } from 'lucide-react'

interface Props {
  value: number
  /** When provided the stars are interactive. */
  onChange?: (value: number) => void
  size?: 'sm' | 'md'
  label?: string
}

export default function StarRating({ value, onChange, size = 'md', label = 'Calificación' }: Props) {
  const iconClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'

  if (!onChange) {
    return (
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} de 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            aria-hidden="true"
            className={`${iconClass} ${n <= Math.round(value) ? 'text-[#a4c639] fill-[#a4c639]' : 'text-[#e8e4d0] fill-[#e8e4d0]'}`}
          />
        ))}
      </span>
    )
  }

  return (
    <div role="radiogroup" aria-label={label} className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} de 5`}
          onClick={() => onChange(value === n ? 0 : n)}
          className="p-0.5 rounded focus-visible:outline-2 focus-visible:outline-[#a4c639] active:scale-[0.92] [transition:transform_150ms_var(--ease-out)]"
        >
          <Star
            aria-hidden="true"
            className={`${iconClass} ${n <= value ? 'text-[#a4c639] fill-[#a4c639]' : 'text-[#e8e4d0] fill-[#e8e4d0]'}`}
          />
        </button>
      ))}
    </div>
  )
}
