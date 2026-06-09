// ============================================
// Kstudy AI — Cliente Gemini 2.0 Flash
// ============================================
// API key en .env.local: GEMINI_API_KEY=...
// Se consigue gratis en https://aistudio.google.com
// ============================================

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export interface GeminiRequest {
  prompt: string
  temperature?: number
  maxOutputTokens?: number
}

export interface GeminiResponse {
  text: string
  ok: boolean
  error?: string
}

export async function callGemini({
  prompt,
  temperature = 0.2,
  maxOutputTokens = 4096,
}: GeminiRequest): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { text: '', ok: false, error: 'GEMINI_API_KEY no configurada en .env.local' }
  }

  try {
    // Las keys nuevas de AI Studio (formato AQ.) son OAuth tokens → van en Authorization header
    // Las keys antiguas (formato AIza...) van como query param ?key=
    const isOAuthToken = apiKey.startsWith('AQ.')
    const url = isOAuthToken ? GEMINI_API_URL : `${GEMINI_API_URL}?key=${apiKey}`
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (isOAuthToken) headers['Authorization'] = `Bearer ${apiKey}`

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { text: '', ok: false, error: `Gemini API error ${res.status}: ${err}` }
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return { text, ok: true }
  } catch (e) {
    return { text: '', ok: false, error: String(e) }
  }
}
