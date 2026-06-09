import { createClient } from '@/lib/supabase/server'
import { Trophy } from 'lucide-react'
import Link from 'next/link'
import { LOGROS, computeXP, computeLevel } from '@/lib/xp'
import type { LogroStats } from '@/lib/xp'

export async function RecentAchievements() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Compute logro stats (same as analytics page)
  const [
    { count: totalCompleted },
    { count: urgentCompleted },
    { data: sessionRows },
    { data: planRows },
  ] = await Promise.all([
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('status', 'completada'),
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('status', 'completada').eq('priority', 'urgente'),
    supabase.from('study_plan_sessions').select('date, duration_minutes, completed')
      .eq('user_id', user.id),
    supabase.from('study_plan_sessions').select('id').eq('user_id', user.id).limit(1),
  ])

  // Streak calculation
  const daysWithSessions = new Set(
    (sessionRows ?? []).filter(s => s.completed).map(s => s.date)
  )
  const today = new Date()
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  let checkDate = new Date(today)
  while (true) {
    const key = checkDate.toISOString().slice(0, 10)
    if (daysWithSessions.has(key)) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else break
  }
  // Longest streak - compute from all sessions
  const sortedDays = Array.from(daysWithSessions).sort()
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) { tempStreak = 1; continue }
    const prev = new Date(sortedDays[i - 1])
    const curr = new Date(sortedDays[i])
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000)
    tempStreak = diff === 1 ? tempStreak + 1 : 1
    if (tempStreak > longestStreak) longestStreak = tempStreak
  }
  longestStreak = Math.max(longestStreak, currentStreak)

  const totalStudyHours = (sessionRows ?? []).filter(s => s.completed)
    .reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0) / 60

  const stats: LogroStats = {
    totalCompleted: totalCompleted ?? 0,
    currentStreak,
    longestStreak,
    totalStudyHours,
    totalSessions: (sessionRows ?? []).filter(s => s.completed).length,
    hasStudyPlan: (planRows?.length ?? 0) > 0,
    urgentCompleted: urgentCompleted ?? 0,
  }

  const unlocked = LOGROS.filter(l => l.check(stats))
  const totalXP  = computeXP(stats)
  const { level, xpForNext } = computeLevel(totalXP)

  // Show last unlocked logros (last 4)
  const recent = unlocked.slice(-4).reverse()

  return (
    <div className="section-card h-full flex flex-col">
      <div className="section-header">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Logros recientes</h2>
        </div>
        <Link href="/dashboard/analytics" className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors">
          Ver todos →
        </Link>
      </div>

      <div className="p-4 flex-1">
        {/* XP summary */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl mb-4"
          style={{ background: 'rgba(252,211,77,0.07)', border: '1px solid rgba(252,211,77,0.15)' }}
        >
          <div className="text-2xl">⭐</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold" style={{ color: '#fcd34d' }}>{totalXP} XP</span>
              <span className="text-xs text-white/40">· Nivel {level}</span>
            </div>
            <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${((200 - xpForNext) / 200) * 100}%`, background: '#fcd34d' }}
              />
            </div>
            <p className="text-[10px] text-white/30 mt-0.5">{xpForNext} XP para nivel {level + 1}</p>
          </div>
        </div>

        {/* Recent logros */}
        {recent.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-white/30">Completa tareas para desbloquear logros</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(l => (
              <div
                key={l.id}
                className="flex items-center gap-3 p-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-xl flex-shrink-0">{l.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/90 truncate">{l.title}</p>
                  <p className="text-[10px] text-white/35 truncate">{l.desc}</p>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(252,211,77,0.12)', color: '#fcd34d' }}
                >
                  +{l.xp} XP
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
