'use client'

import { useState } from 'react'
import { addSchoolPeriod, deleteSchoolPeriod, copyDayToAllDays } from '@/lib/actions/schedule'
import { Plus, Trash2, Copy } from 'lucide-react'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const SCHOOL_DAYS = [1, 2, 3, 4, 5]

const PERIOD_TYPES = [
  { value: 'class',  label: 'Clase',      color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  { value: 'break',  label: 'Recreo',     color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { value: 'lunch',  label: 'Almuerzo',   color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  { value: 'pe',     label: 'Ed. Física', color: '#f43f5e', bg: 'rgba(244,63,94,0.15)'  },
  { value: 'free',   label: 'Libre',      color: '#64748b', bg: 'rgba(100,116,139,0.15)'},
]

// Paleta de colores para elegir asignatura
const COLOR_PALETTE = [
  { id: 'indigo',  color: '#6366f1' },
  { id: 'purple',  color: '#a855f7' },
  { id: 'pink',    color: '#ec4899' },
  { id: 'sky',     color: '#0ea5e9' },
  { id: 'teal',    color: '#14b8a6' },
  { id: 'green',   color: '#22c55e' },
  { id: 'yellow',  color: '#eab308' },
  { id: 'orange',  color: '#f97316' },
  { id: 'rose',    color: '#f43f5e' },
  { id: 'slate',   color: '#64748b' },
]

// Colores fijos para period_type no-clase
const TYPE_COLORS: Record<string, string> = {
  break: '#f59e0b',
  lunch: '#10b981',
  pe: '#f43f5e',
  free: '#64748b',
}

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

function getPeriodBg(type: string, color: string) {
  const hex = color.replace('#','')
  const r = parseInt(hex.slice(0,2),16)
  const g = parseInt(hex.slice(2,4),16)
  const b = parseInt(hex.slice(4,6),16)
  return `rgba(${r},${g},${b},0.15)`
}

export function BlocksSchedule({ scheduleId, initialPeriods }: Props) {
  const [selectedDay, setSelectedDay] = useState(1)
  const [periods, setPeriods]         = useState<Period[]>(initialPeriods)
  const [showForm, setShowForm]       = useState(false)

  // Form state
  const [pType,    setPType]    = useState<'class'|'break'|'lunch'|'free'|'pe'>('class')
  const [pSubject, setPSubject] = useState('')
  const [pStart,   setPStart]   = useState('08:00')
  const [pEnd,     setPEnd]     = useState('09:20')
  const [pColor,   setPColor]   = useState('indigo')
  const [pDays,    setPDays]    = useState<number[]>([1]) // días en que se repite
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const dayPeriods = periods
    .filter(p => p.day_of_week === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  function toggleRepeatDay(d: number) {
    setPDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  // Obtener color final (para class/pe usa el elegido, para otros usa el fijo del tipo)
  function getFinalColor() {
    if (pType === 'class' || pType === 'pe') {
      return COLOR_PALETTE.find(c => c.id === pColor)?.color ?? '#6366f1'
    }
    return TYPE_COLORS[pType] ?? '#6366f1'
  }

  async function handleAdd() {
    if (pDays.length === 0) { setError('Selecciona al menos un día'); return }
    if (pEnd <= pStart) { setError('La hora de fin debe ser después del inicio'); return }
    setError('')
    setLoading(true)

    const finalColor = getFinalColor()
    const subject = (pType === 'class' || pType === 'pe') ? (pSubject || null) : null

    // Insertar en cada día seleccionado
    for (const day of pDays) {
      await addSchoolPeriod({
        schedule_id: scheduleId,
        day_of_week: day,
        period_type: pType,
        subject,
        start_time: pStart,
        end_time: pEnd,
        color: finalColor,
      })
    }

    // Actualizar estado local optimistamente
    const newPeriods = pDays.map(day => ({
      id: crypto.randomUUID(),
      day_of_week: day,
      period_type: pType,
      subject,
      start_time: pStart,
      end_time: pEnd,
      color: finalColor,
    }))
    setPeriods(prev => [...prev, ...newPeriods])

    setLoading(false)
    setShowForm(false)
    setPSubject('')
    setPDays([selectedDay])
  }

  async function handleDelete(id: string) {
    await deleteSchoolPeriod(id)
    setPeriods(prev => prev.filter(p => p.id !== id))
  }

  async function handleCopyToAll() {
    if (!confirm(`¿Copiar el horario del ${DAYS[selectedDay]} a todos los días de semana?`)) return
    await copyDayToAllDays(selectedDay, scheduleId)
    window.location.reload()
  }

  return (
    <div className="space-y-4">

      {/* Selector de día */}
      <div>
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">Día</label>
        <div className="flex gap-2">
          {SCHOOL_DAYS.map(d => (
            <button key={d} onClick={() => { setSelectedDay(d); setPDays([d]) }}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: selectedDay === d ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                border: selectedDay === d ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
                color: selectedDay === d ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
              }}>
              {DAYS[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de períodos del día */}
      <div className="space-y-1.5">
        {dayPeriods.length === 0 && (
          <div className="text-center py-6 text-white/25 text-sm">
            Sin bloques — agrega el primer período del día
          </div>
        )}
        {dayPeriods.map(period => {
          const typeInfo  = PERIOD_TYPES.find(t => t.value === period.period_type) ?? PERIOD_TYPES[0]
          const barColor  = period.color || typeInfo.color
          const [sh, sm]  = period.start_time.split(':').map(Number)
          const [eh, em]  = period.end_time.split(':').map(Number)
          const mins      = (eh * 60 + em) - (sh * 60 + sm)

          return (
            <div key={period.id} className="flex items-center gap-3 p-3 rounded-xl group"
              style={{
                background: getPeriodBg(period.period_type, barColor),
                border: `1px solid ${barColor}44`,
              }}>
              <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: barColor }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white/90">
                  {period.subject ?? typeInfo.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: barColor }}>
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
        <button onClick={() => { setShowForm(!showForm); if (!showForm) setPDays([selectedDay]) }}
          className="btn-primary flex-1 justify-center text-sm">
          <Plus className="w-4 h-4" />
          Agregar bloque
        </button>
        {dayPeriods.length > 0 && (
          <button onClick={handleCopyToAll} className="btn-ghost text-sm"
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

          {/* Tipo de bloque */}
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

          {/* Asignatura */}
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

          {/* Color de la asignatura */}
          {(pType === 'class' || pType === 'pe') && (
            <div>
              <label className="text-xs font-semibold text-white/40 block mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_PALETTE.map(c => (
                  <button key={c.id} onClick={() => setPColor(c.id)}
                    className="w-7 h-7 rounded-full transition-all"
                    style={{
                      background: c.color,
                      outline: pColor === c.id ? `3px solid white` : 'none',
                      outlineOffset: 2,
                      transform: pColor === c.id ? 'scale(1.15)' : 'scale(1)',
                    }}
                    title={c.id}
                  />
                ))}
              </div>
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

          {/* Días en que se repite */}
          <div>
            <label className="text-xs font-semibold text-white/40 block mb-2">
              Repetir en
              <span className="text-white/25 font-normal ml-1">(selecciona todos los días que apliquen)</span>
            </label>
            <div className="flex gap-2">
              {SCHOOL_DAYS.map(d => (
                <button key={d} onClick={() => toggleRepeatDay(d)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: pDays.includes(d)
                      ? (pType === 'class' || pType === 'pe')
                        ? `${COLOR_PALETTE.find(c=>c.id===pColor)?.color ?? '#6366f1'}33`
                        : `${TYPE_COLORS[pType]}33`
                      : 'rgba(255,255,255,0.04)',
                    border: pDays.includes(d)
                      ? `1px solid ${(pType === 'class' || pType === 'pe') ? COLOR_PALETTE.find(c=>c.id===pColor)?.color ?? '#6366f1' : TYPE_COLORS[pType]}66`
                      : '1px solid rgba(255,255,255,0.07)',
                    color: pDays.includes(d) ? '#fff' : 'rgba(255,255,255,0.35)',
                  }}>
                  {DAYS[d]}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={loading}
              className="btn-primary flex-1 justify-center text-sm disabled:opacity-50">
              {loading ? 'Agregando...' : `Agregar${pDays.length > 1 ? ` (${pDays.length} días)` : ''}`}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
