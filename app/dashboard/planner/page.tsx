import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Brain, Plus, Trash2, Clock, RefreshCw, CheckCircle2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDayName, formatTimeRange } from '@/lib/planner/algorithm'
import { deleteRoutine, regeneratePlan, markSessionComplete } from '@/lib/actions/planner'
import { PlannerClient, AddRoutineButton } from '@/components/planner/planner-client'

export const metadata: Metadata = { title: 'Planificador' }
export const revalidate = 0

const COLOR_MAP: Record<string, string> = {
  indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  sky: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  zinc: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
}

export default async function PlannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

  const [
    { data: routines },
    { data: sessions },
    { data: tasks },
  ] = await Promise.all([
    supabase.from('routines').select('*').eq('user_id', user.id).eq('active', true).order('day_of_week').order('start_time'),
    supabase.from('study_plan_sessions').select('*').eq('user_id', user.id).gte('date', today).lte('date', nextWeek).order('date').order('start_time'),
    supabase.from('tasks').select('id, title, type').eq('user_id', user.id).in('status', ['pendiente', 'en_progreso']).not('due_date', 'is', null),
  ])

  // Agrupar sesiones por día
  const sessionsByDay: Record<string, typeof sessions> = {}
  for (const session of sessions ?? []) {
    if (!sessionsByDay[session.date]) sessionsByDay[session.date] = []
    sessionsByDay[session.date]!.push(session)
  }

  const todaySessions = sessions?.filter(s => s.date === today && !s.completed) ?? []
  const totalPending = sessions?.filter(s => !s.completed).length ?? 0

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
            <Brain className="w-5 h-5 text-zinc-500" />
            Planificador de estudio
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {totalPending > 0
              ? `${totalPending} sesiones programadas para los próximos 14 días`
              : 'Agrega rutinas y genera tu plan de estudio automático'}
          </p>
        </div>
        <PlannerClient
          tasksCount={tasks?.length ?? 0}
          hasGeminiKey={!!process.env.GEMINI_API_KEY}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rutinas semanales */}
        <div className="lg:col-span-1 space-y-3">
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800/60 flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-200">Mis rutinas</h2>
              <AddRoutineButton />
            </div>

            {routines && routines.length > 0 ? (
              <div className="divide-y divide-zinc-800/40">
                {routines.map(routine => (
                  <div key={routine.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0',
                      routine.color === 'indigo' ? 'bg-indigo-500' :
                      routine.color === 'violet' ? 'bg-violet-500' :
                      routine.color === 'emerald' ? 'bg-emerald-500' :
                      routine.color === 'amber' ? 'bg-amber-500' :
                      routine.color === 'rose' ? 'bg-rose-500' :
                      routine.color === 'sky' ? 'bg-sky-500' : 'bg-zinc-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 truncate">{routine.name}</p>
                      <p className="text-xs text-zinc-600">
                        {getDayName(routine.day_of_week)} · {formatTimeRange(routine.start_time.slice(0,5), routine.end_time.slice(0,5))}
                      </p>
                    </div>
                    <form action={async () => { 'use server'; await deleteRoutine(routine.id) }}>
                      <button type="submit" className="text-zinc-700 hover:text-red-400 transition-colors p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-zinc-600">Sin rutinas aún</p>
                <p className="text-[10px] text-zinc-700 mt-1">Agrega tus actividades fijas para que el planificador las respete</p>
              </div>
            )}
          </div>

          {/* Hoy */}
          {todaySessions.length > 0 && (
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-indigo-500/10">
                <h2 className="text-sm font-medium text-indigo-300 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Para hoy
                </h2>
              </div>
              <div className="divide-y divide-indigo-500/10">
                {todaySessions.map(s => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                    <form action={async () => { 'use server'; await markSessionComplete(s.id) }}>
                      <button type="submit" className="text-zinc-700 hover:text-emerald-400 transition-colors">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </form>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-200 truncate">{s.label}</p>
                      <p className="text-[10px] text-zinc-600">{formatTimeRange(s.start_time.slice(0,5), s.end_time.slice(0,5))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Plan de estudio — próximos 14 días */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800/60">
              <h2 className="text-sm font-medium text-zinc-200">Plan de estudio — próximos 14 días</h2>
            </div>

            {Object.keys(sessionsByDay).length > 0 ? (
              <div className="divide-y divide-zinc-800/30">
                {Object.entries(sessionsByDay).map(([date, daySessions]) => {
                  const d = new Date(date + 'T12:00:00')
                  const isToday = date === today
                  const pendingCount = daySessions?.filter(s => !s.completed).length ?? 0

                  return (
                    <div key={date} className={cn('px-4 py-3', isToday && 'bg-indigo-500/5')}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn('text-xs font-semibold', isToday ? 'text-indigo-400' : 'text-zinc-400')}>
                          {isToday ? 'Hoy' : getDayName(d.getDay())}
                        </span>
                        <span className="text-xs text-zinc-600">
                          {d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="ml-auto text-xs text-zinc-700">{pendingCount} sesiones</span>
                      </div>
                      <div className="space-y-1.5">
                        {daySessions?.map(s => (
                          <div
                            key={s.id}
                            className={cn(
                              'flex items-center gap-3 p-2.5 rounded-lg border text-xs transition-all',
                              s.completed
                                ? 'opacity-40 border-zinc-800/30 bg-transparent'
                                : 'border-zinc-800/60 bg-zinc-800/30'
                            )}
                          >
                            <form action={async () => { 'use server'; await markSessionComplete(s.id) }}>
                              <button type="submit" disabled={s.completed} className={cn('transition-colors', s.completed ? 'text-emerald-500' : 'text-zinc-700 hover:text-emerald-400')}>
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            </form>
                            <div className="flex-1 min-w-0">
                              <p className={cn('truncate', s.completed ? 'line-through text-zinc-600' : 'text-zinc-200')}>
                                {s.label}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-zinc-600 flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              {formatTimeRange(s.start_time.slice(0,5), s.end_time.slice(0,5))}
                            </div>
                            <span className="text-zinc-700 flex-shrink-0">{s.duration_minutes}min</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Brain className="w-10 h-10 text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-400 font-medium">No hay plan generado</p>
                <p className="text-xs text-zinc-600 mt-1 max-w-xs">
                  Agrega tus rutinas semanales y haz clic en "Generar plan" para que la app organice tus sesiones de estudio automáticamente
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
