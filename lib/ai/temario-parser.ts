// ============================================
// Kstudy AI — Parser de Temarios con Gemini
// ============================================
// Extrae evaluaciones, tareas y fechas desde un
// texto de temario pegado o subido por el usuario.
// ============================================

import { callGemini } from './gemini'
import type { TaskType, TaskPriority } from '@/types'

export interface ParsedTask {
  title: string
  description: string | null
  type: TaskType
  priority: TaskPriority
  due_date: string | null   // ISO yyyy-MM-dd o null
  course_name: string | null
  confidence: number        // 0-1 — qué tan seguro está Gemini
}

export interface TemarioParseResult {
  tasks: ParsedTask[]
  courseName: string | null
  error?: string
}

const SYSTEM_PROMPT = `Eres un asistente académico especializado en extraer información de temarios y programas de estudio de colegios y universidades chilenos.

Dado el texto de un temario, extrae TODOS los eventos académicos importantes: evaluaciones, controles, pruebas, solemnes, certámenes, exámenes, tareas, trabajos, exposiciones, disertaciones y entregas.

Reglas:
- Hoy es ${new Date().toISOString().slice(0, 10)}.
- Si la fecha es relativa (ej: "semana 3"), infiere la fecha absoluta más probable o déjala null.
- Si hay año implícito, usa el año actual.
- Prioridad: usa "urgente" si falta menos de 3 días, "alta" si <1 semana, "media" si <2 semanas, "baja" si más.
- Si no hay fecha, priority = "media".
- type debe ser uno de: "evaluacion", "tarea", "exposicion", "recordatorio", "otro"
- confidence: 0.0 a 1.0 según qué tan clara era la info en el texto.

Responde SOLO con JSON válido, sin explicaciones, con esta estructura exacta:
{
  "courseName": "nombre de la asignatura o null",
  "tasks": [
    {
      "title": "descripción corta del evento",
      "description": "detalles adicionales o null",
      "type": "evaluacion|tarea|exposicion|recordatorio|otro",
      "priority": "urgente|alta|media|baja",
      "due_date": "YYYY-MM-DD o null",
      "course_name": "nombre asignatura o null",
      "confidence": 0.9
    }
  ]
}`

export async function parseTemario(
  text: string,
  overrideCourseName?: string
): Promise<TemarioParseResult> {
  if (!text.trim()) {
    return { tasks: [], courseName: null, error: 'El texto está vacío' }
  }

  const prompt = `${SYSTEM_PROMPT}\n\n--- TEMARIO ---\n${text.slice(0, 12000)}`

  const { text: raw, ok, error } = await callGemini({ prompt, temperature: 0.1 })

  if (!ok || !raw) {
    return { tasks: [], courseName: null, error: error ?? 'Error desconocido de Gemini' }
  }

  try {
    // Gemini a veces envuelve el JSON en ```json ... ```
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned)

    const tasks: ParsedTask[] = (parsed.tasks ?? []).map((t: ParsedTask) => ({
      title: t.title ?? 'Sin título',
      description: t.description ?? null,
      type: validateType(t.type),
      priority: validatePriority(t.priority),
      due_date: validateDate(t.due_date),
      course_name: overrideCourseName ?? t.course_name ?? parsed.courseName ?? null,
      confidence: typeof t.confidence === 'number' ? t.confidence : 0.7,
    }))

    return {
      tasks,
      courseName: overrideCourseName ?? parsed.courseName ?? null,
    }
  } catch (e) {
    return { tasks: [], courseName: null, error: `No se pudo parsear la respuesta: ${String(e)}` }
  }
}

// --- Validadores ---

function validateType(raw: string): TaskType {
  const valid: TaskType[] = ['evaluacion', 'tarea', 'exposicion', 'recordatorio', 'otro']
  return valid.includes(raw as TaskType) ? (raw as TaskType) : 'otro'
}

function validatePriority(raw: string): TaskPriority {
  const valid: TaskPriority[] = ['urgente', 'alta', 'media', 'baja']
  return valid.includes(raw as TaskPriority) ? (raw as TaskPriority) : 'media'
}

function validateDate(raw: string | null): string | null {
  if (!raw) return null
  const d = new Date(raw)
  if (isNaN(d.getTime())) return null
  return raw.slice(0, 10) // yyyy-MM-dd
}
