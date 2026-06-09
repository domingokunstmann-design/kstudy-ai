'use client'

import { useState } from 'react'
import {
  calculateAverage, simulateNeededGrade, gradeColor, gradeBadgeClass,
  gradeLabel, SUBJECT_COLORS
} from '@/lib/grades/calculator'
import { GradeForm } from './grade-form'
import { SubjectForm } from './subject-form'
import {
  Plus, Pencil, Calculator, Calendar, ChevronRight, ChevronDown,
  BookOpen, Globe, Music, FlaskConical, Users, Activity,
  Target, Monitor, Palette, Hash, FileText, Brain, Star,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Icono por nombre de asignatura ────────────────────────────
function getSubjectIcon(name: string): LucideIcon {
  const n = name.toLowerCase()
  if (n.includes('mat') || n.includes('cálc') || n.includes('calc') || n.includes('álgebr')) return Hash
  if (n.includes('arte') || n.includes('plást') || n.includes('visual')) return Palette
  if (n.includes('músi') || n.includes('music') || n.includes('inter') || n.includes('coral')) return Music
  if (n.includes('cien') && !n.includes('ciudad')) return FlaskConical
  if (n.includes('biolog') || n.includes('quím') || n.includes('físic') && n.includes('cien')) return FlaskConical
  if (n.includes('leng') || n.includes('español') || n.includes('cast') || n.includes('liter')) return FileText
  if (n.includes('ingl') || n.includes('franc') || n.includes('alem') || n.includes('idiom')) return Globe
  if (n.includes('hist') || n.includes('geog') || n.includes('social') || n.includes('ciudadan')) return Users
  if (n.includes('educ') && n.includes('físic')) return Activity
  if (n.includes('educ')) return Users
  if (n.includes('fil') || n.includes('ética') || n.includes('filosof')) return Brain
  if (n.includes('teol') || n.includes('relig') || n.includes('form')) return Star
  if (n.includes('corpor') || n.includes('deport') || n.includes('expresi')) return Activity
  if (n.includes('paes') || n.includes('psu') || n.includes('ensayo')) return Target
  if (n.includes('tecn') || n.includes('inform') || n.includes('comput')) return Monitor
  if (n.includes('físic') && !n.includes('educ')) return FlaskConical
  return BookOpen
}

// ── Color hex por key ─────────────────────────────────────────
const COLOR_HEX: Record<string, { bg: string; icon: string; bar: string }> = {
  indigo:  { bg: 'rgba(99,102,241,0.18)',  icon: '#818cf8', bar: '#6366f1' },
  violet:  { bg: 'rgba(139,92,246,0.18)',  icon: '#a78bfa', bar: '#8b5cf6' },
  rose:    { bg: 'rgba(244,63,94,0.18)',   icon: '#fb7185', bar: '#f43f5e' },
  amber:   { bg: 'rgba(245,158,11,0.18)',  icon: '#fbbf24', bar: '#f59e0b' },
  emerald: { bg: 'rgba(16,185,129,0.18)',  icon: '#34d399', bar: '#10b981' },
  cyan:    { bg: 'rgba(6,182,212,0.18)',   icon: '#22d3ee', bar: '#06b6d4' },
  orange:  { bg: 'rgba(249,115,22,0.18)',  icon: '#fb923c', bar: '#f97316' },
  pink:    { bg: 'rgba(236,72,153,0.18)',  icon: '#f472b6', bar: '#ec4899' },
}

// ── Interfaces ────────────────────────────────────────────────
interface Grade {
  id: string; title: string; grade: number
  percentage: number | null; graded_at: string
  notes: string | null; task_id: string | null
}

interface SubjectCardProps {
  subject: { id: string; name: string; color: string; teacher_name: string | null; coefficient: number }
  grades: Grade[]
  semester: number
  schoolYear: number
}

// ── Componente ────────────────────────────────────────────────
export function SubjectCard({ subject, grades, semester, schoolYear }: SubjectCardProps) {
  const [expanded,       setExpanded]       = useState(false)
  const [showGradeForm,  setShowGradeForm]  = useState(false)
  const [editGrade,      setEditGrade]      = useState<Grade | null>(null)
  const [showSubjectForm,setShowSubjectForm]= useState(false)
  const [showSimulator,  setShowSimulator]  = useState(false)
  const [simTarget,      setSimTarget]      = useState('6.0')
  const [simPct,         setSimPct]         = useState('')

  const colorCfg = SUBJECT_COLORS[subject.color] ?? SUBJECT_COLORS.indigo
  const colorHex = COLOR_HEX[subject.color] ?? COLOR_HEX.indigo
  const Icon     = getSubjectIcon(subject.name)
  const average  = calculateAverage(grades.map(g => ({ ...g, percentage: g.percentage })))

  const simResult = showSimulator && simTarget
    ? simulateNeededGrade(
        grades.map(g => ({ ...g, percentage: g.percentage })),
        parseFloat(simTarget) || 6.0,
        simPct ? parseFloat(simPct) : null,
      )
    : null

  // Barra de progreso: porcentaje del promedio en escala 1-7
  const barPct = average !== null ? ((average - 1) / 6) * 100 : 0

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden transition-all group"
        style={{
          background: 'rgba(15,13,30,0.85)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* ── Cuerpo principal ── */}
        <div className="p-4 pb-3">
          <div className="flex items-start gap-3">

            {/* Icono cuadrado con color */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: colorHex.bg }}
            >
              <Icon className="w-5 h-5" style={{ color: colorHex.icon }} strokeWidth={1.8} />
            </div>

            {/* Info central */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white/90 truncate leading-tight">{subject.name}</h3>
              {subject.teacher_name && (
                <p className="text-[11px] text-white/30 truncate mt-0.5">{subject.teacher_name}</p>
              )}

              <div className="flex items-end justify-between mt-1.5">
                <div>
                  <p className="text-[10px] font-medium text-white/35 uppercase tracking-wider mb-0.5">Promedio</p>
                  {average !== null ? (
                    <p className={`text-2xl font-bold leading-none ${gradeColor(average)}`}>
                      {average.toFixed(1)}
                    </p>
                  ) : (
                    <p className="text-2xl font-bold leading-none text-white/20">—</p>
                  )}
                  <p className="text-[10px] text-white/25 mt-1">
                    {grades.length === 0
                      ? 'Sin notas registradas'
                      : `${grades.length} nota${grades.length !== 1 ? 's' : ''}`
                    }
                  </p>
                </div>

                {/* Acciones derecha */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setShowGradeForm(true)}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    title="Agregar nota"
                    style={{ color: colorHex.icon }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowSimulator(v => !v)}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    title="Simulador"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    <Calculator className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowSubjectForm(true)}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    title="Editar asignatura"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {grades.length > 0 && (
                    <button
                      onClick={() => setExpanded(v => !v)}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      <ChevronRight
                        className="w-4 h-4 transition-transform"
                        style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                      />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mini badges de notas */}
          {grades.length > 0 && !expanded && (
            <div className="flex items-center gap-1 mt-2.5 flex-wrap">
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
                <span className="text-[11px] text-white/25">+{grades.length - 6}</span>
              )}
            </div>
          )}

          {/* Simulador */}
          {showSimulator && (
            <div
              className="mt-3 p-3 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)' }}
            >
              <p className="text-xs font-semibold text-amber-400 mb-2">¿Qué nota necesito para llegar a…?</p>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <p className="text-[10px] text-white/30 mb-1">Meta</p>
                  <input
                    type="number" value={simTarget}
                    onChange={e => setSimTarget(e.target.value)}
                    min="1" max="7" step="0.1"
                    className="w-full px-2 py-1.5 rounded-lg text-xs text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div className="w-24">
                  <p className="text-[10px] text-white/30 mb-1">Ponderación %</p>
                  <input
                    type="number" value={simPct}
                    onChange={e => setSimPct(e.target.value)}
                    placeholder="Ej: 30"
                    min="1" max="100"
                    className="w-full px-2 py-1.5 rounded-lg text-xs text-white placeholder-white/20 outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>
              {simResult && (
                <p className={cn('mt-2 text-xs', simResult.possible ? 'text-amber-300' : 'text-rose-400')}>
                  {simResult.possible
                    ? <><span className="font-bold text-sm">{simResult.needed?.toFixed(1)}</span> — {simResult.message}</>
                    : simResult.message
                  }
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Barra de progreso coloreada ── */}
        <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {average !== null && (
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${barPct}%`, background: colorHex.bar, opacity: 0.7 }}
            />
          )}
        </div>

        {/* ── Lista de notas expandida ── */}
        {expanded && grades.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {grades.map(g => (
              <button
                key={g.id}
                onClick={() => setEditGrade(g)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left group/row"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <span className={`text-base font-bold w-10 flex-shrink-0 ${gradeColor(g.grade)}`}>
                  {g.grade.toFixed(1)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">{g.title}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">
                    {new Date(g.graded_at + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                    {g.percentage != null && ` · ${g.percentage}%`}
                  </p>
                </div>
                <Pencil className="w-3 h-3 text-white/20 group-hover/row:text-white/50 flex-shrink-0" />
              </button>
            ))}
            <button
              onClick={() => setShowGradeForm(true)}
              className="w-full flex items-center gap-2 px-4 py-3 text-xs font-medium hover:bg-white/[0.02] transition-colors"
              style={{ color: colorHex.icon }}
            >
              <Plus className="w-3.5 h-3.5" /> Agregar nota
            </button>
          </div>
        )}
      </div>

      {/* Modales */}
      {showGradeForm && (
        <GradeForm subjectId={subject.id} subjectName={subject.name} onClose={() => setShowGradeForm(false)} />
      )}
      {editGrade && (
        <GradeForm subjectId={subject.id} subjectName={subject.name} onClose={() => setEditGrade(null)} editGrade={editGrade} />
      )}
      {showSubjectForm && (
        <SubjectForm onClose={() => setShowSubjectForm(false)} editSubject={subject} semester={semester} schoolYear={schoolYear} />
      )}
    </>
  )
}
