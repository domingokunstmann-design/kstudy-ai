import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isBefore, isToday, isTomorrow, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import type { TaskPriority, TaskType } from '@/types'

// shadcn/ui cn utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// Utilidades de fechas
// ============================================

export function formatDueDate(date: string | Date | null): string {
  if (!date) return 'Sin fecha'
  const d = new Date(date)
  if (isToday(d)) return 'Hoy'
  if (isTomorrow(d)) return 'Mañana'
  return format(d, "d 'de' MMMM", { locale: es })
}

export function formatRelativeDate(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

export function getDaysUntilDue(date: string | Date | null): number | null {
  if (!date) return null
  const now = new Date()
  const due = new Date(date)
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export function isOverdue(date: string | Date | null): boolean {
  if (!date) return false
  return isBefore(new Date(date), new Date())
}

export function isDueSoon(date: string | Date | null, days = 3): boolean {
  if (!date) return false
  const d = new Date(date)
  return !isBefore(d, new Date()) && isBefore(d, addDays(new Date(), days))
}

// ============================================
// Cálculo de prioridad automática
// ============================================

export function calculatePriority(
  type: TaskType,
  dueDate: Date | string | null
): TaskPriority {
  const days = getDaysUntilDue(dueDate)

  // Sin fecha → prioridad por tipo
  if (days === null) {
    if (type === 'evaluacion') return 'alta'
    if (type === 'exposicion') return 'alta'
    return 'media'
  }

  // Vencida
  if (days < 0) return 'urgente'

  // Evaluaciones tienen prioridad más alta
  if (type === 'evaluacion' || type === 'exposicion') {
    if (days <= 1) return 'urgente'
    if (days <= 3) return 'alta'
    if (days <= 7) return 'media'
    return 'baja'
  }

  // Tareas y otros
  if (days === 0) return 'urgente'
  if (days <= 2) return 'alta'
  if (days <= 5) return 'media'
  return 'baja'
}

// ============================================
// Utilidades de texto
// ============================================

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}

export function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

// ============================================
// Colores de cursos (asignación determinista)
// ============================================

const COURSE_COLORS = [
  'bg-indigo-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-orange-500',
  'bg-teal-500',
]

export function getCourseColor(courseId: string): string {
  let hash = 0
  for (let i = 0; i < courseId.length; i++) {
    hash = courseId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length]
}

// ============================================
// Helpers de estado
// ============================================

export function getDueDateUrgency(
  date: string | null
): 'overdue' | 'urgent' | 'soon' | 'normal' | 'none' {
  if (!date) return 'none'
  const days = getDaysUntilDue(date)
  if (days === null) return 'none'
  if (days < 0) return 'overdue'
  if (days === 0) return 'urgent'
  if (days <= 3) return 'soon'
  return 'normal'
}
