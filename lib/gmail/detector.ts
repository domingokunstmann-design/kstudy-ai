import type { TaskType, DetectionResult } from '@/types'
import { extractDueDate } from './parser'

// ============================================
// Sistema de detección basado en reglas
// Sin IA — costo cero
// Orientado a terminología chilena/latinoamericana
// ============================================

interface KeywordRule {
  keywords: string[]
  weight: number
}

const RULES: Record<TaskType, KeywordRule[]> = {
  evaluacion: [
    {
      keywords: ['prueba', 'control', 'examen', 'solemne', 'certamen', 'evaluación', 'evaluacion'],
      weight: 10,
    },
    {
      keywords: ['nota', 'calificación', 'calificacion', 'ponderación', 'ponderacion'],
      weight: 5,
    },
    {
      keywords: ['rendir', 'dar la prueba', 'dar el control', 'presentarse'],
      weight: 7,
    },
    {
      keywords: ['quiz', 'test', 'midterm', 'final exam', 'parcial'],
      weight: 8,
    },
  ],
  exposicion: [
    {
      keywords: ['exposición', 'exposicion', 'presentación oral', 'presentacion oral', 'disertación', 'disertacion'],
      weight: 10,
    },
    {
      keywords: ['exponer', 'presentar', 'defender', 'sustentar'],
      weight: 8,
    },
    {
      keywords: ['ppt', 'powerpoint', 'slides', 'diapositivas'],
      weight: 4,
    },
    {
      keywords: ['grupo', 'equipo', 'compañeros'],
      weight: 2,
    },
  ],
  tarea: [
    {
      keywords: ['tarea', 'homework', 'actividad', 'ejercicio'],
      weight: 10,
    },
    {
      keywords: ['entregar', 'enviar', 'subir', 'upload', 'submit'],
      weight: 8,
    },
    {
      keywords: ['trabajo', 'informe', 'reporte', 'ensayo', 'proyecto'],
      weight: 7,
    },
    {
      keywords: ['fecha límite', 'fecha limite', 'plazo', 'deadline', 'vencimiento', 'entrega'],
      weight: 6,
    },
    {
      keywords: ['pendiente', 'completar', 'realizar', 'hacer'],
      weight: 3,
    },
  ],
  recordatorio: [
    {
      keywords: ['horario', 'cambio de sala', 'cambio de horario', 'suspensión', 'suspension'],
      weight: 10,
    },
    {
      keywords: ['recordatorio', 'recordar', 'aviso', 'notificación', 'notificacion'],
      weight: 8,
    },
    {
      keywords: ['ayudantía', 'ayudantia', 'tutoría', 'tutoria', 'monitoria'],
      weight: 7,
    },
    {
      keywords: ['clase cancelada', 'clase suspendida', 'no habrá clase', 'no habra clase'],
      weight: 9,
    },
    {
      keywords: ['reunión', 'reunion', 'junta', 'meeting', 'sesión', 'sesion'],
      weight: 5,
    },
  ],
  otro: [],
}

// Patrones que descartan INMEDIATAMENTE el email como no académico
const NOISE_PATTERNS = [
  // Marketing / publicidad
  /newsletter/i,
  /unsubscribe/i,
  /darse de baja/i,
  /promocion/i,
  /oferta/i,
  /descuento/i,
  /marketing/i,
  /publicidad/i,
  /suscripci[oó]n/i,
  /cupón|cupon/i,
  // Financiero / bancario
  /transferencia/i,
  /dep[oó]sito/i,
  /saldo/i,
  /transacci[oó]n/i,
  /banco\b/i,
  /tarjeta de cr[eé]dito/i,
  /factura/i,
  /boleta/i,
  /comprobante de pago/i,
  /pago exitoso/i,
  /recarga/i,
  // Notificaciones de apps / redes sociales
  /te mencion[oó]/i,
  /te etiquet[oó]/i,
  /nueva solicitud de amistad/i,
  /comentó en/i,
  /le gust[oó] tu/i,
  /new follower/i,
  /verification code/i,
  /c[oó]digo de verificaci[oó]n/i,
  /OTP/i,
  // Noticias / alerts
  /alerta de google/i,
  /google alert/i,
  /breaking news/i,
]

// Keywords que NUNCA aparecen en correos académicos
// Si alguno de estos está presente con alta presencia → descartar
const HARD_NEGATIVE_KEYWORDS = [
  'banco', 'transferencia', 'depósito', 'saldo disponible',
  'tarjeta', 'compra aprobada', 'monto', 'factura', 'boleta',
  'click aquí para desuscribirte', 'unsubscribe', 'darse de baja',
  'ver en navegador', 'view in browser',
]

/**
 * Detecta el tipo académico de un email y extrae la fecha de entrega
 */
export function detectEmailType(
  subject: string,
  body: string
): DetectionResult {
  const text = `${subject} ${body}`.toLowerCase()

  // Filtrar ruido — revisar asunto Y cuerpo
  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(subject) || pattern.test(body.slice(0, 500))) {
      return { type: 'otro', dueDate: null, confidence: 0, matchedKeywords: [] }
    }
  }

  // Filtrar por keywords negativas duras
  for (const kw of HARD_NEGATIVE_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) {
      return { type: 'otro', dueDate: null, confidence: 0, matchedKeywords: [] }
    }
  }

  // Calcular score para cada tipo
  const scores: Record<TaskType, number> = {
    evaluacion: 0,
    exposicion: 0,
    tarea: 0,
    recordatorio: 0,
    otro: 0,
  }

  const allMatched: Record<TaskType, string[]> = {
    evaluacion: [],
    exposicion: [],
    tarea: [],
    recordatorio: [],
    otro: [],
  }

  for (const [type, rules] of Object.entries(RULES) as [TaskType, KeywordRule[]][]) {
    for (const rule of rules) {
      for (const keyword of rule.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          scores[type] += rule.weight
          allMatched[type].push(keyword)
        }
      }
    }
  }

  // Determinar ganador
  const maxScore = Math.max(...Object.values(scores))

  if (maxScore === 0) {
    return { type: 'otro', dueDate: null, confidence: 0, matchedKeywords: [] }
  }

  const winnerType = Object.entries(scores).find(
    ([, score]) => score === maxScore
  )![0] as TaskType

  // Confidence: qué tan dominante es el tipo ganador (0-1)
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)
  const confidence = totalScore > 0 ? maxScore / totalScore : 0

  // Extraer fecha de entrega
  const dueDate = extractDueDate(text)

  return {
    type: winnerType,
    dueDate,
    confidence,
    matchedKeywords: allMatched[winnerType],
  }
}

/**
 * Genera un título limpio para la tarea a partir del asunto del email
 */
export function generateTaskTitle(subject: string, type: TaskType): string {
  // Limpiar prefijos comunes de email
  let clean = subject
    .replace(/^(re|fwd|fw|reenviado|reenvío):\s*/gi, '')
    .replace(/^\[.*?\]\s*/g, '') // [SPAM], [EXTERNO], etc.
    .trim()

  // Si el asunto ya describe bien la tarea, usarlo directo
  if (clean.length > 5 && clean.length < 80) return clean

  // Fallback por tipo
  const fallbacks: Record<TaskType, string> = {
    evaluacion: 'Evaluación pendiente',
    tarea: 'Tarea pendiente',
    exposicion: 'Exposición pendiente',
    recordatorio: 'Recordatorio académico',
    otro: subject.slice(0, 60),
  }

  return fallbacks[type]
}

/**
 * Extrae el nombre del curso desde el asunto o remitente
 * Heurística: busca patrones como "MAT123", "[Cálculo]", "Física I"
 */
export function extractCourseName(subject: string, from: string): string | null {
  // Buscar código de curso tipo MAT101, CS101, etc.
  const codeMatch = subject.match(/\b[A-Z]{2,4}\s*\d{3,4}\b/)
  if (codeMatch) return codeMatch[0]

  // Buscar entre corchetes [Nombre del Curso]
  const bracketMatch = subject.match(/\[([^\]]{3,40})\]/)
  if (bracketMatch) return bracketMatch[1]

  // Inferir desde el remitente (ej: "prof.matematicas@uni.cl")
  const emailParts = from.match(/@([^.]+)\./)
  if (emailParts && emailParts[1] !== 'gmail' && emailParts[1] !== 'hotmail') {
    return null // no hay suficiente info
  }

  return null
}
