-- ============================================
-- KSTUDY AI — Migración 007: Módulo de Notas
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================

-- ============================================
-- TABLA: subjects
-- Asignaturas del estudiante
-- ============================================

CREATE TABLE public.subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'indigo' NOT NULL,
  teacher_name TEXT,
  semester INTEGER DEFAULT 1 NOT NULL CHECK (semester IN (1, 2)),
  school_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER NOT NULL,
  coefficient NUMERIC(3,1) DEFAULT 1.0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- TABLA: grades
-- Notas registradas por asignatura
-- ============================================

CREATE TABLE public.grades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  grade NUMERIC(3,1) NOT NULL CHECK (grade >= 1.0 AND grade <= 7.0),
  percentage NUMERIC(5,2) CHECK (percentage > 0 AND percentage <= 100),
  graded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER grades_updated_at
  BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_subjects_user_id ON public.subjects(user_id);
CREATE INDEX idx_subjects_user_semester ON public.subjects(user_id, school_year, semester);
CREATE INDEX idx_grades_user_id ON public.grades(user_id);
CREATE INDEX idx_grades_subject_id ON public.grades(subject_id);
CREATE INDEX idx_grades_task_id ON public.grades(task_id);
CREATE INDEX idx_grades_graded_at ON public.grades(graded_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Políticas subjects
CREATE POLICY "Users can view own subjects"
  ON public.subjects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subjects"
  ON public.subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subjects"
  ON public.subjects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subjects"
  ON public.subjects FOR DELETE USING (auth.uid() = user_id);

-- Políticas grades
CREATE POLICY "Users can view own grades"
  ON public.grades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own grades"
  ON public.grades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own grades"
  ON public.grades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own grades"
  ON public.grades FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE public.subjects IS 'Asignaturas del estudiante por semestre/año';
COMMENT ON TABLE public.grades IS 'Notas registradas por evaluación';
COMMENT ON COLUMN public.grades.percentage IS 'Ponderación de esta nota en el promedio (ej: 30 = 30%). NULL = promedio simple';
COMMENT ON COLUMN public.subjects.coefficient IS 'Coeficiente de la asignatura para cálculo de NEM';
