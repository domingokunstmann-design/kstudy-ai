import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncGmail } from '@/lib/actions/gmail'

// Route handler para sync manual desde el botón del dashboard
// y para el Vercel Cron Job (cada 6 horas)
export async function POST(request: NextRequest) {
  // Verificar si es una llamada del cron (tiene el header de autorización)
  const authHeader = request.headers.get('authorization')
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!isCron) {
    // Si no es cron, verificar sesión de usuario normal
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  const result = await syncGmail()

  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
  })
}

// GET para health check del cron
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}
