import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Términos de Servicio',
  description: 'Términos de servicio de Kstudy AI — condiciones de uso de la aplicación.',
}

export default function TermsPage() {
  const lastUpdated = '8 de junio de 2026'

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
            Términos de Servicio
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Última actualización: {lastUpdated}
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              1. Aceptación de los términos
            </h2>
            <p>
              Al acceder o usar Kstudy AI (<strong style={{ color: 'var(--text-primary)' }}>kstudy-ai.vercel.app</strong>),
              aceptas quedar vinculado por estos Términos de Servicio. Si no estás de acuerdo con alguna parte de estos
              términos, no puedes usar la aplicación.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              2. Descripción del servicio
            </h2>
            <p>
              Kstudy AI es una aplicación educativa gratuita dirigida a estudiantes de enseñanza media en Chile. Permite
              organizar tareas, pruebas y tiempos de estudio mediante inteligencia artificial. El servicio integra tu
              cuenta de Google para detectar automáticamente compromisos académicos desde tu correo y generar planes de
              estudio personalizados.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              3. Elegibilidad
            </h2>
            <p>
              Puedes usar Kstudy AI si tienes al menos 13 años de edad. Si eres menor de 18 años, debes contar con el
              consentimiento de un padre, madre o tutor legal para usar la aplicación. Al registrarte, declaras cumplir
              con este requisito.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              4. Cuenta y autenticación
            </h2>
            <p className="mb-3">
              El acceso a Kstudy AI se realiza exclusivamente mediante Google OAuth 2.0. Al iniciar sesión:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Autorizas a Kstudy AI a acceder a tu nombre, correo electrónico y foto de perfil de Google.</li>
              <li>Opcionalmente, puedes autorizar el acceso de solo lectura a tu Gmail para la detección automática de tareas.</li>
              <li>Eres responsable de mantener la seguridad de tu cuenta de Google.</li>
              <li>Debes notificarnos de inmediato si sospechas acceso no autorizado a tu cuenta.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              5. Uso de las APIs de Google
            </h2>
            <p className="mb-3">
              Kstudy AI utiliza las APIs de Google para proveer sus funcionalidades. El uso que hacemos de la
              información recibida a través de las APIs de Google cumple con la{' '}
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
            <div className="space-y-3">
              {[
                {
                  scope: 'gmail.readonly',
                  desc: 'Solo leemos correos para detectar tareas y pruebas. Nunca enviamos correos, modificamos tu bandeja de entrada ni accedemos a correos no relacionados con compromisos académicos.',
                },
                {
                  scope: 'openid, email, profile',
                  desc: 'Usamos tu identidad de Google únicamente para autenticarte y mostrar tu nombre y foto en la app.',
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
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-3">
              Los datos obtenidos a través de las APIs de Google no se utilizan para desarrollar, mejorar o entrenar
              modelos de inteligencia artificial o de aprendizaje automático generalizados.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              6. Uso aceptable
            </h2>
            <p className="mb-3">Al usar Kstudy AI, te comprometes a:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Usar el servicio únicamente para fines educativos y personales.</li>
              <li>No intentar acceder a datos de otros usuarios.</li>
              <li>No usar la aplicación para actividades ilegales o que violen derechos de terceros.</li>
              <li>No intentar interferir con el funcionamiento del servicio (ataques, scraping masivo, etc.).</li>
              <li>No compartir tu cuenta con otras personas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              7. Propiedad intelectual
            </h2>
            <p>
              El diseño, código y contenido de Kstudy AI son propiedad de sus desarrolladores. Los datos que tú generas
              dentro de la app (tareas, notas, planes de estudio) son tuyos. No reclamamos propiedad sobre tu contenido.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              8. Disponibilidad del servicio
            </h2>
            <p>
              Kstudy AI se ofrece de forma gratuita y sin garantías de disponibilidad continua. Podemos modificar,
              suspender o discontinuar el servicio en cualquier momento, con o sin previo aviso. No somos responsables
              por interrupciones temporales del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              9. Limitación de responsabilidad
            </h2>
            <p>
              Kstudy AI se proporciona &quot;tal cual&quot;, sin garantías de ningún tipo. No nos hacemos responsables
              de pérdidas de datos, errores en la detección automática de tareas, ni de ningún daño indirecto derivado
              del uso del servicio. Siempre verifica tus compromisos académicos directamente con tu institución educativa.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              10. Privacidad
            </h2>
            <p>
              El uso de tus datos personales está regulado por nuestra{' '}
              <Link
                href="/privacy"
                className="underline"
                style={{ color: 'var(--accent-light)' }}
              >
                Política de Privacidad
              </Link>
              , que forma parte integral de estos Términos de Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              11. Terminación
            </h2>
            <p>
              Puedes dejar de usar Kstudy AI en cualquier momento y solicitar la eliminación de tu cuenta escribiendo a{' '}
              <a
                href="mailto:domingo.kunstmann@gmail.com"
                className="underline"
                style={{ color: 'var(--accent-light)' }}
              >
                domingo.kunstmann@gmail.com
              </a>
              . También podemos suspender o eliminar cuentas que violen estos términos, con o sin aviso previo.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              12. Cambios a estos términos
            </h2>
            <p>
              Podemos actualizar estos términos en cualquier momento. Los cambios importantes serán notificados por
              correo electrónico o mediante un aviso en la aplicación. El uso continuado del servicio tras la
              notificación constituye aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              13. Ley aplicable
            </h2>
            <p>
              Estos términos se rigen por las leyes de la República de Chile. Cualquier disputa se resolverá en los
              tribunales competentes de Chile.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              14. Contacto
            </h2>
            <p>
              Para cualquier pregunta sobre estos Términos de Servicio, escríbenos a:{' '}
              <a
                href="mailto:domingo.kunstmann@gmail.com"
                className="underline"
                style={{ color: 'var(--accent-light)' }}
              >
                domingo.kunstmann@gmail.com
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
          {' · '}
          <Link href="/terms" className="underline hover:opacity-80">Términos de Servicio</Link>
        </p>
      </footer>
    </div>
  )
}
