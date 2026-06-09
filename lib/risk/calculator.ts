// ============================================
// Kstudy AI — Calculadora de Riesgo Académico
// ============================================
// 100% lógica JS, sin llamadas externas.
// Los datos ya existen en el dashboard.
// ============================================

export interface RiskFactors {
  overdueTasks: number            // tareas vencidas sin completar
  tasksDueIn3Days: number         // tareas que vencen en 3 días
  evalsDueIn7Days: number         // evaluaciones en 7 días
  studySessionsMissedThisWeek: number  // sesiones planificadas no completadas esta semana
  studyStreakDays: number          // racha actual de estudio
  avgCompletionRate: number        // 0–1: % tareas completadas en últimas 4 semanas
}

export interface RiskResult {
  level: 'low' | 'moderate' | 'high'
  score: number   // 0–100
  reasons: string[]
}

export function calculateRiskIndex(f: RiskFactors): RiskResult {
  let score = 0
  const reasons: string[] = []

  // ── Factores negativos ──────────────────────────────
  if (f.overdueTasks > 0) {
    score += Math.min(f.overdueTasks * 15, 40)
    reasons.push(`${f.overdueTasks} tarea${f.overdueTasks > 1 ? 's' : ''} vencida${f.overdueTasks > 1 ? 's' : ''}`)
  }

  if (f.evalsDueIn7Days >= 3) {
    score += 20
    reasons.push(`${f.evalsDueIn7Days} evaluaciones esta semana`)
  } else if (f.evalsDueIn7Days >= 2) {
    score += 10
    reasons.push(`${f.evalsDueIn7Days} evaluaciones próximas`)
  }

  if (f.tasksDueIn3Days >= 3) {
    score += 15
    reasons.push(`${f.tasksDueIn3Days} tareas urgentes`)
  }

  if (f.studySessionsMissedThisWeek >= 3) {
    score += 15
    reasons.push('Pocas sesiones de estudio esta semana')
  }

  if (f.avgCompletionRate < 0.5) {
    score += 10
    reasons.push('Tasa de completitud baja últimas semanas')
  }

  // ── Factores protectores ────────────────────────────
  if (f.studyStreakDays >= 5) score -= 10
  if (f.avgCompletionRate >= 0.8) score -= 10

  score = Math.max(0, Math.min(100, score))

  return {
    score,
    level: score >= 60 ? 'high' : score >= 25 ? 'moderate' : 'low',
    reasons,
  }
}

// Etiqueta visual por nivel
export const RISK_LABELS: Record<RiskResult['level'], string> = {
  low:      'Al día',
  moderate: 'Riesgo moderado',
  high:     'Riesgo alto',
}

// Colores por nivel
export const RISK_COLORS: Record<RiskResult['level'], { text: string; bg: string; border: string; dot: string }> = {
  low:      { text: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.2)',  dot: '#22c55e' },
  moderate: { text: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  dot: '#f59e0b' },
  high:     { text: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', dot: '#ef4444' },
}
