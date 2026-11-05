import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  icon: LucideIcon
  title: string
  value: string | number
  subtitle?: string
  bgColor?: string
  linkText?: string
  linkHref?: string
}

export default function StatsCard({
  icon: Icon,
  title,
  value,
  subtitle,
  bgColor = 'bg-[#1a5744]',
  linkText,
  linkHref,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-[1.5rem] p-6 border border-[#e8e4d0] flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
          <Icon className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-[#1a5744]/80 mb-1">{title}</p>
      <p className="text-3xl font-bold text-[#1a5744] truncate">{value}</p>
      {subtitle && <p className="text-xs text-[#1a5744]/80 mt-1 truncate">{subtitle}</p>}
      {linkText && linkHref && (
        <Link
          href={linkHref}
          className="mt-4 self-start inline-flex items-center min-h-11 bg-[#1a5744] hover:bg-[#2d7a5f] text-white text-xs font-semibold px-4 rounded-lg active:scale-[0.97] [transition:transform_150ms_var(--ease-out),background-color_300ms_var(--ease-brand)]"
        >
          {linkText}
        </Link>
      )}
    </div>
  )
}
