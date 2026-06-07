// ============================================
// KSTUDY AI — Sistema de recordatorios por email
// Usa Resend (gratis: 100 emails/día)
// ============================================

interface TaskReminder {
  taskTitle: string
  taskType: string
  courseName: string | null
  dueDate: string
  daysUntil: number
  dashboardUrl: string
}

function getReminderSubject(task: TaskReminder): string {
  const typeLabel: Record<string, string> = {
    evaluacion: '📝 Prueba/Control',
    tarea: '📋 Tarea',
    exposicion: '🎤 Exposición',
    recordatorio: '⏰ Recordatorio',
    otro: '📌 Tarea',
  }
  const label = typeLabel[task.taskType] ?? '📌 Tarea'

  if (task.daysUntil === 0) return `${label} HOY: ${task.taskTitle}`
  if (task.daysUntil === 1) return `${label} MAÑANA: ${task.taskTitle}`
  return `${label} en ${task.daysUntil} días: ${task.taskTitle}`
}

function getReminderHtml(task: TaskReminder, userName: string): string {
  const urgencyColor =
    task.daysUntil === 0 ? '#ef4444' :
    task.daysUntil === 1 ? '#f59e0b' :
    task.daysUntil <= 3 ? '#f97316' : '#6366f1'

  const urgencyText =
    task.daysUntil === 0 ? '¡ES HOY!' :
    task.daysUntil === 1 ? 'es MAÑANA' :
    `es en ${task.daysUntil} días`

  const typeEmoji: Record<string, string> = {
    evaluacion: '📝', tarea: '📋', exposicion: '🎤', recordatorio: '⏰', otro: '📌',
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#080810;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
      <div style="width:32px;height:32px;background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;">✨</div>
      <span style="font-size:16px;font-weight:700;color:#fff;">Kstudy <span style="color:#818cf8;">AI</span></span>
    </div>

    <!-- Card principal -->
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:28px;margin-bottom:20px;">

      <!-- Urgency badge -->
      <div style="display:inline-flex;align-items:center;gap:6px;background:${urgencyColor}22;border:1px solid ${urgencyColor}44;border-radius:20px;padding:4px 12px;margin-bottom:20px;">
        <div style="width:6px;height:6px;border-radius:50%;background:${urgencyColor};"></div>
        <span style="font-size:12px;font-weight:600;color:${urgencyColor};">
          ${task.daysUntil === 0 ? '⚠️ Vence hoy' : task.daysUntil === 1 ? '⏰ Vence mañana' : `📅 Vence en ${task.daysUntil} días`}
        </span>
      </div>

      <p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.45);">Hola, ${userName} 👋</p>
      <p style="margin:0 0 16px;font-size:15px;color:rgba(255,255,255,0.7);">
        Tu <strong style="color:#fff;">${task.taskType}</strong> ${urgencyText}:
      </p>

      <!-- Task card -->
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:20px;">
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <span style="font-size:24px;">${typeEmoji[task.taskType] ?? '📌'}</span>
          <div>
            <p style="margin:0 0 4px;font-size:17px;font-weight:700;color:#fff;">${task.taskTitle}</p>
            ${task.courseName ? `<p style="margin:0;font-size:13px;color:rgba(255,255,255,0.4);">${task.courseName}</p>` : ''}
            <p style="margin:8px 0 0;font-size:13px;color:${urgencyColor};font-weight:600;">
              📅 ${task.dueDate}
            </p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <a href="${task.dashboardUrl}" style="display:block;text-align:center;margin-top:20px;padding:14px;background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;box-shadow:0 4px 16px rgba(99,102,241,0.4);">
        Ver mis tareas en Kstudy →
      </a>
    </div>

    <!-- Footer -->
    <p style="text-align:center;font-size:11px;color:rgba(255,255,255,0.2);margin:0;">
      Kstudy AI · Tu asistente académico ·
      <a href="${task.dashboardUrl}/settings" style="color:rgba(255,255,255,0.3);">Configurar recordatorios</a>
    </p>
  </div>
</body>
</html>`
}

/**
 * Envía un email de recordatorio usando Resend
 */
export async function sendReminderEmail(
  to: string,
  userName: string,
  task: TaskReminder
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY no configurado — saltando email')
    return false
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Kstudy AI <recordatorios@kstudy.ai>',
        to: [to],
        subject: getReminderSubject(task),
        html: getReminderHtml(task, userName),
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Error Resend:', err)
      return false
    }

    return true
  } catch (error) {
    console.error('Error enviando email:', error)
    return false
  }
}
