// ============================================
// Kstudy AI — Sistema XP y Logros (compartido)
// ============================================

export interface LogroDefinition {
  id: string
  emoji: string
  title: string
  desc: string
  check: (stats: LogroStats) => boolean
  xp: number
}

export interface LogroStats {
  totalCompleted: number
  currentStreak: number
  longestStreak: number
  totalStudyHours: number
  totalSessions: number
  hasStudyPlan: boolean
  urgentCompleted: number
}

export const LOGROS: LogroDefinition[] = [
  { id: 'primera_tarea',      emoji: '🎯', title: 'Primera tarea',    desc: 'Completaste tu primera tarea',          check: s => s.totalCompleted >= 1,   xp: 50  },
  { id: '10_tareas',          emoji: '📚', title: 'Estudiante activo', desc: '10 tareas completadas',                check: s => s.totalCompleted >= 10,  xp: 150 },
  { id: '25_tareas',          emoji: '🏅', title: 'Veterano',          desc: '25 tareas completadas',                check: s => s.totalCompleted >= 25,  xp: 300 },
  { id: '50_tareas',          emoji: '🏆', title: 'Élite académico',   desc: '50 tareas completadas',                check: s => s.totalCompleted >= 50,  xp: 600 },
  { id: 'racha_3',            emoji: '🔥', title: 'En racha',          desc: '3 días consecutivos estudiando',       check: s => s.currentStreak >= 3,    xp: 75  },
  { id: 'racha_7',            emoji: '⚡', title: 'Semana completa',   desc: '7 días seguidos de estudio',           check: s => s.currentStreak >= 7,    xp: 200 },
  { id: 'racha_14',           emoji: '💫', title: 'Imparable',         desc: '14 días seguidos de estudio',          check: s => s.longestStreak >= 14,   xp: 400 },
  { id: '10_horas',           emoji: '⏱️', title: 'Dedicado',          desc: '10 horas de estudio completadas',      check: s => s.totalStudyHours >= 10, xp: 100 },
  { id: '50_horas',           emoji: '🧠', title: 'Mente afilada',     desc: '50 horas de estudio completadas',      check: s => s.totalStudyHours >= 50, xp: 500 },
  { id: 'plan_generado',      emoji: '📋', title: 'Organizado',        desc: 'Generaste tu primer plan de estudio',  check: s => s.hasStudyPlan,          xp: 100 },
  { id: 'urgente_completado', emoji: '🚀', title: 'Bajo presión',      desc: 'Completaste una tarea urgente',        check: s => s.urgentCompleted >= 1,  xp: 125 },
  { id: '5_sesiones',         emoji: '📖', title: 'Constante',         desc: '5 sesiones de estudio completadas',    check: s => s.totalSessions >= 5,    xp: 80  },
]

// XP total = suma de logros desbloqueados
export function computeXP(stats: LogroStats): number {
  return LOGROS.filter(l => l.check(stats)).reduce((sum, l) => sum + l.xp, 0)
}

// Nivel: cada 200 XP sube 1 nivel
export function computeLevel(xp: number): { level: number; xpInLevel: number; xpForNext: number } {
  const level    = Math.floor(xp / 200) + 1
  const xpInLevel = xp % 200
  const xpForNext = 200 - xpInLevel
  return { level, xpInLevel, xpForNext }
}

// Logros desbloqueados (para mostrar recientes)
export function getUnlockedLogros(stats: LogroStats) {
  return LOGROS.filter(l => l.check(stats))
}
