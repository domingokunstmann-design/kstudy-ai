'use client'

import { useState } from 'react'
import { saveRoutine } from '@/lib/actions/planner'
import { Plus, X } from 'lucide-react'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const COLORS = [
  { label: 'Indigo', value: 'indigo', cls: 'bg-indigo-500' },
  { label: 'Violet', value: 'violet', cls: 'bg-violet-500' },
  { label: 'Emerald', value: 'emerald', cls: 'bg-emerald-500' },
  { label: 'Amber', value: 'amber', cls: 'bg-amber-500' },
  { label: 'Rose', value: 'rose', cls: 'bg-rose-500' },
  { label: 'Sky', value: 'sky', cls: 'bg-sky-500' },
]

export function RoutineForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [days, setDays] = useState<number[]>([1])
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:30')
  const [color, setColor] = useState('indigo')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Escribe un nombre'); return }
    if (days.length === 0) { setError('Selecciona al menos un día'); return }
    if (endTime <= startTime) { setError('La hora de fin debe ser después del inicio'); return }

    setLoading(true)
    // Guardar una entrada por cada día seleccionado
    for (const day of days) {
      const result = await saveRoutine({ name: name.trim(), day_of_week: day, start_time: startTime, end_time: endTime, color })
      if (result.error) { setError(result.error); setLoading(false); return }
    }
    setLoading(false)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl space-y-5"
      style={{ background: 'rgba(18,18,28,0.98)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Nueva rutina</h3>
        <button type="button" onClick={onClose} className="text-zinc-600 hover:text-zinc-400"><X className="w-4 h-4" /></button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Nombre */}
      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Nombre</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej: Entrenamiento, Preu, Trabajo..."
          className="w-full kstudy-input text-sm"
          autoFocus
        />
      </div>

      {/* Días — multi-selección */}
      <div>
        <label className="text-xs text-zinc-500 mb-2 block">
          Días de la semana <span className="text-zinc-700">(selecciona varios)</span>
        </label>
        <div className="flex gap-1">
          {DAYS.map((d, i) => {
            const selected = days.includes(i)
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDays(prev =>
                  prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
                )}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  selected
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                style={!selected ? { background: 'rgba(255,255,255,0.05)' } : {}}
              >
                {d}
              </button>
            )
          })}
        </div>
        {days.length > 0 && (
          <p className="text-[10px] text-indigo-400/60 mt-1.5">
            {days.length} día{days.length > 1 ? 's' : ''} seleccionado{days.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Horario */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Inicio</label>
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full kstudy-input text-sm" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Fin</label>
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full kstudy-input text-sm" />
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="text-xs text-zinc-500 mb-2 block">Color</label>
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className={`w-6 h-6 rounded-full ${c.cls} transition-all ${color === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'opacity-60 hover:opacity-100'}`}
            />
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        {loading ? 'Guardando...' : <><Plus className="w-4 h-4" /> Agregar rutina</>}
      </button>
    </form>
  )
}
