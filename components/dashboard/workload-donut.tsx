'use client'

interface SubjectLoad {
  name: string
  count: number
  color: string
}

interface WorkloadDonutProps {
  data: SubjectLoad[]
  total: number
}

const PIE_COLORS = [
  '#7c6af7', '#a78bfa', '#60a5fa', '#34d399', '#f59e0b',
  '#f87171', '#e879f9', '#22d3ee', '#fb923c', '#a3e635',
]

export function WorkloadDonut({ data, total }: WorkloadDonutProps) {
  if (total === 0 || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="text-sm text-white/40">Sin tareas pendientes</p>
      </div>
    )
  }

  // Build donut arcs
  const radius = 56
  const cx = 70, cy = 70
  const circumference = 2 * Math.PI * radius
  const gap = 4 // gap between segments in px

  let cumulativeAngle = -90 // start at top
  const segments = data.map((item, i) => {
    const pct    = item.count / total
    const angle  = pct * 360
    const color  = PIE_COLORS[i % PIE_COLORS.length]

    // Arc path
    const startRad = (cumulativeAngle * Math.PI) / 180
    const endRad   = ((cumulativeAngle + angle) * Math.PI) / 180
    const largeArc = angle > 180 ? 1 : 0

    const x1 = cx + radius * Math.cos(startRad)
    const y1 = cy + radius * Math.sin(startRad)
    const x2 = cx + radius * Math.cos(endRad)
    const y2 = cy + radius * Math.sin(endRad)

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
    ].join(' ')

    cumulativeAngle += angle
    return { pathData, color, item, pct }
  })

  return (
    <div className="flex items-center gap-4">
      {/* Donut SVG */}
      <div className="flex-shrink-0 relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Background ring */}
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
          {/* Segments */}
          {segments.map(({ pathData, color, item, pct }, i) => (
            <path
              key={i}
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth="16"
              strokeLinecap="round"
              opacity={0.85}
            />
          ))}
          {/* Center text */}
          <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="inherit">
            {total}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="inherit">
            tareas
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2 min-w-0">
        {data.slice(0, 6).map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
            />
            <span className="text-[11px] text-white/60 truncate flex-1">{item.name}</span>
            <span className="text-[11px] font-bold text-white/80 flex-shrink-0">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
