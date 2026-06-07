'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createCalendarEvent, deleteCalendarEvent, updateCalendarEvent } from '@/lib/google/calendar'
import type { TaskStatus, TaskPriority, Task } from '@/types'

function revalidateAll() {
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/tasks')
  revalidatePath('/dashboard/calendar')
  revalidatePath('/dashboard/emails')
}

async function hasCalendarScope(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('has_calendar_scope, google_refresh_token')
    .eq('id', userId)
    .single()
  return !!(data?.has_calendar_scope && data?.google_refresh_token)
}

export async function completeTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  const { error } = await supabase
    .from('tasks')
    .update({ status: 'completada' as TaskStatus })
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // Actualizar en Google Calendar si existe el evento
  if (task?.google_calendar_event_id && await hasCalendarScope(user.id)) {
    await updateCalendarEvent(user.id, task.google_calendar_event_id, {
      summary: task.title,
      completed: true,
    })
  }

  revalidateAll()
  return { success: true }
}

export async function reopenTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: task } = await supabase
    .from('tasks')
    .select('google_calendar_event_id, title')
    .eq('id', taskId)
    .single()

  const { error } = await supabase
    .from('tasks')
    .update({ status: 'pendiente' as TaskStatus })
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  if (task?.google_calendar_event_id && await hasCalendarScope(user.id)) {
    await updateCalendarEvent(user.id, task.google_calendar_event_id, {
      summary: task.title,
      completed: false,
    })
  }

  revalidateAll()
  return { success: true }
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: task } = await supabase
    .from('tasks')
    .select('google_calendar_event_id')
    .eq('id', taskId)
    .single()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // Eliminar de Google Calendar
  if (task?.google_calendar_event_id && await hasCalendarScope(user.id)) {
    await deleteCalendarEvent(user.id, task.google_calendar_event_id)
  }

  revalidateAll()
  return { success: true }
}

export async function updateTaskPriority(taskId: string, priority: TaskPriority) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('tasks')
    .update({ priority })
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidateAll()
  return { success: true }
}

export async function createTask(data: {
  title: string
  type: string
  priority: string
  due_date: string | null
  course_name: string | null
  description: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: data.title,
      type: data.type,
      priority: data.priority,
      status: 'pendiente',
      source: 'manual',
      due_date: data.due_date,
      course_name: data.course_name,
      description: data.description,
    })
    .select('*')
    .single()

  if (error) return { error: error.message }

  // Crear evento en Google Calendar si tiene scope
  if (task && await hasCalendarScope(user.id)) {
    const eventId = await createCalendarEvent(user.id, task as Task)
    if (eventId) {
      await supabase
        .from('tasks')
        .update({ google_calendar_event_id: eventId })
        .eq('id', task.id)
    }
  }

  revalidateAll()
  return { success: true }
}

/**
 * Sincroniza TODAS las tareas pendientes al Calendar de una vez
 * Útil cuando el usuario acaba de conectar Calendar
 */
export async function syncAllTasksToCalendar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', synced: 0 }

  if (!await hasCalendarScope(user.id)) {
    return { error: 'No tienes el permiso de Google Calendar. Vuelve a hacer login.', synced: 0 }
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['pendiente', 'en_progreso'])
    .not('due_date', 'is', null)
    .is('google_calendar_event_id', null)  // Solo las que no tienen evento aún

  if (!tasks || tasks.length === 0) return { success: true, synced: 0 }

  let synced = 0
  for (const task of tasks) {
    const eventId = await createCalendarEvent(user.id, task as Task)
    if (eventId) {
      await supabase
        .from('tasks')
        .update({ google_calendar_event_id: eventId })
        .eq('id', task.id)
      synced++
    }
  }

  // Marcar que ya tiene scope
  await supabase
    .from('profiles')
    .update({ has_calendar_scope: true })
    .eq('id', user.id)

  revalidateAll()
  return { success: true, synced }
}
