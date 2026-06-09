'use client'

import { cn, formatDueDate } from '@/lib/utils'
import { TASK_TYPE_CONFIG } from '@/types'
import type { Task } from '@/types'
import { format, eachDayOfInterval, isSameDay, isToday, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

interface MonthlyViewProps {
  tasks: Task[]
  date: Date
}

export function MonthlyView({ tasks, date }: MonthlyViewProps) {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const firstDayOfWeek = (monthStart.getDay() + 6) % 7 // lunes = 0

  const getTasksForDay = (day: Date) =>
    tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), day))

  return (
    <div className="space-y-6">
      {/* Grid mensual */}
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 border-b border-zinc-800/60">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-zinc-600">
              {d}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[72px] border-b border-r border-zinc-800/30" />
          ))}

          {days.map((day, idx) => {
            const dayTasks = getTasksForDay(day)
            const isLastCol = (firstDayOfWeek + idx) % 7 === 6
            const today = isToday(day)

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[72px] p-1.5 border-b border-zinc-800/30 transition-colors',
                  !isLastCol && 'border-r',
                  today && 'bg-indigo-500/5',
                  dayTasks.length > 0 && 'bg-zinc-800/20'
                )}
              >
                <span className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full text-xs mb-1',
                  today ? 'bg-indigo-500 text-white font-semibold' : 'text-zinc-500'
                )}>
                  {format(day, 'd')}
                </span>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 2).map(task => {
                    const config = TASK_TYPE_CONFIG[task.type]
                    return (
                      <div
                        key={task.id}
                        className={cn('text-[9px] px-1 py-0.5 rounded truncate', config.bgColor, config.color)}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    )
                  })}
                  {dayTasks.length > 2 && (
                    <div className="text-[9px] text-zinc-600 px-1">+{dayTasks.length - 2} más</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista de tareas del mes */}
      {tasks.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-3 capitalize">
            {format(date, 'MMMM yyyy', { locale: es })}
          </h2>
          <div className="space-y-2">
            {tasks.map(task => {
              const config = TASK_TYPE_CONFIG[task.type]
              return (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                  <div className={cn(
                    'w-1 h-8 rounded-full flex-shrink-0',
                    task.type === 'evaluacion' ? 'bg-rose-500' :
                    task.type === 'tarea' ? 'bg-indigo-500' :
                    task.type === 'exposicion' ? 'bg-violet-500' : 'bg-amber-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate">{task.title}</p>
                    {task.course_name && <p className="text-xs text-zinc-600">{task.course_name}</p>}
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded border flex-shrink-0', config.bgColor, config.color, config.borderColor)}>
                    {config.label}
                  </span>
                  <span className="text-xs text-zinc-500 flex-shrink-0">
                    {formatDueDate(task.due_date)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-8 text-zinc-600 text-sm">
          No hay tareas con fecha para este mes
        </div>
      )}
    </div>
  )
}
