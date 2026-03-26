import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Sends a prompt to Gemini and returns the raw text response.
 * Throws on API errors.
 */
export async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(prompt)

  return result.response.text()
}
