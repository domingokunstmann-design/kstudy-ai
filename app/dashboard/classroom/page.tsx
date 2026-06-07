import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookOpen, ExternalLink, Clock } from 'lucide-react'
import { cn, formatDueDate } from '@/lib/utils'
import type { Course, Assignment } from '@/types'

export const metadata: Metadata = { title: 'Classroom' }
export const revalidate = 0

const COURSE_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-sky-500', 'bg-orange-500',
]

export default async function ClassroomPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('user_id', user.id)
    .in('state', ['PUBLISHED', 'NEW'])
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(20)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-zinc-500" />
          Google Classroom
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {courses?.length ?? 0} cursos · {assignments?.length ?? 0} tareas activas
        </p>
      </div>

      {(!courses || courses.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="w-10 h-10 text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-400 font-medium">No hay cursos sincronizados</p>
          <p className="text-xs text-zinc-600 mt-1 max-w-xs">
            La sincronización con Google Classroom se activará en la próxima fase del desarrollo.
          </p>
        </div>
      )}

      {/* Cursos */}
      {courses && courses.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Mis cursos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(courses as Course[]).map((course, i) => (
              <div key={course.id} className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/60 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0', COURSE_COLORS[i % COURSE_COLORS.length])}>
                    {course.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{course.name}</p>
                    {course.section && <p className="text-xs text-zinc-500">{course.section}</p>}
                    {course.teacher_name && <p className="text-xs text-zinc-600 mt-0.5">{course.teacher_name}</p>}
                  </div>
                  {course.alternate_link && (
                    <a href={course.alternate_link} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-400 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignments pendientes */}
      {assignments && assignments.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Trabajos pendientes</h2>
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden divide-y divide-zinc-800/40">
            {(assignments as Assignment[]).map(assignment => (
              <div key={assignment.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{assignment.title}</p>
                  {assignment.max_points && (
                    <p className="text-xs text-zinc-600 mt-0.5">{assignment.max_points} pts</p>
                  )}
                </div>
                {assignment.due_date && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3 text-zinc-600" />
                    <span className="text-xs text-zinc-500">{formatDueDate(assignment.due_date)}</span>
                  </div>
                )}
                {assignment.alternate_link && (
                  <a href={assignment.alternate_link} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
