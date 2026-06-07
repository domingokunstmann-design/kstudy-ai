-- ============================================
-- KSTUDY AI — Migración 003: Google Calendar
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================

-- Añadir columna para el ID del evento en Google Calendar
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- Tabla de log de recordatorios enviados (evita duplicados)
CREATE TABLE IF NOT EXISTS public.reminder_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL,   -- '24h', '2h', '1week'
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(task_id, reminder_type)
);

ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reminder logs"
  ON public.reminder_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Columna para saber si el usuario tiene scope de Calendar
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_calendar_scope BOOLEAN DEFAULT FALSE;
