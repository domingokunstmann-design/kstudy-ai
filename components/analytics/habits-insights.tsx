// Insights de hábitos — totalmente basados en datos, sin IA ni APIs externas

interface Session {
  date: string
  duration_minutes: number | null
  start_time?: string | null
}

interface Task {
  status: string
  completed_at: string | null
  due_date: string | null
  type: string
  course_name: string | null
}

interface Props {
  sessions: Session[]
  tasks: Task[]
}

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function HabitsInsights({ sessions, tasks }: Props) {
  // ── Día más productivo ──────────────────────────────────────────────────────
  const dayMinutes: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  for (const s of sessions) {
    const dow = new Date(s.date + 'T12:00:00').getDay()
    dayMinutes[dow] += s.duration_minutes ?? 0
  }
  const bestDayIdx = Object.entries(dayMinutes).sort((a, b) => b[1] - a[1])[0]?.[0]
  const bestDay = bestDayIdx !== undefined ? DAYS_ES[Number(bestDayIdx)] : null
  const bestDayMinutes = bestDay ? dayMinutes[Number(bestDayIdx)] : 0

  // ── Tasa de completitud ─────────────────────────────────────────────────────
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completada').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // ── Horas esta semana ───────────────────────────────────────────────────────
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)
  const weekMinutes = sessions
    .filter(s => new Date(s.date + 'T12:00:00') >= weekStart)
    .reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0)
  const weekHours = (weekMinutes / 60).toFixed(1)

  // ── Tarea completada antes vs. tarde ────────────────────────────────────────
  const withDates = tasks.filter(t => t.completed_at && t.due_date)
  const onTime = withDates.filter(t => new Date(t.completed_at!) <= new Date(t.due_date!)).length
  const onTimePct = withDates.length > 0 ? Math.round((onTime / withDates.length) * 100) : null

  // ── Asignatura más activa ───────────────────────────────────────────────────
  const courseCount: Record<string, number> = {}
  for (const t of tasks) {
    const name = t.course_name?.trim() || 'Sin asignatura'
    courseCount[name] = (courseCount[name] ?? 0) + 1
  }
  const topCourse = Object.entries(courseCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  // ── Render ─────────────────────────────────────────────────────────────────
  const insights: { icon: string; label: string; value: string; sub?: string }[] = []

  if (bestDay && bestDayMinutes > 0) {
    insights.push({
      icon: '📅',
      label: 'Día más productivo',
      value: bestDay,
      sub: `${Math.round(bestDayMinutes / 60 * 10) / 10}h de estudio en promedio`,
    })
  }

  insights.push({
    icon: '✅',
    label: 'Tasa de completitud',
    value: `${completionRate}%`,
    sub: `${completedTasks} de ${totalTasks} tareas completadas`,
  })

  insights.push({
    icon: '⏱️',
    label: 'Esta semana',
    value: `${weekHours}h`,
    sub: 'horas de estudio en el plan',
  })

  if (onTimePct !== null) {
    insights.push({
      icon: onTimePct >= 70 ? '🏃' : '⚠️',
      label: 'Entrega a tiempo',
      value: `${onTimePct}%`,
      sub: onTimePct >= 80 ? '¡Excelente puntualidad!' : 'Intenta empezar antes',
    })
  }

  if (topCourse) {
    insights.push({
      icon: '📖',
      label: 'Asignatura más activa',
      value: topCourse.length > 16 ? topCourse.slice(0, 16) + '…' : topCourse,
      sub: `${courseCount[topCourse]} evaluaciones/tareas`,
    })
  }

  if (insights.length === 0) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
        <p className="text-sm">Completa algunas sesiones y tareas para ver tus hábitos</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {insights.map((ins, i) => (
        <div key={i} className="p-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xl mb-2">{ins.icon}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
            style={{ color: 'var(--text-muted)' }}>
            {ins.label}
          </p>
          <p className="text-xl font-bold text-white">{ins.value}</p>
          {ins.sub && (
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {ins.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
