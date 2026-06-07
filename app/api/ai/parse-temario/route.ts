import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseTemario } from '@/lib/ai/temario-parser'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  let body: { text?: string; courseName?: string; saveAll?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!body.text?.trim()) {
    return NextResponse.json({ error: 'El campo text es requerido' }, { status: 400 })
  }

  // Parsear con Gemini
  const result = await parseTemario(body.text, body.courseName)

  if (result.error && result.tasks.length === 0) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // Si saveAll=true, guardar automáticamente todas las tareas extraídas
  if (body.saveAll && result.tasks.length > 0) {
    const toInsert = result.tasks.map(t => ({
      user_id: user.id,
      title: t.title,
      description: t.description,
      type: t.type,
      priority: t.priority,
      status: 'pendiente' as const,
      source: 'manual' as const,
      due_date: t.due_date ? new Date(t.due_date).toISOString() : null,
      course_name: t.course_name,
    }))

    const { error: dbError } = await supabase.from('tasks').insert(toInsert)
    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      tasks: result.tasks,
      courseName: result.courseName,
      saved: toInsert.length,
    })
  }

  // Sin saveAll: devolver las tareas para que el usuario confirme cuáles guardar
  return NextResponse.json({
    tasks: result.tasks,
    courseName: result.courseName,
    saved: 0,
  })
}
