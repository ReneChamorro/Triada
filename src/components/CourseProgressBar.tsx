interface CourseProgressBarProps {
  percentage: number
  variant?: 'dark' | 'light'
}

export default function CourseProgressBar({ percentage, variant = 'light' }: CourseProgressBarProps) {
  const isDark = variant === 'dark'

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className={isDark ? 'text-white/60' : 'text-gray-400'}>Progreso</span>
        <span className="font-bold text-[#a4c639]">{percentage}%</span>
      </div>
      <div className={`w-full rounded-full h-1.5 ${isDark ? 'bg-white/20' : 'bg-gray-100'}`}>
        <div
          className="bg-[#a4c639] h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
