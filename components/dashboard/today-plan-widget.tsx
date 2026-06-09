import { createClient } from '@/lib/supabase/server'
import { Play, Clock } from 'lucide-react'
import Link from 'next/link'

interface Session {
  id: string
  subject: string
  start_time: string
  end_time: string
  notes: string | null
  completed: boolean
}

function timeLabel(t: string) {
  // t = "HH:MM" or "HH:MM:SS"
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'AM' : 'PM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

function getStatus(start: string, end: string): 'done' | 'active' | 'next' | 'upcoming' {
  const now = new Date()
  const todayPrefix = now.toISOString().slice(0, 10)
  const startDt = new Date(`${todayPrefix}T${start}`)
  const endDt   = new Date(`${todayPrefix}T${end}`)
  if (endDt < now) return 'done'
  if (startDt <= now && now < endDt) return 'active'
  // "next" = first upcoming
  return 'upcoming'
}

export async function TodayPlanWidget() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date().toISOString().slice(0, 10)

  const { data: sessions } = await supabase
    .from('study_plan_sessions')
    .select('id, subject, start_time, end_time, notes, completed')
    .eq('user_id', user.id)
    .eq('date', today)
    .order('start_time', { ascending: true })

  const list = (sessions as Session[] | null) ?? []

  // Tag "next" only to first upcoming after any active
  const hasActive = list.some(s => getStatus(s.start_time, s.end_time) === 'active')
  let markedNext = false

  return (
    <div className="section-card h-full flex flex-col">
      <div className="section-header">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-white">Tu plan de hoy</h2>
        </div>
        <Link href="/dashboard/planner" className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors">
          Editar →
        </Link>
      </div>

      <div className="flex-1 p-4">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <div className="text-3xl mb-3">📅</div>
            <p className="text-sm font-medium text-white/40">Sin sesiones hoy</p>
            <Link href="/dashboard/planner" className="mt-3 text-xs font-medium text-violet-400 hover:text-violet-300">
              Crear plan →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((s, idx) => {
              const rawStatus = getStatus(s.start_time, s.end_time)
              let status = rawStatus
              if (rawStatus === 'upcoming' && !hasActive && !markedNext) {
                status = 'next'
                markedNext = true
              }
              if (s.completed) status = 'done'

              const isActive = status === 'active'
              const isNext   = status === 'next'
              const isDone   = status === 'done'

              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{
                    background: isActive
                      ? 'rgba(124,106,247,0.1)'
                      : isDone
                      ? 'rgba(255,255,255,0.02)'
                      : 'rgba(255,255,255,0.03)',
                    border: isActive
                      ? '1px solid rgba(124,106,247,0.25)'
                      : '1px solid rgba(255,255,255,0.05)',
                    opacity: isDone ? 0.45 : 1,
                  }}
                >
                  {/* Timeline line */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: isActive ? '#7c6af7' : isDone ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)',
                        boxShadow: isActive ? '0 0 6px #7c6af7' : 'none',
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDone ? 'text-white/30' : 'text-white/90'}`}>
                      {s.subject}
                    </p>
                    <p className="text-[11px] text-white/30 mt-0.5">
                      {timeLabel(s.start_time)} – {timeLabel(s.end_time)}
                    </p>
                  </div>

                  {/* Badge */}
                  {isActive && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(124,106,247,0.25)', color: '#c4bcff' }}
                    >
                      En curso
                    </span>
                  )}
                  {isNext && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
                    >
                      Siguiente
                    </span>
                  )}
                  {isDone && (
                    <span className="text-white/20 flex-shrink-0 text-base">✓</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
