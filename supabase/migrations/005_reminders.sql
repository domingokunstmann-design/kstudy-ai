-- Migración 005: Recordatorios por email
-- Agrega columna para que el usuario pueda activar/desactivar recordatorios

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN DEFAULT true NOT NULL;
