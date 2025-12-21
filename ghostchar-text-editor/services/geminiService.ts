
import { GoogleGenAI, Type } from "@google/genai";
import { GhostCharacter, AnalysisResult } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeCharacters = async (code: string, ghostChars: GhostCharacter[]): Promise<AnalysisResult> => {
  if (ghostChars.length === 0) {
    return { explanation: "No suspicious characters found.", suggestions: [] };
  }

  const samples = Array.from(new Set(ghostChars.map(c => `"${c.char}" (U+${c.hex})`))).slice(0, 10).join(", ");

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze these non-standard characters found in a code snippet: ${samples}. 
    Provide an explanation of why these often appear in code (e.g., copy-pasting from Word, different encodings) and suggest standard ASCII replacements. 
    The snippet context is: ${code.substring(0, 500)}...`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                original: { type: Type.STRING },
                replacement: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ["original", "replacement", "reason"]
            }
          }
        },
        required: ["explanation", "suggestions"]
      }
    }
  });

  try {
    return JSON.parse(response.text.trim()) as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return { explanation: "Error analyzing characters.", suggestions: [] };
  }
};
