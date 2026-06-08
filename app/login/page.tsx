import { Metadata } from 'next'
import { signInWithGoogle } from '@/lib/actions/auth'
import { BookOpen, Mail, Calendar, CheckSquare } from 'lucide-react'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
}

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

const FEATURES = [
  {
    icon: Mail,
    title: 'Gmail integrado',
    description: 'Detecta tareas y pruebas desde tus correos automáticamente',
  },
  {
    icon: BookOpen,
    title: 'Google Classroom',
    description: 'Sincroniza tus cursos y trabajos pendientes en tiempo real',
  },
  {
    icon: Calendar,
    title: 'Calendario académico',
    description: 'Todas tus fechas importantes en un solo lugar visual',
  },
  {
    icon: CheckSquare,
    title: 'Prioridades automáticas',
    description: 'El sistema calcula qué estudiar primero por ti',
  },
]

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const hasError = params.error === 'oauth_error'

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Panel izquierdo — Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-zinc-950 border-r border-zinc-900 relative overflow-hidden">
        {/* Gradiente decorativo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_60%_60%_at_30%_20%,rgba(99,102,241,0.12),transparent)]" />
          <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-[radial-gradient(ellipse_60%_60%_at_70%_80%,rgba(139,92,246,0.08),transparent)]" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <Image src="/logo.png" alt="Kstudy AI" width={36} height={36} className="rounded-lg" />
          <span className="text-lg font-semibold text-zinc-100 tracking-tight">
            Kstudy AI
          </span>
        </div>

        {/* Hero text */}
        <div className="relative space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-zinc-100 leading-tight tracking-tight">
              Tu asistente
              <br />
              <span className="text-gradient bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                académico inteligente
              </span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-sm">
              Conecta tu Gmail y Classroom. Nosotros organizamos todo lo demás.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-3 max-w-sm">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60"
                >
                  <div className="w-7 h-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{feature.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-xs text-zinc-600">
            Gratis para estudiantes · Sin tarjeta de crédito
          </p>
        </div>
      </div>

      {/* Panel derecho — Login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {/* Gradiente mobile */}
        <div className="absolute inset-0 pointer-events-none lg:hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.08),transparent)]" />
        </div>

        <div className="relative w-full max-w-sm space-y-8">
          {/* Logo mobile */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <Image src="/logo.png" alt="Kstudy AI" width={36} height={36} className="rounded-lg" />
            <span className="text-lg font-semibold text-zinc-100 tracking-tight">
              Kstudy AI
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
              Bienvenido
            </h2>
            <p className="text-zinc-400 text-sm">
              Inicia sesión con tu cuenta de Google institucional
            </p>
          </div>

          {/* Error message */}
          {hasError && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <span className="text-base">⚠️</span>
              <span>Ocurrió un error al conectar con Google. Inténtalo de nuevo.</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <form action={signInWithGoogle} className="space-y-4">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl
                         bg-zinc-900 border border-zinc-700 hover:border-zinc-600
                         hover:bg-zinc-800/80 text-zinc-100 font-medium text-sm
                         transition-all duration-150 group"
            >
              {/* Google icon SVG */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar con Google
              <span className="ml-auto text-zinc-600 group-hover:text-zinc-500 transition-colors text-xs">
                →
              </span>
            </button>

            <p className="text-xs text-zinc-600 text-center leading-relaxed">
              Al continuar, Kstudy solicitará acceso de{' '}
              <span className="text-zinc-500">solo lectura</span> a tu Gmail y
              Classroom para detectar tareas automáticamente.
            </p>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-zinc-600 bg-zinc-950">
                Seguro · Privado · Gratuito
              </span>
            </div>
          </div>

          {/* Permisos info */}
          <div className="space-y-2">
            {[
              { emoji: '📧', text: 'Lee tu Gmail (solo lectura)' },
              { emoji: '📚', text: 'Accede a tus cursos de Classroom' },
              { emoji: '🔒', text: 'Nunca escribe ni modifica nada' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2.5 text-xs text-zinc-500">
                <span>{item.emoji}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
