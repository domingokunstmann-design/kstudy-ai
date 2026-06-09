// ============================================
// KSTUDY AI — Calculadora de Notas Chilena
// Sistema de notas: escala 1.0 – 7.0
// ============================================

export interface GradeEntry {
  id: string
  grade: number        // 1.0 – 7.0
  percentage: number | null  // porcentaje de ponderación, null = simple
  title: string
}

// ── Promedio ────────────────────────────────────────────────

/**
 * Calcula el promedio de un conjunto de notas.
 * Si todas tienen porcentaje definido → promedio ponderado.
 * De lo contrario → promedio simple.
 */
export function calculateAverage(grades: GradeEntry[]): number | null {
  if (!grades.length) return null

  const allHavePercentage = grades.every(g => g.percentage != null && g.percentage > 0)

  if (allHavePercentage) {
    const totalWeight = grades.reduce((sum, g) => sum + g.percentage!, 0)
    if (totalWeight === 0) return null
    const weighted = grades.reduce((sum, g) => sum + g.grade * g.percentage!, 0)
    return round1(weighted / totalWeight)
  }

  // Promedio simple
  return round1(grades.reduce((sum, g) => sum + g.grade, 0) / grades.length)
}

// ── Simulador de nota necesaria ─────────────────────────────

export interface SimulatorResult {
  needed: number | null   // nota necesaria (null si no es posible)
  possible: boolean       // si es alcanzable (≤ 7.0)
  message: string
}

/**
 * ¿Qué nota necesita el estudiante en la próxima evaluación
 * para llegar a un promedio objetivo?
 *
 * @param currentGrades  Notas ya registradas
 * @param targetAverage  Promedio que quiere alcanzar (ej: 6.0)
 * @param nextPercentage Ponderación de la próxima evaluación en el total (ej: 30)
 *                       Si null → se asume que cada nota pesa lo mismo (promedio simple)
 */
export function simulateNeededGrade(
  currentGrades: GradeEntry[],
  targetAverage: number,
  nextPercentage: number | null,
): SimulatorResult {
  if (targetAverage < 1 || targetAverage > 7) {
    return { needed: null, possible: false, message: 'Meta inválida' }
  }

  const allHavePercentage = currentGrades.every(g => g.percentage != null)

  if (allHavePercentage && nextPercentage != null) {
    // Promedio ponderado
    const usedWeight = currentGrades.reduce((s, g) => s + g.percentage!, 0)
    const remainingWeight = nextPercentage
    const currentWeighted = currentGrades.reduce((s, g) => s + g.grade * g.percentage!, 0)

    // target * totalWeight = currentWeighted + needed * nextPercentage
    const totalWeight = usedWeight + remainingWeight
    const needed = round1((targetAverage * totalWeight - currentWeighted) / remainingWeight)
    return formatResult(needed)
  }

  // Promedio simple: (sum + needed) / (n + 1) = target
  const n = currentGrades.length
  const sum = currentGrades.reduce((s, g) => s + g.grade, 0)
  const needed = round1(targetAverage * (n + 1) - sum)
  return formatResult(needed)
}

function formatResult(needed: number): SimulatorResult {
  if (needed > 7.0) {
    return {
      needed: null,
      possible: false,
      message: 'No es alcanzable con una sola evaluación',
    }
  }
  if (needed < 1.0) {
    return {
      needed: 1.0,
      possible: true,
      message: 'Con cualquier nota alcanzas el objetivo',
    }
  }
  return {
    needed,
    possible: true,
    message: `Necesitas un ${needed.toFixed(1)} en la próxima evaluación`,
  }
}

// ── Utilidades ───────────────────────────────────────────────

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** Devuelve el color semáforo para una nota */
export function gradeColor(grade: number): string {
  if (grade >= 6.0) return 'text-emerald-400'
  if (grade >= 5.0) return 'text-lime-400'
  if (grade >= 4.0) return 'text-amber-400'
  return 'text-rose-400'
}

/** Devuelve el color del borde/badge para una nota */
export function gradeBadgeClass(grade: number): string {
  if (grade >= 6.0) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
  if (grade >= 5.0) return 'border-lime-500/30 bg-lime-500/10 text-lime-400'
  if (grade >= 4.0) return 'border-amber-500/30 bg-amber-500/10 text-amber-400'
  return 'border-rose-500/30 bg-rose-500/10 text-rose-400'
}

/** Etiqueta descriptiva de la nota */
export function gradeLabel(grade: number): string {
  if (grade >= 6.5) return 'Excelente'
  if (grade >= 6.0) return 'Muy bueno'
  if (grade >= 5.5) return 'Bueno'
  if (grade >= 5.0) return 'Sobre el promedio'
  if (grade >= 4.0) return 'Aprobado'
  if (grade >= 3.5) return 'Bajo el mínimo'
  return 'Reprobado'
}

/** Colores disponibles para asignaturas */
export const SUBJECT_COLORS: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  indigo:  { label: 'Índigo',    bg: 'bg-indigo-500/15',  text: 'text-indigo-400',  dot: 'bg-indigo-500'  },
  violet:  { label: 'Violeta',   bg: 'bg-violet-500/15',  text: 'text-violet-400',  dot: 'bg-violet-500'  },
  rose:    { label: 'Rosa',      bg: 'bg-rose-500/15',    text: 'text-rose-400',    dot: 'bg-rose-500'    },
  amber:   { label: 'Ámbar',     bg: 'bg-amber-500/15',   text: 'text-amber-400',   dot: 'bg-amber-500'   },
  emerald: { label: 'Verde',     bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  cyan:    { label: 'Celeste',   bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    dot: 'bg-cyan-500'    },
  orange:  { label: 'Naranja',   bg: 'bg-orange-500/15',  text: 'text-orange-400',  dot: 'bg-orange-500'  },
  pink:    { label: 'Rosa claro',bg: 'bg-pink-500/15',    text: 'text-pink-400',    dot: 'bg-pink-500'    },
}
