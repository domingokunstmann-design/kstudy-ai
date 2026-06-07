-- ============================================
-- KSTUDY AI — Migración Inicial
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE task_type AS ENUM (
  'evaluacion',
  'tarea',
  'exposicion',
  'recordatorio',
  'otro'
);

CREATE TYPE task_priority AS ENUM (
  'urgente',
  'alta',
  'media',
  'baja'
);

CREATE TYPE task_status AS ENUM (
  'pendiente',
  'en_progreso',
  'completada',
  'vencida'
);

CREATE TYPE task_source AS ENUM (
  'gmail',
  'classroom',
  'manual'
);

CREATE TYPE assignment_state AS ENUM (
  'PUBLISHED',
  'DRAFT',
  'DELETED',
  'NEW',
  'CREATED',
  'TURNED_IN',
  'RETURNED',
  'RECLAIMED_BY_STUDENT'
);

-- ============================================
-- TABLA: profiles
-- Extiende auth.users de Supabase
-- ============================================

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT NOT NULL,
  google_access_token TEXT,
  google_refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  gmail_sync_token TEXT,         -- historyId de Gmail para sync incremental
  last_gmail_sync TIMESTAMPTZ,
  last_classroom_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger para auto-crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- TABLA: courses
-- Cursos de Google Classroom
-- ============================================

CREATE TABLE public.courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  classroom_id TEXT NOT NULL,
  name TEXT NOT NULL,
  section TEXT,
  description TEXT,
  teacher_name TEXT,
  teacher_email TEXT,
  color TEXT DEFAULT 'indigo' NOT NULL,
  enrollment_code TEXT,
  alternate_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, classroom_id)
);

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- TABLA: assignments
-- Tareas/trabajos de Google Classroom
-- ============================================

CREATE TABLE public.assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  classroom_assignment_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_time TIME,
  max_points NUMERIC,
  state assignment_state DEFAULT 'PUBLISHED',
  alternate_link TEXT,
  work_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, classroom_assignment_id)
);

CREATE TRIGGER assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- TABLA: emails
-- Correos procesados de Gmail
-- ============================================

CREATE TABLE public.emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  gmail_id TEXT NOT NULL,
  thread_id TEXT,
  subject TEXT NOT NULL,
  sender TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  body_text TEXT,
  body_preview TEXT,       -- primeros 300 chars para preview
  received_at TIMESTAMPTZ NOT NULL,
  detected_type task_type,
  detected_due_date DATE,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, gmail_id)
);

-- ============================================
-- TABLA: tasks
-- Tareas académicas (fuente: gmail, classroom, manual)
-- ============================================

CREATE TABLE public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type task_type DEFAULT 'otro' NOT NULL,
  priority task_priority DEFAULT 'media' NOT NULL,
  status task_status DEFAULT 'pendiente' NOT NULL,
  source task_source DEFAULT 'manual' NOT NULL,
  due_date TIMESTAMPTZ,
  course_name TEXT,                                        -- nombre del curso (denormalizado para velocidad)
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  source_email_id UUID REFERENCES public.emails(id) ON DELETE SET NULL,
  source_assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-marcar como completada cuando status = 'completada'
CREATE OR REPLACE FUNCTION public.handle_task_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completada' AND OLD.status != 'completada' THEN
    NEW.completed_at = NOW();
  END IF;
  IF NEW.status != 'completada' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_completed_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_task_completed();

-- ============================================
-- TABLA: study_sessions
-- Sesiones de estudio planificadas
-- ============================================

CREATE TABLE public.study_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- ÍNDICES para rendimiento
-- ============================================

CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_type ON public.tasks(type);
CREATE INDEX idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX idx_tasks_user_due ON public.tasks(user_id, due_date);

CREATE INDEX idx_emails_user_id ON public.emails(user_id);
CREATE INDEX idx_emails_gmail_id ON public.emails(gmail_id);
CREATE INDEX idx_emails_processed ON public.emails(processed);

CREATE INDEX idx_courses_user_id ON public.courses(user_id);
CREATE INDEX idx_assignments_user_id ON public.assignments(user_id);
CREATE INDEX idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX idx_assignments_due_date ON public.assignments(due_date);

CREATE INDEX idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX idx_study_sessions_task_id ON public.study_sessions(task_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuario solo puede ver y modificar sus propios datos
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para tasks
CREATE POLICY "Users can view own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para emails
CREATE POLICY "Users can view own emails"
  ON public.emails FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emails"
  ON public.emails FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emails"
  ON public.emails FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas para courses
CREATE POLICY "Users can view own courses"
  ON public.courses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own courses"
  ON public.courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses"
  ON public.courses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses"
  ON public.courses FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para assignments
CREATE POLICY "Users can view own assignments"
  ON public.assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assignments"
  ON public.assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assignments"
  ON public.assignments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assignments"
  ON public.assignments FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para study_sessions
CREATE POLICY "Users can view own study sessions"
  ON public.study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions"
  ON public.study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions"
  ON public.study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study sessions"
  ON public.study_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- VISTA: tasks_with_details
-- Para queries frecuentes del dashboard
-- ============================================

CREATE VIEW public.tasks_with_details AS
SELECT
  t.*,
  c.name AS course_full_name,
  c.color AS course_color,
  c.classroom_id AS course_classroom_id,
  e.subject AS email_subject,
  e.sender AS email_sender,
  e.received_at AS email_received_at,
  -- Días hasta vencimiento (negativo = vencida)
  CASE
    WHEN t.due_date IS NOT NULL
    THEN EXTRACT(DAY FROM (t.due_date - NOW()))::INTEGER
    ELSE NULL
  END AS days_until_due
FROM public.tasks t
LEFT JOIN public.courses c ON t.course_id = c.id
LEFT JOIN public.emails e ON t.source_email_id = e.id;

-- Comentarios descriptivos
COMMENT ON TABLE public.profiles IS 'Perfiles de usuarios, extiende auth.users';
COMMENT ON TABLE public.tasks IS 'Tareas académicas detectadas o creadas manualmente';
COMMENT ON TABLE public.emails IS 'Correos de Gmail procesados por el detector';
COMMENT ON TABLE public.courses IS 'Cursos de Google Classroom del usuario';
COMMENT ON TABLE public.assignments IS 'Trabajos y tareas de Google Classroom';
COMMENT ON TABLE public.study_sessions IS 'Sesiones de estudio planificadas';
