import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckSquare, AlertTriangle } from 'lucide-react'
import { SyncButton } from '@/components/gmail/sync-button'
import { TaskCard } from '@/components/tasks/task-card'
import { NewTaskButton } from '@/components/tasks/new-task-button'
import type { Task, Email } from '@/types'

export const metadata: Metadata = { title: 'Tareas' }
export const revalidate = 0

const PRIORITY_ORDER: Record<string, number> = { urgente: 0, alta: 1, media: 2, baja: 3 }

function sortByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 3
    const pb = PRIORITY_ORDER[b.priority] ?? 3
    if (pa !== pb) return pa - pb
    const da = a.due_date ? new Date(a.due_date).getTime() : Infinity
    const db = b.due_date ? new Date(b.due_date).getTime() : Infinity
    return da - db
  })
}

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, emails(*)')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true, nullsFirst: false })

  const all = tasks ?? []
  const pending   = all.filter(t => t.status === 'pendiente')
  const inProgress = all.filter(t => t.status === 'en_progreso')
  const completed = all.filter(t => t.status === 'completada')

  // Separar urgentes (urgente + alta con fecha ≤ 2 días) del resto de pendientes
  const now = new Date()
  const in2Days = new Date(now.getTime() + 2 * 86400000)

  const urgentes = sortByPriority(pending.filter(t =>
    t.priority === 'urgente' ||
    (t.priority === 'alta' && t.due_date && new Date(t.due_date) <= in2Days) ||
    (t.due_date && new Date(t.due_date) < now) // vencidas
  ))
  const urgentIds = new Set(urgentes.map(t => t.id))
  const normalPending = sortByPriority(pending.filter(t => !urgentIds.has(t.id)))

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-zinc-500" />
            Tareas
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {pending.length} pendientes · {completed.length} completadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SyncButton />
          <NewTaskButton />
        </div>
      </div>

      {/* Empty state */}
      {all.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <CheckSquare className="w-6 h-6 text-zinc-700" />
          </div>
          <p className="text-sm font-medium text-zinc-400">No hay tareas aún</p>
          <p className="text-xs text-zinc-600 mt-1">Sincroniza tu Gmail o agrega una tarea manualmente</p>
        </div>
      )}

      {/* 🚨 URGENTES */}
      {urgentes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
              Requieren atención inmediata
            </span>
            <span className="text-xs text-red-400/50">({urgentes.length})</span>
          </div>
          <div className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(244,63,94,0.2)', background: 'rgba(244,63,94,0.04)' }}>
            <div className="space-y-0 divide-y" style={{ borderColor: 'rgba(244,63,94,0.1)' }}>
              {urgentes.map((task: Task & { emails?: Email }) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  email={task.source_email_id ? (task as any).emails : null}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pendientes normales */}
      {normalPending.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pendientes</span>
            <span className="text-xs text-zinc-700">({normalPending.length})</span>
          </div>
          <div className="space-y-2">
            {normalPending.map((task: Task & { emails?: Email }) => (
              <TaskCard
                key={task.id}
                task={task}
                email={task.source_email_id ? (task as any).emails : null}
              />
            ))}
          </div>
        </div>
      )}

      {/* En progreso */}
      {inProgress.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">En progreso</span>
            <span className="text-xs text-zinc-700">({inProgress.length})</span>
          </div>
          <div className="space-y-2">
            {inProgress.map((task: Task & { emails?: Email }) => (
              <TaskCard
                key={task.id}
                task={task}
                email={task.source_email_id ? (task as any).emails : null}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completadas */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Completadas</span>
            <span className="text-xs text-zinc-700">({completed.length})</span>
          </div>
          <div className="space-y-2">
            {completed.map((task: Task & { emails?: Email }) => (
              <TaskCard
                key={task.id}
                task={task}
                email={task.source_email_id ? (task as any).emails : null}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
