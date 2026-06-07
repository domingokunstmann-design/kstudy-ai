'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, CheckSquare, Calendar, Brain, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

const MAIN_ITEMS = [
  { title: 'Inicio',       href: '/dashboard',           icon: LayoutDashboard },
  { title: 'Tareas',       href: '/dashboard/tasks',     icon: CheckSquare },
  { title: 'Calendario',   href: '/dashboard/calendar',  icon: Calendar },
  { title: 'Planificador', href: '/dashboard/planner',   icon: Brain },
]

const MORE_ITEMS = [
  { title: 'Mi Horario',    href: '/dashboard/schedule' },
  { title: 'Classroom',     href: '/dashboard/classroom' },
  { title: 'Correos',       href: '/dashboard/emails' },
  { title: 'Analytics',     href: '/dashboard/analytics' },
  { title: 'IA · Temarios', href: '/dashboard/ai' },
  { title: 'Configuración', href: '/dashboard/settings' },
]

export function MobileNav({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  const isMoreActive = MORE_ITEMS.some(i => pathname.startsWith(i.href))

  return (
    <>
      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch lg:hidden"
        style={{
          background: 'rgba(13,13,24,0.97)',
          borderTop: '1px solid rgba(124,106,247,0.15)',
          backdropFilter: 'blur(20px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {MAIN_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors"
              style={{ color: isActive ? '#a89dff' : 'rgba(255,255,255,0.35)' }}
              onClick={() => setShowMore(false)}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.7} />
              <span className="text-[10px] font-medium">{item.title}</span>
              {item.title === 'Tareas' && pendingCount > 0 && (
                <span
                  className="absolute top-2 text-[9px] font-bold px-1 rounded-full"
                  style={{ background: '#7c6af7', color: 'white' }}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}

        {/* Más */}
        <button
          onClick={() => setShowMore(v => !v)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors"
          style={{ color: isMoreActive || showMore ? '#a89dff' : 'rgba(255,255,255,0.35)' }}
        >
          <MoreHorizontal className="w-5 h-5" strokeWidth={1.7} />
          <span className="text-[10px] font-medium">Más</span>
        </button>
      </nav>

      {/* Panel "Más" */}
      {showMore && (
        <>
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setShowMore(false)}
          />
          <div
            className="fixed bottom-16 left-3 right-3 z-50 rounded-2xl overflow-hidden lg:hidden"
            style={{
              background: 'rgba(13,13,24,0.98)',
              border: '1px solid rgba(124,106,247,0.2)',
              backdropFilter: 'blur(20px)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {MORE_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMore(false)}
                className={cn(
                  'flex items-center gap-3 px-5 py-3.5 transition-colors border-b',
                  pathname.startsWith(item.href)
                    ? 'text-[#a89dff]'
                    : 'text-[rgba(255,255,255,0.6)]'
                )}
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <span className="text-sm font-medium">{item.title}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  )
}
