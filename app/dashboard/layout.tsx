import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { UserMenu } from '@/components/layout/user-menu'
import type { Profile } from '@/types'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { count: pendingCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'pendiente')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Sidebar — solo desktop */}
      <Sidebar pendingCount={pendingCount ?? 0} />

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
