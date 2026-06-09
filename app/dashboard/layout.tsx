import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { UserMenu } from '@/components/layout/user-menu'
import type { Profile } from '@/types'
import { computeXP, computeLevel, LOGROS } from '@/lib/xp'
import type { LogroStats } from '@/lib/xp'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { count: pendingCount },
    { count: totalCompleted },
    { count: urgentCompleted },
    { data: sessionRows },
    { data: planRows },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pendiente'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completada'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completada').eq('priority', 'urgente'),
    supabase.from('study_plan_sessions').select('date, duration_minutes, completed').eq('user_id', user.id),
    supabase.from('study_plan_sessions').select('id').eq('user_id', user.id).limit(1),
  ])

  if (!profile) redirect('/login')

  // ── Streak calculation ──────────────────────────────────────
  const daysWithSessions = new Set(
    (sessionRows ?? []).filter(s => s.completed).map(s => s.date)
  )
  const today = new Date()
  let currentStreak = 0
  const checkDate = new Date(today)
  while (true) {
    const key = checkDate.toISOString().slice(0, 10)
    if (daysWithSessions.has(key)) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else break
  }
  let longestStreak = currentStreak
  let tempStreak = 0
  const sortedDays = Array.from(daysWithSessions).sort()
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) { tempStreak = 1; continue }
    const prev = new Date(sortedDays[i - 1])
    const curr = new Date(sortedDays[i])
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000)
    tempStreak = diff === 1 ? tempStreak + 1 : 1
    if (tempStreak > longestStreak) longestStreak = tempStreak
  }

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

  const totalXP = computeXP(stats)
  const { level, xpForNext, xpInLevel } = computeLevel(totalXP)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Sidebar — solo desktop */}
      <Sidebar
        pendingCount={pendingCount ?? 0}
        totalXP={totalXP}
        level={level}
        xpForNext={xpForNext}
        xpInLevel={xpInLevel}
        streak={currentStreak}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header
          className="flex items-center justify-end px-4 lg:px-6 flex-shrink-0"
          style={{
            height: 52,
            borderBottom: '1px solid var(--border)',
            background: 'rgba(7,7,14,0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <UserMenu profile={profile as Profile} />
        </header>

        {/* Contenido — padding bottom en móvil para el bottom nav */}
        <main
          className="flex-1 overflow-y-auto pb-20 lg:pb-0"
          style={{ background: 'var(--bg)' }}
        >
          {children}
        </main>
      </div>

      {/* Bottom nav — solo móvil */}
      <MobileNav pendingCount={pendingCount ?? 0} />
    </div>
  )
}
