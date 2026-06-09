'use client'

import { useState, useEffect } from 'react'
import { addGrade, getSubjects } from '@/lib/actions/grades'
import { Star, X, Loader2, Plus } from 'lucide-react'
import { gradeColor } from '@/lib/grades/calculator'
import { SubjectForm } from './subject-form'

interface GradeAfterTaskModalProps {
  task: {
    id: string
    title: string
    course_name: string | null
  }
  onClose: () => void
  onSkip: () => void
}

export function GradeAfterTaskModal({ task, onClose, onSkip }: GradeAfterTaskModalProps) {
  const [subjects, setSubjects] = useState<{ id: string; name: string; color: string }[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [gradeVal, setGradeVal] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [error, setError] = useState('')
  const [showNewSubject, setShowNewSubject] = useState(false)

  const currentMonth = new Date().getMonth() + 1
  const currentSemester = currentMonth <= 6 ? 1 : 2
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    getSubjects().then(({ data }) => {
      const list = data ?? []
      setSubjects(list)

      // Pre-seleccionar asignatura que coincida con el nombre del curso
      if (task.course_name) {
        const match = list.find(s =>
          s.name.toLowerCase().includes(task.course_name!.toLowerCase()) ||
          task.course_name!.toLowerCase().includes(s.name.toLowerCase())
        )
        if (match) setSelectedSubject(match.id)
      }

      setLoadingSubjects(false)
    })
  }, [task.course_name])

  const gradeNum = parseFloat(gradeVal)
  const isValid = !isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= 7 && !!selectedSubject

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    setError('')

    const result = await addGrade({
      subject_id: selectedSubject,
      title: task.title,
      grade: gradeNum,
      task_id: task.id,
    })

    setLoading(false)
    if (result?.error) setError(result.error)
    else onClose()
  }

  if (showNewSubject) {
    return (
      <SubjectForm
        onClose={() => {
          setShowNewSubject(false)
          // Recargar asignaturas
          getSubjects().then(({ data }) => {
            setSubjects(data ?? [])
          })
        }}
        semester={currentSemester}
        schoolYear={currentYear}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-sm rounded-2xl p-5 relative"
        style={{ background: '#131326', border: '1px solid rgba(124,106,247,0.25)' }}
      >
        <button onClick={onSkip} className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-400">
          <X className="w-4 h-4" />
        </button>

        {/* Ícono + título */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <Star className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">¿Ya tienes tu nota?</p>
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{task.title}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Asignatura */}
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Asignatura</label>
            {loadingSubjects ? (
              <div className="flex items-center gap-2 text-zinc-600 text-xs py-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Cargando...
              </div>
            ) : subjects.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowNewSubject(true)}
                className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300"
              >
                <Plus className="w-3 h-3" /> Crear asignatura primero
              </button>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {subjects.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSubject(s.id)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: selectedSubject === s.id ? 'rgba(124,106,247,0.2)' : 'rgba(255,255,255,0.04)',
                      border: selectedSubject === s.id ? '1px solid rgba(124,106,247,0.4)' : '1px solid rgba(255,255,255,0.07)',
                      color: selectedSubject === s.id ? '#a89dff' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {s.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowNewSubject(true)}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-zinc-600 hover:text-zinc-400 transition-colors border border-dashed"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  + Nueva
                </button>
              </div>
            )}
          </div>

          {/* Nota */}
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Tu nota</label>
            <input
              type="number"
              value={gradeVal}
              onChange={e => setGradeVal(e.target.value)}
              placeholder="1.0 – 7.0"
              min="1"
              max="7"
              step="0.1"
              autoFocus
              className={`w-full px-3 py-3 rounded-xl text-2xl font-bold text-center outline-none focus:ring-1 focus:ring-indigo-500/60 ${
                gradeVal && !isNaN(gradeNum) ? gradeColor(gradeNum) : 'text-zinc-400'
              }`}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              Después
            </button>
            <button
              type="submit"
              disabled={loading || !isValid}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #7c6af7, #9d8fff)' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
