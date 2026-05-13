import { AIConfig } from "./types";
import { AI_CONFIG } from "./config";

export async function getGroqStream(config: AIConfig) {
  const allKeys = [
    AI_CONFIG.GROQ_API_KEY,
    ...(AI_CONFIG.GROQ_BACKUP_KEYS || [])
  ].filter(Boolean) as string[];

  if (allKeys.length === 0) throw new Error("Groq API Keys not found");

  let lastError: any;

  // Try each key until one works
  for (let i = 0; i < allKeys.length; i++) {
    const apiKey = allKeys[i];
    console.log(`[Groq] Attempting request with key ${i + 1}/${allKeys.length}...`);

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: AI_CONFIG.GROQ_MODEL,
          messages: config.messages,
          temperature: config.temperature ?? 1,
          max_completion_tokens: config.maxTokens ?? 1024,
          stream: true,
          compound_custom: {
            tools: {
              enabled_tools: ["web_search", "code_interpreter", "visit_website"]
            }
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API Error (${response.status}): ${errorText}`);
      }

      return response.body;
    } catch (err: any) {
      lastError = err;
      console.error(`[Groq] Key ${i + 1} failed:`, err.message);
      // Continue to next key
    }
  }

  throw lastError;
}
