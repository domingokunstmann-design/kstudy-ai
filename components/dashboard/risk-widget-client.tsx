'use client'

import { useState } from 'react'
import { SurvivalModeModal } from './survival-mode-modal'
import type { RiskResult } from '@/lib/risk/calculator'
import { RISK_LABELS, RISK_COLORS } from '@/lib/risk/calculator'
import { ShieldAlert, ArrowRight } from 'lucide-react'

interface RiskWidgetClientProps {
  result: RiskResult
  evalsCount: number
}

export function RiskWidgetClient({ result, evalsCount }: RiskWidgetClientProps) {
  const [showSurvival, setShowSurvival] = useState(false)
  const colors = RISK_COLORS[result.level]

  return (
    <>
      <div
        className="rounded-2xl p-4"
        style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" style={{ color: colors.text }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text }}>
              Índice de riesgo
            </span>
          </div>
          {/* Semáforo dot */}
          <span
            className="w-3 h-3 rounded-full block"
            style={{ background: colors.dot, boxShadow: `0 0 8px ${colors.dot}` }}
          />
        </div>

        {/* Nivel */}
        <p className="text-lg font-bold mb-1" style={{ color: colors.text }}>
          {RISK_LABELS[result.level]}
        </p>

        {/* Razones */}
        {result.reasons.length > 0 && (
          <ul className="space-y-0.5 mb-3">
            {result.reasons.slice(0, 2).map((r, i) => (
              <li key={i} className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                · {r}
              </li>
            ))}
          </ul>
        )}

        {result.level === 'low' && (
          <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Todo bajo control 👍
          </p>
        )}

        {/* CTA supervivencia — solo si hay riesgo */}
        {result.level !== 'low' && (
          <button
            onClick={() => setShowSurvival(true)}
            className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80"
            style={{ color: colors.text }}
          >
            Ver plan de rescate
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {showSurvival && (
        <SurvivalModeModal onClose={() => setShowSurvival(false)} />
      )}
    </>
  )
}
