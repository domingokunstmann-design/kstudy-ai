'use client'

import { useState } from 'react'
import { addGrade, updateGrade, deleteGrade } from '@/lib/actions/grades'
import { X, Trash2, Loader2 } from 'lucide-react'

interface GradeFormProps {
  subjectId: string
  subjectName: string
  onClose: () => void
  editGrade?: {
    id: string
    title: string
    grade: number
    percentage: number | null
    graded_at: string
    notes: string | null
  }
  taskId?: string | null
  taskTitle?: string
}

export function GradeForm({ subjectId, subjectName, onClose, editGrade, taskId, taskTitle }: GradeFormProps) {
  const isEdit = !!editGrade
  const today = new Date().toISOString().slice(0, 10)

  const [title, setTitle] = useState(editGrade?.title ?? taskTitle ?? '')
  const [gradeVal, setGradeVal] = useState(String(editGrade?.grade ?? ''))
  const [pct, setPct] = useState(String(editGrade?.percentage ?? ''))
  const [gradedAt, setGradedAt] = useState(editGrade?.graded_at ?? today)
  const [notes, setNotes] = useState(editGrade?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const gradeNum = parseFloat(gradeVal)
  const isValidGrade = !isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= 7

  // Color visual de la nota ingresada
  const gradeColor = !isValidGrade ? 'text-zinc-400'
    : gradeNum >= 6 ? 'text-emerald-400'
    : gradeNum >= 5 ? 'text-lime-400'
    : gradeNum >= 4 ? 'text-amber-400'
    : 'text-rose-400'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidGrade) return
    setLoading(true)
    setError('')

    const form = {
      subject_id: subjectId,
      title: title.trim() || 'Evaluación',
      grade: gradeNum,
      percentage: pct ? parseFloat(pct) : null,
      graded_at: gradedAt,
      notes: notes.trim() || undefined,
      task_id: taskId ?? null,
    }

    const result = isEdit
      ? await updateGrade(editGrade!.id, form)
      : await addGrade(form)

    setLoading(false)
    if (result?.error) setError(result.error)
    else onClose()
  }

  async function handleDelete() {
    if (!isEdit) return
    if (!confirm('¿Eliminar esta nota?')) return
    setLoading(true)
    await deleteGrade(editGrade!.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 relative" style={{ background: '#131326', border: '1px solid rgba(124,106,247,0.25)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-400">
          <X className="w-4 h-4" />
        </button>

        <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--accent-light)' }}>
          {subjectName}
        </p>
        <h2 className="text-base font-semibold text-white mb-5">
          {isEdit ? 'Editar nota' : 'Registrar nota'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Evaluación</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Prueba Unidad 3, Control de lectura..."
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-indigo-500/60"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Nota + porcentaje en fila */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Nota *</label>
              <div className="relative">
                <input
                  type="number"
                  value={gradeVal}
                  onChange={e => setGradeVal(e.target.value)}
                  placeholder="1.0 – 7.0"
                  min="1"
                  max="7"
                  step="0.1"
                  required
                  className={`w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none focus:ring-1 focus:ring-indigo-500/60 ${gradeColor}`}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>
            </div>
            <div className="w-28">
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                Ponderación
                <span className="text-zinc-600 ml-1">(%)</span>
              </label>
              <input
                type="number"
                value={pct}
                onChange={e => setPct(e.target.value)}
                placeholder="Ej: 30"
                min="1"
                max="100"
                step="1"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-indigo-500/60"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Fecha de evaluación</label>
            <input
              type="date"
              value={gradedAt}
              onChange={e => setGradedAt(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500/60"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }}
            />
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Notas (opcional)</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej: Salió mejor de lo esperado..."
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-indigo-500/60"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors border border-rose-500/20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !isValidGrade}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7c6af7, #9d8fff)' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : isEdit ? 'Guardar' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
