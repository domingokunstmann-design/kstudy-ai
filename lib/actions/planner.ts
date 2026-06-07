'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateStudyPlan } from '@/lib/planner/algorithm'
import { getStudyPlanAdvice } from '@/lib/ai/plan-advisor'

// ============================================
// Rutinas
// ============================================

export async function saveRoutine(data: {
  name: string
  day_of_week: number
  start_time: string
  end_time: string
  color: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('routines').insert({ ...data, user_id: user.id })
  if (error) return { error: error.message }

  revalidatePath('/dashboard/planner')
  return { success: true }
}

export async function deleteRoutine(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  await supabase.from('routines').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/dashboard/planner')
  return { success: true }
}

// ============================================
// Temas de tareas
// ============================================

export async function addTaskTopic(taskId: string, topic: string, estimatedHours: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('task_topics').insert({
    task_id: taskId,
    user_id: user.id,
    topic,
    estimated_hours: estimatedHours,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/planner')
  return { success: true }
}

export async function deleteTaskTopic(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  await supabase.from('task_topics').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/dashboard/planner')
  return { success: true }
}

// ============================================
// Generar plan de estudio
// ============================================

export async function regeneratePlan() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const [
    { data: tasks },
    { data: routines },
    { data: prefs },
    { data: topics },
    { data: schoolSchedule },
    { data: schoolPeriods },
  ] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', user.id).in('status', ['pendiente', 'en_progreso']).not('due_date', 'is', null),
    supabase.from('routines').select('*').eq('user_id', user.id).eq('active', true),
    supabase.from('user_preferences').select('*').eq('id', user.id).single(),
    supabase.from('task_topics').select('*').eq('user_id', user.id).eq('completed', false),
    supabase.from('school_schedules').select('*').eq('user_id', user.id).single(),
    supabase.from('school_periods').select('*').eq('user_id', user.id),
  ])

  // Armar estructura para el algoritmo
  const planTasks = (tasks ?? []).map(t => ({
    ...t,
    topics: (topics ?? []).filter(top => top.task_id === t.id).map(top => ({
      id: top.id,
      topic: top.topic,
      estimated_hours: Number(top.estimated_hours),
    })),
  }))

  const schoolScheduleData = schoolSchedule ? {
    mode: schoolSchedule.mode as 'simple' | 'blocks',
    simple_start_time: schoolSchedule.simple_start_time,
    simple_end_time: schoolSchedule.simple_end_time,
    active_days: schoolSchedule.active_days,
    periods: schoolPeriods ?? [],
  } : undefined

  const sessions = generateStudyPlan(planTasks, routines ?? [], prefs ?? {}, schoolScheduleData)

  // Borrar plan anterior y guardar el nuevo
  await supabase.from('study_plan_sessions').delete().eq('user_id', user.id)

  if (sessions.length > 0) {
    const { error } = await supabase.from('study_plan_sessions').insert(
      sessions.map(s => ({ ...s, user_id: user.id }))
    )
    if (error) return { error: error.message }
  }

  revalidatePath('/dashboard/planner')
  revalidatePath('/dashboard')
  return { success: true, sessionsCount: sessions.length }
}

// ============================================
// Generar plan con Gemini (jerarquía inteligente)
// ============================================

export async function regeneratePlanAI() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const [
    { data: tasks },
    { data: routines },
    { data: prefs },
    { data: topics },
    { data: schoolSchedule },
    { data: schoolPeriods },
  ] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', user.id).in('status', ['pendiente', 'en_progreso']).not('due_date', 'is', null),
    supabase.from('routines').select('*').eq('user_id', user.id).eq('active', true),
    supabase.from('user_preferences').select('*').eq('id', user.id).single(),
    supabase.from('task_topics').select('*').eq('user_id', user.id).eq('completed', false),
    supabase.from('school_schedules').select('*').eq('user_id', user.id).single(),
    supabase.from('school_periods').select('*').eq('user_id', user.id),
  ])

  if (!tasks || tasks.length === 0) {
    return { error: 'No hay tareas con fecha para planificar' }
  }

  // 1. Pedir consejo a Gemini sobre jerarquía y horas
  const adviceResult = await getStudyPlanAdvice(
    tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      type: t.type,
      priority: t.priority,
      due_date: t.due_date,
      course_name: t.course_name,
    }))
  )

  // Construir mapa de advice por id
  const adviceMap = new Map(adviceResult.advice.map(a => [a.id, a]))

  // 2. Armar tareas enriquecidas con datos de Gemini
  const planTasks = tasks.map(t => {
    const advice = adviceMap.get(t.id)
    return {
      ...t,
      topics: (topics ?? []).filter(top => top.task_id === t.id).map(top => ({
        id: top.id,
        topic: top.topic,
        estimated_hours: Number(top.estimated_hours),
      })),
      // Enriquecimiento de Gemini
      weight: advice?.weight,
      ai_estimated_hours: advice?.estimated_hours,
      // Solo sugerir temas AI si el usuario no ingresó ninguno manualmente
      ai_topics: advice?.suggested_topics,
    }
  })

  const schoolScheduleData = schoolSchedule ? {
    mode: schoolSchedule.mode as 'simple' | 'blocks',
    simple_start_time: schoolSchedule.simple_start_time,
    simple_end_time: schoolSchedule.simple_end_time,
    active_days: schoolSchedule.active_days,
    periods: schoolPeriods ?? [],
  } : undefined

  // 3. Generar plan con el algoritmo enriquecido
  const sessions = generateStudyPlan(planTasks, routines ?? [], prefs ?? {}, schoolScheduleData)

  // 4. Guardar
  await supabase.from('study_plan_sessions').delete().eq('user_id', user.id)

  if (sessions.length > 0) {
    const { error } = await supabase.from('study_plan_sessions').insert(
      sessions.map(s => ({ ...s, user_id: user.id }))
    )
    if (error) return { error: error.message }
  }

  revalidatePath('/dashboard/planner')
  revalidatePath('/dashboard')

  return {
    success: true,
    sessionsCount: sessions.length,
    aiUsed: adviceResult.advice.length > 0,
    aiError: adviceResult.error,
    advice: adviceResult.advice, // para mostrar en UI
  }
}

export async function markSessionComplete(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  await supabase
    .from('study_plan_sessions')
    .update({ completed: true })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard/planner')
  return { success: true }
}
