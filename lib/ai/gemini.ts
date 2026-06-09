// ============================================
// Kstudy AI — Cliente Gemini (SDK oficial)
// ============================================
// API key en .env.local: GEMINI_API_KEY=...
// Se consigue gratis en https://aistudio.google.com
// ============================================

import { GoogleGenerativeAI } from '@google/generative-ai'

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
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature,
        maxOutputTokens,
        responseMimeType: 'application/json',
      },
    })

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return { text, ok: true }
  } catch (e: any) {
    return { text: '', ok: false, error: String(e?.message ?? e) }
  }
}
