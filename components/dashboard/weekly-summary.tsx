import { createClient } from '@/lib/supabase/server'
import { TrendingUp } from 'lucide-react'

interface DayStat { day: string; count: number }

export async function WeeklySummary() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Monday
  weekStart.setHours(0, 0, 0, 0)
  const weekStartISO = weekStart.toISOString()

  const [
    { data: completedTasks, count: completedCount },
    { data: sessions },
    { data: allCompletedWeek },
  ] = await Promise.all([
    supabase.from('tasks').select('completed_at', { count: 'exact' })
      .eq('user_id', user.id).eq('status', 'completada')
      .gte('completed_at', weekStartISO),
    supabase.from('study_plan_sessions').select('duration_minutes, date, completed')
      .eq('user_id', user.id).gte('date', weekStart.toISOString().slice(0, 10)),
    supabase.from('tasks').select('completed_at, due_date')
      .eq('user_id', user.id).eq('status', 'completada')
      .gte('completed_at', weekStartISO),
  ])

  // Horas de estudio (sólo sesiones completadas)
  const completedSessions = (sessions ?? []).filter(s => s.completed)
  const studyMinutes = completedSessions.reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0)
  const studyHours   = (studyMinutes / 60).toFixed(1)

  // Entregados a tiempo
  const total = allCompletedWeek?.length ?? 0
  const onTime = (allCompletedWeek ?? []).filter(t => {
    if (!t.completed_at || !t.due_date) return true
    return new Date(t.completed_at) <= new Date(t.due_date)
  }).length
  const onTimePct = total > 0 ? Math.round((onTime / total) * 100) : 100

  // Activity bars: Mon–Sun, count completed tasks per day
  const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  const dayCounts: number[] = [0, 0, 0, 0, 0, 0, 0]
  for (const t of (completedTasks ?? [])) {
    if (!t.completed_at) continue
    const d = new Date(t.completed_at)
    let dow = d.getDay() - 1 // Mon=0
    if (dow < 0) dow = 6
    dayCounts[dow]++
  }
  const maxCount = Math.max(...dayCounts, 1)
  const todayDow = (() => { let d = new Date().getDay() - 1; return d < 0 ? 6 : d })()

  const METRICS = [
    { label: 'Tareas completadas', value: `${completedCount ?? 0}`, sub: 'esta semana',  pct: Math.min(100, ((completedCount ?? 0) / 10) * 100), color: '#7c6af7' },
    { label: 'Horas de estudio',   value: `${studyHours}h`,         sub: 'registradas', pct: Math.min(100, (parseFloat(studyHours) / 10) * 100), color: '#34d399' },
    { label: 'Entrega a tiempo',   value: `${onTimePct}%`,          sub: 'de las tareas', pct: onTimePct, color: '#f59e0b' },
  ]

  return (
    <div className="section-card h-full flex flex-col">
      <div className="section-header">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Resumen de esta semana</h2>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Metrics */}
        <div className="space-y-3">
          {METRICS.map(m => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-xs font-medium text-white/60">{m.label}</p>
                </div>
                <span className="text-sm font-bold text-white/90">{m.value}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${m.pct}%`, background: m.color, opacity: 0.8 }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Activity bars */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-2">Actividad diaria</p>
          <div className="flex items-end gap-1 h-16">
            {DAYS.map((day, i) => {
              const h = Math.max(4, (dayCounts[i] / maxCount) * 52)
              const isToday = i === todayDow
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className="w-full rounded-t-sm transition-all duration-500"
                    style={{
                      height: `${h}px`,
                      background: isToday ? '#7c6af7' : 'rgba(255,255,255,0.1)',
                      opacity: dayCounts[i] === 0 ? 0.35 : 1,
                    }}
                  />
                  <span className={`text-[9px] font-medium ${isToday ? 'text-violet-400' : 'text-white/25'}`}>{day}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
