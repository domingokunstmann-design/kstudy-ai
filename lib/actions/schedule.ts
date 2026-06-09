'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================
// Horario escolar — Server Actions
// ============================================

export async function saveSimpleSchedule(data: {
  start_time: string
  end_time: string
  active_days: number[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('school_schedules')
    .upsert({
      user_id: user.id,
      mode: 'simple',
      simple_start_time: data.start_time,
      simple_end_time: data.end_time,
      active_days: data.active_days,
    }, { onConflict: 'user_id' })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/schedule')
  revalidatePath('/dashboard/planner')
  return { success: true }
}

export async function switchToSimpleMode() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('school_schedules')
    .upsert({ user_id: user.id, mode: 'simple' }, { onConflict: 'user_id' })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/schedule')
  return { success: true }
}

export async function switchToBlocksMode() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('school_schedules')
    .upsert({ user_id: user.id, mode: 'blocks' }, { onConflict: 'user_id' })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/schedule')
  return { success: true }
}

export async function addSchoolPeriod(data: {
  schedule_id: string
  day_of_week: number
  period_type: 'class' | 'break' | 'lunch' | 'free' | 'pe'
  subject: string | null
  start_time: string
  end_time: string
  color: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('school_periods')
    .insert({ ...data, user_id: user.id })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/schedule')
  revalidatePath('/dashboard/planner')
  return { success: true }
}

export async function updateSchoolPeriod(id: string, data: {
  period_type: string
  subject: string | null
  start_time: string
  end_time: string
  color: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('school_periods')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/schedule')
  revalidatePath('/dashboard/calendar')
  return { success: true }
}

export async function deleteSchoolPeriod(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  await supabase.from('school_periods').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/dashboard/schedule')
  return { success: true }
}

export async function copyDayToAllDays(sourceDay: number, scheduleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: periods } = await supabase
    .from('school_periods')
    .select('*')
    .eq('user_id', user.id)
    .eq('schedule_id', scheduleId)
    .eq('day_of_week', sourceDay)

  if (!periods || periods.length === 0) return { error: 'No hay períodos en ese día' }

  // Días de colegio (Lun-Vie = 1-5)
  const targetDays = [1, 2, 3, 4, 5].filter(d => d !== sourceDay)

  for (const day of targetDays) {
    // Borrar períodos existentes en ese día
    await supabase
      .from('school_periods')
      .delete()
      .eq('user_id', user.id)
      .eq('schedule_id', scheduleId)
      .eq('day_of_week', day)

    // Copiar desde el día fuente
    await supabase.from('school_periods').insert(
      periods.map(({ id, day_of_week, ...rest }) => ({
        ...rest,
        day_of_week: day,
        user_id: user.id,
      }))
    )
  }

  revalidatePath('/dashboard/schedule')
  return { success: true }
}
