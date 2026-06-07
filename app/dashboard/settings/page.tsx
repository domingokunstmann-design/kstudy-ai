import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings, User } from 'lucide-react'
import { SyncButton } from '@/components/gmail/sync-button'
import { CalendarSyncButton } from '@/components/settings/calendar-sync-button'
import { formatRelativeDate, getInitials } from '@/lib/utils'
import Image from 'next/image'
import type { Profile } from '@/types'

export const metadata: Metadata = { title: 'Configuración' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const p = profile as Profile & { has_calendar_scope?: boolean }

  const integrations = [
    {
      key: 'gmail',
      label: 'Gmail',
      icon: '📧',
      description: 'Detecta tareas desde tus correos automáticamente',
      connected: !!p?.google_refresh_token,
      lastSync: p?.last_gmail_sync,
      action: <SyncButton />,
    },
    {
      key: 'calendar',
      label: 'Google Calendar',
      icon: '📅',
      description: 'Agrega tus tareas al calendario automáticamente',
      connected: !!p?.has_calendar_scope,
      lastSync: null,
      action: <CalendarSyncButton />,
      hint: !p?.has_calendar_scope
        ? 'Cierra sesión y vuelve a entrar con Google para activar Calendar'
        : null,
    },
    {
      key: 'classroom',
      label: 'Google Classroom',
      icon: '📚',
      description: 'Sincroniza cursos y trabajos pendientes',
      connected: !!p?.last_classroom_sync,
      lastSync: p?.last_classroom_sync,
      action: null,
    },
  ]

  return (
    <div className="p-7 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-white/30" />
          Configuración
        </h1>
      </div>

      {/* Perfil */}
      <div className="section-card">
        <div className="section-header">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-white/30" />
            <h2 className="text-sm font-semibold text-white">Perfil</h2>
          </div>
        </div>
        <div className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
            {p?.avatar_url ? (
              <Image src={p.avatar_url} alt="Avatar" width={56} height={56} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-bold text-indigo-400">
                {getInitials(p?.full_name)}
              </div>
            )}
          </div>
          <div>
            <p className="text-base font-semibold text-white">{p?.full_name ?? 'Usuario'}</p>
            <p className="text-sm text-white/40 mt-0.5">{p?.email}</p>
          </div>
        </div>
      </div>

      {/* Integraciones */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="text-sm font-semibold text-white">Integraciones</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {integrations.map(item => (
            <div key={item.key} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <span className={`pill text-[10px] font-bold ${
                        item.connected
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}>
                        {item.connected ? '● Activo' : '○ Inactivo'}
                      </span>
                    </div>
                    <p className="text-xs text-white/35 mt-0.5">{item.description}</p>
                    {item.lastSync && (
                      <p className="text-xs text-white/25 mt-1">
                        Último sync: {formatRelativeDate(item.lastSync)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {item.hint && (
                <div className="flex items-start gap-2 p-3 rounded-xl"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <span className="text-amber-400 text-sm">⚠️</span>
                  <p className="text-xs text-amber-400/80">{item.hint}</p>
                </div>
              )}

              {item.action && item.connected && (
                <div>{item.action}</div>
              )}

              {item.action && !item.connected && item.key !== 'calendar' && (
                <div>{item.action}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Privacidad */}
      <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs text-white/30 leading-relaxed">
          🔒 Kstudy AI accede a tu Gmail y Classroom con permisos de <strong className="text-white/40">solo lectura</strong>. A tu calendario agrega eventos pero nunca modifica los existentes. Tus datos se almacenan en tu base de datos privada de Supabase.
        </p>
      </div>
    </div>
  )
}
