interface CourseProgressBarProps {
  percentage: number
  variant?: 'dark' | 'light'
}

export default function CourseProgressBar({ percentage, variant = 'light' }: CourseProgressBarProps) {
  const isDark = variant === 'dark'

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className={isDark ? 'text-white/90' : 'text-[#1a5744]/80'}>Progreso</span>
        <span className={`font-bold ${isDark ? 'text-[#a4c639]' : 'text-[#1a5744]'}`}>{percentage}%</span>
      </div>
      <div role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso del curso" className={`w-full rounded-full h-1.5 ${isDark ? 'bg-white/20' : 'bg-[#e8e4d0]'}`}>
        <div
          className={`h-1.5 rounded-full ${isDark ? 'bg-[#a4c639]' : 'bg-[#2d7a5f]'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
