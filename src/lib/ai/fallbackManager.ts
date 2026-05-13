import { AIConfig, AIStreamChunk } from "./types";
import { getGroqStream } from "./groq";
import { AI_CONFIG, validateConfig } from "./config";

/**
 * Main AI Engine - Now exclusively using Groq with Key Rotation
 */
export async function* getAiStream(config: AIConfig): AsyncGenerator<AIStreamChunk> {
  validateConfig();

  // Primary Engine: Groq
  if (AI_CONFIG.GROQ_API_KEY || (AI_CONFIG.GROQ_BACKUP_KEYS && AI_CONFIG.GROQ_BACKUP_KEYS.length > 0)) {
    try {
      const body = await getGroqStream(config);
      if (!body) throw new Error("Empty body from Groq");

      const reader = body.getReader();
      const decoder = new TextDecoder();
      let partialChunk = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = (partialChunk + text).split("\n");
        partialChunk = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const content = json.choices?.[0]?.delta?.content;
            if (content) yield { content };
          } catch (e) {
            // ignore parse errors
          }
        }
      }
      return; // Success
    } catch (err: any) {
      console.error("[FallbackManager] Groq failed:", err.message);
    }
  }

  // Ultimate Fallback
  throw new Error("AI engine failed. Please check your internet connection or Groq API keys.");
}

export async function getAiResponse(config: AIConfig): Promise<string> {
  validateConfig();

  // Primary Engine: Groq
  if (AI_CONFIG.GROQ_API_KEY || (AI_CONFIG.GROQ_BACKUP_KEYS && AI_CONFIG.GROQ_BACKUP_KEYS.length > 0)) {
    try {
      const body = await getGroqStream(config);
      if (!body) throw new Error("Empty body from Groq");
      const reader = body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let partialChunk = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const lines = (partialChunk + text).split("\n");
        partialChunk = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
            try {
              const json = JSON.parse(trimmed.slice(6));
              fullContent += json.choices?.[0]?.delta?.content || "";
            } catch {}
          }
        }
      }
      return fullContent;
    } catch (err: any) {
      console.error("[FallbackManager] Groq response failed:", err.message);
    }
  }

  throw new Error("AI engine failed.");
}
