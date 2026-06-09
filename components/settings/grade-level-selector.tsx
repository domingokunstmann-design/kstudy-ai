'use client'

import { useState, useTransition } from 'react'
import { updateGradeLevel } from '@/lib/actions/settings'
import { GraduationCap, CheckCircle2, Loader2 } from 'lucide-react'

type GradeLevel = '7mo' | '8vo' | '1ro_medio' | '2do_medio' | '3ro_medio' | '4to_medio'

const GRADE_OPTIONS: { value: GradeLevel; label: string; group: string }[] = [
  { value: '7mo',       label: '7° Básico',  group: 'Enseñanza Básica' },
  { value: '8vo',       label: '8° Básico',  group: 'Enseñanza Básica' },
  { value: '1ro_medio', label: 'I° Medio',   group: 'Enseñanza Media' },
  { value: '2do_medio', label: 'II° Medio',  group: 'Enseñanza Media' },
  { value: '3ro_medio', label: 'III° Medio', group: 'Enseñanza Media' },
  { value: '4to_medio', label: 'IV° Medio',  group: 'Enseñanza Media' },
]

interface GradeLevelSelectorProps {
  currentLevel: GradeLevel | null
  currentSchool: string | null
}

export function GradeLevelSelector({ currentLevel, currentSchool }: GradeLevelSelectorProps) {
  const [selected, setSelected] = useState<GradeLevel | null>(currentLevel)
  const [school, setSchool] = useState(currentSchool ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isDirty = selected !== currentLevel || school !== (currentSchool ?? '')

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const res = await updateGradeLevel(selected, school || null)
      if (res.error) {
        setError(res.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  const basicOptions = GRADE_OPTIONS.filter(o => o.group === 'Enseñanza Básica')
  const mediaOptions = GRADE_OPTIONS.filter(o => o.group === 'Enseñanza Media')

  return (
    <div className="p-5 space-y-4">
      {/* Selector de nivel */}
      <div>
        <p className="text-xs font-semibold text-white/50 mb-2.5 uppercase tracking-wider">Enseñanza Básica</p>
        <div className="flex gap-2 flex-wrap">
          {basicOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={
                selected === opt.value
                  ? {
                      background: 'linear-gradient(135deg, #7c6af7, #9d8fff)',
                      color: 'white',
                    }
                  : {
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.5)',
                    }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-white/50 mb-2.5 uppercase tracking-wider">Enseñanza Media</p>
        <div className="flex gap-2 flex-wrap">
          {mediaOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
              style={
                selected === opt.value
                  ? {
                      background: 'linear-gradient(135deg, #7c6af7, #9d8fff)',
                      color: 'white',
                    }
                  : {
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.5)',
                    }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Colegio */}
      <div>
        <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
          Colegio (opcional)
        </label>
        <input
          type="text"
          value={school}
          onChange={e => setSchool(e.target.value)}
          placeholder="Nombre de tu colegio"
          className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 border text-white placeholder-white/25 outline-none focus:border-indigo-500/50 transition-colors"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* Guardar */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!isDirty || isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #7c6af7, #9d8fff)' }}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Guardar
        </button>

        {saved && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Guardado
          </span>
        )}
        {error && (
          <span className="text-xs text-rose-400">{error}</span>
        )}
      </div>
    </div>
  )
}
