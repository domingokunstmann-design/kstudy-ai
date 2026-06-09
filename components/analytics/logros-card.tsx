// Logros — basados en datos existentes, sin IA ni APIs externas

interface LogroDefinition {
  id: string
  emoji: string
  title: string
  desc: string
  check: (stats: LogroStats) => boolean
  xp: number
}

interface LogroStats {
  totalCompleted: number
  currentStreak: number
  longestStreak: number
  totalStudyHours: number
  totalSessions: number
  hasStudyPlan: boolean
  urgentCompleted: number
}

const LOGROS: LogroDefinition[] = [
  {
    id: 'primera_tarea',
    emoji: '🎯',
    title: 'Primera tarea',
    desc: 'Completaste tu primera tarea',
    check: s => s.totalCompleted >= 1,
    xp: 50,
  },
  {
    id: '10_tareas',
    emoji: '📚',
    title: 'Estudiante activo',
    desc: '10 tareas completadas',
    check: s => s.totalCompleted >= 10,
    xp: 150,
  },
  {
    id: '25_tareas',
    emoji: '🏅',
    title: 'Veterano',
    desc: '25 tareas completadas',
    check: s => s.totalCompleted >= 25,
    xp: 300,
  },
  {
    id: '50_tareas',
    emoji: '🏆',
    title: 'Élite académico',
    desc: '50 tareas completadas',
    check: s => s.totalCompleted >= 50,
    xp: 600,
  },
  {
    id: 'racha_3',
    emoji: '🔥',
    title: 'En racha',
    desc: '3 días consecutivos estudiando',
    check: s => s.currentStreak >= 3,
    xp: 75,
  },
  {
    id: 'racha_7',
    emoji: '⚡',
    title: 'Semana completa',
    desc: '7 días seguidos de estudio',
    check: s => s.currentStreak >= 7,
    xp: 200,
  },
  {
    id: 'racha_14',
    emoji: '💫',
    title: 'Imparable',
    desc: '14 días seguidos de estudio',
    check: s => s.longestStreak >= 14,
    xp: 400,
  },
  {
    id: '10_horas',
    emoji: '⏱️',
    title: 'Dedicado',
    desc: '10 horas de estudio completadas',
    check: s => s.totalStudyHours >= 10,
    xp: 100,
  },
  {
    id: '50_horas',
    emoji: '🧠',
    title: 'Mente afilada',
    desc: '50 horas de estudio completadas',
    check: s => s.totalStudyHours >= 50,
    xp: 500,
  },
  {
    id: 'plan_generado',
    emoji: '📋',
    title: 'Organizado',
    desc: 'Generaste tu primer plan de estudio',
    check: s => s.hasStudyPlan,
    xp: 100,
  },
  {
    id: 'urgente_completado',
    emoji: '🚀',
    title: 'Bajo presión',
    desc: 'Completaste una tarea urgente',
    check: s => s.urgentCompleted >= 1,
    xp: 125,
  },
  {
    id: '5_sesiones',
    emoji: '📖',
    title: 'Constante',
    desc: '5 sesiones de estudio completadas',
    check: s => s.totalSessions >= 5,
    xp: 80,
  },
]

interface Props {
  stats: LogroStats
}

export function LogrosCard({ stats }: Props) {
  const unlocked = LOGROS.filter(l => l.check(stats))
  const locked   = LOGROS.filter(l => !l.check(stats))
  const totalXP  = unlocked.reduce((acc, l) => acc + l.xp, 0)
  const pct      = Math.round((unlocked.length / LOGROS.length) * 100)

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold" style={{ color: '#fcd34d' }}>{totalXP} XP</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {unlocked.length} de {LOGROS.length} logros · {pct}% completado
          </p>
        </div>
        {/* Progress bar general */}
        <div className="w-24">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#fcd34d' }} />
          </div>
        </div>
      </div>

      {/* Logros desbloqueados */}
      {unlocked.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
            Desbloqueados ({unlocked.length})
          </p>
          <div className="grid grid-cols-2 gap-2">
            {unlocked.map(l => (
              <div key={l.id} className="flex items-center gap-2.5 p-2.5 rounded-xl"
                style={{ background: 'rgba(252,211,77,0.06)', border: '1px solid rgba(252,211,77,0.18)' }}>
                <span className="text-xl flex-shrink-0">{l.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white/90 truncate">{l.title}</p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{l.desc}</p>
                  <p className="text-[10px] font-bold" style={{ color: '#fcd34d' }}>+{l.xp} XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Por desbloquear (máx 4 para no ocupar demasiado espacio) */}
      {locked.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
            Próximos logros
          </p>
          <div className="grid grid-cols-2 gap-2">
            {locked.slice(0, 4).map(l => (
              <div key={l.id} className="flex items-center gap-2.5 p-2.5 rounded-xl opacity-35"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-xl flex-shrink-0 grayscale">{l.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white/70 truncate">{l.title}</p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{l.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
