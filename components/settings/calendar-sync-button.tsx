'use client'

import { useState } from 'react'
import { syncAllTasksToCalendar } from '@/lib/actions/tasks'
import { Calendar, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

export function CalendarSyncButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function handleSync() {
    setState('loading')
    const result = await syncAllTasksToCalendar()

    if (result.success) {
      setState('success')
      setMsg(result.synced === 0
        ? 'Todas las tareas ya estaban sincronizadas'
        : `${result.synced} tarea${result.synced > 1 ? 's' : ''} añadida${result.synced > 1 ? 's' : ''} a tu calendario`)
    } else {
      setState('error')
      setMsg(result.error ?? 'Error al sincronizar')
    }

    setTimeout(() => { setState('idle'); setMsg('') }, 5000)
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSync}
        disabled={state === 'loading'}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
        style={{
          background: state === 'success' ? 'rgba(16,185,129,0.15)' :
                      state === 'error' ? 'rgba(239,68,68,0.15)' :
                      'linear-gradient(135deg,#6366f1,#818cf8)',
          color: state === 'success' ? '#34d399' :
                 state === 'error' ? '#f87171' : '#fff',
          border: state === 'success' ? '1px solid rgba(16,185,129,0.3)' :
                  state === 'error' ? '1px solid rgba(239,68,68,0.3)' : 'none',
          boxShadow: state === 'idle' ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
        }}
      >
        {state === 'loading' ? <RefreshCw className="w-4 h-4 animate-spin" /> :
         state === 'success' ? <CheckCircle className="w-4 h-4" /> :
         state === 'error'   ? <AlertCircle className="w-4 h-4" /> :
                               <Calendar className="w-4 h-4" />}
        {state === 'loading' ? 'Sincronizando...' :
         state === 'success' ? 'Listo' :
         state === 'error'   ? 'Error' :
                               'Sincronizar con Google Calendar'}
      </button>
      {msg && (
        <p className={`text-xs ${state === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
          {msg}
        </p>
      )}
    </div>
  )
}
