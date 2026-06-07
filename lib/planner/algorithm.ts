// ============================================
// KSTUDY AI — Algoritmo de Planificación Inteligente
// Sin IA — lógica basada en reglas
// ============================================

export interface Routine {
  day_of_week: number  // 0=Dom, 1=Lun, ... 6=Sab
  start_time: string   // "HH:MM"
  end_time: string     // "HH:MM"
  name: string
}

export interface SchoolSchedule {
  mode: 'simple' | 'blocks'
  simple_start_time?: string
  simple_end_time?: string
  active_days?: number[]
  periods?: { day_of_week: number; start_time: string; end_time: string }[]
}

export interface PlanTask {
  id: string
  title: string
  due_date: string
  type: string
  priority: string
  topics: { id: string; topic: string; estimated_hours: number }[]
  estimated_study_hours?: number  // total si no hay topics
  // Campos enriquecidos por Gemini (opcionales — si no vienen, usa reglas)
  weight?: number           // 0.1–1.0: importancia jerárquica
  ai_estimated_hours?: number // horas sugeridas por Gemini
  ai_topics?: string[]      // temas sugeridos por Gemini
}

export interface UserPreferences {
  study_start_time: string   // "09:00"
  study_end_time: string     // "22:00"
  max_daily_study_hours: number
  session_duration_minutes: number
  break_minutes: number
  days_before_to_start: number
}

export interface PlannedSession {
  task_id: string
  topic_id: string | null
  date: string           // "YYYY-MM-DD"
  start_time: string     // "HH:MM"
  end_time: string       // "HH:MM"
  duration_minutes: number
  label: string
}

const DEFAULT_PREFS: UserPreferences = {
  study_start_time: '09:00',
  study_end_time: '22:00',
  max_daily_study_hours: 4,
  session_duration_minutes: 45,
  break_minutes: 15,
  days_before_to_start: 5,
}

// Peso por defecto cuando no viene de Gemini — basado en tipo
function defaultWeight(type: string): number {
  switch (type) {
    case 'evaluacion': return 0.75
    case 'exposicion': return 0.55
    case 'tarea':      return 0.40
    default:           return 0.30
  }
}

// Días de anticipación escalados por weight
// weight=1.0 → 12 días antes; weight=0.3 → 3 días antes
function daysBeforeForWeight(weight: number, baseDays: number): number {
  return Math.round(baseDays + (weight - 0.3) / 0.7 * (baseDays * 1.4))
}

// ============================================
// Función principal
// ============================================

export function generateStudyPlan(
  tasks: PlanTask[],
  routines: Routine[],
  prefs: Partial<UserPreferences> = {},
  schoolSchedule?: SchoolSchedule
): PlannedSession[] {
  const p = { ...DEFAULT_PREFS, ...prefs }
  const sessions: PlannedSession[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Filtrar tareas con fecha y ordenar:
  // 1ro por urgencia (fecha más cercana primero)
  // 2do por weight (mayor importancia primero si mismo día)
  const tasksToPlan = tasks
    .filter(t => t.due_date && new Date(t.due_date) > today)
    .sort((a, b) => {
      const dateA = new Date(a.due_date).getTime()
      const dateB = new Date(b.due_date).getTime()
      if (dateA !== dateB) return dateA - dateB
      const wa = a.weight ?? defaultWeight(a.type)
      const wb = b.weight ?? defaultWeight(b.type)
      return wb - wa // mayor weight primero
    })

  if (tasksToPlan.length === 0) return []

  // Mapa de slots disponibles por día (date → minutos disponibles)
  const dailyUsed: Map<string, number> = new Map()

  for (const task of tasksToPlan) {
    const dueDate = new Date(task.due_date)
    dueDate.setHours(23, 59, 0, 0)

    // Cuántos días antes comenzar — escala con el weight de la tarea
    const taskWeight = task.weight ?? defaultWeight(task.type)
    const daysAhead = daysBeforeForWeight(taskWeight, p.days_before_to_start)
    const startDate = new Date(dueDate)
    startDate.setDate(startDate.getDate() - daysAhead)
    if (startDate < today) startDate.setTime(today.getTime())

    // Calcular sesiones necesarias
    const sessionsNeeded = buildSessionsForTask(task, p)

    // Distribuir sesiones en días disponibles
    let dayPtr = new Date(startDate)
    let sessionIdx = 0

    while (sessionIdx < sessionsNeeded.length && dayPtr < dueDate) {
      const dateStr = formatDate(dayPtr)
      const dayOfWeek = dayPtr.getDay()

      // Combinar rutinas + horario escolar como bloques bloqueados
      const allBlocked = [...routines, ...getSchoolBlocks(dayPtr, schoolSchedule)]
      // Slots disponibles este día
      const freeSlots = getDayFreeSlots(dayPtr, allBlocked, p, dailyUsed.get(dateStr) ?? 0)

      for (const slot of freeSlots) {
        if (sessionIdx >= sessionsNeeded.length) break
        if ((dailyUsed.get(dateStr) ?? 0) >= p.max_daily_study_hours * 60) break

        const session = sessionsNeeded[sessionIdx]
        sessions.push({
          ...session,
          date: dateStr,
          start_time: slot.start,
          end_time: addMinutes(slot.start, session.duration_minutes),
        })

        dailyUsed.set(
          dateStr,
          (dailyUsed.get(dateStr) ?? 0) + session.duration_minutes + p.break_minutes
        )
        sessionIdx++
      }

      dayPtr.setDate(dayPtr.getDate() + 1)
    }
  }

  return sessions.sort((a, b) => {
    const d = a.date.localeCompare(b.date)
    if (d !== 0) return d
    return a.start_time.localeCompare(b.start_time)
  })
}

// ============================================
// Helpers internos
// ============================================

function buildSessionsForTask(
  task: PlanTask,
  p: UserPreferences
): Omit<PlannedSession, 'date' | 'start_time' | 'end_time'>[] {
  const sessions: Omit<PlannedSession, 'date' | 'start_time' | 'end_time'>[] = []

  if (task.topics && task.topics.length > 0) {
    // Temas ingresados manualmente — prioridad máxima
    for (const topic of task.topics) {
      const totalMinutes = Math.round(topic.estimated_hours * 60)
      const numSessions = Math.ceil(totalMinutes / p.session_duration_minutes)
      for (let i = 0; i < numSessions; i++) {
        sessions.push({
          task_id: task.id,
          topic_id: topic.id,
          duration_minutes: p.session_duration_minutes,
          label: `${task.title} — ${topic.topic}`,
        })
      }
    }
  } else if (task.ai_topics && task.ai_topics.length > 0) {
    // Temas sugeridos por Gemini — distribuye las horas AI entre ellos
    const totalHours = task.ai_estimated_hours ?? defaultHoursForType(task.type)
    const hoursPerTopic = totalHours / task.ai_topics.length
    for (const topicName of task.ai_topics) {
      const totalMinutes = Math.round(hoursPerTopic * 60)
      const numSessions = Math.max(1, Math.ceil(totalMinutes / p.session_duration_minutes))
      for (let i = 0; i < numSessions; i++) {
        sessions.push({
          task_id: task.id,
          topic_id: null,
          duration_minutes: p.session_duration_minutes,
          label: `${task.title} — ${topicName}`,
        })
      }
    }
  } else {
    // Sin topics: usar horas estimadas por Gemini o fallback por tipo
    const hoursEstimate = task.ai_estimated_hours ?? defaultHoursForType(task.type)
    const totalMinutes = Math.round(hoursEstimate * 60)
    const numSessions = Math.ceil(totalMinutes / p.session_duration_minutes)
    for (let i = 0; i < numSessions; i++) {
      sessions.push({
        task_id: task.id,
        topic_id: null,
        duration_minutes: p.session_duration_minutes,
        label: `Estudiar: ${task.title}`,
      })
    }
  }

  return sessions
}

function defaultHoursForType(type: string): number {
  switch (type) {
    case 'evaluacion': return 3
    case 'exposicion': return 2
    case 'tarea':      return 1.5
    default:           return 1
  }
}

function getDayFreeSlots(
  day: Date,
  routines: Routine[],
  p: UserPreferences,
  usedMinutes: number
): { start: string }[] {
  const dayOfWeek = day.getDay()
  const slots: { start: string }[] = []

  // Bloques bloqueados por rutinas este día
  const blocked = routines
    .filter(r => r.day_of_week === dayOfWeek)
    .map(r => ({ start: timeToMinutes(r.start_time), end: timeToMinutes(r.end_time) }))

  // Ventana de estudio del día
  const studyStart = timeToMinutes(p.study_start_time)
  const studyEnd = timeToMinutes(p.study_end_time)

  let cursor = studyStart
  const maxMinutes = p.max_daily_study_hours * 60

  while (
    cursor + p.session_duration_minutes <= studyEnd &&
    (usedMinutes + (slots.length * (p.session_duration_minutes + p.break_minutes))) < maxMinutes
  ) {
    const slotEnd = cursor + p.session_duration_minutes

    // Verificar que no choca con ninguna rutina
    const conflicts = blocked.some(b => cursor < b.end && slotEnd > b.start)

    if (!conflicts) {
      slots.push({ start: minutesToTime(cursor) })
      cursor = slotEnd + p.break_minutes
    } else {
      // Saltar hasta el final del bloque bloqueado
      const nextFree = blocked
        .filter(b => b.end > cursor)
        .sort((a, b) => a.end - b.end)[0]?.end ?? (cursor + 30)
      cursor = nextFree
    }
  }

  return slots
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function addMinutes(time: string, minutes: number): string {
  return minutesToTime(timeToMinutes(time) + minutes)
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Convierte el horario escolar en bloques bloqueados para un día específico
 */
function getSchoolBlocks(day: Date, schedule?: SchoolSchedule): Routine[] {
  if (!schedule) return []
  const dayOfWeek = day.getDay()

  if (schedule.mode === 'simple') {
    const activeDays = schedule.active_days ?? [1,2,3,4,5]
    if (!activeDays.includes(dayOfWeek)) return []
    if (!schedule.simple_start_time || !schedule.simple_end_time) return []
    return [{
      day_of_week: dayOfWeek,
      start_time: schedule.simple_start_time.slice(0,5),
      end_time: schedule.simple_end_time.slice(0,5),
      name: 'Colegio',
    }]
  }

  if (schedule.mode === 'blocks' && schedule.periods) {
    return schedule.periods
      .filter(p => p.day_of_week === dayOfWeek)
      .map(p => ({
        day_of_week: dayOfWeek,
        start_time: p.start_time.slice(0,5),
        end_time: p.end_time.slice(0,5),
        name: 'Colegio',
      }))
  }

  return []
}

export function getDayName(dayOfWeek: number): string {
  return ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][dayOfWeek]
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} – ${end}`
}
