import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  icon: LucideIcon
  title: string
  value: string | number
  subtitle?: string
  bgColor?: string
}

export default function StatsCard({ 
  icon: Icon, 
  title, 
  value, 
  subtitle,
  bgColor = 'bg-[#a4c639]'
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
      <div className={`w-16 h-16 ${bgColor} rounded-xl mb-6 flex items-center justify-center`}>
        <Icon className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-xl font-bold text-[#1a5744] mb-2">{title}</h3>
      <p className="text-4xl font-bold text-[#2d7a5f]">{value}</p>
      {subtitle && <p className="text-sm text-gray-600 mt-2">{subtitle}</p>}
    </div>
  )
}
