'use client'

import { useState, useEffect, useTransition } from 'react'
import { getSurvivalPlan } from '@/lib/actions/survival-mode'
import type { SurvivalPlan } from '@/lib/actions/survival-mode'
import { X, Loader2, Zap, Clock, BookOpen, AlertTriangle } from 'lucide-react'

interface SurvivalModeModalProps {
  onClose: () => void
}

export function SurvivalModeModal({ onClose }: SurvivalModeModalProps) {
  const [plan, setPlan] = useState<SurvivalPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Fetch plan on mount
  useEffect(() => {
    startTransition(async () => {
      const res = await getSurvivalPlan()
      if (res.error) setError(res.error)
      else setPlan(res.plan)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #130f26 0%, #0d0d18 100%)',
          border: '1px solid rgba(248,113,113,0.25)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.05)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)' }}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Modo Supervivencia</p>
              <p className="text-xs text-white/40">Plan de rescate académico</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-4 h-4 text-white/40" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {isPending && (
            <div className="flex flex-col items-center py-10 gap-3">
              <Loader2 className="w-7 h-7 text-rose-400 animate-spin" />
              <p className="text-sm text-white/50">Analizando tu situación...</p>
            </div>
          )}

          {error && !isPending && (
            <div className="p-4 rounded-xl text-sm text-rose-400" style={{ background: 'rgba(248,113,113,0.08)' }}>
              {error}
            </div>
          )}

          {plan && !isPending && (
            <div className="space-y-4">
              {/* Mensaje motivacional */}
              {plan.message && (
                <div
                  className="p-3 rounded-xl text-sm font-medium text-center"
                  style={{ background: 'rgba(124,106,247,0.08)', color: '#c4bcff', border: '1px solid rgba(124,106,247,0.2)' }}
                >
                  {plan.message}
                </div>
              )}

              {/* Asignatura prioritaria */}
              {plan.priority_subject && (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span className="text-xs text-white/50">Prioridad: </span>
                  <span className="text-sm font-semibold text-rose-300">{plan.priority_subject}</span>
                </div>
              )}

              {/* Pasos */}
              {plan.steps.length > 0 && (
                <div className="space-y-2.5">
                  {plan.steps.map((step, i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-3.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      {/* Step number */}
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                        style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-semibold text-rose-300">{step.day}</span>
                          <span className="text-white/20 text-xs">·</span>
                          <span className="flex items-center gap-1 text-xs text-white/35">
                            <Clock className="w-3 h-3" />
                            {step.duration}
                          </span>
                        </div>
                        <p className="text-sm text-white/80 leading-snug">{step.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {plan.steps.length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-3xl mb-2">🎉</p>
                  <p className="text-sm text-white/60">{plan.message}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white/60 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
