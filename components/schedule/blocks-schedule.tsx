'use client'

import { useState } from 'react'
import { addSchoolPeriod, updateSchoolPeriod, deleteSchoolPeriod, copyDayToAllDays } from '@/lib/actions/schedule'
import { Plus, Trash2, Copy, Pencil, X, Check } from 'lucide-react'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const SCHOOL_DAYS = [1, 2, 3, 4, 5]

const PERIOD_TYPES = [
  { value: 'class',  label: 'Clase',      color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  { value: 'break',  label: 'Recreo',     color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { value: 'lunch',  label: 'Almuerzo',   color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  { value: 'pe',     label: 'Ed. Física', color: '#f43f5e', bg: 'rgba(244,63,94,0.15)'  },
  { value: 'free',   label: 'Libre',      color: '#64748b', bg: 'rgba(100,116,139,0.15)'},
]

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

const TYPE_COLORS: Record<string, string> = {
  break: '#f59e0b', lunch: '#10b981', pe: '#f43f5e', free: '#64748b',
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

function getPeriodBg(color: string) {
  const hex = color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `rgba(${r},${g},${b},0.15)`
}

function colorIdFromHex(hex: string): string {
  return COLOR_PALETTE.find(c => c.color === hex)?.id ?? 'indigo'
}

// ── Formulario de edición inline ────────────────────────────────────────────
function EditForm({
  period,
  onSave,
  onCancel,
}: {
  period: Period
  onSave: (updated: Period) => void
  onCancel: () => void
}) {
  const [pType,    setPType]    = useState(period.period_type as any)
  const [pSubject, setPSubject] = useState(period.subject ?? '')
  const [pStart,   setPStart]   = useState(period.start_time.slice(0, 5))
  const [pEnd,     setPEnd]     = useState(period.end_time.slice(0, 5))
  const [pColor,   setPColor]   = useState(colorIdFromHex(period.color))
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  function getFinalColor() {
    if (pType === 'class' || pType === 'pe') return COLOR_PALETTE.find(c => c.id === pColor)?.color ?? '#6366f1'
    return TYPE_COLORS[pType] ?? '#6366f1'
  }

  async function handleSave() {
    if (pEnd <= pStart) { setError('El fin debe ser después del inicio'); return }
    setLoading(true)
    const finalColor = getFinalColor()
    const subject = (pType === 'class' || pType === 'pe') ? (pSubject || null) : null
    const result = await updateSchoolPeriod(period.id, {
      period_type: pType,
      subject,
      start_time: pStart,
      end_time: pEnd,
      color: finalColor,
    })
    setLoading(false)
    if (result.error) { setError(result.error); return }
    onSave({ ...period, period_type: pType, subject, start_time: pStart, end_time: pEnd, color: finalColor })
  }

  return (
    <div className="p-4 rounded-2xl space-y-3 animate-scale-in"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>

      {/* Tipo */}
      <div className="flex flex-wrap gap-1.5">
        {PERIOD_TYPES.map(t => (
          <button key={t.value} onClick={() => setPType(t.value as any)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: pType === t.value ? t.bg : 'rgba(255,255,255,0.04)',
              border: `1px solid ${pType === t.value ? t.color + '66' : 'rgba(255,255,255,0.07)'}`,
              color: pType === t.value ? t.color : 'rgba(255,255,255,0.4)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Asignatura */}
      {(pType === 'class' || pType === 'pe') && (
        <input type="text" value={pSubject} onChange={e => setPSubject(e.target.value)}
          placeholder="Nombre de la asignatura" className="kstudy-input w-full" autoFocus />
      )}

      {/* Color */}
      {(pType === 'class' || pType === 'pe') && (
        <div className="flex gap-2 flex-wrap">
          {COLOR_PALETTE.map(c => (
            <button key={c.id} onClick={() => setPColor(c.id)}
              className="w-6 h-6 rounded-full transition-all"
              style={{
                background: c.color,
                outline: pColor === c.id ? '2px solid white' : 'none',
                outlineOffset: 2,
                transform: pColor === c.id ? 'scale(1.2)' : 'scale(1)',
              }} />
          ))}
        </div>
      )}

      {/* Horario */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-semibold text-white/40 block mb-1">Inicio</label>
          <input type="time" value={pStart} onChange={e => setPStart(e.target.value)} className="kstudy-input w-full text-sm" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-white/40 block mb-1">Fin</label>
          <input type="time" value={pEnd} onChange={e => setPEnd(e.target.value)} className="kstudy-input w-full text-sm" />
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={loading}
          className="btn-primary flex-1 justify-center text-xs disabled:opacity-50">
          <Check className="w-3.5 h-3.5" />
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button onClick={onCancel} className="btn-ghost text-xs">
          <X className="w-3.5 h-3.5" />
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export function BlocksSchedule({ scheduleId, initialPeriods }: Props) {
  const [selectedDay, setSelectedDay] = useState(1)
  const [periods, setPeriods]         = useState<Period[]>(initialPeriods)
  const [showForm, setShowForm]       = useState(false)
  const [editingId, setEditingId]     = useState<string | null>(null)

  // Form: agregar bloque
  const [pType,    setPType]    = useState<'class'|'break'|'lunch'|'free'|'pe'>('class')
  const [pSubject, setPSubject] = useState('')
  const [pColor,   setPColor]   = useState('indigo')
  // pDays: días seleccionados. dayTimes: horario por día
  const [pDays,    setPDays]    = useState<number[]>([1])
  const [dayTimes, setDayTimes] = useState<Record<number, { start: string; end: string }>>({ 1: { start: '08:00', end: '09:20' } })
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const dayPeriods = periods
    .filter(p => p.day_of_week === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  function toggleRepeatDay(d: number) {
    setPDays(prev => {
      if (prev.includes(d)) {
        if (prev.length === 1) return prev // al menos 1 día
        const next = prev.filter(x => x !== d)
        setDayTimes(t => { const copy = { ...t }; delete copy[d]; return copy })
        return next
      }
      // Agregar con el horario del primer día como default
      const firstTime = Object.values(dayTimes)[0] ?? { start: '08:00', end: '09:20' }
      setDayTimes(t => ({ ...t, [d]: { ...firstTime } }))
      return [...prev, d].sort()
    })
  }

  function setDayTime(d: number, field: 'start' | 'end', val: string) {
    setDayTimes(t => ({ ...t, [d]: { ...t[d], [field]: val } }))
  }

  function applyFirstTimeToAll() {
    const first = Object.values(dayTimes)[0]
    if (!first) return
    const next: Record<number, { start: string; end: string }> = {}
    pDays.forEach(d => { next[d] = { ...first } })
    setDayTimes(next)
  }

  function getFinalColor() {
    if (pType === 'class' || pType === 'pe') return COLOR_PALETTE.find(c => c.id === pColor)?.color ?? '#6366f1'
    return TYPE_COLORS[pType] ?? '#6366f1'
  }

  function openAddForm() {
    setShowForm(true)
    setEditingId(null)
    setPDays([selectedDay])
    setDayTimes({ [selectedDay]: { start: '08:00', end: '09:20' } })
  }

  async function handleAdd() {
    for (const d of pDays) {
      const t = dayTimes[d]
      if (!t || t.end <= t.start) {
        setError(`Horario inválido para el ${DAYS[d]}`); return
      }
    }
    setError('')
    setLoading(true)
    const finalColor = getFinalColor()
    const subject = (pType === 'class' || pType === 'pe') ? (pSubject || null) : null

    for (const day of pDays) {
      const t = dayTimes[day]
      await addSchoolPeriod({
        schedule_id: scheduleId,
        day_of_week: day,
        period_type: pType,
        subject,
        start_time: t.start,
        end_time: t.end,
        color: finalColor,
      })
    }

    const newPeriods = pDays.map(day => ({
      id: crypto.randomUUID(),
      day_of_week: day,
      period_type: pType,
      subject,
      start_time: dayTimes[day].start,
      end_time: dayTimes[day].end,
      color: finalColor,
    }))
    setPeriods(prev => [...prev, ...newPeriods])
    setLoading(false)
    setShowForm(false)
    setPSubject('')
    setPDays([selectedDay])
    setDayTimes({ [selectedDay]: { start: '08:00', end: '09:20' } })
  }

  async function handleDelete(id: string) {
    await deleteSchoolPeriod(id)
    setPeriods(prev => prev.filter(p => p.id !== id))
  }

  function handleEditSave(updated: Period) {
    setPeriods(prev => prev.map(p => p.id === updated.id ? updated : p))
    setEditingId(null)
  }

  async function handleCopyToAll() {
    if (!confirm(`¿Copiar el horario del ${DAYS[selectedDay]} a todos los días de semana?`)) return
    await copyDayToAllDays(selectedDay, scheduleId)
    window.location.reload()
  }

  const accentColor = (pType === 'class' || pType === 'pe')
    ? COLOR_PALETTE.find(c => c.id === pColor)?.color ?? '#6366f1'
    : TYPE_COLORS[pType] ?? '#6366f1'

  return (
    <div className="space-y-4">

      {/* Selector de día */}
      <div>
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">Día</label>
        <div className="flex gap-2">
          {SCHOOL_DAYS.map(d => (
            <button key={d} onClick={() => { setSelectedDay(d); setShowForm(false); setEditingId(null) }}
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

      {/* Lista de períodos */}
      <div className="space-y-1.5">
        {dayPeriods.length === 0 && (
          <div className="text-center py-6 text-white/25 text-sm">
            Sin bloques — agrega el primer período del día
          </div>
        )}
        {dayPeriods.map(period => {
          const typeInfo = PERIOD_TYPES.find(t => t.value === period.period_type) ?? PERIOD_TYPES[0]
          const barColor = period.color || typeInfo.color
          const [sh, sm] = period.start_time.split(':').map(Number)
          const [eh, em] = period.end_time.split(':').map(Number)
          const mins = (eh * 60 + em) - (sh * 60 + sm)
          const isEditing = editingId === period.id

          return (
            <div key={period.id}>
              <div className="flex items-center gap-3 p-3 rounded-xl group"
                style={{ background: getPeriodBg(barColor), border: `1px solid ${barColor}44` }}>
                <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: barColor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/90">
                    {period.subject ?? typeInfo.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: barColor }}>
                    {period.start_time.slice(0, 5)} – {period.end_time.slice(0, 5)} · {mins} min
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingId(isEditing ? null : period.id)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(period.id)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Form de edición inline */}
              {isEditing && (
                <div className="mt-1.5">
                  <EditForm
                    period={period}
                    onSave={handleEditSave}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Botones acción */}
      <div className="flex gap-2">
        <button onClick={openAddForm}
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

      {/* Formulario de agregar */}
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

          {/* Asignatura */}
          {(pType === 'class' || pType === 'pe') && (
            <div>
              <label className="text-xs font-semibold text-white/40 block mb-2">Asignatura</label>
              <input type="text" value={pSubject} onChange={e => setPSubject(e.target.value)}
                placeholder="Ej: Matemáticas, Lenguaje, Historia..."
                className="kstudy-input w-full" autoFocus />
            </div>
          )}

          {/* Color */}
          {(pType === 'class' || pType === 'pe') && (
            <div>
              <label className="text-xs font-semibold text-white/40 block mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_PALETTE.map(c => (
                  <button key={c.id} onClick={() => setPColor(c.id)}
                    className="w-7 h-7 rounded-full transition-all"
                    style={{
                      background: c.color,
                      outline: pColor === c.id ? '3px solid white' : 'none',
                      outlineOffset: 2,
                      transform: pColor === c.id ? 'scale(1.15)' : 'scale(1)',
                    }} />
                ))}
              </div>
            </div>
          )}

          {/* Días en que se repite */}
          <div>
            <label className="text-xs font-semibold text-white/40 block mb-2">
              Repetir en
              <span className="text-white/25 font-normal ml-1">— cada día puede tener su propio horario</span>
            </label>
            <div className="flex gap-2 mb-3">
              {SCHOOL_DAYS.map(d => (
                <button key={d} onClick={() => toggleRepeatDay(d)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: pDays.includes(d) ? `${accentColor}33` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${pDays.includes(d) ? accentColor + '66' : 'rgba(255,255,255,0.07)'}`,
                    color: pDays.includes(d) ? '#fff' : 'rgba(255,255,255,0.35)',
                  }}>
                  {DAYS[d]}
                </button>
              ))}
            </div>

            {/* Horario por día */}
            <div className="space-y-2">
              {pDays.sort().map((d, i) => (
                <div key={d} className="flex items-center gap-2 p-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${accentColor}22` }}>
                  <span className="text-xs font-bold w-8 flex-shrink-0" style={{ color: accentColor }}>
                    {DAYS[d]}
                  </span>
                  <input type="time" value={dayTimes[d]?.start ?? '08:00'}
                    onChange={e => setDayTime(d, 'start', e.target.value)}
                    className="kstudy-input text-xs py-1 flex-1" />
                  <span className="text-white/30 text-xs">→</span>
                  <input type="time" value={dayTimes[d]?.end ?? '09:20'}
                    onChange={e => setDayTime(d, 'end', e.target.value)}
                    className="kstudy-input text-xs py-1 flex-1" />
                  {i === 0 && pDays.length > 1 && (
                    <button onClick={applyFirstTimeToAll}
                      className="text-[10px] text-white/30 hover:text-white/60 whitespace-nowrap transition-colors px-1">
                      ↓ igual a todos
                    </button>
                  )}
                </div>
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
