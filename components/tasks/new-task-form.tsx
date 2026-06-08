'use client'

import { useState, useTransition } from 'react'
import { createTask } from '@/lib/actions/tasks'
import { X, Plus, Loader2 } from 'lucide-react'
import { TASK_TYPE_CONFIG, PRIORITY_CONFIG } from '@/types'
import type { TaskType, TaskPriority } from '@/types'
import { cn } from '@/lib/utils'

const TYPES: { value: TaskType; label: string }[] = [
  { value: 'evaluacion', label: 'Evaluación' },
  { value: 'tarea',      label: 'Tarea' },
  { value: 'exposicion', label: 'Exposición' },
  { value: 'recordatorio', label: 'Recordatorio' },
  { value: 'otro',       label: 'Otro' },
]

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'urgente', label: 'Urgente' },
  { value: 'alta',    label: 'Alta' },
  { value: 'media',   label: 'Media' },
  { value: 'baja',    label: 'Baja' },
]

interface Props { onClose: () => void }

export function NewTaskForm({ onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle]       = useState('')
  const [type, setType]         = useState<TaskType>('tarea')
  const [priority, setPriority] = useState<TaskPriority>('media')
  const [dueDate, setDueDate]   = useState('')
  const [course, setCourse]     = useState('')
  const [description, setDesc]  = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setError(null)

    startTransition(async () => {
      const result = await createTask({
        title: title.trim(),
        type,
        priority,
        due_date: dueDate || null,
        course_name: course.trim() || null,
        description: description.trim() || null,
      })
      if (result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl animate-slide-up"
        style={{
          background: '#0d0d18',
          border: '1px solid rgba(124,106,247,0.2)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Nueva tarea
          </h2>
          <button onClick={onClose}
            className="text-zinc-600 hover:text-zinc-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Título */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Título *
            </label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Prueba de Matemáticas Unidad 3"
              required
              className="kstudy-input"
            />
          </div>

          {/* Tipo + Prioridad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Tipo</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as TaskType)}
                className="kstudy-input"
                style={{ appearance: 'none' }}
              >
                {TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Prioridad</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="kstudy-input"
                style={{ appearance: 'none' }}
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Fecha de entrega
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="kstudy-input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Asignatura */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Asignatura
            </label>
            <input
              value={course}
              onChange={e => setCourse(e.target.value)}
              placeholder="Ej: Matemáticas, Historia…"
              className="kstudy-input"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Notas (opcional)
            </label>
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="Capítulos a estudiar, requisitos…"
              rows={2}
              className="kstudy-input resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className="btn-primary flex-1 justify-center disabled:opacity-40"
            >
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
                : <><Plus className="w-4 h-4" /> Agregar tarea</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
