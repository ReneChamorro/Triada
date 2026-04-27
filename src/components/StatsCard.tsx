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
  bgColor = 'bg-[#a4c639]',
  linkText,
  linkHref,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border-l-4 border-[#a4c639] shadow-sm hover:shadow-md card-hover transition-all flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{title}</p>
      <p className="text-3xl font-extrabold text-[#2d7a5f] truncate">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>}
      {linkText && linkHref && (
        <Link
          href={linkHref}
          className="mt-4 self-start inline-block bg-[#2d7a5f] hover:bg-[#a4c639] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          {linkText}
        </Link>
      )}
    </div>
  )
}
