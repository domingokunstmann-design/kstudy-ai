'use client'

import { useState } from 'react'
import { SubjectCard } from '@/components/grades/subject-card'
import { SubjectForm } from '@/components/grades/subject-form'
import { ImportFromScheduleButton } from '@/components/grades/import-from-schedule-button'
import { calculateAverage, SUBJECT_COLORS } from '@/lib/grades/calculator'
import { Plus, BookOpen, TrendingUp } from 'lucide-react'

interface Subject {
  id: string
  name: string
  color: string
  teacher_name: string | null
  coefficient: number
  semester: number
  school_year: number
}

interface Grade {
  id: string
  subject_id: string
  title: string
  grade: number
  percentage: number | null
  graded_at: string
  notes: string | null
  task_id: string | null
}

interface GradesClientProps {
  initialData: {
    subjects: Subject[]
    grades: Grade[]
    currentSemester: number
    currentYear: number
  } | null
}

export function GradesClient({ initialData }: GradesClientProps) {
  const [showSubjectForm, setShowSubjectForm] = useState(false)

  if (!initialData) {
    return (
      <div className="p-6 text-center text-zinc-500">
        <p>Error cargando las notas. Intenta recargar la página.</p>
      </div>
    )
  }

  const { subjects, grades, currentSemester, currentYear } = initialData

  // Agrupar notas por asignatura
  const gradesBySubject = grades.reduce<Record<string, Grade[]>>((acc, g) => {
    if (!acc[g.subject_id]) acc[g.subject_id] = []
    acc[g.subject_id].push(g)
    return acc
  }, {})

  // Promedios por asignatura para el resumen superior
  const subjectsWithAvg = subjects.map(s => ({
    ...s,
    grades: gradesBySubject[s.id] ?? [],
    average: calculateAverage((gradesBySubject[s.id] ?? []).map(g => ({ ...g, percentage: g.percentage }))),
  }))

  // Promedio general (solo asignaturas con al menos 1 nota)
  const subjectsWithGrades = subjectsWithAvg.filter(s => s.average !== null)
  const overallAverage = subjectsWithGrades.length > 0
    ? Math.round(
        subjectsWithGrades.reduce((sum, s) => sum + s.average! * s.coefficient, 0) /
        subjectsWithGrades.reduce((sum, s) => sum + s.coefficient, 0) * 10
      ) / 10
    : null

  const semesterLabel = currentSemester === 1 ? 'Primer semestre' : 'Segundo semestre'

  return (
    <div className="p-4 lg:p-7 max-w-4xl mx-auto space-y-5 lg:space-y-7 animate-fade-in">

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>
            {semesterLabel} · {currentYear}
          </p>
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Mis notas
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ImportFromScheduleButton />
          <button
            onClick={() => setShowSubjectForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c6af7, #9d8fff)' }}
          >
            <Plus className="w-4 h-4" />
            Nueva
          </button>
        </div>
      </div>

      {/* Resumen superior */}
      {subjectsWithGrades.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(124,106,247,0.1) 0%, rgba(19,15,38,0.6) 100%)',
            border: '1px solid rgba(124,106,247,0.2)',
          }}
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Promedio general</p>
              </div>
              {overallAverage !== null ? (
                <p className={`text-5xl font-bold ${
                  overallAverage >= 6 ? 'text-emerald-400'
                  : overallAverage >= 5 ? 'text-lime-400'
                  : overallAverage >= 4 ? 'text-amber-400'
                  : 'text-rose-400'
                }`}>
                  {overallAverage.toFixed(1)}
                </p>
              ) : (
                <p className="text-2xl font-bold text-zinc-500">—</p>
              )}
              <p className="text-xs text-zinc-500 mt-1">{subjectsWithGrades.length} asignatura{subjectsWithGrades.length !== 1 ? 's' : ''} con notas</p>
            </div>

            {/* Mini-ranking de asignaturas */}
            <div className="flex-1 max-w-xs space-y-1.5">
              {subjectsWithAvg
                .filter(s => s.average !== null)
                .sort((a, b) => (b.average ?? 0) - (a.average ?? 0))
                .slice(0, 4)
                .map(s => {
                  const colorCfg = SUBJECT_COLORS[s.color] ?? SUBJECT_COLORS.indigo
                  return (
                    <div key={s.id} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colorCfg.dot}`} />
                      <span className="text-xs text-zinc-400 flex-1 truncate">{s.name}</span>
                      <span className={`text-xs font-bold ${
                        s.average! >= 6 ? 'text-emerald-400'
                        : s.average! >= 5 ? 'text-lime-400'
                        : s.average! >= 4 ? 'text-amber-400'
                        : 'text-rose-400'
                      }`}>
                        {s.average!.toFixed(1)}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* Asignaturas */}
      {subjects.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.2)' }}
          >
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="text-base font-semibold text-white/60 mb-1">Sin asignaturas aún</p>
          <p className="text-sm text-zinc-600 mb-5 max-w-xs">
            Agrega tus asignaturas para empezar a registrar notas y calcular tu promedio.
          </p>
          <div className="flex flex-col items-center gap-3">
            <ImportFromScheduleButton />
            <button
              onClick={() => setShowSubjectForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #7c6af7, #9d8fff)' }}
            >
              <Plus className="w-4 h-4" /> Agregar manualmente
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectsWithAvg.map(s => (
            <SubjectCard
              key={s.id}
              subject={s}
              grades={s.grades}
              semester={currentSemester}
              schoolYear={currentYear}
            />
          ))}
        </div>
      )}

      {/* Modal nueva asignatura */}
      {showSubjectForm && (
        <SubjectForm
          onClose={() => setShowSubjectForm(false)}
          semester={currentSemester}
          schoolYear={currentYear}
        />
      )}
    </div>
  )
}
