import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const next = searchParams.get('next') ?? '/dashboard'

  // Google rechazó el permiso
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(`${origin}/login?error=oauth_error`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = await createClient()

  // Intercambiar code por sesión
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('Error al intercambiar código:', exchangeError)
    return NextResponse.redirect(`${origin}/login?error=exchange_error`)
  }

  const { session } = data

  if (!session?.user) {
    return NextResponse.redirect(`${origin}/login?error=no_session`)
  }

  // Guardar tokens de Google en la tabla profiles
  // provider_token = access token de Google
  // provider_refresh_token = refresh token de Google (requiere prompt=consent)
  if (session.provider_token || session.provider_refresh_token) {
    const tokenExpiry = session.provider_token
      ? new Date(Date.now() + 3600 * 1000).toISOString() // 1 hora
      : null

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        google_access_token: session.provider_token ?? null,
        google_refresh_token: session.provider_refresh_token ?? null,
        token_expiry: tokenExpiry,
        full_name: session.user.user_metadata?.full_name ?? null,
        avatar_url: session.user.user_metadata?.avatar_url ?? null,
        // Cualquier login nuevo tiene el scope de Calendar activado
        has_calendar_scope: true,
      })
      .eq('id', session.user.id)

    if (updateError) {
      // No bloqueamos el login si falla esto, solo lo registramos
      console.error('Error guardando tokens de Google:', updateError)
    }
  }

  // Redirigir al dashboard
  // Usamos una URL relativa para evitar problemas con el host en producción
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`)
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`)
  } else {
    return NextResponse.redirect(`${origin}${next}`)
  }
}
