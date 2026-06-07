'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, CheckSquare, Calendar,
  BookOpen, Mail, Settings, Sparkles, Brain, GraduationCap, Zap, BarChart2,
} from 'lucide-react'

const NAV_ITEMS = [
  { title: 'Dashboard',    href: '/dashboard',             icon: LayoutDashboard },
  { title: 'Tareas',       href: '/dashboard/tasks',       icon: CheckSquare },
  { title: 'Planificador', href: '/dashboard/planner',     icon: Brain },
  { title: 'Mi Horario',   href: '/dashboard/schedule',    icon: GraduationCap },
  { title: 'Calendario',   href: '/dashboard/calendar',    icon: Calendar },
  { title: 'Classroom',    href: '/dashboard/classroom',   icon: BookOpen },
  { title: 'Correos',      href: '/dashboard/emails',      icon: Mail },
  { title: 'Analytics',    href: '/dashboard/analytics',   icon: BarChart2 },
  { title: 'IA · Temarios',href: '/dashboard/ai',          icon: Zap },
]

interface SidebarProps { pendingCount?: number }

export function Sidebar({ pendingCount = 0 }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="sidebar hidden lg:flex lg:flex-col">
      {/* ── Logo ── */}
      <div className="relative flex items-center gap-3 px-5 pt-6 pb-5">
        {/* Icono */}
        <div className="relative flex-shrink-0">
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #7c6af7 0%, #a89dff 100%)',
              boxShadow: '0 4px 20px rgba(124,106,247,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2.2} />
          </div>
          {/* Pulso */}
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
            style={{ background: '#22c55e', borderColor: '#130f26' }}
          />
        </div>

        {/* Nombre */}
        <div className="leading-none">
          <span
            className="text-[15px] font-bold tracking-tight"
            style={{ color: '#e8e4ff' }}
          >
            Kstudy
          </span>
          <span
            className="text-[15px] font-bold tracking-tight ml-1"
            style={{
              background: 'linear-gradient(135deg, #c4bcff, #7c6af7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            AI
          </span>
        </div>
      </div>

      {/* ── Separador ── */}
      <div
        className="mx-4 mb-3 h-px"
        style={{ background: 'rgba(124,106,247,0.12)' }}
      />

      {/* ── Navegación ── */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('nav-item group', isActive && 'active')}
            >
              <Icon
                className={cn(
                  'w-[15px] h-[15px] flex-shrink-0 transition-colors nav-icon',
                  isActive ? 'text-[--accent-light]' : 'text-[rgba(180,175,220,0.4)]'
                )}
                strokeWidth={isActive ? 2.1 : 1.8}
              />
              <span className="flex-1 truncate">{item.title}</span>

              {/* Badge de tareas pendientes */}
              {item.title === 'Tareas' && pendingCount > 0 && (
                <span
                  className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
                  style={{
                    background: 'rgba(124,106,247,0.28)',
                    color: '#c4bcff',
                    border: '1px solid rgba(124,106,247,0.3)',
                  }}
                >
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}

              {/* Badge IA */}
              {item.href === '/dashboard/ai' && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(124,106,247,0.2)',
                    color: '#a89dff',
                    border: '1px solid rgba(124,106,247,0.25)',
                    letterSpacing: '0.02em',
                  }}
                >
                  NEW
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Status ── */}
      <div className="px-4 pb-3">
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px]"
          style={{
            background: 'rgba(34,197,94,0.07)',
            border: '1px solid rgba(34,197,94,0.14)',
          }}
        >
          <span className="relative flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block" />
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-50" />
          </span>
          <span className="text-[11.5px] font-medium" style={{ color: 'rgba(134,239,172,0.75)' }}>
            Sync activo
          </span>
        </div>
      </div>

      {/* ── Configuración ── */}
      <div
        className="px-3 pb-5 pt-2"
        style={{ borderTop: '1px solid rgba(124,106,247,0.08)' }}
      >
        <Link
          href="/dashboard/settings"
          className={cn('nav-item', pathname === '/dashboard/settings' && 'active')}
        >
          <Settings
            className={cn(
              'w-[15px] h-[15px] flex-shrink-0',
              pathname === '/dashboard/settings'
                ? 'text-[--accent-light]'
                : 'text-[rgba(180,175,220,0.4)]'
            )}
            strokeWidth={1.8}
          />
          <span>Configuración</span>
        </Link>
      </div>
    </aside>
  )
}
