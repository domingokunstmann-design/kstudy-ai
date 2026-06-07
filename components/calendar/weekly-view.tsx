import { cn } from '@/lib/utils'
import { TASK_TYPE_CONFIG } from '@/types'
import type { Task } from '@/types'
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns'
import { es } from 'date-fns/locale'

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
  day_of_week: number
}

interface WeeklyViewProps {
  tasks: Task[]
  sessions: StudySession[]
  periods: SchoolPeriod[]
  date: Date
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7:00 – 21:00
const TOTAL_HOURS = 15
const CELL_HEIGHT = 48 // px por hora

function timeToPercent(time: string): number {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  return ((h - 7) * 60 + m) / (TOTAL_HOURS * 60) * 100
}

function durationToPercent(start: string, end: string): number {
  const [sh, sm] = start.slice(0, 5).split(':').map(Number)
  const [eh, em] = end.slice(0, 5).split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  return Math.max(mins / (TOTAL_HOURS * 60) * 100, 1)
}

const PERIOD_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  class:  { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', text: '#a5b4fc' },
  break:  { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#fcd34d' },
  lunch:  { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#6ee7b7' },
  pe:     { bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.3)',  text: '#fda4af' },
  free:   { bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)', text: '#94a3b8' },
}

export function WeeklyView({ tasks, sessions, periods, date }: WeeklyViewProps) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getTasksForDay = (day: Date) =>
    tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), day))

  const getSessionsForDay = (day: Date) => {
    const dow = ((day.getDay() + 6) % 7) + 1 // lun=1 … dom=7
    return sessions.filter(s => {
      const sessionDate = new Date(s.start_time)
      return isSameDay(sessionDate, day)
    })
  }

  const getPeriodsForDay = (day: Date) => {
    const dow = (day.getDay() + 6) % 7 + 1 // lun=1
    return periods.filter(p => p.day_of_week === dow)
  }

  return (
    <div className="section-card overflow-hidden">
      <div className="flex">
        {/* Columna de horas */}
        <div className="flex-shrink-0 w-12">
          {/* Header vacío alineado con días */}
          <div style={{ height: 40 }} />
          {HOURS.map(h => (
            <div key={h} className="flex items-start justify-end pr-2"
              style={{ height: CELL_HEIGHT }}>
              <span className="text-[9px] font-medium text-white/20 -mt-2">{h}:00</span>
            </div>
          ))}
        </div>

        {/* 7 columnas de días */}
        <div className="flex-1 grid grid-cols-7 border-l" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {weekDays.map((day, colIdx) => {
            const today = isToday(day)
            const dayTasks = getTasksForDay(day)
            const daySessions = getSessionsForDay(day)
            const dayPeriods = getPeriodsForDay(day)
            const isWeekend = colIdx >= 5

            return (
              <div key={day.toISOString()}
                className="flex flex-col border-r"
                style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {/* Header del día */}
                <div className={cn(
                  'flex flex-col items-center justify-center py-2 border-b',
                  isWeekend ? 'opacity-50' : ''
                )}
                  style={{ height: 40, borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-[9px] font-medium text-white/30 uppercase tracking-wide">
                    {format(day, 'EEE', { locale: es })}
                  </span>
                  <span className={cn(
                    'text-sm font-bold mt-0.5',
                    today ? 'text-indigo-400' : 'text-white/60'
                  )}>
                    {format(day, 'd')}
                  </span>
                  {today && <div className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" />}
                </div>

                {/* Timeline */}
                <div className="relative"
                  style={{ height: CELL_HEIGHT * TOTAL_HOURS, background: isWeekend ? 'rgba(0,0,0,0.1)' : 'transparent' }}>
                  {/* Gridlines */}
                  {HOURS.map(h => (
                    <div key={h} className="absolute w-full border-t"
                      style={{ top: (h - 7) * CELL_HEIGHT, borderColor: 'rgba(255,255,255,0.04)' }} />
                  ))}

                  {/* Current time */}
                  {today && (() => {
                    const now = new Date()
                    const pct = timeToPercent(`${now.getHours()}:${now.getMinutes()}`)
                    if (pct < 0 || pct > 100) return null
                    return (
                      <div className="absolute w-full z-20" style={{ top: `${pct}%` }}>
                        <div className="w-full h-px bg-red-400/60" />
                      </div>
                    )
                  })()}

                  {/* School periods */}
                  {dayPeriods.map((period, i) => {
                    const top = timeToPercent(period.start_time)
                    const height = durationToPercent(period.start_time, period.end_time)
                    const colors = PERIOD_COLORS[period.period_type] ?? PERIOD_COLORS.class
                    return (
                      <div key={i} className="absolute inset-x-0.5 rounded px-1 py-0.5 overflow-hidden z-10"
                        style={{
                          top: `${top}%`,
                          height: `${height}%`,
                          background: colors.bg,
                          border: `1px solid ${colors.border}`,
                        }}>
                        <p className="text-[8px] font-semibold truncate leading-tight" style={{ color: colors.text }}>
                          {period.subject ?? (period.period_type === 'break' ? 'Recreo' : period.period_type === 'lunch' ? 'Almuerzo' : period.period_type)}
                        </p>
                      </div>
                    )
                  })}

                  {/* Study sessions */}
                  {daySessions.map(session => {
                    const top = timeToPercent(session.start_time)
                    const height = durationToPercent(session.start_time, session.end_time)
                    return (
                      <div key={session.id} className="absolute inset-x-0.5 rounded px-1 py-0.5 overflow-hidden z-15"
                        style={{
                          top: `${top}%`,
                          height: `${height}%`,
                          background: session.completed ? 'rgba(100,116,139,0.1)' : 'rgba(99,102,241,0.18)',
                          border: `1px solid ${session.completed ? 'rgba(100,116,139,0.2)' : 'rgba(99,102,241,0.35)'}`,
                        }}>
                        <p className="text-[8px] font-semibold text-indigo-300 truncate leading-tight">
                          {session.completed ? '✓ ' : '📖 '}{session.label}
                        </p>
                      </div>
                    )
                  })}

                  {/* Tasks due */}
                  {dayTasks.map((task, i) => {
                    const config = TASK_TYPE_CONFIG[task.type]
                    return (
                      <div key={task.id} className="absolute inset-x-0.5 rounded px-1 py-0.5 overflow-hidden z-20"
                        style={{
                          top: `${8 + i * 4}%`,
                          background: 'rgba(244,63,94,0.12)',
                          border: '1px solid rgba(244,63,94,0.3)',
                        }}>
                        <p className="text-[8px] font-semibold text-rose-300 truncate leading-tight">
                          ⚑ {task.title}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
