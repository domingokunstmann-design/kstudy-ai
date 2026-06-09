'use server'

import { createClient } from '@/lib/supabase/server'
import { callGemini } from '@/lib/ai/gemini'

export interface SurvivalStep {
  day: string
  action: string
  duration: string
}

export interface SurvivalPlan {
  steps: SurvivalStep[]
  priority_subject: string
  message: string
}

export async function getSurvivalPlan(): Promise<{ plan: SurvivalPlan | null; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { plan: null, error: 'No autenticado' }

  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 86400000)

  // Evaluciones próximas (próximos 7 días)
  const { data: evals } = await supabase
    .from('tasks')
    .select('title, due_date, course_name, type')
    .eq('user_id', user.id)
    .eq('type', 'evaluacion')
    .in('status', ['pendiente', 'en_progreso'])
    .gte('due_date', now.toISOString())
    .lte('due_date', in7Days.toISOString())
    .order('due_date', { ascending: true })

  // Todas las tareas urgentes
  const { data: urgentTasks } = await supabase
    .from('tasks')
    .select('title, due_date, type')
    .eq('user_id', user.id)
    .in('status', ['pendiente', 'en_progreso'])
    .gte('due_date', now.toISOString())
    .lte('due_date', new Date(now.getTime() + 3 * 86400000).toISOString())
    .order('due_date', { ascending: true })
    .limit(5)

  const today = now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })

  const evalList = (evals ?? [])
    .map(e => {
      const daysUntil = Math.ceil((new Date(e.due_date!).getTime() - now.getTime()) / 86400000)
      return `- ${e.title}${e.course_name ? ` (${e.course_name})` : ''} — en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}`
    })
    .join('\n')

  const urgentList = (urgentTasks ?? [])
    .filter(t => t.type !== 'evaluacion')
    .map(t => `- ${t.title}`)
    .join('\n')

  if (!evalList && !urgentList) {
    return {
      plan: {
        steps: [],
        priority_subject: '',
        message: 'No tienes evaluaciones críticas en los próximos 7 días. ¡Aprovecha para adelantar trabajo!',
      },
    }
  }

  const prompt = `
Eres un coach académico de emergencia. El estudiante tiene:

Evaluaciones en los próximos 7 días:
${evalList || '(ninguna)'}

Tareas urgentes (próximos 3 días):
${urgentList || '(ninguna)'}

Hoy es: ${today}

Genera un plan de rescate URGENTE. Máximo 5 pasos concretos.
Prioriza por impacto en nota final.
Sé directo y específico: dí qué estudiar, cuánto tiempo, cuándo.
Usa lenguaje motivador pero realista.

Responde SOLO en JSON con esta estructura exacta:
{
  "steps": [
    { "day": "Hoy", "action": "Estudia los capítulos 3-4 de Matemáticas", "duration": "1h 30min" },
    { "day": "Mañana", "action": "Repasa fórmulas y haz ejercicios de práctica", "duration": "45 min" }
  ],
  "priority_subject": "Matemáticas",
  "message": "Frase corta de motivación de máximo 15 palabras"
}
`

  const { text, ok, error } = await callGemini({ prompt, temperature: 0.3, maxOutputTokens: 800 })

  if (!ok || !text) {
    return { plan: null, error: error ?? 'Error al generar el plan' }
  }

  try {
    const plan = JSON.parse(text) as SurvivalPlan
    return { plan }
  } catch {
    return { plan: null, error: 'Respuesta inesperada de la IA' }
  }
}
