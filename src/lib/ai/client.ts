import "server-only"

import { GoogleGenAI } from "@google/genai"
import { AI_MODEL } from "./config"

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error("Gemini API key is not configured")
  }
  return apiKey
}

const client = new GoogleGenAI({ apiKey: getApiKey() })

interface GenerateJsonInput {
  prompt: string
  systemInstruction: string
  maxOutputTokens: number
}

export async function generateJson(input: GenerateJsonInput): Promise<string> {
  const response = await client.models.generateContent({
    model: AI_MODEL,
    contents: input.prompt,
    config: {
      maxOutputTokens: input.maxOutputTokens,
      responseMimeType: "application/json",
      systemInstruction: input.systemInstruction,
    },
  })

  const text = response.text?.trim()
  if (!text) {
    throw new Error("Gemini returned an empty response")
  }

  return text
}
