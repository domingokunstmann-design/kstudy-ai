import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckSquare, AlertCircle, Clock, TrendingUp, ArrowRight, RefreshCw, Zap } from 'lucide-react'
import Link from 'next/link'
import { formatDueDate, getDaysUntilDue, cn } from '@/lib/utils'
import { TASK_TYPE_CONFIG, PRIORITY_CONFIG } from '@/types'
import type { Task } from '@/types'
import { OnboardingBanner } from '@/components/onboarding/onboarding-banner'
import { StudyNowWidget } from '@/components/dashboard/study-now-widget'
import { WeeklyProgress } from '@/components/dashboard/weekly-progress'

export const metadata: Metadata = { title: 'Dashboard' }
export const revalidate = 300

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
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, last_gmail_sync').eq('id', user.id).single(),
    supabase.from('tasks').select('*').eq('user_id', user.id).in('status', ['pendiente', 'en_progreso']).not('due_date', 'is', null).order('due_date', { ascending: true }).limit(5),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pendiente'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).in('status', ['pendiente', 'en_progreso']).lt('due_date', new Date().toISOString()),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).in('status', ['pendiente', 'en_progreso']).gte('due_date', new Date().toISOString()).lte('due_date', new Date(Date.now() + 3 * 86400000).toISOString()),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completada').gte('completed_at', new Date(Date.now() - 7 * 86400000).toISOString()),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Estudiante'

  const STATS = [
    { label: 'Pendientes',    value: pendingCount ?? 0,       cls: 'stat-indigo',  valueColor: '#c4bcff', icon: CheckSquare, iconColor: 'text-[--accent-light]', href: '/dashboard/tasks' },
    { label: 'Vencen pronto', value: dueSoonCount ?? 0,       cls: 'stat-amber',   valueColor: '#fcd34d', icon: Clock,       iconColor: 'text-amber-400',          href: '/dashboard/tasks' },
    { label: 'Vencidas',      value: overdueCount ?? 0,       cls: 'stat-rose',    valueColor: '#fda4af', icon: AlertCircle, iconColor: 'text-rose-400',           href: '/dashboard/tasks' },
    { label: 'Esta semana ✓', value: completedWeekCount ?? 0, cls: 'stat-emerald', valueColor: '#86efac', icon: TrendingUp,  iconColor: 'text-emerald-400',        href: '/dashboard/tasks' },
  ]

  return (
    <div className="p-4 lg:p-7 max-w-5xl mx-auto space-y-5 lg:space-y-7 animate-fade-in">

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Hola, {firstName} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {overdueCount && overdueCount > 0
              ? <span style={{ color: 'var(--danger)' }} className="font-medium">⚠ Tienes {overdueCount} tarea{overdueCount > 1 ? 's' : ''} vencida{overdueCount > 1 ? 's' : ''}</span>
              : dueSoonCount && dueSoonCount > 0
              ? `${dueSoonCount} tarea${dueSoonCount > 1 ? 's vencen' : ' vence'} en los próximos 3 días`
              : '¡Todo al día! Buen trabajo 🎉'}
          </p>
        </div>
        {profile?.last_gmail_sync && (
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw className="w-3 h-3" />
            <span>Sync: {new Date(profile.last_gmail_sync).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>

      {/* Onboarding — solo si no hay tareas aún */}
      {(pendingCount ?? 0) === 0 && (completedWeekCount ?? 0) === 0 && (
        <OnboardingBanner />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href} className={cn('stat-card', stat.cls)}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-xl bg-white/5">
                  <Icon className={cn('w-4 h-4', stat.iconColor)} />
                </div>
              </div>
              <p className="text-[32px] font-bold tracking-tight leading-none" style={{ color: stat.valueColor }}>
                {stat.value}
              </p>
              <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            </Link>
          )
        })}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Próximas tareas */}
        <div className="lg:col-span-2 section-card">
          <div className="section-header">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">Próximas tareas</h2>
            </div>
            <Link href="/dashboard/tasks" className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {tasks && tasks.length > 0 ? (tasks as Task[]).map((task) => {
              const typeConfig = TASK_TYPE_CONFIG[task.type]
              const days = getDaysUntilDue(task.due_date)
              const isOverdue = days !== null && days < 0

              return (
                <Link key={task.id} href="/dashboard/tasks"
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                  {/* Type indicator */}
                  <div className={cn(
                    'w-1 h-8 rounded-full flex-shrink-0',
                    task.type === 'evaluacion' ? 'bg-rose-500' :
                    task.type === 'tarea' ? 'bg-indigo-500' :
                    task.type === 'exposicion' ? 'bg-violet-500' : 'bg-amber-500'
                  )} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/90 truncate group-hover:text-white">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.course_name && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{task.course_name}</span>}
                      <span className={cn('task-badge', typeConfig.bgColor, typeConfig.color, 'border', typeConfig.borderColor)}>
                        {typeConfig.label}
                      </span>
                    </div>
                  </div>

                  <span className={cn('text-xs font-medium flex-shrink-0',
                    isOverdue ? 'text-rose-400' : days === 0 ? 'text-amber-400' : days !== null && days <= 3 ? 'text-amber-400/70' : 'text-white/30'
                  )}>
                    {isOverdue ? `Venció hace ${Math.abs(days!)}d` : formatDueDate(task.due_date)}
                  </span>
                </Link>
              )
            }) : (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <CheckSquare className="w-5 h-5 text-white/20" />
                </div>
                <p className="text-sm font-medium text-white/40">Sin tareas pendientes</p>
                <p className="text-xs text-white/20 mt-1">Sincroniza Gmail para detectar tareas</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho */}
        <div className="space-y-4">

          {/* Progreso semanal */}
          <WeeklyProgress />

          {/* Widget "¿Qué estudiar ahora?" */}
          <StudyNowWidget />

          {/* Quick actions */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="text-sm font-semibold text-white">Acciones rápidas</h2>
            </div>
            <div className="p-3 space-y-1.5">
              {[
                { label: 'Ver plan de estudio', href: '/dashboard/planner', icon: Zap, color: 'text-indigo-400' },
                { label: 'Abrir calendario', href: '/dashboard/calendar', icon: Clock, color: 'text-violet-400' },
                { label: 'Ver correos', href: '/dashboard/emails', icon: RefreshCw, color: 'text-emerald-400' },
              ].map(item => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group hover:bg-white/5"
                  >
                    <Icon className={cn('w-4 h-4 flex-shrink-0', item.color)} />
                    <span className="text-sm font-medium text-white/60 group-hover:text-white/90 transition-colors">{item.label}</span>
                    <ArrowRight className="w-3 h-3 ml-auto text-white/20 group-hover:text-white/40 transition-colors" />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Estado */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="text-sm font-semibold text-white">Estado</h2>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: 'Gmail', connected: !!profile?.last_gmail_sync, icon: '📧' },
                { label: 'Classroom', connected: false, icon: '📚' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm text-white/60 flex-1">{item.label}</span>
                  <span className={cn('pill text-[10px] font-semibold',
                    item.connected
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                  )}>
                    {item.connected ? '● Activo' : '○ Inactivo'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
