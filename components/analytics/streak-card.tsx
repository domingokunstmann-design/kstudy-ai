'use client'

import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  currentStreak: number
  longestStreak: number
  // últimos 28 días: true = estudió, false = no
  activityGrid: boolean[]
}

export function StreakCard({ currentStreak, longestStreak, activityGrid }: Props) {
  // últimas 4 semanas (28 días), de más antiguo a más reciente
  const weeks: boolean[][] = []
  for (let w = 0; w < 4; w++) {
    weeks.push(activityGrid.slice(w * 7, w * 7 + 7))
  }

  return (
    <div className="space-y-5">
      {/* Números */}
      <div className="flex items-center gap-8">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span
              className="text-4xl font-bold tracking-tight"
              style={{ color: currentStreak > 0 ? '#fb923c' : '#4e4e66' }}
            >
              {currentStreak}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: '#9191a8' }}>
            Racha actual
          </p>
        </div>

        <div
          className="w-px h-10 rounded-full"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        />

        <div>
          <span
            className="text-4xl font-bold tracking-tight"
            style={{ color: '#c4bcff' }}
          >
            {longestStreak}
          </span>
          <p className="text-xs mt-1" style={{ color: '#9191a8' }}>
            Racha más larga
          </p>
        </div>
      </div>

      {/* Heatmap 4 semanas */}
      <div>
        <p className="text-[10.5px] font-medium mb-2" style={{ color: '#4e4e66' }}>
          Últimas 4 semanas
        </p>
        <div className="flex gap-1.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1.5">
              {week.map((active, di) => (
                <div
                  key={di}
                  title={active ? 'Sesión completada' : 'Sin estudio'}
                  className="w-6 h-6 rounded-[5px] transition-all"
                  style={{
                    background: active
                      ? 'rgba(124,106,247,0.7)'
                      : 'rgba(255,255,255,0.05)',
                    border: active
                      ? '1px solid rgba(124,106,247,0.4)'
                      : '1px solid rgba(255,255,255,0.04)',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mt-1.5">
          {['L','M','X','J','V','S','D'].map(d => (
            <div
              key={d}
              className="w-6 text-center text-[9px] font-medium"
              style={{ color: '#4e4e66' }}
            >
              {d}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
