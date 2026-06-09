// ============================================
// KSTUDY AI — Tipos TypeScript Globales
// ============================================

// --- Enums de Base de Datos ---

export type TaskType =
  | 'evaluacion'   // prueba, control, examen, solemne, certamen
  | 'tarea'        // tarea, trabajo, entregar
  | 'exposicion'   // exposición, presentación, disertación
  | 'recordatorio' // horario, cambio, aviso
  | 'otro'

export type TaskPriority = 'urgente' | 'alta' | 'media' | 'baja'

export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada' | 'vencida'

export type TaskSource = 'gmail' | 'classroom' | 'manual'

export type AssignmentState =
  | 'PUBLISHED'
  | 'DRAFT'
  | 'DELETED'
  | 'NEW'
  | 'CREATED'
  | 'TURNED_IN'
  | 'RETURNED'
  | 'RECLAIMED_BY_STUDENT'

// --- Modelos de Base de Datos ---

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string
  google_access_token: string | null
  google_refresh_token: string | null
  token_expiry: string | null
  gmail_sync_token: string | null  // Gmail historyId para sync incremental
  last_gmail_sync: string | null
  last_classroom_sync: string | null
  reminders_enabled: boolean
  grade_level: '7mo' | '8vo' | '1ro_medio' | '2do_medio' | '3ro_medio' | '4to_medio' | null
  school_name: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  source: TaskSource
  due_date: string | null
  course_name: string | null
  course_id: string | null
  source_email_id: string | null
  source_assignment_id: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Email {
  id: string
  user_id: string
  gmail_id: string
  thread_id: string | null
  subject: string
  sender: string
  sender_email: string
  body_text: string | null
  body_preview: string | null
  received_at: string
  detected_type: TaskType | null
  detected_due_date: string | null
  processed: boolean
  created_at: string
}

export interface Course {
  id: string
  user_id: string
  classroom_id: string
  name: string
  section: string | null
  description: string | null
  teacher_name: string | null
  teacher_email: string | null
  color: string
  enrollment_code: string | null
  alternate_link: string | null
  created_at: string
  updated_at: string
}

export interface Assignment {
  id: string
  course_id: string
  user_id: string
  classroom_assignment_id: string
  title: string
  description: string | null
  due_date: string | null
  due_time: string | null
  max_points: number | null
  state: AssignmentState
  alternate_link: string | null
  created_at: string
  updated_at: string
}

export interface StudySession {
  id: string
  user_id: string
  task_id: string
  start_time: string
  duration_minutes: number
  notes: string | null
  completed: boolean
  created_at: string
}

// --- DTOs y Respuestas API ---

export interface GmailMessage {
  id: string
  threadId: string
  subject: string
  from: string
  fromEmail: string
  bodyText: string
  bodyPreview: string
  date: string
  labelIds: string[]
}

export interface ClassroomCourse {
  id: string
  name: string
  section?: string
  description?: string
  teacherFolder?: { id: string; title: string }
  ownerId: string
  creationTime: string
  updateTime: string
  enrollmentCode?: string
  courseState: string
  alternateLink: string
  teacherGroupEmail?: string
}

export interface ClassroomCourseWork {
  id: string
  courseId: string
  title: string
  description?: string
  state: AssignmentState
  alternateLink: string
  creationTime: string
  updateTime: string
  dueDate?: {
    year: number
    month: number
    day: number
  }
  dueTime?: {
    hours: number
    minutes: number
  }
  maxPoints?: number
  workType: string
}

// --- Tipos del Detector ---

export interface DetectionResult {
  type: TaskType
  dueDate: Date | null
  confidence: number
  matchedKeywords: string[]
}

// --- Estado del Dashboard ---

export interface DashboardStats {
  totalTasks: number
  pendingTasks: number
  dueSoon: number        // vencen en < 3 días
  completedThisWeek: number
  overdueCount: number
}

// --- Tipos de UI ---

export interface NavItem {
  title: string
  href: string
  icon: string
  badge?: number
}

export type ColorLabel =
  | 'indigo'
  | 'violet'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'sky'
  | 'orange'

// Map de colores por tipo de tarea
export const TASK_TYPE_CONFIG: Record<
  TaskType,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  evaluacion: {
    label: 'Evaluación',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
  },
  tarea: {
    label: 'Tarea',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
  },
  exposicion: {
    label: 'Exposición',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
  },
  recordatorio: {
    label: 'Recordatorio',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  otro: {
    label: 'Otro',
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    borderColor: 'border-zinc-500/30',
  },
}

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; dot: string }
> = {
  urgente: { label: 'Urgente', color: 'text-red-400', dot: 'bg-red-500' },
  alta: { label: 'Alta', color: 'text-orange-400', dot: 'bg-orange-500' },
  media: { label: 'Media', color: 'text-yellow-400', dot: 'bg-yellow-500' },
  baja: { label: 'Baja', color: 'text-zinc-500', dot: 'bg-zinc-600' },
}
