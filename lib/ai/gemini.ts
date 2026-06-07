// ============================================
// Kstudy AI — Cliente Gemini 1.5 Flash
// ============================================
// API key en .env.local: GEMINI_API_KEY=...
// Se consigue gratis en https://aistudio.google.com
// ============================================

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

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
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
