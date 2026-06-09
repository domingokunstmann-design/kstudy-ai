import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckSquare, AlertCircle, Clock, TrendingUp, ArrowRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { formatDueDate, getDaysUntilDue, cn } from '@/lib/utils'
import { TASK_TYPE_CONFIG } from '@/types'
import type { Task } from '@/types'
import { OnboardingBanner } from '@/components/onboarding/onboarding-banner'
import { RiskWidget } from '@/components/dashboard/risk-widget'
import { TodayPlanWidget } from '@/components/dashboard/today-plan-widget'
import { WorkloadDonut } from '@/components/dashboard/workload-donut'
import { WeeklySummary } from '@/components/dashboard/weekly-summary'
import { RecentAchievements } from '@/components/dashboard/recent-achievements'
import { StudyNowWidget } from '@/components/dashboard/study-now-widget'
import { PomodoroTimer } from '@/components/pomodoro/pomodoro-timer'

export const metadata: Metadata = { title: 'Dashboard' }
export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: tasks },
    { count: pendingCount },
    { count: overdueCount },
    { count: dueSoonCount },
    { count: completedWeekCount },
    { count: weekTotal },
    { data: tasksByCourse },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, last_gmail_sync').eq('id', user.id).single(),
    supabase.from('tasks').select('*').eq('user_id', user.id)
      .in('status', ['pendiente', 'en_progreso'])
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true })
      .limit(6),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pendiente'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      .in('status', ['pendiente', 'en_progreso'])
      .lt('due_date', new Date().toISOString()),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      .in('status', ['pendiente', 'en_progreso'])
      .gte('due_date', new Date().toISOString())
      .lte('due_date', new Date(Date.now() + 3 * 86400000).toISOString()),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      .eq('status', 'completada')
      .gte('completed_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      .gte('due_date', new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from('tasks').select('course_name').eq('user_id', user.id)
      .in('status', ['pendiente', 'en_progreso'])
      .not('course_name', 'is', null),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Estudiante'

  // Build workload data
  const courseMap: Record<string, number> = {}
  for (const t of (tasksByCourse ?? [])) {
    const name = t.course_name ?? 'Sin asignatura'
    courseMap[name] = (courseMap[name] ?? 0) + 1
  }
  const workloadData = Object.entries(courseMap)
    .map(([name, count]) => ({ name, count, color: '' }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
  const workloadTotal = workloadData.reduce((s, d) => s + d.count, 0)

  const STATS = [
    {
      label: 'Pendientes', sublabel: 'tareas por hacer',
      value: pendingCount ?? 0,
      valueColor: '#c4bcff', bgColor: 'rgba(124,106,247,0.08)', borderColor: 'rgba(124,106,247,0.18)',
      icon: CheckSquare, iconColor: '#7c6af7', iconBg: 'rgba(124,106,247,0.15)',
      href: '/dashboard/tasks',
    },
    {
      label: 'Vencen pronto', sublabel: 'en los próximos 3 días',
      value: dueSoonCount ?? 0,
      valueColor: '#fcd34d', bgColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.18)',
      icon: Clock, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.15)',
      href: '/dashboard/tasks',
    },
    {
      label: 'Vencidas', sublabel: overdueCount === 0 ? '¡Bien! Nada vencido' : 'por entregar',
      value: overdueCount ?? 0,
      valueColor: overdueCount === 0 ? '#86efac' : '#fda4af',
      bgColor: overdueCount === 0 ? 'rgba(34,197,94,0.08)' : 'rgba(244,63,94,0.08)',
      borderColor: overdueCount === 0 ? 'rgba(34,197,94,0.18)' : 'rgba(244,63,94,0.18)',
      icon: AlertCircle, iconColor: overdueCount === 0 ? '#22c55e' : '#f43f5e',
      iconBg: overdueCount === 0 ? 'rgba(34,197,94,0.15)' : 'rgba(244,63,94,0.15)',
      href: '/dashboard/tasks',
    },
    {
      label: 'Esta semana', sublabel: 'tareas completadas',
      value: completedWeekCount ?? 0,
      valueColor: '#86efac', bgColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.18)',
      icon: TrendingUp, iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.15)',
      href: '/dashboard/tasks',
    },
  ]

  const dateStr = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
  const dateCapitalized = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
            {dateCapitalized}
          </p>
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Hola, {firstName} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {overdueCount && overdueCount > 0
              ? <span style={{ color: 'var(--danger)' }}>⚠ Tienes {overdueCount} tarea{overdueCount > 1 ? 's' : ''} vencida{overdueCount > 1 ? 's' : ''}</span>
              : dueSoonCount && dueSoonCount > 0
              ? `${dueSoonCount} tarea${dueSoonCount > 1 ? 's vencen' : ' vence'} en los próximos 3 días`
              : 'Tú puedes con todo. Vamos paso a paso. 💪'}
          </p>
        </div>
        {profile?.last_gmail_sync && (
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw className="w-3 h-3" />
            <span>Sync: {new Date(profile.last_gmail_sync).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>

      {/* Onboarding */}
      {(pendingCount ?? 0) === 0 && (completedWeekCount ?? 0) === 0 && <OnboardingBanner />}

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-2xl p-4 transition-all hover:scale-[1.02] hover:brightness-110"
              style={{ background: stat.bgColor, border: `1px solid ${stat.borderColor}` }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                style={{ background: stat.iconBg }}
              >
                <Icon className="w-4 h-4" style={{ color: stat.iconColor }} />
              </div>
              <p className="text-[28px] font-bold leading-none" style={{ color: stat.valueColor }}>
                {stat.value}
              </p>
              <p className="text-xs font-semibold mt-1.5" style={{ color: 'var(--text-primary)', opacity: 0.8 }}>
                {stat.label}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {stat.sublabel}
              </p>
            </Link>
          )
        })}
      </div>

      {/* ── Middle Row: 3 columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Col 1: Próximas tareas */}
        <div className="section-card">
          <div className="section-header">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">Próximas tareas</h2>
            </div>
            <Link href="/dashboard/tasks" className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {tasks && tasks.length > 0 ? (tasks as Task[]).map((task) => {
              const typeConfig = TASK_TYPE_CONFIG[task.type]
              const days = getDaysUntilDue(task.due_date)
              const isOverdue = days !== null && days < 0
              const dotColor = task.type === 'evaluacion' ? '#f43f5e'
                : task.type === 'tarea' ? '#7c6af7'
                : task.type === 'exposicion' ? '#8b5cf6' : '#f59e0b'

              return (
                <Link key={task.id} href="/dashboard/tasks"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ background: dotColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/85 truncate group-hover:text-white">{task.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {task.course_name && <span className="text-[11px] text-white/30 truncate">{task.course_name}</span>}
                      <span className={cn('task-badge text-[10px]', typeConfig.bgColor, typeConfig.color, 'border', typeConfig.borderColor)}>
                        {typeConfig.label}
                      </span>
                    </div>
                  </div>
                  <span className={cn('text-[11px] font-medium flex-shrink-0',
                    isOverdue ? 'text-rose-400' : days === 0 ? 'text-amber-400' : days !== null && days <= 3 ? 'text-amber-400/60' : 'text-white/25'
                  )}>
                    {isOverdue ? `Hace ${Math.abs(days!)}d` : formatDueDate(task.due_date)}
                  </span>
                </Link>
              )
            }) : (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm font-medium text-white/40">Sin tareas pendientes</p>
                <p className="text-xs text-white/20 mt-1">Sincroniza Gmail para detectar tareas</p>
              </div>
            )}
          </div>
        </div>

        {/* Col 2: Plan de hoy */}
        <TodayPlanWidget />

        {/* Col 3: Riesgo + Pomodoro + ¿Qué estudiar? */}
        <div className="space-y-4">
          <RiskWidget />
          <PomodoroTimer />
          <StudyNowWidget />
        </div>
      </div>

      {/* ── Bottom Row: 3 columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Col 1: Resumen de la semana */}
        <WeeklySummary />

        {/* Col 2: Carga de trabajo */}
        <div className="section-card">
          <div className="section-header">
            <div className="flex items-center gap-2">
              <span className="text-sm">🍩</span>
              <h2 className="text-sm font-semibold text-white">Carga de trabajo</h2>
            </div>
            <span className="text-xs text-white/30">{workloadTotal} pendientes</span>
          </div>
          <div className="p-4">
            <WorkloadDonut data={workloadData} total={workloadTotal} />
          </div>
        </div>

        {/* Col 3: Logros recientes */}
        <RecentAchievements />
      </div>
    </div>
  )
}
