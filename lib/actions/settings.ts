'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type GradeLevel = '7mo' | '8vo' | '1ro_medio' | '2do_medio' | '3ro_medio' | '4to_medio'

export async function updateGradeLevel(
  gradeLevel: GradeLevel | null,
  schoolName: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('profiles')
    .update({
      grade_level: gradeLevel,
      school_name: schoolName,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function toggleReminders(enabled: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('profiles')
    .update({ reminders_enabled: enabled })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/settings')
  return { success: true }
}
