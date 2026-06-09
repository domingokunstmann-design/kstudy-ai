// Logros — basados en datos existentes, sin IA ni APIs externas
import { LOGROS } from '@/lib/xp'
import type { LogroStats } from '@/lib/xp'

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
