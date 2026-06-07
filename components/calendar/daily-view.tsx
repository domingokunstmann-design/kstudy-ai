import { cn } from '@/lib/utils'
import { TASK_TYPE_CONFIG } from '@/types'
import type { Task } from '@/types'

interface StudySession {
  id: string
  label: string
  start_time: string
  end_time: string
  duration_minutes: number
  completed: boolean
}

interface SchoolPeriod {
  subject: string | null
  period_type: string
  start_time: string
  end_time: string
}

interface Routine {
  name: string
  start_time: string
  end_time: string
  color: string
}

interface DailyViewProps {
  tasks: Task[]
  sessions: StudySession[]
  periods: SchoolPeriod[]
  routines: Routine[]
  date: Date
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7) // 7am - 23pm

function timeToPercent(time: string, startHour = 7, totalHours = 17): number {
  const [h, m] = time.split(':').map(Number)
  return ((h - startHour) * 60 + m) / (totalHours * 60) * 100
}

function durationToPercent(start: string, end: string, totalHours = 17): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  return Math.max(mins / (totalHours * 60) * 100, 1.5)
}

const PERIOD_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  class:  { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', text: '#a5b4fc' },
  break:  { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#fcd34d' },
  lunch:  { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#6ee7b7' },
  pe:     { bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.3)',  text: '#fda4af' },
  free:   { bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)', text: '#94a3b8' },
}

const ROUTINE_BG: Record<string, string> = {
  indigo: 'rgba(99,102,241,0.15)',
  violet: 'rgba(139,92,246,0.15)',
  emerald: 'rgba(16,185,129,0.15)',
  amber: 'rgba(245,158,11,0.15)',
  rose: 'rgba(244,63,94,0.15)',
  sky: 'rgba(14,165,233,0.15)',
}

export function DailyView({ tasks, sessions, periods, routines, date }: DailyViewProps) {
  const TOTAL_HOURS = 17
  const CELL_HEIGHT = 64 // px per hour

  return (
    <div className="section-card overflow-hidden">
      <div className="flex">
        {/* Hour labels */}
        <div className="flex-shrink-0 w-14 pt-0">
          {HOURS.map(hour => (
            <div key={hour} className="flex items-start justify-end pr-3"
              style={{ height: CELL_HEIGHT }}>
              <span className="text-[10px] font-medium text-white/20 -mt-2">
                {hour}:00
              </span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="flex-1 relative border-l" style={{ borderColor: 'rgba(255,255,255,0.06)', minHeight: CELL_HEIGHT * TOTAL_HOURS }}>
          {/* Hour gridlines */}
          {HOURS.map(hour => (
            <div key={hour} className="absolute w-full border-t"
              style={{
                top: (hour - 7) * CELL_HEIGHT,
                borderColor: 'rgba(255,255,255,0.04)',
              }} />
          ))}

          {/* Current time indicator */}
          {(() => {
            const now = new Date()
            const isToday = date.toDateString() === now.toDateString()
            if (!isToday) return null
            const pct = timeToPercent(`${now.getHours()}:${now.getMinutes()}`)
            if (pct < 0 || pct > 100) return null
            return (
              <div className="absolute w-full flex items-center z-20"
                style={{ top: `${pct}%` }}>
                <div className="w-2 h-2 rounded-full bg-red-400 -ml-1 flex-shrink-0" />
                <div className="flex-1 h-px bg-red-400/60" />
              </div>
            )
          })()}

          {/* School periods */}
          {periods.map((period, i) => {
            const top = timeToPercent(period.start_time.slice(0,5))
            const height = durationToPercent(period.start_time.slice(0,5), period.end_time.slice(0,5))
            const colors = PERIOD_COLORS[period.period_type] ?? PERIOD_COLORS.class
            return (
              <div key={i} className="absolute left-1 right-1 rounded-lg px-2 py-1 overflow-hidden z-10"
                style={{
                  top: `${top}%`,
                  height: `${height}%`,
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                }}>
                <p className="text-[10px] font-semibold truncate" style={{ color: colors.text }}>
                  {period.subject ?? period.period_type === 'break' ? '☕ Recreo' : period.period_type === 'lunch' ? '🍽️ Almuerzo' : period.period_type}
                </p>
                <p className="text-[9px] opacity-60" style={{ color: colors.text }}>
                  {period.start_time.slice(0,5)} – {period.end_time.slice(0,5)}
                </p>
              </div>
            )
          })}

          {/* Routines */}
          {routines.map((routine, i) => {
            const top = timeToPercent(routine.start_time.slice(0,5))
            const height = durationToPercent(routine.start_time.slice(0,5), routine.end_time.slice(0,5))
            const bg = ROUTINE_BG[routine.color] ?? ROUTINE_BG.indigo
            return (
              <div key={i} className="absolute rounded-lg px-2 py-1 overflow-hidden z-10"
                style={{
                  top: `${top}%`,
                  height: `${height}%`,
                  left: '33%', right: '1px',
                  background: bg,
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                <p className="text-[10px] font-semibold text-white/70 truncate">{routine.name}</p>
              </div>
            )
          })}

          {/* Study sessions */}
          {sessions.map(session => {
            const top = timeToPercent(session.start_time.slice(0,5))
            const height = durationToPercent(session.start_time.slice(0,5), session.end_time.slice(0,5))
            return (
              <div key={session.id}
                className="absolute rounded-lg px-2 py-1 overflow-hidden z-15"
                style={{
                  top: `${top}%`,
                  height: `${height}%`,
                  left: '1px', right: '33%',
                  background: session.completed ? 'rgba(100,116,139,0.1)' : 'rgba(99,102,241,0.18)',
                  border: `1px solid ${session.completed ? 'rgba(100,116,139,0.2)' : 'rgba(99,102,241,0.35)'}`,
                  opacity: session.completed ? 0.6 : 1,
                }}>
                <p className="text-[10px] font-semibold text-indigo-300 truncate">
                  {session.completed ? '✓ ' : '📖 '}{session.label}
                </p>
                <p className="text-[9px] text-indigo-400/60">
                  {session.start_time.slice(0,5)} · {session.duration_minutes}min
                </p>
              </div>
            )
          })}

          {/* Tasks due today */}
          {tasks.map(task => {
            const config = TASK_TYPE_CONFIG[task.type]
            return (
              <div key={task.id} className="absolute right-1 flex items-center gap-1.5 px-2 py-1 rounded-lg z-20"
                style={{
                  top: `${timeToPercent('09:00')}%`,
                  background: 'rgba(244,63,94,0.15)',
                  border: '1px solid rgba(244,63,94,0.3)',
                  left: 'auto', width: 'auto', maxWidth: '45%',
                }}>
                <span className="text-[9px] font-bold text-rose-400">HOY</span>
                <span className="text-[10px] text-rose-300 truncate">{task.title}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
