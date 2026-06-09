-- Migración 008: grade_level, school_name y onboarding_completed en profiles
-- Permite personalizar la experiencia según el nivel escolar del estudiante

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS grade_level TEXT
    CHECK (grade_level IN ('7mo', '8vo', '1ro_medio', '2do_medio', '3ro_medio', '4to_medio')),
  ADD COLUMN IF NOT EXISTS school_name TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.grade_level IS
  'Nivel escolar: 7mo | 8vo | 1ro_medio | 2do_medio | 3ro_medio | 4to_medio';
COMMENT ON COLUMN public.profiles.school_name IS
  'Nombre del colegio (opcional)';
COMMENT ON COLUMN public.profiles.onboarding_completed IS
  'TRUE cuando el usuario completó el flujo de onboarding inicial';
