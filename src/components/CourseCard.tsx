import Link from 'next/link'
import { ArrowRight, LucideIcon } from 'lucide-react'

interface CourseCardProps {
  id: string | number
  title: string
  description: string
  price: number
  thumbnail_url?: string | null
  Icon?: LucideIcon
  category?: string
}

export default function CourseCard({ 
  id, 
  title, 
  description, 
  price, 
  thumbnail_url,
  Icon,
  category 
}: CourseCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
      {/* Icon or Image Header */}
      <div className="h-48 bg-white flex items-center justify-center relative overflow-hidden">
        {thumbnail_url ? (
          <img 
            src={thumbnail_url} 
            alt={title}
            className="w-full h-full object-contain p-4"
          />
        ) : Icon ? (
          <Icon className="h-16 w-16 text-white" />
        ) : (
          <div className="h-16 w-16 text-white text-4xl font-bold">
            {title.charAt(0)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      
      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-[#1a5744] mb-3 group-hover:text-[#2d7a5f] transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-2">
          {description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-[#2d7a5f]">
            ${price}
          </span>
          <Link 
            href={`/courses/${id}`} 
            className="text-[#2d7a5f] font-medium group-hover:underline flex items-center"
          >
            Ver más
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
