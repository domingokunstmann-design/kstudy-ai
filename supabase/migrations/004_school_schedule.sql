-- ============================================
-- KSTUDY AI — Migración 004: Horario Escolar
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================

CREATE TYPE schedule_mode AS ENUM ('simple', 'blocks');
CREATE TYPE period_type AS ENUM ('class', 'break', 'lunch', 'free', 'pe');

-- ============================================
-- TABLA: school_schedules
-- Configuración general del horario escolar
-- ============================================

CREATE TABLE public.school_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  mode schedule_mode DEFAULT 'simple' NOT NULL,
  -- Modo simple: horario único de entrada/salida
  simple_start_time TIME DEFAULT '07:45',
  simple_end_time TIME DEFAULT '15:40',
  -- Días activos (array de 0-6, 0=Dom, 1=Lun, ..., 6=Sáb)
  active_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- Lun-Vie por defecto
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER school_schedules_updated_at
  BEFORE UPDATE ON public.school_schedules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.school_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own school schedule"
  ON public.school_schedules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TABLA: school_periods
-- Bloques individuales del horario (modo bloques)
-- ============================================

CREATE TABLE public.school_periods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  schedule_id UUID REFERENCES public.school_schedules(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL,          -- 0=Dom, 1=Lun, ..., 6=Sáb
  period_type period_type DEFAULT 'class' NOT NULL,
  subject TEXT,                          -- "Matemáticas", "Lenguaje", null para recreos
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color TEXT DEFAULT 'indigo',           -- color del bloque en UI
  CONSTRAINT valid_period_day CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT valid_period_time CHECK (end_time > start_time)
);

CREATE INDEX idx_school_periods_user ON public.school_periods(user_id);
CREATE INDEX idx_school_periods_schedule ON public.school_periods(schedule_id);
CREATE INDEX idx_school_periods_day ON public.school_periods(day_of_week);

ALTER TABLE public.school_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own school periods"
  ON public.school_periods FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCIÓN: obtener bloques bloqueados de un día
-- Para el planificador
-- ============================================

CREATE OR REPLACE FUNCTION public.get_blocked_slots(
  p_user_id UUID,
  p_day_of_week INTEGER
)
RETURNS TABLE(start_time TIME, end_time TIME, label TEXT) AS $$
DECLARE
  v_schedule RECORD;
BEGIN
  SELECT * INTO v_schedule
  FROM public.school_schedules
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN RETURN; END IF;

  -- Si ese día no es día de colegio, no hay bloques
  IF NOT (p_day_of_week = ANY(v_schedule.active_days)) THEN RETURN; END IF;

  IF v_schedule.mode = 'simple' THEN
    -- Modo simple: todo el día de colegio es bloqueado
    RETURN QUERY SELECT
      v_schedule.simple_start_time,
      v_schedule.simple_end_time,
      'Colegio'::TEXT;
  ELSE
    -- Modo bloques: cada período es bloqueado
    RETURN QUERY
      SELECT sp.start_time, sp.end_time,
        COALESCE(sp.subject, sp.period_type::TEXT) AS label
      FROM public.school_periods sp
      WHERE sp.user_id = p_user_id
        AND sp.schedule_id = v_schedule.id
        AND sp.day_of_week = p_day_of_week
      ORDER BY sp.start_time;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
