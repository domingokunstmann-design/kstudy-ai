// ============================================
// Kstudy AI — Asesor de planificación con Gemini
// ============================================
// Analiza la carga académica completa y asigna:
//   - weight (0–1): importancia jerárquica de la tarea
//   - estimated_hours: horas de estudio recomendadas
//   - suggested_topics: temas a estudiar (si no tiene)
// ============================================

import { callGemini } from './gemini'

export interface TaskForAdvice {
  id: string
  title: string
  description: string | null
  type: string       // evaluacion | tarea | exposicion | recordatorio | otro
  priority: string   // urgente | alta | media | baja
  due_date: string   // ISO
  course_name: string | null
}

export interface TaskAdvice {
  id: string
  weight: number           // 0.1 – 1.0 (mayor = más importante)
  estimated_hours: number  // horas de estudio recomendadas
  reasoning: string        // por qué tiene ese peso
  suggested_topics: string[] // temas sugeridos si el usuario no ingresó ninguno
}

export interface PlanAdviceResult {
  advice: TaskAdvice[]
  error?: string
}

const PROMPT_SYSTEM = `Eres un asesor académico experto en planificación de estudio para estudiantes chilenos de enseñanza media y universidad.

Tu tarea: analizar un conjunto de tareas/evaluaciones académicas y asignar a cada una:
1. **weight** (0.1 – 1.0): importancia jerárquica. Guíate por esta escala:
   - 1.0 → Examen final / solemne semestral / certamen de mayor porcentaje
   - 0.85 → Prueba / certamen de unidad (ej: prueba de materia)
   - 0.70 → Control / quiz / mini-evaluación
   - 0.60 → Trabajo grupal / proyecto / exposición mayor
   - 0.45 → Tarea / trabajo individual pequeño
   - 0.30 → Recordatorio / aviso / trámite menor
   Si el título menciona porcentajes (ej "vale 30%"), úsalos directamente.
2. **estimated_hours**: horas realistas de estudio (no el tiempo de la prueba, sino cuánto hay que preparar).
3. **reasoning**: 1 frase explicando el peso asignado.
4. **suggested_topics**: array de 2–5 temas sugeridos para estudiar (vacío si no aplica, ej: recordatorio).

Reglas:
- Si dos evaluaciones del mismo ramo compiten, la de mayor ponderación tiene mayor weight.
- Las evaluaciones siempre tienen mayor weight que las tareas del mismo ramo.
- Sé realista con las horas: un control puede requerir 1–2h, una solemne 6–10h.
- Hoy es ${new Date().toISOString().slice(0, 10)}.

Responde SOLO con JSON válido:
{
  "advice": [
    {
      "id": "uuid-de-la-tarea",
      "weight": 0.85,
      "estimated_hours": 4,
      "reasoning": "Prueba de unidad con contenido amplio",
      "suggested_topics": ["Tema A", "Tema B", "Tema C"]
    }
  ]
}`

export async function getStudyPlanAdvice(
  tasks: TaskForAdvice[]
): Promise<PlanAdviceResult> {
  if (tasks.length === 0) return { advice: [] }

  const tasksJson = JSON.stringify(
    tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      type: t.type,
      priority: t.priority,
      due_date: t.due_date.slice(0, 10),
      course_name: t.course_name,
    })),
    null, 2
  )

  const prompt = `${PROMPT_SYSTEM}\n\n--- TAREAS A ANALIZAR ---\n${tasksJson}`

  const { text: raw, ok, error } = await callGemini({
    prompt,
    temperature: 0.1,
    maxOutputTokens: 2048,
  })

  if (!ok || !raw) {
    return { advice: [], error: error ?? 'Error de Gemini' }
  }

  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned)

    const advice: TaskAdvice[] = (parsed.advice ?? []).map((a: TaskAdvice) => ({
      id: a.id,
      weight: clamp(Number(a.weight), 0.1, 1.0),
      estimated_hours: Math.max(0.5, Number(a.estimated_hours) || 1),
      reasoning: a.reasoning ?? '',
      suggested_topics: Array.isArray(a.suggested_topics) ? a.suggested_topics : [],
    }))

    return { advice }
  } catch (e) {
    return { advice: [], error: `Error parseando respuesta: ${String(e)}` }
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}
