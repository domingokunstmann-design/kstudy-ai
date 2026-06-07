// ============================================
// Extractor de fechas desde texto en español
// Sin librerías de NLP — regex puro
// ============================================

const MESES: Record<string, number> = {
  enero: 0, ene: 0,
  febrero: 1, feb: 1,
  marzo: 2, mar: 2,
  abril: 3, abr: 3,
  mayo: 4, may: 4,
  junio: 5, jun: 5,
  julio: 6, jul: 6,
  agosto: 7, ago: 7,
  septiembre: 8, sep: 8, sept: 8,
  octubre: 9, oct: 9,
  noviembre: 10, nov: 10,
  diciembre: 11, dic: 11,
}

const DIAS_SEMANA: Record<string, number> = {
  domingo: 0, dom: 0,
  lunes: 1, lun: 1,
  martes: 2, mar: 2,
  miércoles: 3, miercoles: 3, mié: 3, mie: 3,
  jueves: 4, jue: 4,
  viernes: 5, vie: 5,
  sábado: 6, sabado: 6, sáb: 6, sab: 6,
}

/**
 * Extrae la fecha de entrega más probable desde el texto de un email
 * Retorna null si no encuentra ninguna fecha relevante
 */
export function extractDueDate(text: string): Date | null {
  const lower = text.toLowerCase()
  const now = new Date()

  // Intentar patrones en orden de especificidad

  // 1. Fecha absoluta: "23 de junio", "23 de junio de 2024"
  const absoluteDate = extractAbsoluteDate(lower, now)
  if (absoluteDate) return absoluteDate

  // 2. Fecha numérica: "23/06", "23/06/2024", "2024-06-23"
  const numericDate = extractNumericDate(lower, now)
  if (numericDate) return numericDate

  // 3. Fecha relativa: "próximo lunes", "el viernes", "esta semana"
  const relativeDate = extractRelativeDate(lower, now)
  if (relativeDate) return relativeDate

  // 4. Plazo relativo: "en 3 días", "en una semana"
  const daysDate = extractDaysRelative(lower, now)
  if (daysDate) return daysDate

  return null
}

/**
 * "23 de junio", "lunes 15 de marzo de 2025"
 */
function extractAbsoluteDate(text: string, now: Date): Date | null {
  const pattern =
    /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|sept|oct|nov|dic)(?:\s+(?:de\s+)?(\d{4}))?/gi

  let match
  let bestDate: Date | null = null

  while ((match = pattern.exec(text)) !== null) {
    const day = parseInt(match[1])
    const monthName = match[2].toLowerCase()
    const year = match[3] ? parseInt(match[3]) : now.getFullYear()
    const month = MESES[monthName]

    if (month === undefined || day < 1 || day > 31) continue

    const date = new Date(year, month, day, 23, 59, 0)

    // Si la fecha ya pasó este año, asumir que es el próximo año
    if (date < now && !match[3]) {
      date.setFullYear(now.getFullYear() + 1)
    }

    // Tomar la fecha más próxima al futuro
    if (!bestDate || (date > now && date < bestDate)) {
      bestDate = date
    } else if (!bestDate && date < now) {
      bestDate = date // fallback si todas pasaron
    }
  }

  return bestDate
}

/**
 * "23/06", "23/06/2024", "23-06-2024", "2024-06-23"
 */
function extractNumericDate(text: string, now: Date): Date | null {
  // ISO: 2024-06-23
  const isoPattern = /(\d{4})-(\d{2})-(\d{2})/g
  let match = isoPattern.exec(text)
  if (match) {
    const date = new Date(
      parseInt(match[1]),
      parseInt(match[2]) - 1,
      parseInt(match[3]),
      23, 59, 0
    )
    if (!isNaN(date.getTime())) return date
  }

  // DD/MM o DD/MM/YYYY o DD-MM-YYYY
  const dmPattern = /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/g
  let best: Date | null = null

  while ((match = dmPattern.exec(text)) !== null) {
    const day = parseInt(match[1])
    const month = parseInt(match[2]) - 1
    let year = match[3] ? parseInt(match[3]) : now.getFullYear()

    if (year < 100) year += 2000 // "24" → 2024
    if (month < 0 || month > 11 || day < 1 || day > 31) continue

    const date = new Date(year, month, day, 23, 59, 0)
    if (isNaN(date.getTime())) continue

    if (date < now && !match[3]) {
      date.setFullYear(now.getFullYear() + 1)
    }

    if (!best || (date > now && date < best)) {
      best = date
    }
  }

  return best
}

/**
 * "próximo lunes", "el viernes", "este martes"
 */
function extractRelativeDate(text: string, now: Date): Date | null {
  const dayNames = Object.keys(DIAS_SEMANA).join('|')
  const pattern = new RegExp(
    `(?:próximo|proximo|siguiente|este|el|la)\\s+(${dayNames})`,
    'gi'
  )

  let match
  while ((match = pattern.exec(text)) !== null) {
    const dayName = match[1].toLowerCase()
    const targetDay = DIAS_SEMANA[dayName]
    if (targetDay === undefined) continue

    const date = nextWeekday(now, targetDay)
    // "próximo" → siempre la semana que viene aunque hoy sea ese día
    if (match[0].match(/próximo|proximo|siguiente/i)) {
      if (date.getDay() === now.getDay()) date.setDate(date.getDate() + 7)
    }

    return date
  }

  // Solo el nombre del día: "el lunes", "el viernes"
  const simplePattern = new RegExp(`\\b(${dayNames})\\b`, 'gi')
  while ((match = simplePattern.exec(text)) !== null) {
    const dayName = match[1].toLowerCase()
    const targetDay = DIAS_SEMANA[dayName]
    if (targetDay === undefined) continue

    return nextWeekday(now, targetDay)
  }

  return null
}

/**
 * "en 3 días", "en una semana", "en 2 semanas"
 */
function extractDaysRelative(text: string, now: Date): Date | null {
  // "en N días"
  const daysMatch = text.match(/en\s+(\d+|un|una|dos|tres|cuatro|cinco)\s+días?/i)
  if (daysMatch) {
    const n = parseSpanishNumber(daysMatch[1])
    const date = new Date(now)
    date.setDate(date.getDate() + n)
    return date
  }

  // "en N semanas"
  const weeksMatch = text.match(/en\s+(\d+|una|dos|tres)\s+semanas?/i)
  if (weeksMatch) {
    const n = parseSpanishNumber(weeksMatch[1])
    const date = new Date(now)
    date.setDate(date.getDate() + n * 7)
    return date
  }

  // "para mañana"
  if (/para mañana|para el día de mañana/i.test(text)) {
    const date = new Date(now)
    date.setDate(date.getDate() + 1)
    return date
  }

  // "para hoy"
  if (/para hoy|este día/i.test(text)) {
    return new Date(now)
  }

  return null
}

function nextWeekday(from: Date, targetDay: number): Date {
  const date = new Date(from)
  const currentDay = date.getDay()
  let daysUntil = targetDay - currentDay
  if (daysUntil <= 0) daysUntil += 7
  date.setDate(date.getDate() + daysUntil)
  date.setHours(23, 59, 0, 0)
  return date
}

function parseSpanishNumber(str: string): number {
  const map: Record<string, number> = {
    un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  }
  return map[str.toLowerCase()] ?? parseInt(str) ?? 1
}

/**
 * Contexto alrededor de una fecha en el texto (para mostrar al usuario)
 */
export function extractDateContext(text: string, windowSize = 80): string {
  const patterns = [
    /\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?/,
    /\d{1,2}\s+de\s+\w+/i,
    /próximo\s+\w+/i,
    /para\s+el\s+\w+/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match.index !== undefined) {
      const start = Math.max(0, match.index - windowSize / 2)
      const end = Math.min(text.length, match.index + match[0].length + windowSize / 2)
      return '...' + text.slice(start, end).trim() + '...'
    }
  }

  return ''
}
