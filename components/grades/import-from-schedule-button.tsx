'use client'

import { useState } from 'react'
import { importSubjectsFromSchedule } from '@/lib/actions/grades'
import { GraduationCap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export function ImportFromScheduleButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null)

  async function handleImport() {
    setLoading(true)
    setResult(null)
    const res = await importSubjectsFromSchedule()
    setLoading(false)

    if (res.error) {
      setResult({ type: 'error', msg: res.error })
    } else if (res.imported === 0 && 'alreadyExisted' in res) {
      setResult({ type: 'info', msg: `Todas las asignaturas de tu horario ya están en Notas.` })
    } else {
      setResult({
        type: 'success',
        msg: `${res.imported} asignatura${res.imported !== 1 ? 's' : ''} importada${res.imported !== 1 ? 's' : ''} desde tu horario.`,
      })
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleImport}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
        style={{
          background: 'rgba(124,106,247,0.1)',
          border: '1px solid rgba(124,106,247,0.25)',
          color: '#a89dff',
        }}
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <GraduationCap className="w-4 h-4" />}
        Importar desde Mi Horario
      </button>

      {result && (
        <div className="flex items-center gap-2 text-xs">
          {result.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
          {result.type === 'error'   && <AlertCircle   className="w-3.5 h-3.5 text-rose-400    flex-shrink-0" />}
          {result.type === 'info'    && <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400     flex-shrink-0" />}
          <span className={
            result.type === 'success' ? 'text-emerald-400'
            : result.type === 'error' ? 'text-rose-400'
            : 'text-zinc-500'
          }>
            {result.msg}
          </span>
        </div>
      )}
    </div>
  )
}
