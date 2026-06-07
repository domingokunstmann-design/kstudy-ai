'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { regeneratePlan, regeneratePlanAI } from '@/lib/actions/planner'
import { RoutineForm } from './routine-form'
import { RefreshCw, Plus, CheckCircle, Sparkles, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskAdvice {
  id: string
  weight: number
  estimated_hours: number
  reasoning: string
  suggested_topics: string[]
}

interface PlannerClientProps {
  tasksCount: number
  hasGeminiKey?: boolean
}

type SyncState = 'idle' | 'loading' | 'loading-ai' | 'success' | 'error'

export function PlannerClient({ tasksCount, hasGeminiKey = false }: PlannerClientProps) {
  const [state, setState] = useState<SyncState>('idle')
  const [msg, setMsg] = useState('')
  const [advice, setAdvice] = useState<TaskAdvice[]>([])
  const [showAdvice, setShowAdvice] = useState(false)
  const [aiWarning, setAiWarning] = useState<string | null>(null)

  async function handleGenerate(useAI: boolean) {
    setState(useAI ? 'loading-ai' : 'loading')
    setAdvice([])
    setAiWarning(null)

    if (useAI) {
      const result = await regeneratePlanAI()
      if (result.success) {
        setState('success')
        const aiNote = result.aiUsed ? ' · con jerarquía IA' : ''
        setMsg(`${result.sessionsCount ?? 0} sesiones generadas${aiNote}`)
        if (result.advice) { setAdvice(result.advice as TaskAdvice[]); setShowAdvice(true) }
        if (result.aiError) setAiWarning(result.aiError as string)
      } else {
        setState('error')
        setMsg(result.error ?? 'Error')
      }
    } else {
      const result = await regeneratePlan()
      if (result.success) {
        setState('success')
        setMsg(`${result.sessionsCount ?? 0} sesiones generadas`)
      } else {
        setState('error')
        setMsg(result.error ?? 'Error')
      }
    }
    setTimeout(() => { setState('idle'); setMsg('') }, 6000)
  }

  const isLoading = state === 'loading' || state === 'loading-ai'

  return (
    <div className="space-y-4">
      {/* Botones */}
      <div className="flex items-center gap-2 flex-wrap">
        {msg && (
          <span className={cn(
            'text-xs font-medium',
            state === 'success' ? 'text-emerald-400' : 'text-red-400'
          )}>
            {msg}
          </span>
        )}

        {/* Botón IA (principal si hay key) */}
        {hasGeminiKey && (
          <button
            onClick={() => handleGenerate(true)}
            disabled={isLoading || tasksCount === 0}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            title="Gemini analiza la importancia de cada evaluación y distribuye el estudio en consecuencia"
          >
            {state === 'loading-ai'
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : state === 'success'
              ? <CheckCircle className="w-4 h-4" />
              : <Sparkles className="w-4 h-4" />
            }
            Plan con IA
          </button>
        )}

        {/* Botón básico */}
        <button
          onClick={() => handleGenerate(false)}
          disabled={isLoading || tasksCount === 0}
          className={cn(
            'disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2',
            hasGeminiKey ? 'btn-ghost text-sm' : 'btn-primary'
          )}
        >
          {state === 'loading'
            ? <RefreshCw className="w-4 h-4 animate-spin" />
            : <RefreshCw className="w-4 h-4" />
          }
          {hasGeminiKey ? 'Plan simple' : 'Generar plan'}
        </button>
      </div>

      {/* Warning si Gemini falló parcialmente */}
      {aiWarning && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/8 border border-amber-500/20 text-xs text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>Gemini no pudo analizar todas las tareas: {aiWarning}. Se usaron reglas para las faltantes.</span>
        </div>
      )}

      {/* Resultado del análisis de Gemini */}
      {advice.length > 0 && (
        <div className="section-card space-y-3">
          <button
            onClick={() => setShowAdvice(v => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-zinc-300">
                Análisis de Gemini — {advice.length} {advice.length === 1 ? 'tarea' : 'tareas'}
              </span>
            </div>
            {showAdvice
              ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600" />
              : <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
            }
          </button>

          {showAdvice && (
            <div className="space-y-2 pt-1">
              {advice
                .sort((a, b) => b.weight - a.weight)
                .map(a => (
                <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
                  {/* Barra de peso */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 w-8">
                    <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${a.weight * 100}%`,
                          background: a.weight >= 0.8 ? '#f43f5e'
                            : a.weight >= 0.6 ? '#f59e0b'
                            : '#6366f1',
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-bold"
                      style={{
                        color: a.weight >= 0.8 ? '#fda4af'
                          : a.weight >= 0.6 ? '#fcd34d'
                          : '#a5b4fc',
                      }}>
                      {Math.round(a.weight * 100)}%
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-xs text-zinc-300 leading-snug">{a.reasoning}</p>
                    <p className="text-[10px] text-zinc-600">
                      ~{a.estimated_hours}h de estudio
                      {a.suggested_topics.length > 0 && ` · ${a.suggested_topics.slice(0, 2).join(', ')}${a.suggested_topics.length > 2 ? '…' : ''}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AddRoutineButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Agregar
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-sm animate-scale-in">
            <RoutineForm onClose={() => setOpen(false)} />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
