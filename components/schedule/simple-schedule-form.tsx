'use client'

import { useState } from 'react'
import { saveSimpleSchedule } from '@/lib/actions/schedule'
import { Save, Clock } from 'lucide-react'

const DAYS = [
  { label: 'Lun', value: 1 },
  { label: 'Mar', value: 2 },
  { label: 'Mié', value: 3 },
  { label: 'Jue', value: 4 },
  { label: 'Vie', value: 5 },
  { label: 'Sáb', value: 6 },
  { label: 'Dom', value: 0 },
]

interface Props {
  initialStart?: string
  initialEnd?: string
  initialDays?: number[]
}

export function SimpleScheduleForm({ initialStart = '07:45', initialEnd = '15:40', initialDays = [1,2,3,4,5] }: Props) {
  const [startTime, setStartTime] = useState(initialStart)
  const [endTime, setEndTime] = useState(initialEnd)
  const [activeDays, setActiveDays] = useState<number[]>(initialDays)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function toggleDay(day: number) {
    setActiveDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  async function handleSave() {
    if (endTime <= startTime) { setError('La salida debe ser después de la entrada'); return }
    if (activeDays.length === 0) { setError('Selecciona al menos un día'); return }
    setError('')
    setLoading(true)
    const result = await saveSimpleSchedule({ start_time: startTime, end_time: endTime, active_days: activeDays })
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const totalMinutes = (() => {
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    return (eh * 60 + em) - (sh * 60 + sm)
  })()

  return (
    <div className="space-y-5">
      {/* Días */}
      <div>
        <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">Días de colegio</label>
        <div className="flex gap-2 flex-wrap">
          {DAYS.map(day => (
            <button
              key={day.value}
              onClick={() => toggleDay(day.value)}
              className="px-3 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: activeDays.includes(day.value) ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                border: activeDays.includes(day.value) ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: activeDays.includes(day.value) ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
                boxShadow: activeDays.includes(day.value) ? '0 2px 8px rgba(99,102,241,0.2)' : 'none',
              }}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* Horario */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">Entrada</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="kstudy-input pl-9 text-base font-semibold"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">Salida</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="kstudy-input pl-9 text-base font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      {totalMinutes > 0 && (
        <div className="p-3 rounded-xl text-sm"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
          <span className="text-indigo-400 font-semibold">
            {Math.floor(totalMinutes / 60)}h {totalMinutes % 60 > 0 ? `${totalMinutes % 60}min` : ''}
          </span>
          <span className="text-white/30 ml-2">
            de colegio · El planificador organizará el estudio de {endTime} en adelante
          </span>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button onClick={handleSave} disabled={loading}
        className="btn-primary w-full justify-center disabled:opacity-50">
        <Save className="w-4 h-4" />
        {loading ? 'Guardando...' : saved ? '¡Guardado! ✓' : 'Guardar horario'}
      </button>
    </div>
  )
}
