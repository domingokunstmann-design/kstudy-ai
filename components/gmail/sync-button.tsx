'use client'

import { useState } from 'react'
import { syncGmail } from '@/lib/actions/gmail'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SyncButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSync() {
    setState('loading')
    setMessage('')

    const result = await syncGmail()

    if (result.success) {
      setState('success')
      if (result.emailsProcessed === 0) {
        setMessage('Todo al día — no hay correos nuevos')
      } else {
        setMessage(
          `${result.emailsProcessed} correos procesados · ${result.tasksCreated} tareas creadas`
        )
      }
    } else {
      setState('error')
      setMessage(result.error ?? 'Error al sincronizar')
    }

    // Volver a idle después de 4 segundos
    setTimeout(() => {
      setState('idle')
      setMessage('')
    }, 4000)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={state === 'loading'}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
          state === 'idle' &&
            'bg-indigo-500 hover:bg-indigo-600 text-white',
          state === 'loading' &&
            'bg-zinc-800 text-zinc-400 cursor-not-allowed',
          state === 'success' &&
            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
          state === 'error' &&
            'bg-red-500/20 text-red-400 border border-red-500/30'
        )}
      >
        {state === 'loading' ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : state === 'success' ? (
          <CheckCircle className="w-4 h-4" />
        ) : state === 'error' ? (
          <AlertCircle className="w-4 h-4" />
        ) : (
          <RefreshCw className="w-4 h-4" />
        )}
        {state === 'loading'
          ? 'Sincronizando...'
          : state === 'success'
          ? 'Listo'
          : state === 'error'
          ? 'Error'
          : 'Sincronizar Gmail'}
      </button>

      {message && (
        <span
          className={cn(
            'text-xs',
            state === 'success' ? 'text-emerald-400' : 'text-red-400'
          )}
        >
          {message}
        </span>
      )}
    </div>
  )
}
