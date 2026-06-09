import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarHeader } from '@/components/calendar/calendar-header'
import { DailyView } from '@/components/calendar/daily-view'
import { WeeklyView } from '@/components/calendar/weekly-view'
import { MonthlyView } from '@/components/calendar/monthly-view'
import {
  format,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  parseISO, isValid,
} from 'date-fns'
import type { Task } from '@/types'

export const metadata: Metadata = { title: 'Calendario' }
export const revalidate = 0

type CalendarView = 'daily' | 'weekly' | 'monthly'

interface PageProps {
  searchParams: Promise<{ view?: string; date?: string }>
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Resolver search params
  const params = await searchParams
  const view: CalendarView =
    params.view === 'daily' || params.view === 'weekly' || params.view === 'monthly'
      ? params.view
      : 'weekly'

  const rawDate = params.date ? parseISO(params.date) : new Date()
  const currentDate = isValid(rawDate) ? rawDate : new Date()
  const currentDateStr = format(currentDate, 'yyyy-MM-dd')

  // Rango de fechas según vista
  let rangeStart: Date, rangeEnd: Date
  if (view === 'daily') {
    rangeStart = currentDate
    rangeEnd = currentDate
  } else if (view === 'weekly') {
    rangeStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    rangeEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  } else {
    rangeStart = startOfMonth(currentDate)
    rangeEnd = endOfMonth(currentDate)
  }

  // Fetches en paralelo
  const [
    { data: tasks },
    { data: sessions },
    { data: periods },
    { data: routines },
  ] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pendiente', 'en_progreso'])
      .gte('due_date', rangeStart.toISOString())
      .lte('due_date', rangeEnd.toISOString())
      .order('due_date', { ascending: true }),

    // Sesiones del plan de estudio
    supabase
      .from('study_plan_sessions')
      .select('id, label, start_time, end_time, duration_minutes, completed')
      .eq('user_id', user.id)
      .gte('start_time', rangeStart.toISOString())
      .lte('start_time', rangeEnd.toISOString()),

    // Períodos escolares (sin filtro de fecha — son por día de la semana)
    supabase
      .from('school_periods')
      .select('subject, period_type, start_time, end_time, day_of_week, color')
      .eq('user_id', user.id),

    // Rutinas activas
    supabase
      .from('routines')
      .select('name, start_time, end_time, color, day_of_week')
      .eq('user_id', user.id)
      .eq('active', true),
  ])

  const typedTasks = (tasks as Task[] ?? [])
  const typedSessions = sessions ?? []
  const typedPeriods = periods ?? []
  const typedRoutines = routines ?? []

  // Para DailyView: filtrar períodos y rutinas por día de la semana
  const currentDow = (currentDate.getDay() + 6) % 7 + 1 // lun=1
  const dailyPeriods = typedPeriods.filter(p => p.day_of_week === currentDow)
  const dailyRoutines = typedRoutines.filter(r => r.day_of_week === currentDow)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5 animate-fade-in">
      <CalendarHeader view={view} currentDate={currentDateStr} />

      {view === 'daily' && (
        <DailyView
          tasks={typedTasks}
          sessions={typedSessions}
          periods={dailyPeriods}
          routines={dailyRoutines}
          date={currentDate}
        />
      )}

      {view === 'weekly' && (
        <WeeklyView
          tasks={typedTasks}
          sessions={typedSessions}
          periods={typedPeriods}
          routines={typedRoutines}
          date={currentDate}
        />
      )}

      {view === 'monthly' && (
        <MonthlyView
          tasks={typedTasks}
          date={currentDate}
        />
      )}
    </div>
  )
}
