'use client'

import { useState } from 'react'
import { completeTask, deleteTask, reopenTask } from '@/lib/actions/tasks'
import { cn, formatDueDate, getDaysUntilDue } from '@/lib/utils'
import { TASK_TYPE_CONFIG, PRIORITY_CONFIG } from '@/types'
import type { Task, Email } from '@/types'
import {
  CheckCircle2, Circle, Trash2, ChevronDown, AlertCircle,
  Mail, Clock, RotateCcw,
} from 'lucide-react'
import { GradeAfterTaskModal } from '@/components/grades/grade-after-task-modal'

interface TaskCardProps {
  task: Task
  email?: Email | null
}

export function TaskCard({ task, email }: TaskCardProps) {
  const [loading, setLoading] = useState<'complete' | 'delete' | null>(null)
  const [showEmail, setShowEmail] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [showGradeModal, setShowGradeModal] = useState(false)

  if (deleted) return null

  const typeConfig = TASK_TYPE_CONFIG[task.type]
  const priorityConfig = PRIORITY_CONFIG[task.priority]
  const days = getDaysUntilDue(task.due_date)
  const isOverdue = days !== null && days < 0
  const isCompleted = task.status === 'completada'

  async function handleComplete() {
    setLoading('complete')
    if (isCompleted) {
      await reopenTask(task.id)
      setLoading(null)
    } else {
      await completeTask(task.id)
      setLoading(null)
      // Si es una evaluación, preguntar si ya tiene la nota
      if (task.type === 'evaluacion') {
        setShowGradeModal(true)
      }
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta tarea?')) return
    setLoading('delete')
    await deleteTask(task.id)
    setDeleted(true)
  }

  return (
    <div className={cn(
      'rounded-xl border transition-all',
      isCompleted
        ? 'border-zinc-800/30 bg-zinc-900/20 opacity-60'
        : 'border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/60'
    )}>
      {/* Main row */}
      <div className="flex items-start gap-3 p-4">
        {/* Complete button */}
        <button
          onClick={handleComplete}
          disabled={loading !== null}
          className="flex-shrink-0 mt-0.5 text-zinc-600 hover:text-indigo-400 transition-colors"
        >
          {loading === 'complete' ? (
            <div className="w-4 h-4 rounded-full border-2 border-zinc-600 border-t-indigo-400 animate-spin" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            {/* Priority dot */}
            <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2', priorityConfig.dot)} />

            <p className={cn(
              'text-sm font-medium flex-1',
              isCompleted ? 'line-through text-zinc-500' : 'text-zinc-100'
            )}>
              {task.title}
            </p>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded border',
              typeConfig.bgColor, typeConfig.color, typeConfig.borderColor
            )}>
              {typeConfig.label}
            </span>

            {/* Badge de prioridad para urgente/alta */}
            {(task.priority === 'urgente' || task.priority === 'alta') && (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded border font-semibold',
                task.priority === 'urgente'
                  ? 'bg-red-500/10 text-red-400 border-red-500/25'
                  : 'bg-orange-500/10 text-orange-400 border-orange-500/25'
              )}>
                {task.priority === 'urgente' ? '🔴 Urgente' : '🟠 Alta'}
              </span>
            )}

            {task.course_name && (
              <span className="text-xs text-zinc-600">{task.course_name}</span>
            )}

            {task.source === 'gmail' && (
              <span className="flex items-center gap-1 text-[10px] text-zinc-700">
                <Mail className="w-3 h-3" /> Gmail
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && !isCompleted && (
            <p className="text-xs text-zinc-600 mt-1.5 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Right side */}
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          {/* Due date */}
          {task.due_date && (
            <div className={cn(
              'flex items-center gap-1 text-xs',
              isOverdue ? 'text-red-400' : days === 0 ? 'text-amber-400' : days !== null && days <= 3 ? 'text-amber-400/70' : 'text-zinc-500'
            )}>
              {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {isOverdue ? `Venció hace ${Math.abs(days!)}d` : formatDueDate(task.due_date)}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Ver correo origen */}
            {email && (
              <button
                onClick={() => setShowEmail(!showEmail)}
                className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                title="Ver correo origen"
              >
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showEmail && 'rotate-180')} />
              </button>
            )}

            {/* Reabrir (solo si completada) */}
            {isCompleted && (
              <button
                onClick={handleComplete}
                disabled={loading !== null}
                className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                title="Reabrir tarea"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Eliminar */}
            <button
              onClick={handleDelete}
              disabled={loading !== null}
              className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Eliminar tarea"
            >
              {loading === 'delete' ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-600 border-t-red-400 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de nota al completar una evaluación */}
      {showGradeModal && (
        <GradeAfterTaskModal
          task={{ id: task.id, title: task.title, course_name: task.course_name }}
          onClose={() => setShowGradeModal(false)}
          onSkip={() => setShowGradeModal(false)}
        />
      )}

      {/* Email viewer expandible */}
      {showEmail && email && (
        <div className="px-4 pb-4 pt-0 border-t border-zinc-800/60 mt-0">
          <div className="mt-3 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/40">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-medium text-zinc-300">{email.subject}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  De: {email.sender} · {new Date(email.received_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="text-xs text-zinc-500 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
              {email.body_text?.slice(0, 1500) ?? email.body_preview ?? 'Sin contenido'}
              {(email.body_text?.length ?? 0) > 1500 && (
                <span className="text-zinc-700"> [...correo truncado]</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
