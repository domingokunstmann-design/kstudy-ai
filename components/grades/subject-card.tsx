'use client'

import { useState } from 'react'
import { calculateAverage, simulateNeededGrade, gradeColor, gradeBadgeClass, gradeLabel, SUBJECT_COLORS } from '@/lib/grades/calculator'
import { GradeForm } from './grade-form'
import { SubjectForm } from './subject-form'
import { Plus, ChevronDown, ChevronUp, Pencil, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Grade {
  id: string
  title: string
  grade: number
  percentage: number | null
  graded_at: string
  notes: string | null
  task_id: string | null
}

interface SubjectCardProps {
  subject: {
    id: string
    name: string
    color: string
    teacher_name: string | null
    coefficient: number
  }
  grades: Grade[]
  semester: number
  schoolYear: number
}

export function SubjectCard({ subject, grades, semester, schoolYear }: SubjectCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showGradeForm, setShowGradeForm] = useState(false)
  const [editGrade, setEditGrade] = useState<Grade | null>(null)
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [showSimulator, setShowSimulator] = useState(false)
  const [simTarget, setSimTarget] = useState('6.0')
  const [simPct, setSimPct] = useState('')

  const colorCfg = SUBJECT_COLORS[subject.color] ?? SUBJECT_COLORS.indigo
  const average = calculateAverage(grades.map(g => ({ ...g, percentage: g.percentage })))

  const simResult = showSimulator && simTarget
    ? simulateNeededGrade(
        grades.map(g => ({ ...g, percentage: g.percentage })),
        parseFloat(simTarget) || 6.0,
        simPct ? parseFloat(simPct) : null,
      )
    : null

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden transition-all"
        style={{ background: 'rgba(19,19,38,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Header de la asignatura */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Dot de color */}
            <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${colorCfg.dot}`} />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{subject.name}</h3>
                  {subject.teacher_name && (
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{subject.teacher_name}</p>
                  )}
                </div>

                {/* Promedio */}
                <div className="flex-shrink-0 text-right">
                  {average !== null ? (
                    <>
                      <p className={`text-2xl font-bold leading-none ${gradeColor(average)}`}>
                        {average.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{gradeLabel(average)}</p>
                    </>
                  ) : (
                    <p className="text-sm text-zinc-600">Sin notas</p>
                  )}
                </div>
              </div>

              {/* Mini-barra de notas */}
              {grades.length > 0 && (
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {grades.slice(0, 6).map(g => (
                    <button
                      key={g.id}
                      onClick={() => { setEditGrade(g); setExpanded(true) }}
                      className={cn('text-[11px] font-bold px-1.5 py-0.5 rounded border transition-opacity hover:opacity-80', gradeBadgeClass(g.grade))}
                      title={g.title}
                    >
                      {g.grade.toFixed(1)}
                    </button>
                  ))}
                  {grades.length > 6 && (
                    <span className="text-[11px] text-zinc-600">+{grades.length - 6}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setShowGradeForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-400 hover:bg-indigo-500/10 transition-colors border border-indigo-500/20"
            >
              <Plus className="w-3 h-3" /> Agregar nota
            </button>
            <button
              onClick={() => setShowSimulator(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors border border-amber-500/20"
            >
              <Calculator className="w-3 h-3" /> Simular
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setShowSubjectForm(true)}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            {grades.length > 0 && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* Simulador */}
          {showSimulator && (
            <div
              className="mt-3 p-3 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)' }}
            >
              <p className="text-xs font-semibold text-amber-400 mb-2">¿Qué nota necesito?</p>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <p className="text-[10px] text-zinc-500 mb-1">Meta de promedio</p>
                  <input
                    type="number"
                    value={simTarget}
                    onChange={e => setSimTarget(e.target.value)}
                    min="1" max="7" step="0.1"
                    className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div className="w-24">
                  <p className="text-[10px] text-zinc-500 mb-1">Ponderación (%)</p>
                  <input
                    type="number"
                    value={simPct}
                    onChange={e => setSimPct(e.target.value)}
                    placeholder="Ej: 30"
                    min="1" max="100"
                    className="w-full px-2 py-1.5 rounded-lg text-xs text-white placeholder-zinc-600 outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>
              {simResult && (
                <div className="mt-2">
                  {simResult.possible ? (
                    <p className="text-xs text-amber-300">
                      <span className="font-bold text-sm">{simResult.needed?.toFixed(1)}</span>
                      {' '}— {simResult.message}
                    </p>
                  ) : (
                    <p className="text-xs text-rose-400">{simResult.message}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lista detallada de notas (expandida) */}
        {expanded && grades.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {grades.map(g => (
              <button
                key={g.id}
                onClick={() => setEditGrade(g)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left group"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <span className={`text-base font-bold w-10 flex-shrink-0 ${gradeColor(g.grade)}`}>
                  {g.grade.toFixed(1)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">{g.title}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    {new Date(g.graded_at + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                    {g.percentage != null && ` · ${g.percentage}%`}
                  </p>
                </div>
                <Pencil className="w-3 h-3 text-zinc-700 group-hover:text-zinc-500 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      {showGradeForm && (
        <GradeForm
          subjectId={subject.id}
          subjectName={subject.name}
          onClose={() => setShowGradeForm(false)}
        />
      )}
      {editGrade && (
        <GradeForm
          subjectId={subject.id}
          subjectName={subject.name}
          onClose={() => setEditGrade(null)}
          editGrade={editGrade}
        />
      )}
      {showSubjectForm && (
        <SubjectForm
          onClose={() => setShowSubjectForm(false)}
          editSubject={subject}
          semester={semester}
          schoolYear={schoolYear}
        />
      )}
    </>
  )
}
