import { createClient } from '@/lib/supabase/server'
import { TrendingUp } from 'lucide-react'

export async function WeeklyProgress() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  // Lunes de esta semana
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  // Domingo de esta semana
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const [
    { count: completedWeek },
    { data: sessions },
    { data: dueTasks },
  ] = await Promise.all([
    // Tareas completadas esta semana
    supabase.from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completada')
      .gte('completed_at', monday.toISOString()),

    // Sesiones completadas esta semana
    supabase.from('study_plan_sessions')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('date', monday.toISOString().slice(0, 10)),

    // Tareas que vencen esta semana
    supabase.from('tasks')
      .select('id, status')
      .eq('user_id', user.id)
      .gte('due_date', monday.toISOString())
      .lte('due_date', sunday.toISOString()),
  ])

  const tasksCompletedThisWeek = completedWeek ?? 0
  const tasksThisWeek = dueTasks?.length ?? 0
  const tasksDoneOfDue = dueTasks?.filter(t => t.status === 'completada').length ?? 0

  const studyMins = sessions?.reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0) ?? 0
  const studyHours = (studyMins / 60).toFixed(1)

  // % de tareas de la semana ya resueltas
  const pct = tasksThisWeek > 0 ? Math.round((tasksDoneOfDue / tasksThisWeek) * 100) : 0
  const barColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#6366f1'

  const dayName = now.toLocaleDateString('es-CL', { weekday: 'long' })

  return (
    <div className="section-card">
      <div className="section-header">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Esta semana</h2>
        </div>
        <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
          {dayName}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Tareas completadas esta semana */}
        <div>
          <div className="flex items-end justify-between mb-1.5">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Tareas completadas
            </span>
            <span className="text-sm font-bold text-white">
              {tasksCompletedThisWeek}
            </span>
          </div>
        </div>

        {/* Horas de estudio */}
        <div>
          <div className="flex items-end justify-between mb-1.5">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Horas de estudio
            </span>
            <span className="text-sm font-bold text-white">{studyHours}h</span>
          </div>
        </div>

        {/* Progreso de entregas */}
        {tasksThisWeek > 0 && (
          <div>
            <div className="flex items-end justify-between mb-1.5">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Entregas de la semana
              </span>
              <span className="text-xs font-semibold" style={{ color: barColor }}>
                {tasksDoneOfDue}/{tasksThisWeek} · {pct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: barColor }}
              />
            </div>
          </div>
        )}

        {tasksThisWeek === 0 && tasksCompletedThisWeek === 0 && Number(studyHours) === 0 && (
          <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
            Sin actividad aún esta semana
          </p>
        )}
      </div>
    </div>
  )
}
