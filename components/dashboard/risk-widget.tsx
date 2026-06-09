import { createClient } from '@/lib/supabase/server'
import { RiskWidgetClient } from './risk-widget-client'
import { calculateRiskIndex } from '@/lib/risk/calculator'
import type { RiskFactors } from '@/lib/risk/calculator'

export async function RiskWidget() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const in3Days  = new Date(now.getTime() + 3  * 86400000).toISOString()
  const in7Days  = new Date(now.getTime() + 7  * 86400000).toISOString()
  const ago7Days = new Date(now.getTime() - 7  * 86400000).toISOString()
  const ago28Days= new Date(now.getTime() - 28 * 86400000).toISOString()

  const [
    { count: overdue },
    { count: dueIn3 },
    { count: evalsIn7 },
    { count: missedSessions },
    { count: totalSessions7d },
    { count: completedMonth },
    { count: totalMonth },
  ] = await Promise.all([
    // tareas vencidas
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).in('status', ['pendiente', 'en_progreso'])
      .lt('due_date', now.toISOString()),
    // tareas en 3 días
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).in('status', ['pendiente', 'en_progreso'])
      .gte('due_date', now.toISOString()).lte('due_date', in3Days),
    // evaluaciones en 7 días
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('type', 'evaluacion')
      .in('status', ['pendiente', 'en_progreso'])
      .gte('due_date', now.toISOString()).lte('due_date', in7Days),
    // sesiones NO completadas esta semana
    supabase.from('study_sessions').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('completed', false)
      .gte('start_time', ago7Days),
    // sesiones totales esta semana
    supabase.from('study_sessions').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('start_time', ago7Days),
    // tareas completadas en 28 días
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('status', 'completada')
      .gte('completed_at', ago28Days),
    // tareas totales en 28 días
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', ago28Days),
  ])

  // Racha: número de días consecutivos con al menos una sesión completada
  const { data: recentSessions } = await supabase
    .from('study_sessions')
    .select('start_time')
    .eq('user_id', user.id)
    .eq('completed', true)
    .gte('start_time', new Date(now.getTime() - 30 * 86400000).toISOString())
    .order('start_time', { ascending: false })

  let streakDays = 0
  if (recentSessions && recentSessions.length > 0) {
    const sessionDays = new Set(
      recentSessions.map(s => new Date(s.start_time).toLocaleDateString('es-CL'))
    )
    const checkDate = new Date(now)
    while (sessionDays.has(checkDate.toLocaleDateString('es-CL'))) {
      streakDays++
      checkDate.setDate(checkDate.getDate() - 1)
    }
  }

  const factors: RiskFactors = {
    overdueTasks: overdue ?? 0,
    tasksDueIn3Days: dueIn3 ?? 0,
    evalsDueIn7Days: evalsIn7 ?? 0,
    studySessionsMissedThisWeek: missedSessions ?? 0,
    studyStreakDays: streakDays,
    avgCompletionRate: (totalMonth ?? 0) > 0 ? (completedMonth ?? 0) / (totalMonth ?? 1) : 0.7,
  }

  const result = calculateRiskIndex(factors)

  return <RiskWidgetClient result={result} evalsCount={evalsIn7 ?? 0} />
}
