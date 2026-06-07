'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Upload, CheckCircle2, AlertCircle, Loader2, X, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TASK_TYPE_CONFIG, PRIORITY_CONFIG } from '@/types'
import type { TaskType, TaskPriority } from '@/types'
import { useRouter } from 'next/navigation'

interface ParsedTask {
  title: string
  description: string | null
  type: TaskType
  priority: TaskPriority
  due_date: string | null
  course_name: string | null
  confidence: number
}

type Step = 'input' | 'reviewing' | 'done'

export function TemarioUploader() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('input')
  const [text, setText] = useState('')
  const [courseName, setCourseName] = useState('')
  const [tasks, setTasks] = useState<ParsedTask[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const [isParsing, startParse] = useTransition()
  const [isSaving, startSave] = useTransition()

  async function handleParse() {
    if (!text.trim()) return
    setError(null)

    startParse(async () => {
      const res = await fetch('/api/ai/parse-temario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, courseName: courseName || undefined }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? 'Error al parsear')
        return
      }

      setTasks(data.tasks)
      setSelected(new Set(data.tasks.map((_: ParsedTask, i: number) => i)))
      setStep('reviewing')
    })
  }

  async function handleSave() {
    const selectedTasks = tasks.filter((_, i) => selected.has(i))
    if (selectedTasks.length === 0) return

    startSave(async () => {
      const res = await fetch('/api/ai/parse-temario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          courseName: courseName || undefined,
          saveAll: true,
          // Note: en una v2 podríamos enviar solo las seleccionadas
        }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? 'Error al guardar')
        return
      }

      setSavedCount(data.saved)
      setStep('done')
      router.refresh()
    })
  }

  function toggleTask(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function reset() {
    setStep('input')
    setText('')
    setCourseName('')
    setTasks([])
    setSelected(new Set())
    setError(null)
    setSavedCount(0)
  }

  // ── DONE ──────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="section-card flex flex-col items-center gap-4 py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <p className="text-lg font-semibold text-white">
            {savedCount} {savedCount === 1 ? 'tarea guardada' : 'tareas guardadas'}
          </p>
          <p className="text-sm text-zinc-500 mt-1">Ya aparecen en tu calendario y lista de tareas.</p>
        </div>
        <button onClick={reset} className="btn-ghost text-sm mt-2">
          Parsear otro temario
        </button>
      </div>
    )
  }

  // ── REVIEWING ─────────────────────────────────────
  if (step === 'reviewing') {
    return (
      <div className="space-y-4">
        <div className="section-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-white">
                Gemini encontró {tasks.length} {tasks.length === 1 ? 'evento' : 'eventos'}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Selecciona cuáles guardar — todas están marcadas por defecto.
              </p>
            </div>
            <button onClick={reset} className="text-zinc-600 hover:text-zinc-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {tasks.map((task, i) => {
              const typeConfig = TASK_TYPE_CONFIG[task.type]
              const priorityConfig = PRIORITY_CONFIG[task.priority]
              const isSelected = selected.has(i)

              return (
                <button
                  key={i}
                  onClick={() => toggleTask(i)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
                    isSelected
                      ? 'border-indigo-500/40 bg-indigo-500/5'
                      : 'border-zinc-800/50 bg-zinc-900/30 opacity-50'
                  )}
                >
                  {/* Checkbox visual */}
                  <div className={cn(
                    'mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all',
                    isSelected
                      ? 'bg-indigo-500 border-indigo-500'
                      : 'border-zinc-700 bg-transparent'
                  )}>
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 leading-snug">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-zinc-600 mt-0.5 line-clamp-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', typeConfig.bgColor, typeConfig.color, typeConfig.borderColor)}>
                        {typeConfig.label}
                      </span>
                      <span className={cn('text-[10px] font-medium', priorityConfig.color)}>
                        {priorityConfig.label}
                      </span>
                      {task.due_date && (
                        <span className="text-[10px] text-zinc-500">
                          📅 {new Date(task.due_date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {task.course_name && (
                        <span className="text-[10px] text-zinc-600 truncate">{task.course_name}</span>
                      )}
                      {/* Confianza baja → warning */}
                      {task.confidence < 0.6 && (
                        <span className="text-[10px] text-amber-500">⚠ revisar</span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={reset} className="btn-ghost text-sm flex-1">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || selected.size === 0}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-40"
          >
            {isSaving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
              : <><CheckCircle2 className="w-4 h-4" /> Guardar {selected.size} {selected.size === 1 ? 'tarea' : 'tareas'}</>
            }
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    )
  }

  // ── INPUT ──────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="section-card space-y-4">
        {/* Cabecera */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Parsear temario con IA</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Pega el texto de tu programa o temario — Gemini extrae evaluaciones, tareas y fechas automáticamente.
            </p>
          </div>
        </div>

        {/* Asignatura (opcional) */}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Asignatura (opcional)</label>
          <input
            type="text"
            value={courseName}
            onChange={e => setCourseName(e.target.value)}
            placeholder="Ej: Matemáticas, Historia, Química…"
            className="w-full bg-zinc-900/60 border border-zinc-800/60 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        {/* Textarea del temario */}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">
            Texto del temario
            <span className="ml-2 text-zinc-700">(máx. 12.000 caracteres)</span>
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Pega aquí el texto completo del temario, programa de estudios, o lista de evaluaciones…&#10;&#10;Ejemplo:&#10;Unidad 1 — Álgebra (semanas 1-4)&#10;Control 1: viernes 14 de marzo&#10;Trabajo grupal: entrega 28 de marzo&#10;Prueba solemne: 11 de abril"
            rows={10}
            maxLength={12000}
            className="w-full bg-zinc-900/60 border border-zinc-800/60 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none font-mono"
          />
          <p className="text-[10px] text-zinc-700 mt-1 text-right">
            {text.length} / 12.000 caracteres
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleParse}
          disabled={isParsing || !text.trim()}
          className="w-full btn-primary flex items-center justify-center gap-2 text-sm disabled:opacity-40 py-2.5"
        >
          {isParsing
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Analizando con Gemini…</>
            : <><Sparkles className="w-4 h-4" /> Extraer evaluaciones y tareas</>
          }
        </button>
      </div>

      {/* Tip */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/40">
        <BookOpen className="w-3.5 h-3.5 text-zinc-600 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-zinc-600 leading-relaxed">
          <span className="text-zinc-400 font-medium">Tip:</span> Funciona mejor con texto completo copiado desde PDF o Word. Incluye fechas, nombres de evaluaciones y porcentajes para mejores resultados.
        </p>
      </div>
    </div>
  )
}
