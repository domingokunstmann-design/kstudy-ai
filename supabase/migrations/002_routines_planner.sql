-- ============================================
-- KSTUDY AI — Migración 002: Rutinas y Planificador
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================

-- ============================================
-- TABLA: routines
-- Bloques de tiempo bloqueados semanalmente
-- ============================================

CREATE TABLE public.routines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,                    -- "Entrenamiento", "Preu", "Trabajo"
  day_of_week INTEGER NOT NULL,          -- 0=Domingo, 1=Lunes, ... 6=Sábado
  start_time TIME NOT NULL,              -- "08:00"
  end_time TIME NOT NULL,                -- "10:00"
  color TEXT DEFAULT 'zinc' NOT NULL,    -- para la UI
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_day CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT valid_time CHECK (end_time > start_time)
);

CREATE INDEX idx_routines_user_id ON public.routines(user_id);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own routines"
  ON public.routines FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TABLA: task_topics
-- Contenidos/temas de una tarea o prueba
-- ============================================

CREATE TABLE public.task_topics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,                   -- "Derivadas", "Cinemática", etc.
  estimated_hours NUMERIC DEFAULT 1,     -- horas estimadas para estudiar este tema
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.task_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own task topics"
  ON public.task_topics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TABLA: study_plan_sessions
-- Sesiones generadas por el planificador automático
-- ============================================

CREATE TABLE public.study_plan_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES public.task_topics(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  label TEXT NOT NULL,                   -- "Estudiar Matemáticas: Derivadas"
  completed BOOLEAN DEFAULT FALSE,
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_study_plan_user_id ON public.study_plan_sessions(user_id);
CREATE INDEX idx_study_plan_date ON public.study_plan_sessions(date);
CREATE INDEX idx_study_plan_task_id ON public.study_plan_sessions(task_id);

ALTER TABLE public.study_plan_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own study plan"
  ON public.study_plan_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TABLA: user_preferences
-- Preferencias del planificador
-- ============================================

CREATE TABLE public.user_preferences (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  study_start_time TIME DEFAULT '09:00',
  study_end_time TIME DEFAULT '22:00',
  max_daily_study_hours INTEGER DEFAULT 4,
  session_duration_minutes INTEGER DEFAULT 45,   -- duración de cada bloque
  break_minutes INTEGER DEFAULT 15,              -- descanso entre bloques
  days_before_to_start INTEGER DEFAULT 5,        -- cuántos días antes empezar a estudiar
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-crear preferencias al crear perfil
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_preferences
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();

-- Insertar preferencias para usuarios existentes
INSERT INTO public.user_preferences (id)
SELECT id FROM public.profiles
ON CONFLICT (id) DO NOTHING;
