'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, addDays, addWeeks, addMonths, startOfWeek, subDays, subWeeks, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

type CalendarView = 'daily' | 'weekly' | 'monthly'

interface Props {
  view: CalendarView
  currentDate: string // ISO date string
}

export function CalendarHeader({ view, currentDate }: Props) {
  const router = useRouter()
  const date = new Date(currentDate + 'T12:00:00')

  function navigate(direction: 'prev' | 'next' | 'today') {
    let newDate: Date

    if (direction === 'today') {
      newDate = new Date()
    } else {
      const delta = direction === 'next' ? 1 : -1
      if (view === 'daily') newDate = direction === 'next' ? addDays(date, 1) : subDays(date, 1)
      else if (view === 'weekly') newDate = direction === 'next' ? addWeeks(date, 1) : subWeeks(date, 1)
      else newDate = direction === 'next' ? addMonths(date, 1) : subMonths(date, 1)
    }

    router.push(`/dashboard/calendar?view=${view}&date=${format(newDate, 'yyyy-MM-dd')}`)
  }

  function switchView(newView: CalendarView) {
    router.push(`/dashboard/calendar?view=${newView}&date=${currentDate}`)
  }

  const title = (() => {
    if (view === 'daily') return format(date, "EEEE d 'de' MMMM", { locale: es })
    if (view === 'weekly') {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 })
      const weekEnd = addDays(weekStart, 6)
      return `${format(weekStart, 'd MMM', { locale: es })} – ${format(weekEnd, 'd MMM yyyy', { locale: es })}`
    }
    return format(date, "MMMM yyyy", { locale: es })
  })()

  const VIEWS: { key: CalendarView; label: string }[] = [
    { key: 'daily', label: 'Día' },
    { key: 'weekly', label: 'Semana' },
    { key: 'monthly', label: 'Mes' },
  ]

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Title */}
      <div className="flex items-center gap-2 flex-1">
        <Calendar className="w-5 h-5 text-white/30" />
        <h1 className="text-xl font-bold text-white tracking-tight capitalize">{title}</h1>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('today')}
          className="btn-ghost text-xs px-3 py-1.5"
        >
          Hoy
        </button>
        <div className="flex items-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}>
          <button onClick={() => navigate('prev')}
            className="p-2 text-white/40 hover:text-white/80 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => navigate('next')}
            className="p-2 text-white/40 hover:text-white/80 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* View switcher */}
      <div className="flex items-center rounded-xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {VIEWS.map(v => (
          <button key={v.key} onClick={() => switchView(v.key)}
            className="px-3 py-1.5 text-xs font-semibold transition-all"
            style={{
              background: view === v.key ? 'rgba(99,102,241,0.25)' : 'transparent',
              color: view === v.key ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
            }}>
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )
}
