import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SyncButton } from '@/components/gmail/sync-button'
import { Mail, Clock, Tag } from 'lucide-react'
import { cn, formatRelativeDate } from '@/lib/utils'
import { TASK_TYPE_CONFIG } from '@/types'
import type { Email, TaskType } from '@/types'

export const metadata: Metadata = {
  title: 'Correos',
}

export const revalidate = 0

export default async function EmailsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: emails } = await supabase
    .from('emails')
    .select('*')
    .eq('user_id', user.id)
    .order('received_at', { ascending: false })
    .limit(100)

  const { data: profile } = await supabase
    .from('profiles')
    .select('last_gmail_sync, google_refresh_token')
    .eq('id', user.id)
    .single()

  const hasGoogleToken = !!profile?.google_refresh_token
  const lastSync = profile?.last_gmail_sync
    ? formatRelativeDate(profile.last_gmail_sync)
    : null

  const totalEmails = emails?.length ?? 0
  const detectedEmails = emails?.filter((e) => e.detected_type).length ?? 0

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
            <Mail className="w-5 h-5 text-zinc-500" />
            Correos detectados
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {totalEmails > 0
              ? `${totalEmails} correos procesados · ${detectedEmails} con contenido académico`
              : 'Sincroniza tu Gmail para detectar tareas automáticamente'}
            {lastSync && (
              <span className="ml-2 text-zinc-600">· Último sync {lastSync}</span>
            )}
          </p>
        </div>

        {hasGoogleToken ? (
          <SyncButton />
        ) : (
          <div className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
            Vuelve a hacer login para conectar Gmail
          </div>
        )}
      </div>

      {/* Sin token warning */}
      {!hasGoogleToken && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-sm font-medium text-amber-400">Gmail no conectado</p>
            <p className="text-xs text-zinc-500 mt-1">
              Cierra sesión y vuelve a entrar con tu cuenta de Google para conectar Gmail.
            </p>
          </div>
        </div>
      )}

      {/* Lista de correos */}
      {emails && emails.length > 0 ? (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
          {/* Filtros rápidos */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/60 overflow-x-auto">
            <span className="text-xs text-zinc-600 flex-shrink-0">Filtrar:</span>
            {(['evaluacion', 'tarea', 'exposicion', 'recordatorio'] as TaskType[]).map(
              (type) => {
                const config = TASK_TYPE_CONFIG[type]
                const count = emails.filter((e) => e.detected_type === type).length
                if (count === 0) return null
                return (
                  <span
                    key={type}
                    className={cn(
                      'flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border',
                      config.bgColor,
                      config.color,
                      config.borderColor
                    )}
                  >
                    {config.label} ({count})
                  </span>
                )
              }
            )}
          </div>

          <div className="divide-y divide-zinc-800/40">
            {(emails as Email[]).map((email) => {
              const typeConfig = email.detected_type
                ? TASK_TYPE_CONFIG[email.detected_type as TaskType]
                : null

              return (
                <div
                  key={email.id}
                  className="flex items-start gap-4 px-4 py-3.5 hover:bg-zinc-800/20 transition-colors"
                >
                  {/* Indicador de tipo */}
                  <div className="flex-shrink-0 mt-0.5">
                    {typeConfig ? (
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full mt-1.5',
                          email.detected_type === 'evaluacion' && 'bg-rose-500',
                          email.detected_type === 'tarea' && 'bg-indigo-500',
                          email.detected_type === 'exposicion' && 'bg-violet-500',
                          email.detected_type === 'recordatorio' && 'bg-amber-500'
                        )}
                      />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-zinc-700 mt-1.5" />
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {email.subject}
                      </p>
                      {typeConfig && (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border flex-shrink-0',
                            typeConfig.bgColor,
                            typeConfig.color,
                            typeConfig.borderColor
                          )}
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {typeConfig.label}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-zinc-500 truncate max-w-[200px]">
                        {email.sender}
                      </span>
                      {email.detected_due_date && (
                        <span className="flex items-center gap-1 text-xs text-amber-400/80 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          {new Date(email.detected_due_date).toLocaleDateString('es-CL', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      )}
                    </div>

                    {email.body_preview && (
                      <p className="text-xs text-zinc-600 mt-1 line-clamp-1">
                        {email.body_preview}
                      </p>
                    )}
                  </div>

                  {/* Fecha */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-zinc-600">
                      {formatRelativeDate(email.received_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-zinc-700" />
          </div>
          <p className="text-sm font-medium text-zinc-400">No hay correos procesados</p>
          <p className="text-xs text-zinc-600 mt-1 max-w-xs">
            Haz clic en "Sincronizar Gmail" para analizar tus correos y detectar tareas académicas automáticamente
          </p>
        </div>
      )}
    </div>
  )
}
