import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Kstudy AI — Tu asistente académico',
    template: '%s · Kstudy AI',
  },
  description:
    'Asistente académico inteligente para estudiantes. Detecta tareas, pruebas y fechas desde tu Gmail y Google Classroom automáticamente.',
  keywords: ['estudio', 'académico', 'tareas', 'calendario', 'Gmail', 'Classroom'],
  authors: [{ name: 'Kstudy AI' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kstudy AI',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#7c6af7',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased bg-[--bg] text-[--text-primary] min-h-screen">
        {children}
      </body>
    </html>
  )
}
