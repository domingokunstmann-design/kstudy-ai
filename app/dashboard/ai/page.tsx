import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { TemarioUploader } from '@/components/ai/temario-uploader'

export const metadata: Metadata = { title: 'IA · Temarios' }

export default async function AIPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const hasApiKey = !!process.env.GEMINI_API_KEY

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-400" />
          IA — Parsear temarios
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Gemini extrae evaluaciones y fechas desde tu programa de estudios.
        </p>
      </div>

      {!hasApiKey ? (
        <div className="section-card space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <p className="text-sm font-semibold text-amber-400 mb-1">GEMINI_API_KEY no configurada</p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Para usar esta función necesitas una API key gratuita de Google AI Studio.
            </p>
          </div>

          <div className="space-y-3 text-sm text-zinc-400">
            <p className="font-medium text-zinc-300">Cómo activarla (2 minutos):</p>
            <ol className="space-y-2 text-xs text-zinc-500 list-decimal list-inside">
              <li>
                Ve a{' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                  className="text-violet-400 underline underline-offset-2">
                  aistudio.google.com/app/apikey
                </a>
                {' '}con tu cuenta Google
              </li>
              <li>Haz clic en <strong className="text-zinc-300">«Create API key»</strong></li>
              <li>Copia la key generada</li>
              <li>
                Abre el archivo{' '}
                <code className="bg-zinc-800 px-1 rounded text-zinc-300">.env.local</code>
                {' '}en la raíz del proyecto
              </li>
              <li>
                Agrega la línea:{' '}
                <code className="bg-zinc-800 px-1 rounded text-zinc-300">GEMINI_API_KEY=tu_key_aquí</code>
              </li>
              <li>Reinicia el servidor con <code className="bg-zinc-800 px-1 rounded text-zinc-300">npm run dev</code></li>
            </ol>
          </div>
        </div>
      ) : (
        <TemarioUploader />
      )}
    </div>
  )
}
