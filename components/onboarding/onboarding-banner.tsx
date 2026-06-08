'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Mail, GraduationCap, Brain, Sparkles, ChevronRight } from 'lucide-react'

const STEPS = [
  {
    icon: Mail,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.2)',
    title: 'Sincroniza tu Gmail',
    desc: 'Detectamos tareas y pruebas automáticamente desde tus correos del colegio.',
    href: '/dashboard/emails',
    action: 'Ir a Correos',
  },
  {
    icon: GraduationCap,
    color: '#7c6af7',
    bg: 'rgba(124,106,247,0.1)',
    border: 'rgba(124,106,247,0.2)',
    title: 'Configura tu horario',
    desc: 'El planificador respeta tus horas de clase y organiza el estudio en los ratos libres.',
    href: '/dashboard/schedule',
    action: 'Mi horario',
  },
  {
    icon: Brain,
    color: '#a89dff',
    bg: 'rgba(168,157,255,0.1)',
    border: 'rgba(168,157,255,0.2)',
    title: 'Genera tu plan de estudio',
    desc: 'La IA distribuye el tiempo según la importancia de cada prueba o tarea.',
    href: '/dashboard/planner',
    action: 'Planificador',
  },
  {
    icon: Sparkles,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.2)',
    title: 'Sube un temario con IA',
    desc: 'Pega el texto del programa de estudios y Gemini extrae las fechas y evaluaciones.',
    href: '/dashboard/ai',
    action: 'IA · Temarios',
  },
]

export function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div
      className="rounded-2xl p-5 relative"
      style={{
        background: 'linear-gradient(135deg, rgba(124,106,247,0.08) 0%, rgba(19,15,38,0.6) 100%)',
        border: '1px solid rgba(124,106,247,0.2)',
      }}
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(124,106,247,0.2)' }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: '#a89dff' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Bienvenido a Kstudy AI
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Sigue estos pasos para sacarle el máximo provecho
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <Link
              key={i}
              href={step.href}
              className="flex items-start gap-3 p-3.5 rounded-xl transition-all hover:scale-[1.01] group"
              style={{
                background: step.bg,
                border: `1px solid ${step.border}`,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: step.bg, border: `1px solid ${step.border}` }}
              >
                <Icon className="w-4 h-4" style={{ color: step.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                  {step.title}
                </p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {step.desc}
                </p>
              </div>
              <ChevronRight
                className="w-3.5 h-3.5 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: step.color }}
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
