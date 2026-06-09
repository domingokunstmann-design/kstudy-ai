'use client'

import { useState } from 'react'
import { createSubject, updateSubject, deleteSubject } from '@/lib/actions/grades'
import { SUBJECT_COLORS } from '@/lib/grades/calculator'
import { X, Trash2, Loader2 } from 'lucide-react'

interface SubjectFormProps {
  onClose: () => void
  editSubject?: {
    id: string
    name: string
    color: string
    teacher_name: string | null
    coefficient: number
  }
  semester: number
  schoolYear: number
}

export function SubjectForm({ onClose, editSubject, semester, schoolYear }: SubjectFormProps) {
  const isEdit = !!editSubject
  const [name, setName] = useState(editSubject?.name ?? '')
  const [color, setColor] = useState(editSubject?.color ?? 'indigo')
  const [teacher, setTeacher] = useState(editSubject?.teacher_name ?? '')
  const [coefficient, setCoefficient] = useState(String(editSubject?.coefficient ?? 1.0))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const result = isEdit
      ? await updateSubject(editSubject!.id, {
          name,
          color,
          teacher_name: teacher,
          coefficient: parseFloat(coefficient) || 1.0,
        })
      : await createSubject({
          name,
          color,
          teacher_name: teacher,
          semester,
          school_year: schoolYear,
          coefficient: parseFloat(coefficient) || 1.0,
        })

    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      onClose()
    }
  }

  async function handleDelete() {
    if (!editSubject) return
    if (!confirm(`¿Eliminar "${editSubject.name}" y todas sus notas?`)) return
    setLoading(true)
    await deleteSubject(editSubject.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 relative" style={{ background: '#131326', border: '1px solid rgba(124,106,247,0.25)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-400">
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-base font-semibold text-white mb-5">
          {isEdit ? 'Editar asignatura' : 'Nueva asignatura'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Nombre *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Matemáticas, Lenguaje..."
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-indigo-500/60"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Profesor */}
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Profesor (opcional)</label>
            <input
              value={teacher}
              onChange={e => setTeacher(e.target.value)}
              placeholder="Nombre del profesor"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-indigo-500/60"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-2 block">Color</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SUBJECT_COLORS).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setColor(key)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: color === key ? cfg.bg.replace('/15', '/25') : 'rgba(255,255,255,0.04)',
                    border: color === key ? `1.5px solid currentColor` : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  <span className={color === key ? cfg.text : 'text-zinc-500'}>{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Coeficiente */}
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
              Coeficiente para NEM
              <span className="ml-1 text-zinc-600 font-normal">(generalmente 1.0)</span>
            </label>
            <input
              type="number"
              value={coefficient}
              onChange={e => setCoefficient(e.target.value)}
              min="0.5"
              max="3"
              step="0.5"
              className="w-24 px-3 py-2 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500/60"
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
              disabled={loading || !name.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7c6af7, #9d8fff)' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : isEdit ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
