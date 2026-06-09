'use client'

import { useState, useMemo } from 'react'
import { SubjectCard } from '@/components/grades/subject-card'
import { SubjectForm } from '@/components/grades/subject-form'
import { ImportFromScheduleButton } from '@/components/grades/import-from-schedule-button'
import { calculateAverage } from '@/lib/grades/calculator'
import { Plus, BookOpen, TrendingUp, Award, AlertCircle, Search, LayoutGrid, List, ChevronDown } from 'lucide-react'

interface Subject {
  id: string; name: string; color: string
  teacher_name: string | null; coefficient: number
  semester: number; school_year: number
}

interface Grade {
  id: string; subject_id: string; title: string; grade: number
  percentage: number | null; graded_at: string; notes: string | null; task_id: string | null
}

interface GradesClientProps {
  initialData: {
    subjects: Subject[]; grades: Grade[]
    currentSemester: number; currentYear: number
  } | null
}

type SortKey = 'az' | 'za' | 'avg_desc' | 'avg_asc' | 'count'
const SORT_LABELS: Record<SortKey, string> = {
  az:       'A → Z',
  za:       'Z → A',
  avg_desc: 'Mayor promedio',
  avg_asc:  'Menor promedio',
  count:    'Más notas',
}

export function GradesClient({ initialData }: GradesClientProps) {
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [search,       setSearch]       = useState('')
  const [view,         setView]         = useState<'grid' | 'list'>('grid')
  const [sort,         setSort]         = useState<SortKey>('az')
  const [showSortMenu, setShowSortMenu] = useState(false)

  if (!initialData) {
    return (
      <div className="p-6 text-center text-zinc-500">
        <p>Error cargando las notas. Intenta recargar la página.</p>
      </div>
    )
  }

  const { subjects, grades, currentSemester, currentYear } = initialData

  const gradesBySubject = grades.reduce<Record<string, Grade[]>>((acc, g) => {
    if (!acc[g.subject_id]) acc[g.subject_id] = []
    acc[g.subject_id].push(g)
    return acc
  }, {})

  const subjectsWithAvg = useMemo(() => subjects.map(s => ({
    ...s,
    grades: gradesBySubject[s.id] ?? [],
    average: calculateAverage((gradesBySubject[s.id] ?? []).map(g => ({ ...g, percentage: g.percentage }))),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [subjects, grades])

  const subjectsWithGrades = subjectsWithAvg.filter(s => s.average !== null)
  const overallAverage = subjectsWithGrades.length > 0
    ? Math.round(
        subjectsWithGrades.reduce((sum, s) => sum + s.average! * s.coefficient, 0) /
        subjectsWithGrades.reduce((sum, s) => sum + s.coefficient, 0) * 10
      ) / 10
    : null

  const bestSubject  = [...subjectsWithGrades].sort((a, b) => (b.average ?? 0) - (a.average ?? 0))[0]
  const pendingCount = subjectsWithAvg.filter(s => s.grades.length === 0).length

  const filtered = useMemo(() => {
    let list = subjectsWithAvg.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase())
    )
    switch (sort) {
      case 'az':       list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break
      case 'za':       list = [...list].sort((a, b) => b.name.localeCompare(a.name)); break
      case 'avg_desc': list = [...list].sort((a, b) => (b.average ?? -1) - (a.average ?? -1)); break
      case 'avg_asc':  list = [...list].sort((a, b) => (a.average ?? 99) - (b.average ?? 99)); break
      case 'count':    list = [...list].sort((a, b) => b.grades.length - a.grades.length); break
    }
    return list
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectsWithAvg, search, sort])

  const semesterLabel = currentSemester === 1 ? 'Primer semestre' : 'Segundo semestre'

  const avgColor = overallAverage !== null
    ? overallAverage >= 6 ? '#4ade80' : overallAverage >= 5 ? '#a3e635' : overallAverage >= 4 ? '#fbbf24' : '#f87171'
    : '#71717a'

  const STATS = [
    {
      label: 'Asignaturas',
      value: subjects.length,
      sub: 'Con registro de notas',
      icon: BookOpen,
      color: '#818cf8',
      bg: 'rgba(99,102,241,0.1)',
      border: 'rgba(99,102,241,0.2)',
    },
    {
      label: 'Promedio general',
      value: overallAverage !== null ? overallAverage.toFixed(1) : '—',
      sub: 'Todas las asignaturas',
      icon: TrendingUp,
      color: avgColor,
      bg: 'rgba(16,185,129,0.08)',
      border: 'rgba(16,185,129,0.15)',
    },
    {
      label: 'Mejor nota',
      value: bestSubject ? bestSubject.average!.toFixed(1) : '—',
      sub: bestSubject?.name ?? 'Sin datos',
      icon: Award,
      color: '#fbbf24',
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.15)',
    },
    {
      label: 'Notas pendientes',
      value: pendingCount,
      sub: 'Sin calificar',
      icon: AlertCircle,
      color: pendingCount > 0 ? '#f87171' : '#71717a',
      bg: pendingCount > 0 ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.03)',
      border: pendingCount > 0 ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.06)',
    },
  ]

  return (
    <div className="p-4 lg:p-7 max-w-5xl mx-auto space-y-5 lg:space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>
            {semesterLabel} · {currentYear}
          </p>
          <h1 className="text-[26px] font-bold tracking-tight text-white">Mis notas</h1>
        </div>
        <div className="flex items-center gap-2">
          <ImportFromScheduleButton />
          <button
            onClick={() => setShowSubjectForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c6af7, #9d8fff)' }}
          >
            <Plus className="w-4 h-4" />
            Nueva nota
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {subjects.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map(stat => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="rounded-2xl p-4"
                style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
              >
                <Icon className="w-4 h-4 mb-2" style={{ color: stat.color }} />
                <p className="text-[28px] font-bold leading-none mb-1" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-xs font-semibold text-white/60">{stat.label}</p>
                <p className="text-[10px] text-white/25 mt-0.5 truncate">{stat.sub}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Barra de filtros */}
      {subjects.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className="flex items-center gap-2 flex-1 min-w-[160px] px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Search className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
            <input
              type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar asignatura..."
              className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none min-w-0"
            />
          </div>

          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setView('grid')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all"
              style={{
                background: view === 'grid' ? 'rgba(124,106,247,0.2)' : 'rgba(255,255,255,0.03)',
                color: view === 'grid' ? '#a89dff' : 'rgba(255,255,255,0.3)',
              }}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Tarjetas
            </button>
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all"
              style={{
                background: view === 'list' ? 'rgba(124,106,247,0.2)' : 'rgba(255,255,255,0.03)',
                color: view === 'list' ? '#a89dff' : 'rgba(255,255,255,0.3)',
                borderLeft: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <List className="w-3.5 h-3.5" /> Tabla
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowSortMenu(v => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
            >
              Ordenar por: <span className="text-white/80">{SORT_LABELS[sort]}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <div
                  className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden min-w-[160px]"
                  style={{ background: 'rgba(18,16,34,0.98)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                >
                  {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setSort(key); setShowSortMenu(false) }}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium transition-colors hover:bg-white/5"
                      style={{ color: sort === key ? '#a89dff' : 'rgba(255,255,255,0.5)' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Contenido */}
      {subjects.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.2)' }}
          >
            <BookOpen className="w-7 h-7 text-indigo-400" />
          </div>
          <p className="text-base font-semibold text-white/60 mb-1">Sin asignaturas aún</p>
          <p className="text-sm text-white/25 mb-6 max-w-xs">
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

      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-white/30 text-sm">
          No hay asignaturas que coincidan con &quot;{search}&quot;
        </div>

      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(s => (
            <SubjectCard
              key={s.id} subject={s} grades={s.grades}
              semester={currentSemester} schoolYear={currentYear}
            />
          ))}
        </div>

      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Asignatura', 'Notas', 'Promedio', 'Mejor', 'Peor'].map(h => (
                  <th key={h} className={`px-5 py-3 text-[11px] font-semibold text-white/40 uppercase tracking-wider ${h === 'Asignatura' ? 'text-left' : 'text-center'} ${['Mejor','Peor'].includes(h) ? 'hidden lg:table-cell' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const colorHex: Record<string,string> = {
                  indigo: '#818cf8', violet: '#a78bfa', rose: '#fb7185',
                  amber: '#fbbf24', emerald: '#34d399', cyan: '#22d3ee',
                  orange: '#fb923c', pink: '#f472b6',
                }
                const hex = colorHex[s.color] ?? '#818cf8'
                const best  = s.grades.length ? Math.max(...s.grades.map(g => g.grade)) : null
                const worst = s.grades.length ? Math.min(...s.grades.map(g => g.grade)) : null
                const ac = s.average !== null
                  ? s.average >= 6 ? '#4ade80' : s.average >= 5 ? '#a3e635' : s.average >= 4 ? '#fbbf24' : '#f87171'
                  : '#52525b'
                return (
                  <tr key={s.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: hex }} />
                        <span className="text-sm font-medium text-white/80">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm text-white/40">{s.grades.length}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-base font-bold" style={{ color: ac }}>
                        {s.average !== null ? s.average.toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm text-emerald-400 hidden lg:table-cell">
                      {best !== null ? best.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm text-rose-400 hidden lg:table-cell">
                      {worst !== null ? worst.toFixed(1) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showSubjectForm && (
        <SubjectForm onClose={() => setShowSubjectForm(false)} semester={currentSemester} schoolYear={currentYear} />
      )}
    </div>
  )
}
