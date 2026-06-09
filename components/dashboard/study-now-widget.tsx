import { createClient } from '@/lib/supabase/server'
import { TASK_TYPE_CONFIG, PRIORITY_CONFIG } from '@/types'
import { getDaysUntilDue } from '@/lib/utils'
import { BookOpen, ArrowRight, Flame, Clock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface StudySession {
  id: string
  label: string
  start_time: string
  end_time: string
  completed: boolean
}

interface Task {
  id: string
  title: string
  type: string
  priority: string
  due_date: string | null
  course_name: string | null
}

function timeLabel(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

export async function StudyNowWidget() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  // Sesiones de hoy que aún no se completaron
  const { data: sessions } = await supabase
    .from('study_plan_sessions')
    .select('id, label, start_time, end_time, completed')
    .eq('user_id', user.id)
    .eq('completed', false)
    .gte('start_time', todayStart.toISOString())
    .lte('start_time', todayEnd.toISOString())
    .order('start_time', { ascending: true })

  // Tarea más urgente pendiente
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, type, priority, due_date, course_name')
    .eq('user_id', user.id)
    .in('status', ['pendiente', 'en_progreso'])
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(10)

  const pendingSessions = (sessions ?? []) as StudySession[]
  const pendingTasks = (tasks ?? []) as Task[]

  // Determinar recomendación
  // 1. Sesión activa ahora mismo (start ≤ now ≤ end)
  const activeSession = pendingSessions.find(s => {
    const start = new Date(s.start_time)
    const end = new Date(s.end_time)
    return start <= now && now <= end
  })

  // 2. Próxima sesión de hoy
  const nextSession = pendingSessions.find(s => new Date(s.start_time) > now)

  // 3. Tarea urgente / vence hoy o mañana
  const PRIORITY_ORDER: Record<string, number> = { urgente: 0, alta: 1, media: 2, baja: 3 }
  const urgentTask = [...pendingTasks]
    .sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority] ?? 3
      const pb = PRIORITY_ORDER[b.priority] ?? 3
      if (pa !== pb) return pa - pb
      const da = a.due_date ? new Date(a.due_date).getTime() : Infinity
      const db = b.due_date ? new Date(b.due_date).getTime() : Infinity
      return da - db
    })[0] ?? null

  if (!activeSession && !nextSession && !urgentTask) {
    return (
      <div className="section-card">
        <div className="section-header">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">¿Qué estudiar ahora?</h2>
          </div>
        </div>
        <div className="p-5 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-sm font-medium text-white/60">¡Sin pendientes urgentes!</p>
          <p className="text-xs text-white/30 mt-1">Aprovecha de repasar o descansar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="section-card">
      <div className="section-header">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">¿Qué estudiar ahora?</h2>
        </div>
      </div>

      <div className="p-4 space-y-3">

        {/* Sesión activa ahora */}
        {activeSession && (
          <div className="p-3 rounded-xl"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Flame className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Sesión activa ahora</span>
            </div>
            <p className="text-sm font-semibold text-white">{activeSession.label}</p>
            <p className="text-xs text-indigo-400/70 mt-0.5">
              Hasta las {timeLabel(activeSession.end_time)}
            </p>
            <Link href="/dashboard/planner"
              className="mt-2.5 flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
              Ver plan de hoy <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Próxima sesión */}
        {!activeSession && nextSession && (
          <div className="p-3 rounded-xl"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400/70 flex-shrink-0" />
              <span className="text-[10px] font-bold text-indigo-400/70 uppercase tracking-wider">Próxima sesión</span>
            </div>
            <p className="text-sm font-semibold text-white/90">{nextSession.label}</p>
            <p className="text-xs text-white/40 mt-0.5">
              A las {timeLabel(nextSession.start_time)} — {timeLabel(nextSession.end_time)}
            </p>
            <Link href="/dashboard/planner"
              className="mt-2.5 flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
              Ver plan de hoy <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Tarea urgente */}
        {urgentTask && (() => {
          const days = getDaysUntilDue(urgentTask.due_date)
          const isOverdue = days !== null && days < 0
          const dueToday = days === 0
          const typeConfig = TASK_TYPE_CONFIG[urgentTask.type as keyof typeof TASK_TYPE_CONFIG] ?? TASK_TYPE_CONFIG.otro
          const priorityConfig = PRIORITY_CONFIG[urgentTask.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.media

          const urgencyBg = urgentTask.priority === 'urgente'
            ? 'rgba(244,63,94,0.1)' : urgentTask.priority === 'alta'
            ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.04)'
          const urgencyBorder = urgentTask.priority === 'urgente'
            ? 'rgba(244,63,94,0.3)' : urgentTask.priority === 'alta'
            ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.08)'

          return (
            <div className="p-3 rounded-xl"
              style={{ background: urgencyBg, border: `1px solid ${urgencyBorder}` }}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', priorityConfig.dot)} />
                <span className={cn('text-[10px] font-bold uppercase tracking-wider', priorityConfig.color)}>
                  {isOverdue ? 'Vencida' : dueToday ? 'Vence hoy' : `Prioridad ${priorityConfig.label}`}
                </span>
              </div>
              <p className="text-sm font-semibold text-white/90 line-clamp-2">{urgentTask.title}</p>
              {urgentTask.course_name && (
                <p className="text-xs text-white/35 mt-0.5">{urgentTask.course_name}</p>
              )}
              <div className="flex items-center justify-between mt-2.5">
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded border',
                  typeConfig.bgColor, typeConfig.color, typeConfig.borderColor
                )}>
                  {typeConfig.label}
                </span>
                <Link href="/dashboard/tasks"
                  className="flex items-center gap-1 text-xs font-medium text-white/40 hover:text-white/70 transition-colors">
                  Ver tarea <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )
        })()}

        {/* Si hay más pendientes */}
        {pendingSessions.length > 1 && (
          <p className="text-xs text-white/25 text-center pb-1">
            +{pendingSessions.length - 1} sesión{pendingSessions.length > 2 ? 'es' : ''} más hoy
          </p>
        )}
      </div>
    </div>
  )
}
