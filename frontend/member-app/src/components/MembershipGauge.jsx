// Animated SVG ring gauge for membership days-left visualization
export default function MembershipGauge({ daysLeft, totalDays }) {
  const safeDaysLeft = daysLeft ?? 0
  const safeTotalDays = totalDays ?? 30
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const progress = safeTotalDays > 0 ? Math.max(0, Math.min(1, safeDaysLeft / safeTotalDays)) : 0
  const offset = circumference * (1 - progress)

  const color =
    progress > 0.5 ? '#4CAF50' :
    progress > 0.2 ? '#FF5722' :
    '#F44336'

  return (
    <div className="relative w-48 h-48">
      <svg
        className="w-full h-full transform -rotate-90"
        viewBox="0 0 100 100"
        aria-label={`${safeDaysLeft} of ${safeTotalDays} days remaining`}
      >
        {/* Track */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="#2c1c17"
          strokeWidth="8"
        />
        {/* Progress */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="gauge-ring"
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-lexend font-bold text-[32px] leading-none text-on-surface">{safeDaysLeft}</span>
        <span className="font-inter font-bold text-[11px] tracking-widest text-on-surface-variant uppercase mt-1">Days Left</span>
      </div>
    </div>
  )
}
