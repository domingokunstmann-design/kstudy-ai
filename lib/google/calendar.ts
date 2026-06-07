import { google } from 'googleapis'
import { getGoogleClient } from '@/lib/gmail/client'
import type { Task } from '@/types'

// Colores de Google Calendar por tipo de tarea
// https://developers.google.com/calendar/api/v3/reference/colors
const EVENT_COLORS: Record<string, string> = {
  evaluacion: '11',  // Tomato (rojo)
  exposicion: '3',   // Grape (violeta)
  tarea: '9',        // Blueberry (azul)
  recordatorio: '5', // Banana (amarillo)
  otro: '8',         // Graphite (gris)
}

/**
 * Crea un evento en Google Calendar del usuario
 * Retorna el eventId creado
 */
export async function createCalendarEvent(
  userId: string,
  task: Task
): Promise<string | null> {
  if (!task.due_date) return null

  try {
    const auth = await getGoogleClient(userId)
    const calendar = google.calendar({ version: 'v3', auth })

    const dueDate = new Date(task.due_date)
    const startTime = new Date(dueDate)
    startTime.setHours(9, 0, 0, 0)
    const endTime = new Date(startTime)

    // Duración según tipo
    const durations: Record<string, number> = {
      evaluacion: 120,
      exposicion: 60,
      tarea: 30,
      recordatorio: 30,
      otro: 30,
    }
    endTime.setMinutes(endTime.getMinutes() + (durations[task.type] ?? 30))

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `📚 ${task.title}`,
        description: [
          task.description ?? '',
          '',
          `Tipo: ${task.type}`,
          task.course_name ? `Curso: ${task.course_name}` : '',
          '',
          '— Creado por Kstudy AI',
        ].filter(Boolean).join('\n'),
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'America/Santiago',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'America/Santiago',
        },
        colorId: EVENT_COLORS[task.type] ?? '8',
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 24 * 60 },   // 1 día antes
            { method: 'popup', minutes: 60 },          // 1 hora antes
            { method: 'email', minutes: 24 * 60 },    // Email 1 día antes
          ],
        },
      },
    })

    return event.data.id ?? null
  } catch (error) {
    console.error('Error creando evento en Calendar:', error)
    return null
  }
}

/**
 * Elimina un evento de Google Calendar
 */
export async function deleteCalendarEvent(
  userId: string,
  eventId: string
): Promise<void> {
  try {
    const auth = await getGoogleClient(userId)
    const calendar = google.calendar({ version: 'v3', auth })

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    })
  } catch (error) {
    // Si el evento ya no existe, no es un error crítico
    console.warn('No se pudo eliminar el evento de Calendar:', error)
  }
}

/**
 * Actualiza el título o fecha de un evento existente
 */
export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  updates: { summary?: string; completed?: boolean }
): Promise<void> {
  try {
    const auth = await getGoogleClient(userId)
    const calendar = google.calendar({ version: 'v3', auth })

    const patch: Record<string, any> = {}

    if (updates.summary) {
      patch.summary = updates.completed
        ? `✅ ${updates.summary}`
        : `📚 ${updates.summary}`
    }

    if (updates.completed) {
      patch.colorId = '8' // Graphite cuando está completada
    }

    await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: patch,
    })
  } catch (error) {
    console.warn('No se pudo actualizar el evento de Calendar:', error)
  }
}
