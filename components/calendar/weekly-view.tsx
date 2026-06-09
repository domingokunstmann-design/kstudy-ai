'use client'

import { cn } from '@/lib/utils'
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
  color?: string | null
}

interface Routine {
  name: string
  start_time: string
  end_time: string
  color: string
  day_of_week: number
}

interface WeeklyViewProps {
  tasks: Task[]
  sessions: StudySession[]
  periods: SchoolPeriod[]
  routines: Routine[]
  date: Date
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7:00 – 21:00
const TOTAL_HOURS = 15
const CELL_HEIGHT = 64

// Paleta fallback (cuando no hay color guardado)
const SUBJECT_PALETTE = [
  { bg: 'rgba(99,102,241,0.2)',  border: 'rgba(99,102,241,0.5)',  text: '#c7d2fe', bar: '#6366f1' },
  { bg: 'rgba(168,85,247,0.2)', border: 'rgba(168,85,247,0.5)', text: '#e9d5ff', bar: '#a855f7' },
  { bg: 'rgba(236,72,153,0.2)', border: 'rgba(236,72,153,0.5)', text: '#fbcfe8', bar: '#ec4899' },
  { bg: 'rgba(14,165,233,0.2)', border: 'rgba(14,165,233,0.5)', text: '#bae6fd', bar: '#0ea5e9' },
  { bg: 'rgba(20,184,166,0.2)', border: 'rgba(20,184,166,0.5)', text: '#99f6e4', bar: '#14b8a6' },
  { bg: 'rgba(34,197,94,0.2)',  border: 'rgba(34,197,94,0.5)',  text: '#bbf7d0', bar: '#22c55e'  },
  { bg: 'rgba(234,179,8,0.2)',  border: 'rgba(234,179,8,0.5)',  text: '#fef08a', bar: '#eab308'  },
  { bg: 'rgba(249,115,22,0.2)', border: 'rgba(249,115,22,0.5)', text: '#fed7aa', bar: '#f97316' },
  { bg: 'rgba(244,63,94,0.2)',  border: 'rgba(244,63,94,0.5)',  text: '#fecdd3', bar: '#f43f5e'  },
  { bg: 'rgba(45,212,191,0.2)', border: 'rgba(45,212,191,0.5)', text: '#99f6e4', bar: '#2dd4bf' },
]

const SPECIAL: Record<string, { bg: string; border: string; text: string; bar: string }> = {
  break: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#fcd34d', bar: '#f59e0b' },
  lunch: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#6ee7b7', bar: '#10b981' },
  free:  { bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)', text: '#94a3b8', bar: '#64748b' },
}

const ROUTINE_COLORS: Record<string, string> = {
  indigo:  '#6366f1',
  violet:  '#8b5cf6',
  emerald: '#10b981',
  amber:   '#f59e0b',
  rose:    '#f43f5e',
  sky:     '#0ea5e9',
}

function hashSubject(subject: string): number {
  let h = 0
  for (const c of subject) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function getPeriodColor(period: SchoolPeriod) {
  if (period.period_type === 'break') return SPECIAL.break
  if (period.period_type === 'lunch') return SPECIAL.lunch
  if (period.period_type === 'free')  return SPECIAL.free

  // Usar el color guardado en DB si existe
  if (period.color) {
    return {
      bg:     hexToRgba(period.color, 0.2),
      border: hexToRgba(period.color, 0.5),
      text:   '#ffffff',
      bar:    period.color,
    }
  }

  // Fallback: hash por nombre de asignatura
  const key = period.subject ?? period.period_type
  return SUBJECT_PALETTE[hashSubject(key) % SUBJECT_PALETTE.length]
}

function timeToTop(time: string): number {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  return ((h - 7) * 60 + m) / (TOTAL_HOURS * 60) * (CELL_HEIGHT * TOTAL_HOURS)
}

function durationToPx(start: string, end: string): number {
  const [sh, sm] = start.slice(0, 5).split(':').map(Number)
  const [eh, em] = end.slice(0, 5).split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  return Math.max(mins / 60 * CELL_HEIGHT, 20)
}

function periodLabel(p: SchoolPeriod): string {
  if (p.period_type === 'break') return '☕ Recreo'
  if (p.period_type === 'lunch') return '🍽 Almuerzo'
  return p.subject ?? p.period_type
}

export function WeeklyView({ tasks, sessions, periods, routines, date }: WeeklyViewProps) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))

  const getTasksForDay = (day: Date) =>
    tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), day))

  const getSessionsForDay = (day: Date) =>
    sessions.filter(s => isSameDay(new Date(s.start_time), day))

  const getPeriodsForDay = (day: Date) => {
    // day.getDay(): 0=Dom,1=Lun,...,6=Sáb → convertir a lun=1
    const dow = day.getDay() === 0 ? 7 : day.getDay()
    return periods.filter(p => p.day_of_week === dow)
  }

  const getRoutinesForDay = (day: Date) => {
    const dow = day.getDay() === 0 ? 7 : day.getDay()
    return routines.filter(r => r.day_of_week === dow)
  }

  const totalHeight = CELL_HEIGHT * TOTAL_HOURS

  return (
    <div className="section-card overflow-hidden select-none">
      <div className="flex" style={{ fontSize: 0 }}>

        {/* Columna de horas */}
        <div className="flex-shrink-0 w-12 border-r" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div style={{ height: 44 }} />
          {HOURS.map(h => (
            <div key={h} className="flex items-start justify-end pr-2"
              style={{ height: CELL_HEIGHT }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.2)', marginTop: -6 }}>
                {h}:00
              </span>
            </div>
          ))}
        </div>

        {/* Columnas de días */}
        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${weekDays.length}, 1fr)` }}>
          {weekDays.map((day, colIdx) => {
            const today = isToday(day) // ← client-side: usa timezone del browser ✓
            const isWeekend = colIdx >= 5
            const dayTasks    = getTasksForDay(day)
            const daySessions = getSessionsForDay(day)
            const dayPeriods  = getPeriodsForDay(day)
            const dayRoutines = getRoutinesForDay(day)

            return (
              <div key={day.toISOString()}
                className="flex flex-col border-r"
                style={{ borderColor: 'rgba(255,255,255,0.04)' }}>

                {/* Header día */}
                <div className={cn(
                  'flex flex-col items-center justify-center border-b',
                  isWeekend ? 'opacity-40' : ''
                )}
                  style={{ height: 44, borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {format(day, 'EEE', { locale: es })}
                  </span>
                  <div className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-full mt-0.5 transition-colors',
                    today ? 'bg-indigo-500' : ''
                  )}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: today ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                      {format(day, 'd')}
                    </span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="relative"
                  style={{
                    height: totalHeight,
                    background: isWeekend ? 'rgba(0,0,0,0.08)' : 'transparent',
                  }}>

                  {/* Gridlines */}
                  {HOURS.map(h => (
                    <div key={h} className="absolute w-full"
                      style={{
                        top: (h - 7) * CELL_HEIGHT,
                        borderTop: h === 7 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                      }} />
                  ))}
                  {HOURS.map(h => (
                    <div key={`h-${h}`} className="absolute w-full"
                      style={{
                        top: (h - 7) * CELL_HEIGHT + CELL_HEIGHT / 2,
                        borderTop: '1px dashed rgba(255,255,255,0.02)',
                      }} />
                  ))}

                  {/* Línea de tiempo actual */}
                  {today && (() => {
                    const now = new Date()
                    const top = timeToTop(`${now.getHours()}:${now.getMinutes()}`)
                    if (top < 0 || top > totalHeight) return null
                    return (
                      <div className="absolute w-full z-30 flex items-center" style={{ top }}>
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0 -ml-1.5 shadow-[0_0_6px_rgba(248,113,113,0.8)]" />
                        <div className="flex-1 h-px bg-red-400/70" />
                      </div>
                    )
                  })()}

                  {/* Rutinas */}
                  {dayRoutines.map((routine, i) => {
                    const top    = timeToTop(routine.start_time)
                    const height = durationToPx(routine.start_time, routine.end_time)
                    const barColor = ROUTINE_COLORS[routine.color] ?? '#6366f1'
                    return (
                      <div key={i}
                        className="absolute rounded-lg overflow-hidden z-10"
                        style={{
                          top: top + 1,
                          height: height - 2,
                          left: 2, right: 2,
                          background: hexToRgba(barColor, 0.12),
                          border: `1px solid ${hexToRgba(barColor, 0.3)}`,
                          display: 'flex',
                        }}>
                        <div className="w-1 flex-shrink-0 rounded-l-lg" style={{ background: barColor }} />
                        <div className="flex-1 min-w-0 px-1.5 py-1 overflow-hidden">
                          {height >= 28 && (
                            <p className="font-semibold truncate leading-tight" style={{ fontSize: 10, color: '#fff' }}>
                              {routine.name}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Períodos del horario */}
                  {dayPeriods.map((period, i) => {
                    const top    = timeToTop(period.start_time)
                    const height = durationToPx(period.start_time, period.end_time)
                    const colors = getPeriodColor(period)
                    const label  = periodLabel(period)
                    const showTime    = height >= 28
                    const showSubTime = height >= 44

                    return (
                      <div key={i}
                        className="absolute rounded-lg overflow-hidden z-10 transition-all"
                        style={{
                          top: top + 1,
                          height: height - 2,
                          left: 2,
                          right: 2,
                          background: colors.bg,
                          border: `1px solid ${colors.border}`,
                          display: 'flex',
                        }}>
                        <div className="w-1 flex-shrink-0 rounded-l-lg" style={{ background: colors.bar }} />
                        <div className="flex-1 min-w-0 px-1.5 py-1 overflow-hidden">
                          {showTime && (
                            <p className="font-semibold truncate leading-tight" style={{ fontSize: 10, color: colors.text }}>
                              {label}
                            </p>
                          )}
                          {showSubTime && (
                            <p className="truncate leading-tight mt-0.5" style={{ fontSize: 9, color: colors.bar, opacity: 0.8 }}>
                              {period.start_time.slice(0,5)}–{period.end_time.slice(0,5)}
                            </p>
                          )}
                          {!showTime && (
                            <div className="w-full h-full" title={label} />
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Study sessions */}
                  {daySessions.map(session => {
                    const top    = timeToTop(session.start_time)
                    const height = durationToPx(session.start_time, session.end_time)
                    return (
                      <div key={session.id}
                        className="absolute rounded-lg overflow-hidden z-20"
                        style={{
                          top: top + 1,
                          height: height - 2,
                          left: '30%', right: 2,
                          background: session.completed ? 'rgba(100,116,139,0.1)' : 'rgba(99,102,241,0.2)',
                          border: `1px solid ${session.completed ? 'rgba(100,116,139,0.25)' : 'rgba(99,102,241,0.45)'}`,
                          display: 'flex',
                        }}>
                        <div className="w-1 flex-shrink-0 rounded-l-lg"
                          style={{ background: session.completed ? '#64748b' : '#6366f1' }} />
                        <div className="flex-1 px-1.5 py-1 overflow-hidden">
                          <p className="font-semibold truncate" style={{ fontSize: 10, color: session.completed ? '#94a3b8' : '#a5b4fc' }}>
                            {session.completed ? '✓ ' : '📖 '}{session.label}
                          </p>
                        </div>
                      </div>
                    )
                  })}

                  {/* Tareas que vencen ese día */}
                  {dayTasks.map((task, i) => (
                    <div key={task.id}
                      className="absolute rounded-md overflow-hidden z-25"
                      style={{
                        top: 4 + i * 22,
                        right: 2, left: 2,
                        height: 18,
                        background: 'rgba(244,63,94,0.18)',
                        border: '1px solid rgba(244,63,94,0.4)',
                        display: 'flex', alignItems: 'center', paddingLeft: 6, gap: 3,
                      }}>
                      <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#f43f5e' }} />
                      <p className="truncate" style={{ fontSize: 9, fontWeight: 700, color: '#fda4af' }}>
                        {task.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
