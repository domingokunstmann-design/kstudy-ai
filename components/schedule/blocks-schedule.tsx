'use client'

import { useState } from 'react'
import { addSchoolPeriod, deleteSchoolPeriod, copyDayToAllDays } from '@/lib/actions/schedule'
import { Plus, Trash2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const SCHOOL_DAYS = [1, 2, 3, 4, 5] // Lun-Vie

const PERIOD_TYPES = [
  { value: 'class', label: 'Clase', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  { value: 'break', label: 'Recreo', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { value: 'lunch', label: 'Almuerzo', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  { value: 'pe', label: 'Ed. Física', color: '#f43f5e', bg: 'rgba(244,63,94,0.15)' },
  { value: 'free', label: 'Libre', color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
]

interface Period {
  id: string
  day_of_week: number
  period_type: string
  subject: string | null
  start_time: string
  end_time: string
  color: string
}

interface Props {
  scheduleId: string
  initialPeriods: Period[]
}

export function BlocksSchedule({ scheduleId, initialPeriods }: Props) {
  const [selectedDay, setSelectedDay] = useState(1)
  const [periods, setPeriods] = useState<Period[]>(initialPeriods)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [pType, setPType] = useState<'class' | 'break' | 'lunch' | 'free' | 'pe'>('class')
  const [pSubject, setPSubject] = useState('')
  const [pStart, setPStart] = useState('08:00')
  const [pEnd, setPEnd] = useState('09:20')
  const [loading, setLoading] = useState(false)

  const dayPeriods = periods
    .filter(p => p.day_of_week === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  async function handleAdd() {
    setLoading(true)
    const result = await addSchoolPeriod({
      schedule_id: scheduleId,
      day_of_week: selectedDay,
      period_type: pType,
      subject: pType === 'class' || pType === 'pe' ? pSubject || null : null,
      start_time: pStart,
      end_time: pEnd,
      color: PERIOD_TYPES.find(t => t.value === pType)?.value ?? 'indigo',
    })
    setLoading(false)
    if (result.success) {
      // Optimistic update
      setPeriods(prev => [...prev, {
        id: crypto.randomUUID(),
        day_of_week: selectedDay,
        period_type: pType,
        subject: pType === 'class' || pType === 'pe' ? pSubject || null : null,
        start_time: pStart,
        end_time: pEnd,
        color: pType,
      }])
      setShowForm(false)
      setPSubject('')
    }
  }

  async function handleDelete(id: string) {
    await deleteSchoolPeriod(id)
    setPeriods(prev => prev.filter(p => p.id !== id))
  }

  async function handleCopyToAll() {
    if (!confirm(`¿Copiar el horario del ${DAYS[selectedDay]} a todos los días de semana?`)) return
    await copyDayToAllDays(selectedDay, scheduleId)
    // Reload optimistically - just prompt user to refresh
    window.location.reload()
  }

  const getPeriodStyle = (type: string) => {
    return PERIOD_TYPES.find(t => t.value === type) ?? PERIOD_TYPES[0]
  }

  return (
    <div className="space-y-4">
      {/* Day selector */}
      <div>
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">Día</label>
        <div className="flex gap-2">
          {SCHOOL_DAYS.map(d => (
            <button key={d} onClick={() => setSelectedDay(d)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: selectedDay === d ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                border: selectedDay === d ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
                color: selectedDay === d ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
              }}
            >
              {DAYS[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline del día */}
      <div className="space-y-1.5">
        {dayPeriods.length === 0 && (
          <div className="text-center py-6 text-white/25 text-sm">
            Sin bloques — agrega el primer período del día
          </div>
        )}
        {dayPeriods.map(period => {
          const style = getPeriodStyle(period.period_type)
          const [sh, sm] = period.start_time.split(':').map(Number)
          const [eh, em] = period.end_time.split(':').map(Number)
          const mins = (eh * 60 + em) - (sh * 60 + sm)

          return (
            <div key={period.id} className="flex items-center gap-3 p-3 rounded-xl group"
              style={{ background: style.bg, border: `1px solid ${style.color}33` }}>
              <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: style.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white/90">
                  {period.subject ?? style.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: style.color }}>
                  {period.start_time.slice(0,5)} – {period.end_time.slice(0,5)} · {mins} min
                </p>
              </div>
              <button onClick={() => handleDelete(period.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-red-400 p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Botones acción */}
      <div className="flex gap-2">
        <button onClick={() => setShowForm(!showForm)}
          className="btn-primary flex-1 justify-center text-sm">
          <Plus className="w-4 h-4" />
          Agregar bloque
        </button>
        {dayPeriods.length > 0 && (
          <button onClick={handleCopyToAll}
            className="btn-ghost text-sm"
            title="Copiar este horario a todos los días de semana">
            <Copy className="w-4 h-4" />
            Copiar a todos
          </button>
        )}
      </div>

      {/* Formulario inline */}
      {showForm && (
        <div className="p-4 rounded-2xl space-y-4 animate-scale-in"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

          {/* Tipo */}
          <div>
            <label className="text-xs font-semibold text-white/40 block mb-2">Tipo de bloque</label>
            <div className="flex flex-wrap gap-2">
              {PERIOD_TYPES.map(t => (
                <button key={t.value} onClick={() => setPType(t.value as any)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: pType === t.value ? t.bg : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${pType === t.value ? t.color + '66' : 'rgba(255,255,255,0.07)'}`,
                    color: pType === t.value ? t.color : 'rgba(255,255,255,0.4)',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Asignatura (solo para clases) */}
          {(pType === 'class' || pType === 'pe') && (
            <div>
              <label className="text-xs font-semibold text-white/40 block mb-2">Asignatura</label>
              <input
                type="text"
                value={pSubject}
                onChange={e => setPSubject(e.target.value)}
                placeholder="Ej: Matemáticas, Lenguaje, Historia..."
                className="kstudy-input w-full"
                autoFocus
              />
            </div>
          )}

          {/* Horario */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-white/40 block mb-1.5">Inicio</label>
              <input type="time" value={pStart} onChange={e => setPStart(e.target.value)} className="kstudy-input w-full" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/40 block mb-1.5">Fin</label>
              <input type="time" value={pEnd} onChange={e => setPEnd(e.target.value)} className="kstudy-input w-full" />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={loading} className="btn-primary flex-1 justify-center text-sm">
              {loading ? 'Agregando...' : 'Agregar'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
