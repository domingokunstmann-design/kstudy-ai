import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendReminderEmail } from '@/lib/email/reminders'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Vercel Cron Job — se ejecuta todos los días a las 8:00 AM (Chile = UTC-3)
// Cron: "0 11 * * *" (11am UTC = 8am Chile)

export async function GET(request: NextRequest) {
  // Verificar que viene de Vercel Cron o de un admin autorizado
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kstudy.vercel.app'

  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 3600000)
  const in48h = new Date(now.getTime() + 48 * 3600000)
  const in7d = new Date(now.getTime() + 7 * 24 * 3600000)

  let emailsSent = 0

  // Buscar tareas que vencen en 7 días, 24h, o hoy
  const checkWindows = [
    { label: '1week', from: new Date(now.getTime() + 6.5 * 24 * 3600000), to: in7d, daysUntil: 7 },
    { label: '24h',   from: new Date(now.getTime() + 22 * 3600000),        to: in48h, daysUntil: 1 },
    { label: 'today', from: now, to: new Date(now.getTime() + 2 * 3600000), daysUntil: 0 },
  ]

  for (const window of checkWindows) {
    // Tareas en esta ventana de tiempo que no hayan recibido recordatorio aún
    const { data: tasks } = await supabase
      .from('tasks')
      .select(`
        id, title, type, course_name, due_date, user_id,
        profiles!inner(full_name, email, reminders_enabled),
        reminder_logs(id)
      `)
      .in('status', ['pendiente', 'en_progreso'])
      .gte('due_date', window.from.toISOString())
      .lte('due_date', window.to.toISOString())
      .not('id', 'in', `(
        SELECT task_id FROM reminder_logs WHERE reminder_type = '${window.label}'
      )`)

    for (const task of tasks ?? []) {
      const profile = Array.isArray(task.profiles) ? task.profiles[0] : task.profiles
      if (!profile?.email) continue
      if (profile.reminders_enabled === false) continue

      const dueDateFormatted = format(new Date(task.due_date), "EEEE d 'de' MMMM", { locale: es })

      const sent = await sendReminderEmail(profile.email, profile.full_name ?? 'Estudiante', {
        taskTitle: task.title,
        taskType: task.type,
        courseName: task.course_name,
        dueDate: dueDateFormatted,
        daysUntil: window.daysUntil,
        dashboardUrl: `${appUrl}/dashboard/tasks`,
      })

      if (sent) {
        // Registrar que ya se envió este recordatorio
        await supabase.from('reminder_logs').insert({
          user_id: task.user_id,
          task_id: task.id,
          reminder_type: window.label,
        })
        emailsSent++
      }
    }
  }

  return NextResponse.json({
    success: true,
    emailsSent,
    timestamp: now.toISOString(),
  })
}
