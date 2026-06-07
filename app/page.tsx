import { redirect } from 'next/navigation'

// La raíz redirige al dashboard
// El middleware ya protege esta ruta y redirige a /login si no hay sesión
export default function RootPage() {
  redirect('/dashboard')
}
