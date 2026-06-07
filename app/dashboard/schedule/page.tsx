import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GraduationCap, Clock, LayoutGrid } from 'lucide-react'
import { SimpleScheduleForm } from '@/components/schedule/simple-schedule-form'
import { BlocksSchedule } from '@/components/schedule/blocks-schedule'
import { switchToBlocksMode, switchToSimpleMode } from '@/lib/actions/schedule'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Horario Escolar' }
export const revalidate = 0

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: schedule }, { data: periods }] = await Promise.all([
    supabase.from('school_schedules').select('*').eq('user_id', user.id).single(),
    supabase.from('school_periods').select('*').eq('user_id', user.id).order('start_time'),
  ])

  const isBlocksMode = schedule?.mode === 'blocks'

  return (
    <div className="p-7 max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-white/30" />
          Horario Escolar
        </h1>
        <p className="text-sm text-white/35 mt-1">
          El planificador respeta tu horario y organiza el estudio en los ratos libres
        </p>
      </div>

      {/* Mode toggle */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="text-sm font-semibold text-white">Modo de configuración</h2>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {/* Simple */}
          <form action={switchToSimpleMode}>
            <button type="submit" className="w-full text-left">
              <div className={cn(
                'p-4 rounded-2xl cursor-pointer transition-all',
                !isBlocksMode
                  ? 'border border-indigo-500/40 bg-indigo-500/10'
                  : 'border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]'
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className={cn('w-4 h-4', !isBlocksMode ? 'text-indigo-400' : 'text-white/30')} />
                  <span className={cn('text-sm font-semibold', !isBlocksMode ? 'text-indigo-300' : 'text-white/50')}>
                    Modo Simple
                  </span>
                  {!isBlocksMode && (
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/30">Solo ingresas la hora de entrada y salida del colegio</p>
              </div>
            </button>
          </form>

          {/* Bloques */}
          <form action={switchToBlocksMode}>
            <button type="submit" className="w-full text-left">
              <div className={cn(
                'p-4 rounded-2xl cursor-pointer transition-all',
                isBlocksMode
                  ? 'border border-violet-500/40 bg-violet-500/10'
                  : 'border border-white/07 bg-white/[0.02] hover:bg-white/[0.04]'
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <LayoutGrid className={cn('w-4 h-4', isBlocksMode ? 'text-violet-400' : 'text-white/30')} />
                  <span className={cn('text-sm font-semibold', isBlocksMode ? 'text-violet-300' : 'text-white/50')}>
                    Por Bloques
                  </span>
                  {isBlocksMode && (
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/30">Configuras cada asignatura, recreo y almuerzo por hora</p>
              </div>
            </button>
          </form>
        </div>
      </div>

      {/* Configuración según modo */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="text-sm font-semibold text-white">
            {isBlocksMode ? 'Bloques por día' : 'Horario general'}
          </h2>
        </div>
        <div className="p-5">
          {!isBlocksMode ? (
            <SimpleScheduleForm
              initialStart={schedule?.simple_start_time?.slice(0,5) ?? '07:45'}
              initialEnd={schedule?.simple_end_time?.slice(0,5) ?? '15:40'}
              initialDays={schedule?.active_days ?? [1,2,3,4,5]}
            />
          ) : (
            schedule ? (
              <BlocksSchedule
                scheduleId={schedule.id}
                initialPeriods={periods ?? []}
              />
            ) : (
              <div className="text-center py-6 text-white/30 text-sm">
                Guarda primero el horario en modo simple, luego cambia a bloques
              </div>
            )
          )}
        </div>
      </div>

      {/* Tip */}
      <div className="p-4 rounded-2xl"
        style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)' }}>
        <p className="text-xs text-indigo-300/70 leading-relaxed">
          💡 <strong className="text-indigo-300">Tip:</strong> Una vez que configures tu horario, ve al Planificador y genera tu plan de estudio. La app automáticamente programará sesiones en las tardes y fines de semana, respetando tus rutinas y el horario de clases.
        </p>
      </div>
    </div>
  )
}
