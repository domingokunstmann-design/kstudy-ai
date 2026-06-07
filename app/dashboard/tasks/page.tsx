import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckSquare, Plus } from 'lucide-react'
import { SyncButton } from '@/components/gmail/sync-button'
import { TaskCard } from '@/components/tasks/task-card'
import type { Task, Email } from '@/types'

export const metadata: Metadata = { title: 'Tareas' }
export const revalidate = 0

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Tareas con su email origen
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, emails(*)')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true, nullsFirst: false })

  const pending = tasks?.filter(t => t.status === 'pendiente') ?? []
  const inProgress = tasks?.filter(t => t.status === 'en_progreso') ?? []
  const completed = tasks?.filter(t => t.status === 'completada') ?? []

  const sections = [
    { label: 'Pendientes', items: pending, emptyMsg: 'Sin tareas pendientes 🎉' },
    { label: 'En progreso', items: inProgress, emptyMsg: null },
    { label: 'Completadas', items: completed, emptyMsg: null },
  ]

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
        </div>
      </div>

      {/* Empty state */}
      {(!tasks || tasks.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <CheckSquare className="w-6 h-6 text-zinc-700" />
          </div>
          <p className="text-sm font-medium text-zinc-400">No hay tareas aún</p>
          <p className="text-xs text-zinc-600 mt-1">
            Sincroniza tu Gmail o agrega una tarea manualmente
          </p>
        </div>
      )}

      {/* Sections */}
      {sections.map(({ label, items, emptyMsg }) => {
        if (items.length === 0 && !emptyMsg) return null
        return (
          <div key={label} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {label}
              </span>
              {items.length > 0 && (
                <span className="text-xs text-zinc-700">({items.length})</span>
              )}
            </div>

            {items.length === 0 && emptyMsg ? (
              <p className="text-sm text-zinc-600 py-3">{emptyMsg}</p>
            ) : (
              <div className="space-y-2">
                {items.map((task: Task & { emails?: Email }) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    email={task.source_email_id ? (task as any).emails : null}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
