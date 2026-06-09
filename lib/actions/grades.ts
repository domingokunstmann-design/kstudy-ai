'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function revalidateGrades() {
  revalidatePath('/dashboard/grades')
  revalidatePath('/dashboard')
}

// ── Subjects ─────────────────────────────────────────────────

export async function getSubjects() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  return { data, error: error?.message }
}

export async function createSubject(form: {
  name: string
  color: string
  teacher_name?: string
  semester: number
  school_year: number
  coefficient?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('subjects').insert({
    user_id: user.id,
    name: form.name.trim(),
    color: form.color,
    teacher_name: form.teacher_name?.trim() || null,
    semester: form.semester,
    school_year: form.school_year,
    coefficient: form.coefficient ?? 1.0,
  })

  if (error) return { error: error.message }
  revalidateGrades()
  return { success: true }
}

export async function updateSubject(
  subjectId: string,
  form: Partial<{
    name: string
    color: string
    teacher_name: string
    coefficient: number
  }>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('subjects')
    .update({
      ...(form.name && { name: form.name.trim() }),
      ...(form.color && { color: form.color }),
      ...(form.teacher_name !== undefined && { teacher_name: form.teacher_name?.trim() || null }),
      ...(form.coefficient !== undefined && { coefficient: form.coefficient }),
    })
    .eq('id', subjectId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidateGrades()
  return { success: true }
}

export async function deleteSubject(subjectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', subjectId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidateGrades()
  return { success: true }
}

// ── Grades ───────────────────────────────────────────────────

export async function getGradesForSubject(subjectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .eq('subject_id', subjectId)
    .eq('user_id', user.id)
    .order('graded_at', { ascending: true })

  return { data, error: error?.message }
}

export async function addGrade(form: {
  subject_id: string
  title: string
  grade: number
  percentage?: number | null
  graded_at?: string
  notes?: string
  task_id?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  if (form.grade < 1 || form.grade > 7) {
    return { error: 'La nota debe estar entre 1.0 y 7.0' }
  }

  const { error } = await supabase.from('grades').insert({
    user_id: user.id,
    subject_id: form.subject_id,
    title: form.title.trim(),
    grade: form.grade,
    percentage: form.percentage ?? null,
    graded_at: form.graded_at ?? new Date().toISOString().slice(0, 10),
    notes: form.notes?.trim() || null,
    task_id: form.task_id ?? null,
  })

  if (error) return { error: error.message }
  revalidateGrades()
  return { success: true }
}

export async function updateGrade(
  gradeId: string,
  form: Partial<{
    title: string
    grade: number
    percentage: number | null
    graded_at: string
    notes: string
  }>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  if (form.grade !== undefined && (form.grade < 1 || form.grade > 7)) {
    return { error: 'La nota debe estar entre 1.0 y 7.0' }
  }

  const { error } = await supabase
    .from('grades')
    .update(form)
    .eq('id', gradeId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidateGrades()
  return { success: true }
}

export async function deleteGrade(gradeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('grades')
    .delete()
    .eq('id', gradeId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidateGrades()
  return { success: true }
}

// ── Datos completos para la página de notas ──────────────────

export async function getGradesPageData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const currentSemester = currentMonth <= 6 ? 1 : 2

  const [{ data: subjects }, { data: grades }] = await Promise.all([
    supabase
      .from('subjects')
      .select('*')
      .eq('user_id', user.id)
      .eq('school_year', currentYear)
      .eq('semester', currentSemester)
      .order('name'),
    supabase
      .from('grades')
      .select('*')
      .eq('user_id', user.id)
      .order('graded_at', { ascending: true }),
  ])

  return {
    subjects: subjects ?? [],
    grades: grades ?? [],
    currentSemester,
    currentYear,
  }
}
