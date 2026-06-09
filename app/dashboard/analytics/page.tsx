import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart2, Flame, Clock, BookOpen, Trophy, TrendingUp } from 'lucide-react'
import { CompletionChart } from '@/components/analytics/completion-chart'
import { SubjectChart } from '@/components/analytics/subject-chart'
import { StudyTimeChart } from '@/components/analytics/study-time-chart'
import { StreakCard } from '@/components/analytics/streak-card'
import { LogrosCard } from '@/components/analytics/logros-card'
import { HabitsInsights } from '@/components/analytics/habits-insights'
import { format, subDays, startOfWeek, eachWeekOfInterval, startOfDay, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

export const metadata: Metadata = { title: 'Analytics' }
export const revalidate = 0

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const twelveWeeksAgo = subDays(now, 84)
  const twentyEightDaysAgo = subDays(now, 27)

  // Fetches en paralelo
  const [
    { data: allTasks },
    { data: completedSessions },
  ] = await Promise.all([
    // Todas las tareas (para distribución por asignatura y completadas en el tiempo)
    supabase
      .from('tasks')
      .select('id, status, course_name, type, completed_at, created_at, due_date')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),

    // Sesiones completadas (para tiempo de estudio y racha)
    supabase
      .from('study_plan_sessions')
      .select('id, date, duration_minutes, completed, start_time')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('date', format(twelveWeeksAgo, 'yyyy-MM-dd'))
      .order('date', { ascending: true }),
  ])

  const tasks = allTasks ?? []
  const sessions = completedSessions ?? []

  // ── 1. Tareas completadas por semana (últimas 12 semanas) ──────────────────
  const weeks = eachWeekOfInterval(
    { start: twelveWeeksAgo, end: now },
    { weekStartsOn: 1 }
  )

  const completionData = weeks.map(weekStart => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59)

    const completadas = tasks.filter(t =>
      t.completed_at &&
      new Date(t.completed_at) >= weekStart &&
      new Date(t.completed_at) <= weekEnd
    ).length

    const pendientes = tasks.filter(t =>
      t.due_date &&
      new Date(t.due_date) >= weekStart &&
      new Date(t.due_date) <= weekEnd &&
      t.status !== 'completada'
    ).length

    return {
      label: format(weekStart, 'd MMM', { locale: es }),
      completadas,
      pendientes,
    }
  })

  // ── 2. Distribución por asignatura ────────────────────────────────────────
  const courseMap = new Map<string, { total: number; completadas: number }>()
  for (const task of tasks) {
    const name = task.course_name?.trim() || 'Sin asignatura'
    const prev = courseMap.get(name) ?? { total: 0, completadas: 0 }
    courseMap.set(name, {
      total: prev.total + 1,
      completadas: prev.completadas + (task.status === 'completada' ? 1 : 0),
    })
  }
  const subjectData = Array.from(courseMap.entries())
    .map(([course, v]) => ({ course, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  // ── 3. Tiempo de estudio acumulado por semana ──────────────────────────────
  const studyTimeData = weeks.map(weekStart => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const minutes = sessions
      .filter(s => {
        const d = new Date(s.date + 'T12:00:00')
        return d >= weekStart && d <= weekEnd
      })
      .reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0)

    return {
      label: format(weekStart, 'd MMM', { locale: es }),
      horas: Math.round((minutes / 60) * 10) / 10,
    }
  })

  // ── 4. Racha de estudio ────────────────────────────────────────────────────
  // Conjunto de días con sesiones completadas
  const daysWithSessions = new Set(sessions.map(s => s.date))

  // Racha actual: contar hacia atrás desde hoy
  let currentStreak = 0
  let checkDate = startOfDay(now)
  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd')
    if (daysWithSessions.has(dateStr)) {
      currentStreak++
      checkDate = subDays(checkDate, 1)
    } else if (format(checkDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
      // Hoy aún no hay sesión pero seguimos buscando desde ayer
      checkDate = subDays(checkDate, 1)
    } else {
      break
    }
  }

  // Racha más larga (en todo el historial del usuario)
  const allSessionDays = sessions.map(s => s.date).sort()
  let longestStreak = 0
  let tempStreak = 0
  let prevDay: string | null = null
  for (const day of allSessionDays) {
    if (!prevDay) {
      tempStreak = 1
    } else {
      const prev = new Date(prevDay + 'T12:00:00')
      const curr = new Date(day + 'T12:00:00')
      const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000)
      tempStreak = diff === 1 ? tempStreak + 1 : 1
    }
    longestStreak = Math.max(longestStreak, tempStreak)
    prevDay = day
  }

  // Grid de actividad de últimos 28 días (lun a dom × 4 semanas)
  const gridStart = startOfWeek(twentyEightDaysAgo, { weekStartsOn: 1 })
  const activityGrid = Array.from({ length: 28 }, (_, i) => {
    const d = format(subDays(now, 27 - i), 'yyyy-MM-dd')
    return daysWithSessions.has(d)
  })

  // ── Stats de cabecera ──────────────────────────────────────────────────────
  const totalCompleted = tasks.filter(t => t.status === 'completada').length
  const totalStudyMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0)
  const totalStudyHours = Math.round((totalStudyMinutes / 60) * 10) / 10
  const totalCourses = courseMap.size

  // ── Datos para Logros ─────────────────────────────────────────────────────
  const urgentCompleted = tasks.filter(t =>
    t.status === 'completada' && (t as any).priority === 'urgente'
  ).length

  const logroStats = {
    totalCompleted,
    currentStreak,
    longestStreak,
    totalStudyHours,
    totalSessions: sessions.length,
    hasStudyPlan: sessions.length > 0,
    urgentCompleted,
  }

  return (
    <div className="p-7 max-w-5xl mx-auto space-y-7 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Tu progreso académico en los últimos 3 meses
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Tareas completadas',
            value: totalCompleted,
            suffix: '',
            icon: BarChart2,
            cls: 'stat-indigo',
            color: '#c4bcff',
            iconColor: '#a89dff',
          },
          {
            label: 'Horas de estudio',
            value: totalStudyHours,
            suffix: 'h',
            icon: Clock,
            cls: 'stat-amber',
            color: '#fcd34d',
            iconColor: '#f59e0b',
          },
          {
            label: 'Racha actual',
            value: currentStreak,
            suffix: 'd',
            icon: Flame,
            cls: 'stat-rose',
            color: '#fb923c',
            iconColor: '#f97316',
          },
          {
            label: 'Asignaturas',
            value: totalCourses,
            suffix: '',
            icon: BookOpen,
            cls: 'stat-emerald',
            color: '#86efac',
            iconColor: '#22c55e',
          },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className={`stat-card ${stat.cls}`}>
              <div className="p-2 rounded-xl bg-white/5 w-fit mb-4">
                <Icon className="w-4 h-4" style={{ color: stat.iconColor }} />
              </div>
              <p className="text-[32px] font-bold tracking-tight leading-none" style={{ color: stat.color }}>
                {stat.value}{stat.suffix}
              </p>
              <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                {stat.label}
              </p>
            </div>
          )
        })}
      </div>

      {/* Gráficos — fila 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Completadas en el tiempo */}
        <div className="lg:col-span-2 section-card">
          <div className="section-header">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Tareas por semana
            </span>
            <div className="flex items-center gap-3 text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#7c6af7' }} />
                completadas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'rgba(124,106,247,0.3)' }} />
                pendientes
              </span>
            </div>
          </div>
          <div className="p-5 pt-4">
            <CompletionChart data={completionData} />
          </div>
        </div>

        {/* Racha */}
        <div className="section-card">
          <div className="section-header">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Racha de estudio
            </span>
          </div>
          <div className="p-5">
            <StreakCard
              currentStreak={currentStreak}
              longestStreak={longestStreak}
              activityGrid={activityGrid}
            />
          </div>
        </div>
      </div>

      {/* Gráficos — fila 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Distribución por asignatura */}
        <div className="section-card">
          <div className="section-header">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Carga por asignatura
            </span>
          </div>
          {subjectData.length > 0 ? (
            <div className="p-5 pt-4">
              <SubjectChart data={subjectData} />
            </div>
          ) : (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Aún no hay tareas por asignatura
            </div>
          )}
        </div>

        {/* Tiempo de estudio */}
        <div className="section-card">
          <div className="section-header">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Horas de estudio por semana
            </span>
          </div>
          {totalStudyHours > 0 ? (
            <div className="p-5 pt-4">
              <StudyTimeChart data={studyTimeData} />
            </div>
          ) : (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">Sin sesiones completadas aún</p>
              <p className="text-xs mt-1">Completa sesiones del planificador para ver tu tiempo de estudio</p>
            </div>
          )}
        </div>
      </div>

      {/* Fila 3 — Logros + Hábitos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Logros */}
        <div className="section-card">
          <div className="section-header">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Logros
              </span>
            </div>
          </div>
          <div className="p-5 pt-4">
            <LogrosCard stats={logroStats} />
          </div>
        </div>

        {/* Insights de hábitos */}
        <div className="section-card">
          <div className="section-header">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Tus hábitos de estudio
              </span>
            </div>
          </div>
          <div className="p-5 pt-4">
            <HabitsInsights sessions={sessions} tasks={tasks} />
          </div>
        </div>
      </div>
    </div>
  )
}
