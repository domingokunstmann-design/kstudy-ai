import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

// ============================================
// Gmail API Client
// Maneja tokens, refresh automático y fetch de emails
// ============================================

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
]

/**
 * Crea un cliente OAuth2 de Google autenticado para el usuario
 * Refresca el access token automáticamente si expiró
 */
export async function getGoogleClient(userId: string) {
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('google_access_token, google_refresh_token, token_expiry')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    throw new Error('No se encontró el perfil del usuario')
  }

  if (!profile.google_refresh_token) {
    throw new Error('No hay refresh token — el usuario debe volver a hacer login')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({
    access_token: profile.google_access_token,
    refresh_token: profile.google_refresh_token,
    expiry_date: profile.token_expiry ? new Date(profile.token_expiry).getTime() : undefined,
    scope: GOOGLE_SCOPES.join(' '),
  })

  // Listener: cuando se refresca el token, guardarlo en la DB
  oauth2Client.on('tokens', async (tokens) => {
    const updates: Record<string, string | null> = {}

    if (tokens.access_token) {
      updates.google_access_token = tokens.access_token
    }
    if (tokens.refresh_token) {
      updates.google_refresh_token = tokens.refresh_token
    }
    if (tokens.expiry_date) {
      updates.token_expiry = new Date(tokens.expiry_date).toISOString()
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('profiles').update(updates).eq('id', userId)
    }
  })

  return oauth2Client
}

// ============================================
// Tipos de mensaje de Gmail
// ============================================

export interface ParsedEmail {
  id: string
  threadId: string
  subject: string
  from: string
  fromEmail: string
  bodyText: string
  bodyPreview: string
  date: Date
  labelIds: string[]
}

/**
 * Obtiene los últimos N correos del usuario
 * Filtra por correos relevantes académicamente
 */
export async function fetchRecentEmails(
  userId: string,
  maxResults = 50
): Promise<ParsedEmail[]> {
  const auth = await getGoogleClient(userId)
  const gmail = google.gmail({ version: 'v1', auth })

  // Buscar correos de los últimos 30 días
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const afterDate = Math.floor(thirtyDaysAgo.getTime() / 1000)

  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: `after:${afterDate} -category:promotions -category:social -category:updates -label:spam -from:noreply -from:no-reply`,
  })

  const messages = listResponse.data.messages ?? []
  if (messages.length === 0) return []

  // Fetch detallado en paralelo (máximo 10 a la vez para no saturar)
  const parsed: ParsedEmail[] = []
  const chunks = chunkArray(messages, 10)

  for (const chunk of chunks) {
    const details = await Promise.all(
      chunk.map((msg) =>
        gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'full',
        })
      )
    )

    for (const detail of details) {
      const parsed_msg = parseGmailMessage(detail.data)
      if (parsed_msg) parsed.push(parsed_msg)
    }
  }

  return parsed
}

/**
 * Parsea un mensaje de Gmail al formato interno
 */
function parseGmailMessage(
  msg: any // eslint-disable-line @typescript-eslint/no-explicit-any
): ParsedEmail | null {
  if (!msg?.id) return null

  const headers = msg.payload?.headers ?? []
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''

  const subject = getHeader('Subject') || '(Sin asunto)'
  const fromRaw = getHeader('From')
  const dateStr = getHeader('Date')

  // Parsear "Nombre <email@dominio.com>" o "email@dominio.com"
  const emailMatch = fromRaw.match(/<([^>]+)>/)
  const fromEmail = emailMatch ? emailMatch[1] : fromRaw.trim()
  const fromName = emailMatch
    ? fromRaw.replace(/<[^>]+>/, '').trim().replace(/^"|"$/g, '')
    : fromRaw

  // Extraer texto del body (prioriza text/plain sobre text/html)
  const bodyText = extractBodyText(msg.payload)
  const bodyPreview = bodyText.slice(0, 300).replace(/\s+/g, ' ').trim()

  let date: Date
  try {
    date = new Date(dateStr)
    if (isNaN(date.getTime())) date = new Date()
  } catch {
    date = new Date()
  }

  return {
    id: msg.id,
    threadId: msg.threadId ?? '',
    subject,
    from: fromName || fromEmail,
    fromEmail,
    bodyText,
    bodyPreview,
    date,
    labelIds: msg.labelIds ?? [],
  }
}

/**
 * Extrae texto plano del payload de un mensaje Gmail
 * Maneja multipart, base64, HTML
 */
function extractBodyText(payload: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!payload) return ''

  // Mensaje simple
  if (payload.body?.data) {
    const decoded = Buffer.from(payload.body.data, 'base64').toString('utf-8')
    if (payload.mimeType === 'text/plain') return decoded
    if (payload.mimeType === 'text/html') return stripHtml(decoded)
  }

  // Multipart — buscar text/plain primero, luego text/html
  if (payload.parts) {
    let htmlContent = ''

    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8')
      }
      if (part.mimeType === 'text/html' && part.body?.data) {
        htmlContent = Buffer.from(part.body.data, 'base64').toString('utf-8')
      }
      // Recursivo para multipart/alternative anidado
      if (part.mimeType?.startsWith('multipart/')) {
        const nested = extractBodyText(part)
        if (nested) return nested
      }
    }

    if (htmlContent) return stripHtml(htmlContent)
  }

  return ''
}

/**
 * Elimina tags HTML y decodifica entidades básicas
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}
