'use server'

import { createClient } from '@/lib/supabase/server'
import { fetchRecentEmails } from '@/lib/gmail/client'
import { detectEmailType, generateTaskTitle, extractCourseName } from '@/lib/gmail/detector'
import { calculatePriority } from '@/lib/utils'
import { revalidatePath } from 'next/cache'

// ============================================
// Server Action: Sincronizar Gmail
// ============================================

export interface SyncResult {
  success: boolean
  emailsProcessed: number
  tasksCreated: number
  error?: string
}

export async function syncGmail(): Promise<SyncResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, emailsProcessed: 0, tasksCreated: 0, error: 'No autenticado' }
  }

  try {
    // Verificar que el usuario tiene tokens de Google
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_refresh_token')
      .eq('id', user.id)
      .single()

    if (!profile?.google_refresh_token) {
      return {
        success: false,
        emailsProcessed: 0,
        tasksCreated: 0,
        error: 'No hay token de Google. Vuelve a hacer login.',
      }
    }

    // Obtener IDs de emails ya procesados (para no duplicar)
    const { data: processedEmails } = await supabase
      .from('emails')
      .select('gmail_id')
      .eq('user_id', user.id)

    const processedIds = new Set(processedEmails?.map((e) => e.gmail_id) ?? [])

    // Fetch emails desde Gmail API
    const emails = await fetchRecentEmails(user.id, 50)
    const newEmails = emails.filter((e) => !processedIds.has(e.id))

    if (newEmails.length === 0) {
      // Actualizar timestamp de último sync
      await supabase
        .from('profiles')
        .update({ last_gmail_sync: new Date().toISOString() })
        .eq('id', user.id)

      return { success: true, emailsProcessed: 0, tasksCreated: 0 }
    }

    let tasksCreated = 0

    // Procesar cada email nuevo
    for (const email of newEmails) {
      const detection = detectEmailType(email.subject, email.bodyText)

      // Guardar el email en la DB
      const { data: savedEmail, error: emailError } = await supabase
        .from('emails')
        .insert({
          user_id: user.id,
          gmail_id: email.id,
          thread_id: email.threadId,
          subject: email.subject,
          sender: email.from,
          sender_email: email.fromEmail,
          body_text: email.bodyText.slice(0, 5000), // límite de seguridad
          body_preview: email.bodyPreview,
          received_at: email.date.toISOString(),
          detected_type: detection.type !== 'otro' ? detection.type : null,
          detected_due_date: detection.dueDate?.toISOString().split('T')[0] ?? null,
          processed: true,
        })
        .select('id')
        .single()

      if (emailError) {
        console.error('Error guardando email:', emailError)
        continue
      }

      // Solo crear tarea si:
      // - tipo detectado (no "otro")
      // - confianza > 50%
      // - al menos 2 keywords coincidieron
      const shouldCreateTask =
        detection.type !== 'otro' &&
        detection.confidence > 0.5 &&
        detection.matchedKeywords.length >= 2

      if (shouldCreateTask && savedEmail) {
        const courseName = extractCourseName(email.subject, email.fromEmail)
        const title = generateTaskTitle(email.subject, detection.type)
        const priority = calculatePriority(detection.type, detection.dueDate)

        const { error: taskError } = await supabase.from('tasks').insert({
          user_id: user.id,
          title,
          description: email.bodyPreview,
          type: detection.type,
          priority,
          status: 'pendiente',
          source: 'gmail',
          due_date: detection.dueDate?.toISOString() ?? null,
          course_name: courseName,
          source_email_id: savedEmail.id,
        })

        if (!taskError) tasksCreated++
      }
    }

    // Actualizar timestamp de último sync
    await supabase
      .from('profiles')
      .update({ last_gmail_sync: new Date().toISOString() })
      .eq('id', user.id)

    // Revalidar páginas afectadas
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/tasks')
    revalidatePath('/dashboard/emails')

    return {
      success: true,
      emailsProcessed: newEmails.length,
      tasksCreated,
    }
  } catch (error) {
    console.error('Error en syncGmail:', error)
    return {
      success: false,
      emailsProcessed: 0,
      tasksCreated: 0,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}
