import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad de Kstudy AI — cómo recopilamos, usamos y protegemos tus datos.',
}

export default function PrivacyPage() {
  const lastUpdated = '8 de junio de 2025'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Nav mínima */}
      <header
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: 'linear-gradient(135deg,#7c6af7,#9b8dff)', color: '#fff' }}
          >
            K
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Kstudy <span style={{ color: 'var(--accent-light)' }}>AI</span>
          </span>
        </Link>
        <Link
          href="/login"
          className="text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)' }}
        >
          Volver al inicio
        </Link>
      </header>

      {/* Contenido */}
      <main className="max-w-2xl mx-auto px-6 py-14">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Política de Privacidad
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Última actualización: {lastUpdated}
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              1. ¿Quiénes somos?
            </h2>
            <p>
              Kstudy AI (<strong style={{ color: 'var(--text-primary)' }}>kstudy-ai.vercel.app</strong>) es una
              aplicación educativa diseñada para ayudar a estudiantes de enseñanza media en Chile a organizar sus
              tareas, pruebas y tiempos de estudio. La aplicación es operada de forma independiente.
            </p>
            <p className="mt-3">
              Si tienes preguntas sobre esta política, puedes contactarnos en{' '}
              <a
                href="mailto:coni@conisapag.com"
                className="underline"
                style={{ color: 'var(--accent-light)' }}
              >
                coni@conisapag.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              2. Datos que recopilamos
            </h2>
            <p className="mb-3">Al usar Kstudy AI, recopilamos los siguientes datos:</p>

            <div className="space-y-3">
              {[
                {
                  title: 'Información de cuenta de Google',
                  desc: 'Cuando inicias sesión con Google, obtenemos tu nombre completo, dirección de correo electrónico y foto de perfil, exclusivamente para crear y gestionar tu cuenta.',
                },
                {
                  title: 'Correos electrónicos (solo encabezados y contenido relevante)',
                  desc: 'Con tu autorización explícita, accedemos a los correos de tu Gmail para detectar tareas, pruebas y fechas importantes enviadas por tu colegio. Solo leemos los mensajes necesarios para esta función. No almacenamos el contenido completo de tus correos.',
                },
                {
                  title: 'Tareas y eventos creados en la app',
                  desc: 'Guardamos las tareas, fechas de entrega y planes de estudio que tú o la IA crean dentro de la aplicación. Estos datos están asociados a tu cuenta.',
                },
                {
                  title: 'Horario escolar',
                  desc: 'Si configuras tu horario de clases, lo almacenamos para que el planificador pueda sugerir horarios de estudio en los ratos libres.',
                },
                {
                  title: 'Datos de uso',
                  desc: 'Recopilamos información básica sobre cómo utilizas la aplicación (páginas visitadas, funciones usadas) para mejorar el servicio. No vinculamos estos datos a tu identidad.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </p>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              3. Cómo usamos tus datos
            </h2>
            <p>Usamos tus datos únicamente para:</p>
            <ul className="mt-3 space-y-2 list-disc list-inside">
              <li>Crear y mantener tu cuenta de usuario</li>
              <li>Detectar automáticamente tareas y pruebas desde tus correos del colegio</li>
              <li>Generar planes de estudio personalizados mediante inteligencia artificial</li>
              <li>Enviarte recordatorios por email sobre tareas próximas a vencer (solo si lo activas)</li>
              <li>Mejorar la experiencia y funcionalidad de la aplicación</li>
            </ul>
            <p className="mt-3">
              <strong style={{ color: 'var(--text-primary)' }}>No vendemos, arrendamos ni compartimos</strong> tus
              datos personales con terceros con fines comerciales o publicitarios.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              4. Servicios de terceros
            </h2>
            <p className="mb-3">
              Para operar, Kstudy AI utiliza los siguientes servicios externos, cada uno con su propia política de
              privacidad:
            </p>
            <div className="space-y-2">
              {[
                { name: 'Google OAuth 2.0', purpose: 'Autenticación con tu cuenta Google y acceso a Gmail', url: 'https://policies.google.com/privacy' },
                { name: 'Supabase', purpose: 'Base de datos y almacenamiento de tu información', url: 'https://supabase.com/privacy' },
                { name: 'Google Gemini AI', purpose: 'Análisis de temarios y generación de planes de estudio', url: 'https://policies.google.com/privacy' },
                { name: 'Resend', purpose: 'Envío de emails de recordatorio', url: 'https://resend.com/privacy' },
                { name: 'Vercel', purpose: 'Hospedaje y despliegue de la aplicación', url: 'https://vercel.com/legal/privacy-policy' },
              ].map((s) => (
                <div key={s.name} className="flex items-start gap-3 py-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: 'var(--accent)' }}
                  />
                  <div>
                    <span style={{ color: 'var(--text-primary)' }} className="font-medium">{s.name}</span>
                    {' — '}{s.purpose}.{' '}
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--accent-light)' }}>
                      Ver política
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              5. Permisos de Google que solicitamos
            </h2>
            <p className="mb-3">Al conectar tu cuenta de Google, solicitamos los siguientes permisos (scopes):</p>
            <div className="space-y-3">
              {[
                {
                  scope: 'openid, email, profile',
                  why: 'Para identificarte y crear tu cuenta. Solo leemos tu nombre y correo.',
                },
                {
                  scope: 'gmail.readonly',
                  why: 'Para leer tus correos del colegio y detectar tareas y pruebas automáticamente. Solo leemos, nunca enviamos correos en tu nombre.',
                },
              ].map((item) => (
                <div
                  key={item.scope}
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(124,106,247,0.06)', border: '1px solid rgba(124,106,247,0.15)' }}
                >
                  <code className="text-xs font-mono mb-1 block" style={{ color: 'var(--accent-light)' }}>
                    {item.scope}
                  </code>
                  <p>{item.why}</p>
                </div>
              ))}
            </div>
            <p className="mt-3">
              El uso que Kstudy AI hace de la información obtenida a través de las APIs de Google se ajusta a la{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: 'var(--accent-light)' }}
              >
                Política de Datos de Usuario de los Servicios API de Google
              </a>
              , incluyendo los requisitos de Uso Limitado.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              6. Retención y eliminación de datos
            </h2>
            <p>
              Conservamos tus datos mientras tu cuenta esté activa. Puedes solicitar la eliminación completa de tu
              cuenta y todos tus datos en cualquier momento escribiendo a{' '}
              <a href="mailto:coni@conisapag.com" className="underline" style={{ color: 'var(--accent-light)' }}>
                coni@conisapag.com
              </a>
              . Procesamos las solicitudes en un plazo máximo de 30 días.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              7. Seguridad
            </h2>
            <p>
              Todos los datos se transmiten mediante HTTPS. Las credenciales de autenticación son manejadas por Google
              OAuth 2.0 y Supabase Auth — nunca almacenamos tu contraseña de Google. Los datos en la base de datos
              están protegidos con Row Level Security (RLS), lo que significa que cada usuario solo puede acceder a
              sus propios datos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              8. Menores de edad
            </h2>
            <p>
              Kstudy AI está diseñado para estudiantes de enseñanza media (14–18 años). Si eres menor de 14 años, te
              pedimos que uses la aplicación con supervisión de un adulto. No recopilamos intencionalmente datos de
              niños menores de 13 años.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              9. Cambios a esta política
            </h2>
            <p>
              Podemos actualizar esta política ocasionalmente. Si realizamos cambios importantes, te lo notificaremos
              por correo electrónico o mediante un aviso en la aplicación. La fecha de última actualización siempre
              estará visible al inicio de este documento.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              10. Contacto
            </h2>
            <p>
              Si tienes preguntas, dudas o solicitudes relacionadas con tu privacidad, contáctanos en:{' '}
              <a href="mailto:coni@conisapag.com" className="underline" style={{ color: 'var(--accent-light)' }}>
                coni@conisapag.com
              </a>
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t px-6 py-6 text-center"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Kstudy AI ·{' '}
          <Link href="/privacy" className="underline hover:opacity-80">Política de Privacidad</Link>
        </p>
      </footer>
    </div>
  )
}
